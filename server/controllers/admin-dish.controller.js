import {jsonMutation} from '../utils/http.js';
import {validateDish} from '../validators/dish.js';
import {getAdminDishes,saveDish} from '../models/admin-dish.model.js';
import {send} from '../middleware/auth.js';
import {getFood} from '../models/food.model.js';
export async function adminDishes(req,res,url,user){
 const collection=url.pathname==='/api/admin/dishes',match=url.pathname.match(/^\/api\/admin\/dishes\/([a-z0-9-]{1,100})$/);
 if(!collection&&!match)return false;
 try{
  if(collection&&req.method==='GET'){const food=await getFood({admin:true});send(res,200,{items:await getAdminDishes(),cuisines:food.CUISINES,meals:food.MEALS});return true;}
  if((collection&&req.method==='POST')||(match&&req.method==='PUT')){
   const input=validateDish(await jsonMutation(req),{update:!!match});
   const result=await saveDish(input,{id:match?.[1],actorId:user.id});send(res,result.created?201:200,result);return true;
  }
  send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:collection?'GET, POST':'PUT'});return true;
 }catch(e){
  if(e.status){send(res,e.status,{message:e.message});return true;}
  if(e.code==='ER_DUP_ENTRY'){send(res,409,{message:'Món đã được lưu. Hãy tải lại danh sách.'});return true;}
  throw e;
 }
}
