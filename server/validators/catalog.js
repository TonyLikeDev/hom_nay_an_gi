import {HttpError} from '../utils/http.js';
const fail=message=>{throw new HttpError(400,message);};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const keys=(o,allowed)=>{if(!object(o)||Object.keys(o).some(k=>!allowed.includes(k)))fail('Có trường dữ liệu không hợp lệ.');};
const text=(v,max=5000,required=false)=>{if(typeof v!=='string'||v.trim().length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(v)||(required&&!v.trim()))fail('Thiếu nội dung hoặc văn bản quá dài/không hợp lệ.');return v.trim();};
const url=(v,required=true)=>{const value=text(v,2000,required);if(!value)return '';let u;try{u=new URL(value);}catch{fail('Nguồn phải là URL HTTPS hợp lệ.');}if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))fail('Nguồn phải dùng HTTPS, không chứa thông tin đăng nhập.');return u.href;};
const id=v=>{if(typeof v!=='string'||!/^[a-z0-9-]{1,100}$/.test(v))fail('Mã món/quán không hợp lệ.');return v;};
const number=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Định lượng hoặc số liệu không hợp lệ.');return v;};
const day=v=>{const value=text(v,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}))fail('Ngày đối chiếu không hợp lệ hoặc ở tương lai.');return value;};
export const criterionSource='https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en';
export function validateCatalog(kind,input,{update=false}={}){
 const fieldNames={links:['dishId','restaurantId','type','offering','price','sourceUrl','note','enabled'],recipes:['dishId','servings','prep','cook','soak','tip','source','ingredients','steps','enabled'],reviews:['dishId','vegetarianReview','nutritionProfile','nutritionKeys','confirmed']};
 keys(input,[...fieldNames[kind],'requestId','revision']);
 if(typeof input.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId))fail('Thiếu mã yêu cầu. Hãy mở lại form.');
 if(update&&(!Number.isSafeInteger(input.revision)||input.revision<1))fail('Thiếu phiên bản dữ liệu. Hãy tải lại trang.');
 const v={dishId:id(input.dishId)};
 if(kind!=='reviews'){if(typeof input.enabled!=='boolean')fail('Chọn trạng thái công bố.');v.enabled=input.enabled;}
 if(kind==='links'){
  v.restaurantId=id(input.restaurantId);if(!['dish','related'].includes(input.type))fail('Chọn đúng món hoặc món liên quan.');v.type=input.type;
  v.offering=text(input.offering,500,true);v.price=input.price===null?null:number(input.price,0,999999999999);if(v.price!==null&&!Number.isInteger(v.price))fail('Giá VND phải là số nguyên.');
  v.sourceUrl=url(input.sourceUrl);v.note=text(input.note,3000,true);
 }else if(kind==='recipes'){
  v.servings=number(input.servings,1,12);if(!Number.isInteger(v.servings))fail('Khẩu phần phải là số người nguyên.');
  for(const key of ['prep','cook'])v[key]=text(input[key],255,true);
  v.soak=text(input.soak||'',3000);v.tip=text(input.tip,5000);
  keys(input.source,['label','url']);v.source={label:text(input.source.label,500,true),url:url(input.source.url)};
  if(!Array.isArray(input.ingredients)||!input.ingredients.length||input.ingredients.length>100)fail('Cần 1–100 nguyên liệu.');
  v.ingredients=input.ingredients.map(i=>{keys(i,['name','amount','unit','text']);const name=text(i.name,255,true);if(i.text!==undefined){if(i.amount!==undefined||i.unit!==undefined)fail('Không trộn định lượng số với định lượng văn bản.');return {name,text:text(i.text,500,true)};}const quantity=v=>{number(v,0.0001,99999999);if(Math.abs(v*10000-Math.round(v*10000))>0.000001)fail('Định lượng chỉ hỗ trợ tối đa 4 chữ số thập phân.');return v;};const unit=text(i.unit,80,true);if(Array.isArray(i.amount)){if(i.amount.length!==2)fail('Khoảng định lượng cần hai số.');const min=quantity(i.amount[0]),max=quantity(i.amount[1]);if(max<min)fail('Khoảng định lượng bị đảo ngược.');return {name,amount:[min,max],unit};}return {name,amount:quantity(i.amount),unit};});
  if(!Array.isArray(input.steps)||!input.steps.length||input.steps.length>100)fail('Cần 1–100 bước nấu.');
  v.steps=input.steps.map(s=>{if(!Array.isArray(s)||s.length!==2)fail('Bước nấu cần tiêu đề và nội dung.');return [text(s[0],255,true),text(s[1],5000,true)];});
 }else{
  if(input.confirmed!==true)fail('Cần xác nhận đã kiểm tra nguyên liệu và nguồn của đúng phiên bản.');
  v.confirmed=true;v.vegetarianReview=null;v.nutritionProfile=null;v.nutritionKeys=[];v.nutritionReviews=[];
  if(input.vegetarianReview){
   const r=input.vegetarianReview;keys(r,['status','scope','ingredients','source','reviewedAt']);if(!['reviewed','source-declared'].includes(r.status))fail('Mức xác minh ăn chay không hợp lệ.');
   if(!Array.isArray(r.ingredients)||!r.ingredients.length||r.ingredients.length>100)fail('Cần nguyên liệu để xác minh ăn chay.');
   v.vegetarianReview={status:r.status,scope:text(r.scope,5000,true),ingredients:r.ingredients.map(i=>text(i,255,true)),source:url(r.source),reviewedAt:day(r.reviewedAt)};
  }
  if(!Array.isArray(input.nutritionKeys)||new Set(input.nutritionKeys).size!==input.nutritionKeys.length||input.nutritionKeys.some(k=>!['low-sugar','low-energy'].includes(k)))fail('Chỉ hỗ trợ tiêu chí ít đường và ít năng lượng có ngưỡng đối chiếu; không tự gán ít tinh bột.');
  v.nutritionKeys=[...input.nutritionKeys];
  if(v.nutritionKeys.length&&!input.nutritionProfile)fail('Cần số liệu dinh dưỡng và khẩu phần nguồn.');
  if(input.nutritionProfile){
   const p=input.nutritionProfile;keys(p,['scope','sourceLabel','source','serving','values','foodForm','servingQuantity','servingUnit','dataNote','checkedAt','dishId','scopeType']);keys(p.values,['energyKcal','sugarsG','carbohydrateG']);
   if(!['solid','liquid'].includes(p.foodForm)||p.servingUnit!==(p.foodForm==='solid'?'g':'ml'))fail('Thức ăn rắn cần g; đồ uống cần ml.');
   const values=Object.fromEntries(['energyKcal','sugarsG','carbohydrateG'].map(k=>[k,number(p.values[k],0,100000)]));
   const profile={dishId:v.dishId,scopeType:'reference-variant',scope:text(p.scope,5000,true),sourceLabel:text(p.sourceLabel,500,true),source:url(p.source),serving:text(p.serving,500,true),values,foodForm:p.foodForm,servingQuantity:number(p.servingQuantity,0.0001,100000),servingUnit:p.servingUnit,dataNote:text(p.dataNote,5000,true),checkedAt:day(p.checkedAt)};
   v.nutritionProfile=profile;
   v.nutritionReviews=v.nutritionKeys.map(key=>{const sugar=key==='low-sugar',per100=100*(sugar?values.sugarsG:values.energyKcal)/profile.servingQuantity,limit=sugar?(p.foodForm==='solid'?5:2.5):(p.foodForm==='solid'?40:20);if(per100>limit)fail('Số liệu không đạt tiêu chí '+key+'. Không gán nhãn.');return {key,status:'verified',scopeType:'reference-variant',scope:profile.scope,source:profile.source,criterionSource,checkedAt:profile.checkedAt,basis:`${per100.toFixed(3)} ${sugar?'g đường':'kcal'}/100 ${profile.servingUnit}; ngưỡng đối chiếu ≤ ${limit}. Chỉ áp dụng cho phiên bản và khẩu phần nguồn.`};});
  }
 }
 return {values:v,revision:input.revision,requestId:input.requestId.toLowerCase()};
}
