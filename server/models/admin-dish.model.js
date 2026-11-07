import {isDeepStrictEqual} from 'node:util';
import {getPool,rows} from '../config/database.js';
import {getFood} from './food.model.js';
import {HttpError} from '../utils/http.js';
export async function getAdminDishes(){
 const [food,versions]=await Promise.all([getFood({admin:true}),rows('SELECT id,revision,admin_image_url,is_visible FROM dishes')]);
 const revisions=new Map(versions.map(r=>[r.id,r]));
 return food.DISHES.map(d=>({...d,revision:revisions.get(d.id).revision,imageUrl:revisions.get(d.id).admin_image_url||'',isVisible:!!revisions.get(d.id).is_visible}));
}
export async function saveDish({values,revision,requestId},{id,actorId}={}){
 const target=id||'d-'+requestId,c=await getPool().getConnection();let created=false;
 try{
  await c.beginTransaction();
  const [[actor]]=await c.execute('SELECT role FROM users WHERE id=? FOR SHARE',[actorId]);
  if(actor?.role!=='admin')throw new HttpError(403,'Tài khoản không còn quyền quản trị.');
  const [[current]]=await c.execute('SELECT * FROM dishes WHERE id=? FOR UPDATE',[target]);
  if(id&&!current)throw new HttpError(404,'Không tìm thấy món ăn.');
  if(!id&&current){
   const [[audit]]=await c.execute("SELECT actor_user_id,after_data FROM dish_audit WHERE dish_id=? AND action='create' ORDER BY id LIMIT 1",[target]);
   if(!audit||String(audit.actor_user_id)!==String(actorId)||!isDeepStrictEqual(audit.after_data,values))throw new HttpError(409,'Mã yêu cầu đã được sử dụng. Hãy tải lại danh sách.');
  }else{
   if(current&&current.revision!==revision)throw new HttpError(409,'Món đã được cập nhật ở nơi khác. Nội dung đang nhập chưa được lưu; hãy đóng form, tải lại trang rồi sửa lại.');
   const [cuisines]=await c.execute('SELECT id FROM cuisines WHERE id=?',[values.cuisine]);
   if(!cuisines.length)throw new HttpError(400,'Nền ẩm thực không tồn tại.');
   if(current){
    await c.execute('UPDATE dishes SET name=?,cuisine_id=?,description=?,admin_image_url=?,revision=revision+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?',[values.name,values.cuisine,values.desc,values.imageUrl||null,target]);
   }else{
    const source={type:'admin-entry',createdAt:new Date().toISOString()};
    await c.execute('INSERT INTO dishes (id,name,cuisine_id,description,admin_image_url,provenance,source_record) VALUES (?,?,?,?,?,?,?)',[target,values.name,values.cuisine,values.desc,values.imageUrl||null,JSON.stringify(source),JSON.stringify({id:target,...values,source})]);created=true;
   }
   await c.execute('UPDATE dishes SET is_visible=? WHERE id=?',[values.isVisible??(current?!!current.is_visible:true),target]);
   await c.execute('DELETE FROM dish_meals WHERE dish_id=?',[target]);
   for(const [index,meal] of values.meals.entries())await c.execute('INSERT INTO dish_meals (dish_id,meal_id,sort_order) VALUES (?,?,?)',[target,meal,index+1]);
   await c.execute('INSERT INTO dish_audit (dish_id,actor_user_id,action,before_data,after_data) VALUES (?,?,?,?,?)',[target,actorId,current?'update':'create',current?JSON.stringify(current):null,JSON.stringify(values)]);
  }
  await c.commit();
 }catch(e){await c.rollback();throw e;}finally{c.release();}
 return {record:(await getAdminDishes()).find(d=>d.id===target),created};
}
