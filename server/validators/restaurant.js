import {HttpError} from '../utils/http.js';
const fields={name:255,address:500,area:120,category:120,priceLabel:255,priceTier:120,website:2000,phone:40,hours:500,imageUrl:2000,grabFoodUrl:2000,shopeeFoodUrl:2000,partnership:40,note:3000};
export function validateRestaurant(input,{update=false}={}){
 if(Object.keys(input).some(key=>!Object.hasOwn(fields,key)&&!['meals','revision','requestId','isVisible'].includes(key)))throw new HttpError(400,'Có trường dữ liệu không được phép cập nhật.');
 const result={};
 if(Object.hasOwn(input,'isVisible')){if(typeof input.isVisible!=='boolean')throw new HttpError(400,'Trạng thái hiển thị phải là đúng hoặc sai.');result.isVisible=input.isVisible;}
 for(const [key,max] of Object.entries(fields)){
  const raw=input[key]??'';if(typeof raw!=='string')throw new HttpError(400,'Trường '+key+' phải là văn bản.');
  const value=raw.trim();if(value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value))throw new HttpError(400,'Trường '+key+' quá dài hoặc chứa ký tự không hợp lệ.');result[key]=value;
 }
 for(const key of ['name','address','area','category'])if(!result[key])throw new HttpError(400,'Cần nhập tên quán, địa chỉ, khu vực và nhóm món.');
 for(const key of ['website','imageUrl','grabFoodUrl','shopeeFoodUrl'])if(result[key]){
  let url;try{url=new URL(result[key]);}catch{throw new HttpError(400,'Đường dẫn '+key+' không hợp lệ.');}
  if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.'))throw new HttpError(400,'Đường dẫn phải dùng HTTPS và không chứa tài khoản/mật khẩu.');
  if(key==='grabFoodUrl'&&url.hostname!=='food.grab.com')throw new HttpError(400,'Link GrabFood phải thuộc food.grab.com.');
  if(key==='shopeeFoodUrl'&&!['shopeefood.vn','www.shopeefood.vn'].includes(url.hostname))throw new HttpError(400,'Link ShopeeFood phải thuộc shopeefood.vn.');
  result[key]=url.href;
 }
 if(result.phone&&(!/^[+0-9().\s-]+$/.test(result.phone)||result.phone.replace(/\D/g,'').length<6))throw new HttpError(400,'Số điện thoại không hợp lệ.');
 if(!result.partnership)result.partnership='unknown';if(!['unknown','draft-partner'].includes(result.partnership))throw new HttpError(400,'Tình trạng hợp tác chưa hợp lệ.');
 if(!Array.isArray(input.meals)||input.meals.length>5||input.meals.some(m=>typeof m!=='string'||!['sang','trua','chieu','toi','khuya'].includes(m))||new Set(input.meals).size!==input.meals.length)throw new HttpError(400,'Bữa gợi ý không hợp lệ.');
 result.meals=[...input.meals];
 if(update&&(!Number.isSafeInteger(input.revision)||input.revision<1))throw new HttpError(400,'Thiếu phiên bản dữ liệu. Hãy tải lại danh sách trước khi sửa.');
 if(!update&&(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId||'')))throw new HttpError(400,'Thiếu mã yêu cầu tạo quán. Hãy mở lại form.');
 return {values:result,revision:input.revision,requestId:update?undefined:input.requestId.toLowerCase()};
}
