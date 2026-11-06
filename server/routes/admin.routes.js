import {requireAdmin,send} from '../middleware/auth.js';
import {rows} from '../config/database.js';
import {adminRestaurants} from '../controllers/admin-restaurant.controller.js';
import {adminDishes} from '../controllers/admin-dish.controller.js';
import {adminCatalog} from '../controllers/admin-catalog.controller.js';
export async function handleAdmin(req,res,url){
 if(!url.pathname.startsWith('/api/admin/'))return false;
 const user=await requireAdmin(req,res);if(!user)return true;
 if(await adminRestaurants(req,res,url,user))return true;
 if(await adminDishes(req,res,url,user))return true;
 if(await adminCatalog(req,res,url,user))return true;
 if(req.method!=='GET'){send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:'GET'});return true;}
 if(url.pathname==='/api/admin/me'){send(res,200,{user});return true;}
 if(url.pathname==='/api/admin/users'){
  const page=Number(url.searchParams.get('page')||1);
  if(!Number.isSafeInteger(page)||page<1||page>100000){send(res,400,{message:'Số trang không hợp lệ.'});return true;}
  const [{total}]=await rows('SELECT COUNT(*) AS total FROM users');const pages=Math.max(1,Math.ceil(total/20)),currentPage=Math.min(page,pages);
  const users=await rows('SELECT id,email,display_name AS name,role,created_at AS createdAt FROM users ORDER BY id LIMIT 20 OFFSET '+((currentPage-1)*20));
  send(res,200,{items:users.map(u=>({...u,id:String(u.id)})),total,page:currentPage,totalPages:pages});return true;
 }
 send(res,404,{message:'API quản trị không tồn tại.'});return true;
}
