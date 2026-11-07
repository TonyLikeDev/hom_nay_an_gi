import {isDeepStrictEqual} from 'node:util';
import {getPool} from '../config/database.js';
import {HttpError} from '../utils/http.js';
import {findRestaurantById} from './restaurant.model.js';
const json=JSON.stringify;
async function writeRestaurant({values,revision,requestId},{id,actorId}={}){
 const c=await getPool().getConnection();
 const target=id||'r-'+requestId;
 try{
  await c.beginTransaction();
  const [[actor]]=await c.execute('SELECT role FROM users WHERE id=? FOR SHARE',[actorId]);
  if(actor?.role!=='admin')throw new HttpError(403,'Tài khoản không còn quyền quản trị.');
  const [[current]]=await c.execute('SELECT * FROM restaurants WHERE id=? FOR UPDATE',[target]);
  if(id&&!current)throw new HttpError(404,'Không tìm thấy quán để sửa.');
  if(!id&&current){
   const [[audit]]=await c.execute("SELECT actor_user_id,after_data FROM restaurant_audit WHERE restaurant_id=? AND action='create' ORDER BY id LIMIT 1",[target]);
   if(!audit||String(audit.actor_user_id)!==String(actorId)||!isDeepStrictEqual(audit.after_data,values))throw new HttpError(409,'Yêu cầu này đã được sử dụng. Hãy tải lại danh sách trước khi tạo tiếp.');
   await c.commit();return {id:target,created:false};
  }
  if(current&&current.revision!==revision)throw new HttpError(409,'Quán đã được cập nhật ở nơi khác. Hãy đóng form, tải lại trang rồi mở lại để sửa; nội dung đang nhập chưa được lưu.');
  const details=Object.fromEntries(['phone','hours','imageUrl','grabFoodUrl','shopeeFoodUrl','partnership','note'].map(key=>[key,values[key]]));
  if(current){
   await c.execute("UPDATE restaurants SET name=?,address=?,area=?,category=?,price_label=?,price_tier=?,website=?,admin_details=?,verification='admin-updated',revision=revision+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",[values.name,values.address,values.area,values.category,values.priceLabel||null,values.priceTier||null,values.website||null,json(details),target]);
  }else{
   const source={type:'admin-entry',createdAt:new Date().toISOString()};
   const photo={kind:'illustration',local:null,sourceLabel:'Chưa có ảnh phù hợp'};
   const sourceRecord={id:target,name:values.name,address:values.address,area:values.area,category:values.category,originalCategory:values.category,suggestedMeals:[],priceLabel:values.priceLabel||null,priceTier:values.priceTier||null,verification:'admin-entered',photo,source};
   await c.execute('INSERT INTO restaurants (id,name,category,original_category,address,area,price_label,price_tier,website,verification,photo,provenance,source_record,admin_details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[target,values.name,values.category,values.category,values.address,values.area,values.priceLabel||null,values.priceTier||null,values.website||null,'admin-entered',json(photo),json(source),json(sourceRecord),json(details)]);
  }
  await c.execute('UPDATE restaurants SET is_visible=? WHERE id=?',[values.isVisible??(current?!!current.is_visible:true),target]);
  const [oldMeals]=await c.execute('SELECT meal_id FROM restaurant_meals WHERE restaurant_id=? ORDER BY sort_order',[target]);
  if(!isDeepStrictEqual(oldMeals.map(r=>r.meal_id),values.meals)){
   await c.execute('DELETE FROM restaurant_meals WHERE restaurant_id=?',[target]);
   for(const [index,meal] of values.meals.entries())await c.execute('INSERT INTO restaurant_meals (restaurant_id,meal_id,sort_order) VALUES (?,?,?)',[target,meal,index+1]);
  }
  await c.execute('INSERT INTO restaurant_audit (restaurant_id,actor_user_id,action,before_data,after_data) VALUES (?,?,?,?,?)',[target,actorId,id?'update':'create',current?json(current):null,json(values)]);
  await c.commit();
  return {id:target,created:!id};
 }catch(error){await c.rollback();throw error;}finally{c.release();}
}

export async function saveRestaurant(data,options){
 const result=await writeRestaurant(data,options);
 return {record:await findRestaurantById(result.id,{admin:true}),created:result.created};
}
