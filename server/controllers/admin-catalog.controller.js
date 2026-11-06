import {jsonMutation} from '../utils/http.js';import {validateCatalog} from '../validators/catalog.js';import {getAdminCatalog,saveCatalog} from '../models/admin-catalog.model.js';import {send} from '../middleware/auth.js';
export async function adminCatalog(req,res,url,user){
 const match=url.pathname.match(/^\/api\/admin\/(links|recipes|reviews)(?:\/([^/]+))?$/);if(!match)return false;
 const [,kind,encoded]=match;let id;
 try{
  if(encoded){id=decodeURIComponent(encoded);if(!/^[a-z0-9-]{1,100}(?:\/[a-z0-9-]{1,100})?$/.test(id)){send(res,400,{message:'Mã mục không hợp lệ.'});return true;}}
  if(!id&&req.method==='GET'){send(res,200,{items:await getAdminCatalog(kind)});return true;}
  if((!id&&req.method==='POST')||(id&&req.method==='PUT')){const data=validateCatalog(kind,await jsonMutation(req,{limit:131072}),{update:!!id});const result=await saveCatalog(kind,data,{id,actorId:user.id});send(res,result.created?201:200,result);return true;}
  send(res,405,{message:'Phương thức không được hỗ trợ.'},{Allow:id?'PUT':'GET, POST'});return true;
 }catch(e){if(e.status){send(res,e.status,{message:e.message});return true;}if(e instanceof URIError){send(res,400,{message:'Đường dẫn không hợp lệ.'});return true;}if(e.code==='ER_DUP_ENTRY'){send(res,409,{message:'Mục đã có. Hãy tải lại trang.'});return true;}throw e;}
}
