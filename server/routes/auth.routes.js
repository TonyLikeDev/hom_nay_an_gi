import {authOrigin,getAuth} from '../config/auth.js';
import {currentUser,send} from '../middleware/auth.js';
import {clientIp} from '../utils/client-ip.js';

async function readBody(req){
 let bytes=0,chunks=[];
 for await(const chunk of req){bytes+=chunk.length;if(bytes>8192){const error=new Error('Request too large');error.status=413;throw error;}chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{const error=new Error('Invalid JSON');error.status=400;throw error;}
}
export async function handleAuth(req,res,url){
 if(!url.pathname.startsWith('/api/auth/'))return false;
 if(url.pathname==='/api/auth/me'){
  if(req.method!=='GET'){send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:'GET'});return true;}
  const user=await currentUser(req);send(res,user?200:401,user?{user}:{message:'Bạn chưa đăng nhập.'});return true;
 }
 const endpoints={'/api/auth/sign-in/email':'POST','/api/auth/sign-out':'POST'};
 if(!Object.hasOwn(endpoints,url.pathname)){send(res,404,{message:'API không tồn tại.'});return true;}
 if(req.method!=='POST'){send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:'POST'});return true;}
 const origin=authOrigin();
 if(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'){send(res,403,{message:'Yêu cầu không hợp lệ. Hãy đăng nhập từ website.'});return true;}
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){send(res,415,{message:'Yêu cầu phải có định dạng JSON.'});return true;}
 let body;try{body=await readBody(req);}catch(error){send(res,error.status||400,{message:'Dữ liệu gửi lên không hợp lệ.'});return true;}
 const login=url.pathname.endsWith('/sign-in/email');
 if(login&&(typeof body?.email!=='string'||typeof body?.password!=='string'||body.email.length>254||body.password.length>128||!body.email.trim()||!body.password)){send(res,400,{message:'Vui lòng nhập email và mật khẩu hợp lệ.'});return true;}
 const headers=new Headers({'content-type':'application/json',origin});
 if(req.headers.cookie)headers.set('cookie',req.headers.cookie);
 if(req.headers['user-agent'])headers.set('user-agent',req.headers['user-agent'].slice(0,1000));
 // Do not trust browser-supplied forwarded IP headers on the local Node server.
 headers.set('x-hnag-client-ip',clientIp(req));
 const response=await getAuth().handler(new Request(origin+url.pathname,{method:'POST',headers,body:JSON.stringify(login?{email:body.email.trim().toLowerCase(),password:body.password,rememberMe:false}:{} )}));
 const outgoing={};const cookies=response.headers.getSetCookie();if(cookies.length)outgoing['Set-Cookie']=cookies;
 const retry=response.headers.get('retry-after');if(retry)outgoing['Retry-After']=retry;
 if(response.ok){send(res,200,{success:true},outgoing);}else{
  const status=response.status===429?429:response.status>=500?503:login?401:400;
  send(res,status,{message:status===429?'Bạn đã thử quá nhiều lần. Vui lòng chờ một phút rồi thử lại.':status===503?'Chưa kết nối được hệ thống đăng nhập. Vui lòng thử lại.':login?'Email hoặc mật khẩu không đúng.':'Chưa đăng xuất được. Vui lòng thử lại.'},outgoing);
 }
 return true;
}
