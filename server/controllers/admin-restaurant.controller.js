import {jsonMutation,HttpError} from '../utils/http.js';
import {validateRestaurant} from '../validators/restaurant.js';
import {saveRestaurant} from '../models/admin-restaurant.model.js';
import {findRestaurants} from '../models/restaurant.model.js';
import {send} from '../middleware/auth.js';
export async function adminRestaurants(req,res,url,user){
 const collection=url.pathname==='/api/admin/restaurants';
 const match=url.pathname.match(/^\/api\/admin\/restaurants\/([a-z0-9-]{1,100})$/);
 if(!collection&&!match)return false;
 const allowed=collection?'GET, POST':'PUT';
 try{
  if(collection&&req.method==='GET'){
   const page=Number(url.searchParams.get('page')||1),pageSize=Number(url.searchParams.get('pageSize')||12);
   if(!Number.isSafeInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>48)throw new HttpError(400,'Số trang không hợp lệ.');
   send(res,200,await findRestaurants({page,pageSize,admin:true}));return true;
  }
  if((collection&&req.method==='POST')||(match&&req.method==='PUT')){
   const body=await jsonMutation(req);
   const data=validateRestaurant(body,{update:!!match});
   const result=await saveRestaurant(data,{id:match?.[1],actorId:user.id});
   send(res,result.created?201:200,{record:result.record,message:'Đã lưu quán vào MySQL.'});return true;
  }
  send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:allowed});return true;
 }catch(error){
  if(error.status){send(res,error.status,{message:error.message});return true;}
  if(error.code==='ER_DUP_ENTRY'){send(res,409,{message:'Quán đã được lưu. Hãy tải lại danh sách trước khi thử tiếp.'});return true;}
  throw error;
 }
}
