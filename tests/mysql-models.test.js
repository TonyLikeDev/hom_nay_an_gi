import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import mysql from 'mysql2/promise';
import {connectionConfig,closeDatabase} from '../server/config/database.js';
import {applySchema,importSeed} from '../scripts/import-mysql.mjs';
import {loadSeed} from '../scripts/mysql-seed-data.mjs';
import {getFood} from '../server/models/food.model.js';
import {getRecipes} from '../server/models/recipe.model.js';
import {getRestaurantData} from '../server/models/restaurant.model.js';
import {getDishRestaurantLinks} from '../server/models/restaurant.model.js';
import {server} from '../server/app.js';
const request=(url,method='GET')=>new Promise(resolve=>server.emit('request',{url,method},{writeHead(status,headers){this.status=status;this.headers=headers;},end(body){resolve({status:this.status,body:body?.toString(),headers:this.headers});}}));

test('MySQL models preserve API contracts, use live normalized values and never fall back to JSON',async t=>{
 const originalName=process.env.DB_NAME;
 // A separate DB in the disposable suite server; mutations cannot affect other tests.
 let connection;
 try{
  connection=await mysql.createConnection(connectionConfig());
  await connection.query('CREATE DATABASE hnag_models_proof CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  await connection.changeUser({database:'hnag_models_proof'});process.env.DB_NAME='hnag_models_proof';
  const seed=await loadSeed();await applySchema(connection);await importSeed(connection,seed);
  assert.deepEqual(await getFood(),seed.food);
  assert.deepEqual(await getRecipes(),seed.recipes);
  assert.deepEqual(await getRestaurantData(),seed.restaurants);
  assert.deepEqual(await getDishRestaurantLinks(),seed.associations);
  const foodResponse=await request('/js/data.js');assert.equal(foodResponse.status,200);
  assert.deepEqual(JSON.parse(vm.runInNewContext(foodResponse.body+'; JSON.stringify(FOOD)')),seed.food);
  const recipeResponse=await request('/js/recipes.js');assert.equal(recipeResponse.status,200);
  assert.deepEqual(JSON.parse(vm.runInNewContext(recipeResponse.body+'; JSON.stringify(RECIPES)')),seed.recipes);
  assert.equal((await request('/js/recipes.js','HEAD')).body,undefined);
  assert.equal((await request('/js/recipes.js','POST')).status,405);
  assert.equal((await request('/api/dishes?cuisine=thai&meal=chieu')).status,200);
  await connection.execute("UPDATE dishes SET name=?,description=? WHERE id='pho-bo'",['Phở bò thử nghiệm MySQL','Đọc trực tiếp từ cột database']);
  let response=JSON.parse((await request('/api/dishes/pho-bo')).body);assert.equal(response.name,'Phở bò thử nghiệm MySQL');assert.equal(response.desc,'Đọc trực tiếp từ cột database');
  await connection.execute("UPDATE restaurants SET name=? WHERE id='dn-053'",['Quán thử nghiệm database']);
  response=JSON.parse((await request('/api/dishes/pho-bo/restaurants')).body);assert.equal(response.matches[0].name,'Quán thử nghiệm database');
  await connection.execute("DELETE FROM restaurant_dishes WHERE dish_id='pho-bo' AND restaurant_id='dn-053'");
  response=JSON.parse((await request('/api/dishes/pho-bo')).body);assert.equal(response.linkedRestaurantCount,0);
  assert.equal(JSON.parse((await request('/api/dishes/pho-bo/restaurants')).body).matches.length,0);
  await connection.execute("DELETE FROM dish_reviews WHERE dish_id='bruschetta' AND review_key='vegetarian'");
  assert.equal(JSON.parse((await request('/api/dishes/bruschetta')).body).vegetarianReview,undefined);
  await connection.execute("UPDATE recipe_ingredients SET amount_min=999 WHERE dish_id='bruschetta' AND sort_order=1");
  const recipes=JSON.parse(vm.runInNewContext((await request('/js/recipes.js')).body+'; JSON.stringify(RECIPES)'));assert.equal(recipes.bruschetta.ingredients[0].amount,999);
  // No local JSON/source snapshot changed, and runtime models do not read them back.
  assert.equal(JSON.parse(await readFile(new URL('../data/food.json',import.meta.url),'utf8')).DISHES[0].name,seed.food.DISHES[0].name);
  await closeDatabase();process.env.DB_NAME='hnag_database_does_not_exist';
  const messages=[];t.mock.method(console,'error',(...args)=>messages.push(args.join(' ')));
  response=await request('/api/dishes');assert.equal(response.status,503);assert.match(response.headers['Content-Type'],/application\/json/);assert.ok(JSON.parse(response.body).message);assert.doesNotMatch(response.body,/SELECT|password|DB_PASSWORD/i);
  assert.equal((await request('/js/data.js')).status,503);assert.equal((await request('/js/recipes.js')).status,503);assert.equal((await request('/index.html')).status,200);
  assert.ok(messages.every(message=>!message.includes(process.env.DB_PASSWORD||'NEVER_MATCH_THIS')));
 }finally{await closeDatabase();process.env.DB_NAME=originalName;if(connection)await connection.end();}
});
