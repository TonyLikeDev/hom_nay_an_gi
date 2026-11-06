import test from 'node:test';import assert from 'node:assert/strict';import mysql from 'mysql2/promise';import {randomUUID} from 'node:crypto';import {connectionConfig,closeDatabase} from '../server/config/database.js';import {resetAuth,createAuth} from '../server/config/auth.js';import {applySchema,importSeed} from '../scripts/import-mysql.mjs';import {loadSeed} from '../scripts/mysql-seed-data.mjs';import {provisionAdmin} from '../server/services/provision-admin.js';import {saveRestaurant} from '../server/models/admin-restaurant.model.js';import {server} from '../server/app.js';

test('admin restaurant writes: authorization, validation, live reads, optimistic conflict, replay and rollback',{timeout:120000},async()=>{
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_write_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_write_test'});process.env.DB_NAME='hnag_write_test';await applySchema(c);await importSeed(c,await loadSeed());
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const call=(route,{method='GET',body,cookie,origin=base,headers={}}={})=>fetch(base+route,{method,headers:{...(body?{'content-type':'application/json',origin}:{}),...(cookie?{cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  const password='RestaurantWriteTest!42';const admin=await provisionAdmin({email:'writer@example.com',password});const normal=await createAuth({provisioning:true}).api.signUpEmail({body:{email:'reader@example.com',password,name:'Reader'}});await c.execute("UPDATE users SET role='user' WHERE id=?",[normal.user.id]);
  const signIn=async email=>{const r=await call('/api/auth/sign-in/email',{method:'POST',body:{email,password}});assert.equal(r.status,200);return r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');};const cookie=await signIn('writer@example.com'),normalCookie=await signIn('reader@example.com');
  const values={name:'Quán thử mới',address:'Địa chỉ thử nghiệm',area:'Khu vực thử nghiệm',category:'Món chính',priceLabel:'',priceTier:'',website:'https://example.com/',phone:'0901234567',hours:'Thông tin thử nghiệm',imageUrl:'https://example.com/photo.jpg',grabFoodUrl:'https://food.grab.com/vn/vi/',shopeeFoodUrl:'https://shopeefood.vn/',partnership:'draft-partner',note:'Ghi chú nội bộ',meals:['sang','trua']};
  const requestId=randomUUID(),body={...values,requestId};
  for(const [identity,status]of [[undefined,401],[normalCookie,403]])assert.equal((await call('/api/admin/restaurants',{method:'POST',body,cookie:identity})).status,status);
  assert.equal((await call('/api/admin/restaurants',{method:'POST',body,cookie,origin:'https://evil.example'})).status,403);
  assert.equal((await call('/api/admin/restaurants',{method:'POST',body,cookie,headers:{origin:''}})).status,403);
  for(const bad of [{...body,name:''},{...body,address:''},{...body,area:''},{...body,website:'javascript:alert(1)'},{...body,imageUrl:'https://user:pass@example.com/a'},{...body,grabFoodUrl:'https://food.grab.com.evil.example/'},{...body,meals:['unknown']},{...body,meals:['sang','sang']},{...body,revision:1,id:'dn-001'},{...body,name:'<script>alert(1)</script>'},{...body,note:'x'.repeat(3001)}])assert.equal((await call('/api/admin/restaurants',{method:'POST',body:bad,cookie})).status,400);
  let response=await call('/api/admin/restaurants',{method:'POST',body,cookie});assert.equal(response.status,201);let {record}=await response.json();const id=record.id;assert.match(id,/^r-/);assert.equal(record.revision,1);assert.equal(record.note,values.note);
  response=await call('/api/restaurants/'+id);assert.equal(response.status,200);let publicRecord=await response.json();assert.equal(publicRecord.name,values.name);assert.deepEqual(publicRecord.suggestedMeals,['Sáng','Trưa']);assert.equal(publicRecord.phone,values.phone);assert.equal(publicRecord.photo.kind,'admin-provided');assert.equal(publicRecord.note,undefined);assert.equal(publicRecord.partnership,undefined);assert.equal(publicRecord.revision,undefined);
  response=await call('/api/admin/restaurants',{method:'POST',body,cookie});assert.equal(response.status,200);assert.equal((await response.json()).record.id,id);
  assert.equal((await call('/api/admin/restaurants',{method:'POST',body:{...body,name:'Changed replay'},cookie})).status,409);
  const edit={...values,name:'Quán đã cập nhật',imageUrl:'',phone:'',meals:['toi'],revision:1};
  response=await call('/api/admin/restaurants/'+id,{method:'PUT',body:edit,cookie});assert.equal(response.status,200);record=(await response.json()).record;assert.equal(record.revision,2);
  publicRecord=await (await call('/api/restaurants/'+id)).json();assert.equal(publicRecord.name,edit.name);assert.deepEqual(publicRecord.suggestedMeals,['Tối']);assert.equal(publicRecord.phone,undefined);assert.equal(publicRecord.photo.kind,'illustration');
  assert.equal((await call('/api/admin/restaurants/'+id,{method:'PUT',body:{...edit,name:'Stale overwrite'},cookie})).status,409);
  assert.equal((await call('/api/admin/restaurants/missing',{method:'PUT',body:{...edit,revision:2},cookie})).status,404);
  assert.equal((await call('/api/admin/restaurants/'+id,{method:'DELETE',cookie})).status,405);
  let [[audit]]=await c.query('SELECT COUNT(*) AS n FROM restaurant_audit');assert.equal(audit.n,2);
  // A relational write failing after the row update must roll back row, meals and audit.
  await assert.rejects(saveRestaurant({values:{...values,name:'Should rollback',meals:['not-a-meal']},revision:2},{id,actorId:admin.id}),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  publicRecord=await (await call('/api/restaurants/'+id)).json();assert.equal(publicRecord.name,edit.name);assert.deepEqual(publicRecord.suggestedMeals,['Tối']);[[audit]]=await c.query('SELECT COUNT(*) AS n FROM restaurant_audit');assert.equal(audit.n,2);
  // Preserve imported source/photo while editable columns and linked results change.
  response=await call('/api/admin/restaurants?pageSize=48',{cookie});let old=(await response.json()).items.find(r=>r.id==='dn-001');assert.equal(old.revision,1);
  const update={...values,name:'Mì Quảng tên mới',address:old.address,area:old.area,category:old.category,website:old.website||'',imageUrl:'',meals:['sang'],revision:1};
  response=await call('/api/admin/restaurants/dn-001',{method:'PUT',body:update,cookie});assert.equal(response.status,200);
  const linked=await (await call('/api/dishes/mi-quang/restaurants')).json();assert.equal(linked.matches.find(r=>r.id==='dn-001').name,update.name);
  const [[saved]]=await c.query("SELECT source_record,photo,revision FROM restaurants WHERE id='dn-001'");assert.equal(saved.source_record.name,old.name);assert.deepEqual(saved.photo,old.photo);assert.equal(saved.revision,2);
  assert.equal((await call('/api/restaurants?q='+encodeURIComponent('Quán đã cập nhật'))).status,200);
  const [hashes]=await c.query('SELECT actor_user_id,before_data,after_data FROM restaurant_audit WHERE restaurant_id=? ORDER BY id',[id]);assert.equal(String(hashes[0].actor_user_id),admin.id);assert.equal(hashes[0].before_data,null);assert.equal(hashes[1].after_data.name,edit.name);
  // Two writers using the same revision: exactly one succeeds.
  const attempts=await Promise.all(['A','B'].map(suffix=>call('/api/admin/restaurants/'+id,{method:'PUT',body:{...edit,name:'Concurrent '+suffix,revision:2},cookie})));assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);
  const [[count]]=await c.query('SELECT COUNT(*) AS n FROM restaurants');assert.equal(count.n,106);
 }finally{if(server.listening)await new Promise(r=>server.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();}
});
