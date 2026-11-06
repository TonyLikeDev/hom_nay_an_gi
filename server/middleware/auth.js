import {fromNodeHeaders} from 'better-auth/node';
import {getAuth} from '../config/auth.js';
import {rows} from '../config/database.js';
export const send=(res,status,payload,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(payload));};
export async function currentUser(req){
 const session=await getAuth().api.getSession({headers:fromNodeHeaders(req.headers||{})});
 if(!session)return null;
 // Always read role from MySQL: demotion applies to the next request, no cookie role cache.
 const users=await rows('SELECT id,email,display_name,role FROM users WHERE id=?',[session.user.id]);
 if(!users.length)return null;
 const user=users[0];return {id:String(user.id),email:user.email,name:user.display_name,role:user.role};
}
export async function requireAdmin(req,res,{page=false}={}){
 const user=await currentUser(req);
 if(!user){if(page){res.writeHead(302,{'Location':'/admin-login.html','Cache-Control':'no-store'});res.end();}else send(res,401,{message:'Vui lòng đăng nhập để tiếp tục.'});return null;}
 if(user.role!=='admin'){if(page){res.writeHead(302,{'Location':'/admin-login.html?reason=forbidden','Cache-Control':'no-store'});res.end();}else send(res,403,{message:'Tài khoản không có quyền quản trị.'});return null;}
 return user;
}
