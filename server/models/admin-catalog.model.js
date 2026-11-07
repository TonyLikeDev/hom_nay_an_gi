import {isDeepStrictEqual} from 'node:util';
import {getPool,rows} from '../config/database.js';
import {getFood} from './food.model.js';
import {getRecipes} from './recipe.model.js';
import {HttpError} from '../utils/http.js';
const json=JSON.stringify;
export async function getAdminCatalog(kind){
 const [versions,food]=await Promise.all([rows('SELECT * FROM admin_catalog_versions WHERE kind=?',[kind]),getFood({admin:true})]);
 const version=new Map(versions.map(v=>[v.entity_key,v.revision]));const names=new Map(food.DISHES.map(d=>[d.id,d.name]));let records;
 if(kind==='links'){
  const links=await rows('SELECT * FROM restaurant_dishes');const meta=new Map(versions.map(v=>[v.entity_key,v.last_payload]));
  records=links.map(r=>{const id=r.dish_id+'/'+r.restaurant_id,m=meta.get(id);return {id,dishId:r.dish_id,restaurantId:r.restaurant_id,name:names.get(r.dish_id),type:r.match_type,offering:r.offering,price:r.price_vnd===null?null:Number(r.price_vnd),sourceUrl:m?.sourceUrl||'',note:m?.note||r.source_record.evidence||''};});
 }else if(kind==='recipes')records=Object.entries(await getRecipes({admin:true})).map(([id,r])=>({id,dishId:id,name:names.get(id),...r}));
 else records=food.DISHES.map(d=>({id:d.id,dishId:d.id,name:d.name,vegetarianReview:d.vegetarianReview||null,nutritionProfile:d.nutritionProfile||null,nutritionKeys:(d.nutritionReviews||[]).map(r=>r.key),nutritionReviews:d.nutritionReviews||[],label:[...(d.vegetarianReview?['Ăn chay']:[]),...(d.nutritionReviews||[]).map(r=>r.key==='low-sugar'?'Ít đường':r.key==='low-energy'?'Ít năng lượng':'Ít tinh bột')].join(', ')||'Chưa gán nhãn',status:d.vegetarianReview||d.nutritionReviews?.length?'Có căn cứ':'Chưa gán nhãn'}));
 if(kind!=='reviews'){
  records=records.map(r=>({...r,enabled:true}));
  for(const v of versions)if(v.last_payload?.enabled===false&&!records.some(r=>r.id===v.entity_key))records.push({id:v.entity_key,name:names.get(v.last_payload.dishId),...v.last_payload});
 }
 const hiddenDishes=new Set(food.DISHES.filter(d=>!d.isVisible).map(d=>d.id));
 const hiddenVenues=new Set(kind==='links'?(await rows('SELECT id FROM restaurants WHERE is_visible=FALSE')).map(r=>r.id):[]);
 return records.map(r=>({...r,parentHidden:hiddenDishes.has(r.dishId)||hiddenVenues.has(r.restaurantId),revision:version.get(r.id)||1}));
}
export async function saveCatalog(kind,{values,revision,requestId},{id,actorId}={}){
 const key=kind==='links'?values.dishId+'/'+values.restaurantId:values.dishId;
 if(id&&id!==key)throw new HttpError(400,'Không đổi món/quán của mục hiện có. Hãy tạo mục mới.');
 const c=await getPool().getConnection();let created=false;
 try{
  await c.beginTransaction();
  const [[actor]]=await c.execute('SELECT role FROM users WHERE id=? FOR SHARE',[actorId]);if(actor?.role!=='admin')throw new HttpError(403,'Tài khoản không còn quyền quản trị.');
  const [[lockedDish]]=await c.execute('SELECT id FROM dishes WHERE id=? FOR UPDATE',[values.dishId]);if(!lockedDish)throw new HttpError(400,'Món ăn không tồn tại.');
  await c.execute('INSERT IGNORE INTO admin_catalog_versions(kind,entity_key) VALUES (?,?)',[kind,key]);
  const [[version]]=await c.execute('SELECT * FROM admin_catalog_versions WHERE kind=? AND entity_key=? FOR UPDATE',[kind,key]);
  if(version.last_request_id===requestId){
   if(String(version.last_actor_id)!==String(actorId)||!isDeepStrictEqual(version.last_payload,values))throw new HttpError(409,'Mã yêu cầu đã được sử dụng với nội dung khác.');
  }else{
   const [[dish]]=await c.execute('SELECT id FROM dishes WHERE id=? FOR SHARE',[values.dishId]);if(!dish)throw new HttpError(400,'Món ăn không tồn tại.');
   let before;
   if(kind==='links'){
    const [[venue]]=await c.execute('SELECT id FROM restaurants WHERE id=? FOR SHARE',[values.restaurantId]);if(!venue)throw new HttpError(400,'Quán không tồn tại.');
    const [[row]]=await c.execute('SELECT * FROM restaurant_dishes WHERE dish_id=? AND restaurant_id=? FOR UPDATE',[values.dishId,values.restaurantId]);before=row||null;
   }else if(kind==='recipes'){
    const [[row]]=await c.execute('SELECT * FROM recipes WHERE dish_id=? FOR UPDATE',[key]);before=row||null;
    if(row){const [ingredients]=await c.execute('SELECT * FROM recipe_ingredients WHERE dish_id=? ORDER BY sort_order',[key]);const [steps]=await c.execute('SELECT * FROM recipe_steps WHERE dish_id=? ORDER BY sort_order',[key]);before={...row,ingredients,steps};}
   }else{
    const [reviews]=await c.execute('SELECT * FROM dish_reviews WHERE dish_id=? FOR UPDATE',[key]);const [profiles]=await c.execute('SELECT * FROM dish_nutrition_profiles WHERE dish_id=? FOR UPDATE',[key]);before={reviews,profiles};
   }
   if(!before&&version.last_payload?.enabled===false)before=version.last_payload;
   let originalSource;
   if(before?.enabled===false){
    const [[snapshot]]=await c.execute("SELECT before_data FROM admin_catalog_audit WHERE kind=? AND entity_key=? AND JSON_CONTAINS_PATH(before_data,'one','$.source_record') ORDER BY id LIMIT 1",[kind,key]);
    originalSource=snapshot?.before_data?.source_record;
   }
   if(id&&!before)throw new HttpError(404,'Không tìm thấy mục để sửa.');
   if(!id&&before)throw new HttpError(409,'Mục này đã có. Hãy sửa mục hiện có.');
   if(id&&revision!==version.revision)throw new HttpError(409,'Nội dung đã được cập nhật ở nơi khác. Hãy tải lại trang trước khi sửa; form hiện tại chưa được lưu.');
   created=!before;
   if(kind==='links'){
    if(!values.enabled)await c.execute('DELETE FROM restaurant_dishes WHERE dish_id=? AND restaurant_id=?',[values.dishId,values.restaurantId]);
    else if(before&&before.enabled!==false)await c.execute('UPDATE restaurant_dishes SET match_type=?,offering=?,price_vnd=? WHERE dish_id=? AND restaurant_id=?',[values.type,values.offering,values.price,values.dishId,values.restaurantId]);
    else await c.execute('INSERT INTO restaurant_dishes(dish_id,restaurant_id,match_type,offering,price_vnd,source_record) VALUES (?,?,?,?,?,?)',[values.dishId,values.restaurantId,values.type,values.offering,values.price,json(originalSource||{type:'admin-entry',evidence:values.note,source:values.sourceUrl})]);
   }else if(kind==='recipes'){
    const columns=[values.servings,values.prep,values.cook,values.soak||null,values.tip,values.source.label,values.source.url];
    if(values.enabled){
     if(before&&before.enabled!==false)await c.execute('UPDATE recipes SET base_servings=?,prep_time=?,cook_time=?,soak_note=?,tip=?,source_label=?,source_url=? WHERE dish_id=?',[...columns,key]);
     else await c.execute('INSERT INTO recipes(base_servings,prep_time,cook_time,soak_note,tip,source_label,source_url,dish_id,source_record) VALUES (?,?,?,?,?,?,?,?,?)',[...columns,key,json(originalSource||{type:'admin-entry',...values})]);
    }
    await c.execute('DELETE FROM recipe_ingredients WHERE dish_id=?',[key]);await c.execute('DELETE FROM recipe_steps WHERE dish_id=?',[key]);
    if(values.enabled){
     for(const [index,i] of values.ingredients.entries())await c.execute('INSERT INTO recipe_ingredients(dish_id,sort_order,name,amount_min,amount_max,unit,amount_text) VALUES (?,?,?,?,?,?,?)',[key,index+1,i.name,i.text===undefined?(Array.isArray(i.amount)?i.amount[0]:i.amount):null,Array.isArray(i.amount)?i.amount[1]:null,i.unit||null,i.text??null]);
     for(const [index,s] of values.steps.entries())await c.execute('INSERT INTO recipe_steps(dish_id,sort_order,title,instruction) VALUES (?,?,?,?)',[key,index+1,...s]);
    }else await c.execute('DELETE FROM recipes WHERE dish_id=?',[key]);
    // A changed onsite recipe requires a fresh vegetarian review; keep the previous evidence in the audit.
    const [[review]]=await c.execute("SELECT * FROM dish_reviews WHERE dish_id=? AND review_key='vegetarian' AND status='reviewed' FOR UPDATE",[key]);
    if(review){
     await c.execute("DELETE FROM dish_reviews WHERE dish_id=? AND review_key='vegetarian'",[key]);
     await c.execute("INSERT INTO admin_catalog_versions(kind,entity_key,revision) VALUES ('reviews',?,2) ON DUPLICATE KEY UPDATE revision=revision+1,last_request_id=NULL",[key]);
     await c.execute("INSERT INTO admin_catalog_audit(kind,entity_key,actor_user_id,before_data,after_data) VALUES ('reviews',?,?,?,?)",[key,actorId,json(review),json({reason:'recipe-updated',vegetarianReview:null})]);
    }
   }else{
    await c.execute('DELETE FROM dish_reviews WHERE dish_id=?',[key]);await c.execute('DELETE FROM dish_nutrition_profiles WHERE dish_id=?',[key]);
    if(values.vegetarianReview)await c.execute("INSERT INTO dish_reviews(dish_id,review_key,status,evidence) VALUES (?,'vegetarian',?,?)",[key,values.vegetarianReview.status,json(values.vegetarianReview)]);
    for(const r of values.nutritionReviews)await c.execute('INSERT INTO dish_reviews(dish_id,review_key,status,evidence) VALUES (?,?,?,?)',[key,r.key,r.status,json(r)]);
    if(values.nutritionProfile)await c.execute('INSERT INTO dish_nutrition_profiles(dish_id,profile) VALUES (?,?)',[key,json(values.nutritionProfile)]);
   }
   await c.execute('INSERT INTO admin_catalog_audit(kind,entity_key,actor_user_id,before_data,after_data) VALUES (?,?,?,?,?)',[kind,key,actorId,before?json(before):null,json(values)]);
   await c.execute('UPDATE admin_catalog_versions SET revision=?,last_request_id=?,last_actor_id=?,last_payload=? WHERE kind=? AND entity_key=?',[id?version.revision+1:1,requestId,actorId,json(values),kind,key]);
  }
  await c.commit();
 }catch(e){await c.rollback();throw e;}finally{c.release();}
 return {record:(await getAdminCatalog(kind)).find(r=>r.id===key),created};
}
