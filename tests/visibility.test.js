import test from 'node:test';import assert from 'node:assert/strict';import mysql from 'mysql2/promise';
import {connectionConfig,closeDatabase} from '../server/config/database.js';import {resetAuth} from '../server/config/auth.js';import {applySchema,importSeed} from '../scripts/import-mysql.mjs';import {loadSeed} from '../scripts/mysql-seed-data.mjs';import {provisionAdmin} from '../server/services/provision-admin.js';import {getFood} from '../server/models/food.model.js';import {getRecipes} from '../server/models/recipe.model.js';import {getRestaurantData,getDishRestaurantLinks} from '../server/models/restaurant.model.js';import {server} from '../server/app.js';
test('visibility persists without data loss and applies across public catalogs, recipes, links, counts and admin',{timeout:120000},async()=>{
 assert.equal(process.env.DB_HOST,'127.0.0.1','Never test on Aiven');assert.equal(process.env.DB_NAME,'hnag_suite_test','Use npm test isolated runner');assert.equal(process.env.DB_PASSWORD,'');assert.ok(process.env.HNAG_ISOLATED_TEST_DIR,'Disposable instance required');
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_visibility_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_visibility_test'});process.env.DB_NAME='hnag_visibility_test';await applySchema(c);await importSeed(c,await loadSeed());
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const call=(route,{method='GET',body,cookie,origin=base}={})=>fetch(base+route,{method,redirect:'manual',headers:{...(body?{'content-type':'application/json',origin}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const password='VisibilityTestOnly!42',admin=await provisionAdmin({email:'visibility@example.com',password});
  const login=await call('/api/auth/sign-in/email',{method:'POST',body:{email:admin.email,password}});assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
  const foodBefore=await getFood(),booksBefore=await getRecipes(),linksBefore=await getDishRestaurantLinks();
  const list=async kind=>(await (await call('/api/admin/'+kind,{cookie})).json()).items;
  const write=async(kind,record,isVisible)=>{let body;
   if(kind==='dishes')body=Object.fromEntries(['name','cuisine','desc','imageUrl','meals'].map(k=>[k,record[k]??'']));
   else body={...Object.fromEntries(['name','address','area','category','priceLabel','priceTier','website','phone','hours','imageUrl','grabFoodUrl','shopeeFoodUrl','partnership','note'].map(k=>[k,record[k]??''])),meals:record.suggestedMeals.includes('Cả ngày')?['sang','trua','chieu','toi','khuya']:record.suggestedMeals.map(label=>Object.keys(foodBefore.MEALS).find(k=>foodBefore.MEALS[k].label===label))};
   const response=await call('/api/admin/'+kind+'/'+record.id,{method:'PUT',cookie,body:{...body,revision:record.revision,isVisible}});assert.equal(response.status,200,await response.clone().text());return (await response.json()).record;
  };
  let dish=(await list('dishes')).find(d=>d.id==='xoi-xoai');assert.equal(dish.isVisible,true);
  const [[source]]=await c.execute('SELECT source_record FROM dishes WHERE id=?',[dish.id]);
  const counts=async()=>{const [[row]]=await c.query('SELECT (SELECT COUNT(*) FROM dishes) dishes,(SELECT COUNT(*) FROM restaurants) restaurants,(SELECT COUNT(*) FROM restaurant_dishes) links,(SELECT COUNT(*) FROM recipes) recipes,(SELECT COUNT(*) FROM recipe_ingredients) ingredients,(SELECT COUNT(*) FROM dish_reviews) reviews');return row;};const countsBefore=await counts();
  dish=await write('dishes',dish,false);assert.equal(dish.isVisible,false);assert.equal(dish.revision,2);
  assert.equal((await call('/api/dishes/xoi-xoai')).status,404);assert.equal((await call('/api/dishes/xoi-xoai/restaurants')).status,404);
  assert.ok(!(await getFood()).DISHES.some(d=>d.id===dish.id));assert.equal((await getRecipes())['xoi-xoai'],undefined);
  for(const route of ['/js/%64ata.js','/js/%72ecipes.js',...(process.platform==='win32'?['/JS/DATA.JS','/js%5cdata.js']:[])]){
   const response=await call(route);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const script=await response.text();assert.ok(!script.includes('"id":"xoi-xoai"'));if(route.includes('ecipes'))assert.ok(!script.includes('"xoi-xoai":'));
  }
  if(process.platform==='win32')assert.equal((await call('/ADMIN.HTML')).status,302);
  assert.ok((await list('recipes')).some(r=>r.id===dish.id&&r.parentHidden));assert.ok((await list('reviews')).some(r=>r.id===dish.id&&r.vegetarianReview));
  const body={name:dish.name,cuisine:dish.cuisine,desc:dish.desc,imageUrl:'',meals:dish.meals,revision:dish.revision,isVisible:true};
  for(const identity of [undefined])assert.equal((await call('/api/admin/dishes/'+dish.id,{method:'PUT',body,cookie:identity})).status,401);
  assert.equal((await call('/api/admin/dishes/'+dish.id,{method:'PUT',body,cookie,origin:'https://evil.example'})).status,403);
  assert.equal((await call('/api/admin/dishes/'+dish.id,{method:'PUT',body:{...body,isVisible:'false'},cookie})).status,400);
  assert.equal((await call('/api/admin/dishes/'+dish.id,{method:'PUT',body:{...body,revision:1},cookie})).status,409);
  // Old clients that omit the flag cannot accidentally reveal a hidden record.
  const {isVisible:omitted,...legacy}=body;const legacyResponse=await call('/api/admin/dishes/'+dish.id,{method:'PUT',body:legacy,cookie});assert.equal(legacyResponse.status,200);dish=(await legacyResponse.json()).record;assert.equal(dish.isVisible,false);
  await applySchema(c);assert.equal((await list('dishes')).find(d=>d.id===dish.id).isVisible,false);
  dish=await write('dishes',dish,true);assert.equal((await call('/api/dishes/xoi-xoai')).status,200);assert.deepEqual((await getRecipes())['xoi-xoai'],booksBefore['xoi-xoai']);
  assert.deepEqual((await getFood()).DISHES.find(d=>d.id===dish.id).vegetarianReview,foodBefore.DISHES.find(d=>d.id===dish.id).vegetarianReview);
  const [[kept]]=await c.execute('SELECT source_record FROM dishes WHERE id=?',[dish.id]);assert.deepEqual(kept.source_record,source.source_record);
  let venue=(await list('restaurants')).find(r=>r.id==='dn-001');venue=await write('restaurants',venue,false);assert.equal(venue.isVisible,false);
  assert.equal((await call('/api/restaurants/dn-001')).status,404);assert.ok(!(await getRestaurantData()).restaurants.some(r=>r.id==='dn-001'));
  const expected=linksBefore.links.filter(l=>l.restaurantId==='dn-001'&&l.type==='dish');
  for(const link of expected){const old=foodBefore.DISHES.find(d=>d.id===link.dishId),fresh=(await getFood()).DISHES.find(d=>d.id===link.dishId);assert.equal(fresh.linkedRestaurantCount,old.linkedRestaurantCount-1);assert.ok(!fresh.source?.restaurantIds?.includes('dn-001'));}
  assert.ok(!(await getDishRestaurantLinks()).links.some(l=>l.restaurantId==='dn-001'));assert.ok((await list('links')).some(l=>l.restaurantId==='dn-001'&&l.parentHidden));
  venue=await write('restaurants',venue,true);assert.equal((await call('/api/restaurants/dn-001')).status,200);assert.deepEqual(await getDishRestaurantLinks(),linksBefore);
  // Hiding cuisine covers and then an entire cuisine cannot leave a dangling cover.
  const [cuisineKey,cuisine]=Object.entries(foodBefore.CUISINES)[0];await c.execute('UPDATE dishes SET is_visible=FALSE WHERE id=?',[cuisine.cover]);
  const covered=await getFood();assert.ok(!covered.CUISINES[cuisineKey]||covered.DISHES.some(d=>d.id===covered.CUISINES[cuisineKey].cover));
  await c.execute('UPDATE dishes SET is_visible=FALSE WHERE cuisine_id=?',[cuisineKey]);assert.equal((await getFood()).CUISINES[cuisineKey],undefined);
  const adminFood=await (await call('/api/admin/dishes',{cookie})).json();assert.ok(adminFood.cuisines[cuisineKey]);assert.ok(adminFood.items.some(d=>d.cuisine===cuisineKey&&d.isVisible===false));
  await c.query('UPDATE dishes SET is_visible=FALSE');assert.equal((await getFood()).DISHES.length,0);assert.deepEqual((await getFood()).CUISINES,{});assert.deepEqual(await getRecipes(),{});
  await c.query('UPDATE dishes SET is_visible=TRUE');assert.deepEqual(await counts(),countsBefore);
  const [audit]=await c.execute("SELECT before_data,after_data FROM dish_audit WHERE dish_id='xoi-xoai' ORDER BY id");assert.equal(audit[0].before_data.is_visible,1);assert.equal(audit[0].after_data.isVisible,false);
  await c.execute("UPDATE users SET role='user' WHERE id=?",[admin.id]);assert.equal((await call('/api/admin/restaurants/'+venue.id,{method:'PUT',cookie,body:{revision:venue.revision,isVisible:false}})).status,403);
 }finally{if(server.listening)await new Promise(r=>server.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();}
});
