import {HttpError} from '../utils/http.js';
export function validateDish(input,{update=false}={}){
 const limits={name:255,cuisine:32,desc:5000,imageUrl:2000};
 if(Object.keys(input).some(k=>!Object.hasOwn(limits,k)&&!['meals','revision','requestId','isVisible'].includes(k)))throw new HttpError(400,'Có trường không được phép cập nhật.');
 const values={};
 if(Object.hasOwn(input,'isVisible')){if(typeof input.isVisible!=='boolean')throw new HttpError(400,'Trạng thái hiển thị phải là đúng hoặc sai.');values.isVisible=input.isVisible;}
 for(const [key,max] of Object.entries(limits)){
  const raw=input[key]??'';
  if(typeof raw!=='string'||raw.trim().length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(raw))throw new HttpError(400,'Trường '+key+' không hợp lệ hoặc quá dài.');
  values[key]=raw.trim();
 }
 if(!values.name||!values.cuisine)throw new HttpError(400,'Cần nhập tên món và chọn nền ẩm thực.');
 if(values.imageUrl){
  let url;try{url=new URL(values.imageUrl);}catch{throw new HttpError(400,'URL ảnh không hợp lệ.');}
  if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.'))throw new HttpError(400,'Ảnh phải dùng HTTPS, không chứa tài khoản hay mật khẩu.');
  values.imageUrl=url.href;
 }
 if(!Array.isArray(input.meals)||input.meals.length<1||input.meals.length>5||new Set(input.meals).size!==input.meals.length||input.meals.some(m=>!['sang','trua','chieu','toi','khuya'].includes(m)))throw new HttpError(400,'Chọn ít nhất một bữa ăn hợp lệ.');
 values.meals=[...input.meals];
 if(update&&(!Number.isSafeInteger(input.revision)||input.revision<1))throw new HttpError(400,'Thiếu phiên bản món. Hãy tải lại danh sách.');
 if(!update&&(typeof input.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)))throw new HttpError(400,'Thiếu mã yêu cầu. Hãy mở lại form.');
 return {values,revision:input.revision,requestId:update?undefined:input.requestId.toLowerCase()};
}
