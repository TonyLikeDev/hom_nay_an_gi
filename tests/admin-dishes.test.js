import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import mysql from 'mysql2/promise';
import {connectionConfig,closeDatabase} from '../server/config/database.js';
import {resetAuth} from '../server/config/auth.js';
import {applySchema,importSeed} from '../scripts/import-mysql.mjs';
import {loadSeed} from '../scripts/mysql-seed-data.mjs';
import {provisionAdmin} from '../server/services/provision-admin.js';
import {saveDish} from '../server/models/admin-dish.model.js';
import {server} from '../server/app.js';
test('dish admin writes: auth, validation, persistence, conflicts, preserved relations and rollback',{timeout:120000},async()=>{
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_dish_write_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_dish_write_test'});process.env.DB_NAME='hnag_dish_write_test';
  await applySchema(c);await applySchema(c);await importSeed(c,await loadSeed());
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const call=(route,{method='GET',body,cookie,origin=base}={})=>fetch(base+route,{method,headers:{...(body?{'content-type':'application/json',origin}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const password='DishTestOnly!Password42',admin=await provisionAdmin({email:'dish-writer@example.com',password});
  const login=await call('/api/auth/sign-in/email',{method:'POST',body:{email:admin.email,password}});assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
  const values={name:'Món thử',cuisine:'viet',desc:'Mô tả có nguồn',imageUrl:'',meals:['sang','trua']},body={...values,requestId:randomUUID()};
  assert.equal((await call('/api/admin/dishes')).status,401);
  assert.equal((await call('/api/admin/dishes',{method:'POST',body})).status,401);
  assert.equal((await call('/api/admin/dishes',{method:'POST',body,cookie,origin:'https://evil.example'})).status,403);
  for(const invalid of [{name:''},{meals:[]},{meals:['fake']},{meals:['sang','sang']},{cuisine:'missing'},{imageUrl:'javascript:alert(1)'},{imageUrl:'https://user:password@example.com/a'},{name:'<script>'},{vegetarian:true},{visibility:'hide'},{requestId:5}])assert.equal((await call('/api/admin/dishes',{method:'POST',body:{...body,...invalid},cookie})).status,400);
  let response=await call('/api/admin/dishes',{method:'POST',body,cookie});assert.equal(response.status,201);let {record}=await response.json();const id=record.id;assert.equal(record.revision,1);
  let published=await (await call('/api/dishes/'+id)).json();assert.equal(published.name,values.name);assert.deepEqual(published.meals,values.meals);assert.equal(published.vegetarianReview,undefined);assert.equal(published.revision,undefined);
  assert.equal((await call('/api/admin/dishes',{method:'POST',body,cookie})).status,200);
  assert.equal((await call('/api/admin/dishes',{method:'POST',body:{...body,name:'Different'},cookie})).status,409);
  const edit={...values,name:'Món đã sửa',meals:['toi'],imageUrl:'https://example.com/photo.jpg',revision:1};
  response=await call('/api/admin/dishes/'+id,{method:'PUT',body:edit,cookie});assert.equal(response.status,200);assert.equal((await response.json()).record.revision,2);
  published=await (await call('/api/dishes/'+id)).json();assert.equal(published.name,edit.name);assert.deepEqual(published.meals,['toi']);assert.equal(published.imageSource.kind,'admin-provided');
  assert.equal((await call('/api/admin/dishes/'+id,{method:'PUT',body:edit,cookie})).status,409);
  assert.equal((await call('/api/admin/dishes/missing',{method:'PUT',body:edit,cookie})).status,404);
  await assert.rejects(saveDish({values:{...values,meals:['not-a-meal']},revision:2},{id,actorId:admin.id}),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  assert.equal((await (await call('/api/dishes/'+id)).json()).name,edit.name);
  const [[audit]]=await c.execute('SELECT COUNT(*) n FROM dish_audit WHERE dish_id=?',[id]);assert.equal(audit.n,2);
  const [[old]]=await c.query("SELECT * FROM dishes WHERE id='bruschetta'");
  response=await call('/api/admin/dishes/bruschetta',{method:'PUT',body:{...values,cuisine:'italy',name:'Bruschetta giữ căn cứ',revision:1},cookie});
  // Use the actual cuisine ID from the existing record, not an assumed code.
  if(response.status===400)response=await call('/api/admin/dishes/bruschetta',{method:'PUT',body:{...values,cuisine:old.cuisine_id,name:'Bruschetta giữ căn cứ',revision:1},cookie});
  assert.equal(response.status,200);
  const [[kept]]=await c.query("SELECT * FROM dishes WHERE id='bruschetta'");assert.deepEqual(kept.source_record,old.source_record);assert.equal(kept.photo_id,old.photo_id);
  const dish=await (await call('/api/dishes/bruschetta')).json();assert.ok(dish.vegetarianReview);
  assert.ok((await (await call('/js/recipes.js')).text()).includes('bruschetta'));
  const concurrent=await Promise.all(['A','B'].map(name=>call('/api/admin/dishes/'+id,{method:'PUT',body:{...edit,name,revision:2},cookie})));assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  await c.execute("UPDATE users SET role='user' WHERE id=?",[admin.id]);assert.equal((await call('/api/admin/dishes',{cookie})).status,403);assert.equal((await call('/api/admin/dishes',{method:'POST',body:{...body,requestId:randomUUID()},cookie})).status,403);
 }finally{if(server.listening)await new Promise(r=>server.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();}
});
