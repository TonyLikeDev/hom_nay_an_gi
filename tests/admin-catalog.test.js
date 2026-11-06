import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import mysql from 'mysql2/promise';
import {connectionConfig,closeDatabase} from '../server/config/database.js';import {resetAuth} from '../server/config/auth.js';import {applySchema,importSeed} from '../scripts/import-mysql.mjs';import {loadSeed} from '../scripts/mysql-seed-data.mjs';import {provisionAdmin} from '../server/services/provision-admin.js';import {saveCatalog} from '../server/models/admin-catalog.model.js';import {server} from '../server/app.js';
test('remaining admin catalogs: links, recipes, evidence, withdrawal, auth, conflicts and rollback',{timeout:120000},async()=>{
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_catalog_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_catalog_test'});process.env.DB_NAME='hnag_catalog_test';await applySchema(c);await applySchema(c);await importSeed(c,await loadSeed());
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const call=(route,{method='GET',body,cookie,origin=base}={})=>fetch(base+route,{method,headers:{...(body?{'content-type':'application/json',origin}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const password='CatalogTestOnly!42',admin=await provisionAdmin({email:'catalog@example.com',password});
  const login=await call('/api/auth/sign-in/email',{method:'POST',body:{email:admin.email,password}});assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
  const list=async kind=>(await (await call('/api/admin/'+kind,{cookie})).json()).items;
  const write=async(kind,values,record)=>{const body={...values,requestId:randomUUID(),...(record?{revision:record.revision}:{})};const route='/api/admin/'+kind+(record?'/'+encodeURIComponent(record.id):'');const response=await call(route,{method:record?'PUT':'POST',body,cookie});assert.ok([200,201].includes(response.status),kind+': '+await response.clone().text());return (await response.json()).record;};
  for(const kind of ['links','recipes','reviews'])assert.equal((await call('/api/admin/'+kind)).status,401);
  const link={dishId:'pho-bo',restaurantId:'dn-001',type:'related',offering:'Món cùng nhóm',price:null,sourceUrl:'https://example.com/menu',note:'Nguồn thực đơn thử, không xác nhận món',enabled:true};
  assert.equal((await call('/api/admin/links',{method:'POST',body:{...link,requestId:randomUUID()},cookie,origin:'https://evil.example'})).status,403);
  let saved=await write('links',link);const linkId=saved.id;
  assert.ok((await (await call('/api/dishes/pho-bo/restaurants')).json()).related.some(r=>r.id==='dn-001'));
  saved=await write('links',{...link,type:'dish',offering:'Phở bò',price:45000},saved);
  let matches=(await (await call('/api/dishes/pho-bo/restaurants')).json()).matches;assert.equal(matches.find(r=>r.id==='dn-001').dishMatch.priceVnd,45000);
  saved=await write('links',{...link,enabled:false},saved);matches=(await (await call('/api/dishes/pho-bo/restaurants')).json()).matches;assert.ok(!matches.some(r=>r.id==='dn-001'));assert.equal((await list('links')).find(r=>r.id===linkId).enabled,false);
  saved=await write('links',link,saved);assert.equal(saved.enabled,true);
  assert.equal((await call('/api/admin/links/'+encodeURIComponent(saved.id),{method:'PUT',cookie,body:{...link,requestId:randomUUID(),revision:1}})).status,409);
  const recipe={dishId:'banh-mi',servings:2,prep:'10 phút',cook:'5 phút',soak:'',tip:'Mô tả thử',source:{label:'Nguồn thử',url:'https://example.com/recipe'},ingredients:[{name:'Bánh mì',amount:2,unit:'ổ'},{name:'Rau',amount:[100,150],unit:'g'},{name:'Muối',text:'Một ít'}],steps:[['Chuẩn bị','Sơ chế nguyên liệu'],['Hoàn thành','Trình bày']],enabled:true};
  let recipeRecord=await write('recipes',recipe);let js=await (await call('/js/recipes.js')).text();assert.ok(js.includes('"banh-mi"'));assert.ok(js.includes('"amount":[100,150]'));
  recipeRecord=await write('recipes',{...recipe,enabled:false},recipeRecord);assert.ok(!(await (await call('/js/recipes.js')).text()).includes('"banh-mi"'));
  recipeRecord=await write('recipes',recipe,recipeRecord);
  await assert.rejects(saveCatalog('recipes',{values:{...recipe,ingredients:[{name:'Invalid',amount:0,unit:'g'}]},revision:recipeRecord.revision,requestId:randomUUID()},{id:'banh-mi',actorId:admin.id}));
  assert.equal((await list('recipes')).find(r=>r.id==='banh-mi').revision,recipeRecord.revision);
  const profile={scope:'Cà phê đen nguyên vị, không đường hay sữa',sourceLabel:'Nguồn thử dữ liệu',source:'https://example.com/nutrition',serving:'100 ml',values:{energyKcal:1,sugarsG:0,carbohydrateG:0},foodForm:'liquid',servingQuantity:100,servingUnit:'ml',dataNote:'Chỉ phiên bản tham khảo, không áp dụng suất tại quán',checkedAt:'2026-11-01'};
  let review=(await list('reviews')).find(r=>r.id==='banh-mi');
  const evidence={dishId:'banh-mi',confirmed:true,vegetarianReview:{status:'reviewed',scope:'Phiên bản bánh mì rau thử nghiệm không thịt cá',ingredients:['bánh mì','rau'],source:'https://example.com/ingredients',reviewedAt:'2026-11-01'},nutritionProfile:profile,nutritionKeys:['low-sugar','low-energy']};
  for(const invalid of [{confirmed:false},{nutritionKeys:['low-carb']},{nutritionProfile:{...profile,values:{...profile.values,sugarsG:10}}},{vegetarianReview:{...evidence.vegetarianReview,source:'javascript:alert(1)'}}])assert.equal((await call('/api/admin/reviews/banh-mi',{method:'PUT',body:{...evidence,...invalid,revision:review.revision,requestId:randomUUID()},cookie})).status,400);
  review=await write('reviews',evidence,review);let dish=await (await call('/api/dishes/banh-mi')).json();assert.equal(dish.nutritionReviews.length,2);assert.equal(dish.vegetarianReview.status,'reviewed');
  // Editing onsite recipe revokes reviewed vegetarian evidence and invalidates its edit revision.
  recipeRecord=await write('recipes',{...recipe,tip:'Nội dung công thức đã thay đổi'},recipeRecord);dish=await (await call('/api/dishes/banh-mi')).json();assert.equal(dish.vegetarianReview,undefined);assert.equal(dish.nutritionReviews.length,2);
  assert.equal((await call('/api/admin/reviews/banh-mi',{method:'PUT',body:{...evidence,revision:review.revision,requestId:randomUUID()},cookie})).status,409);
  review=(await list('reviews')).find(r=>r.id==='banh-mi');review=await write('reviews',{dishId:'banh-mi',confirmed:true,vegetarianReview:null,nutritionProfile:null,nutritionKeys:[]},review);dish=await (await call('/api/dishes/banh-mi')).json();assert.equal(dish.nutritionReviews,undefined);assert.equal(dish.nutritionProfile,undefined);
  const results=await Promise.all(['A','B'].map(note=>call('/api/admin/links/'+encodeURIComponent(saved.id),{method:'PUT',cookie,body:{...link,note,revision:saved.revision,requestId:randomUUID()}})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  await c.execute("UPDATE users SET role='user' WHERE id=?",[admin.id]);for(const kind of ['links','recipes','reviews'])assert.equal((await call('/api/admin/'+kind,{cookie})).status,403);
 }finally{if(server.listening)await new Promise(r=>server.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();}
});
