import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { loadSeed, seedCounts } from '../scripts/mysql-seed-data.mjs';
import { applySchema, importSeed, TABLES } from '../scripts/import-mysql.mjs';
const enabled=process.env.RUN_MYSQL_INTEGRATION==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const server=net.createServer();await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});const port=server.address().port;await new Promise(r=>server.close(r));return port;}
async function command(file,args){const child=spawn(file,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);const [code]=await once(child,'exit');if(code!==0)throw new Error(`Temporary MySQL initialization failed (${code}): ${output}`);}

test('real MySQL 8.4: import, round trip, constraints, rollback and repeat safety', {skip:!enabled,timeout:120000},async()=>{
 const executable=process.env.MYSQLD_PATH||'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe';
 await access(executable);
 const temp=await mkdtemp(path.join(tmpdir(),'hnag-mysql-test-'));
 let server,connection;
 try{
  // A completely new data directory, unrelated to C:/ProgramData/MySQL.
  await command(executable,['--no-defaults','--initialize-insecure',`--datadir=${temp}`,'--console']);
  const port=await freePort();
  server=spawn(executable,['--no-defaults',`--datadir=${temp}`,`--port=${port}`,'--bind-address=127.0.0.1','--mysqlx=OFF','--console'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let startup='';server.stdout.on('data',d=>startup+=d);server.stderr.on('data',d=>startup+=d);
  for(let n=0;n<100;n++){
   if(server.exitCode!==null)throw new Error('Temporary MySQL failed: '+startup);
   try{connection=await mysql.createConnection({host:'127.0.0.1',port,user:'root',password:'',charset:'utf8mb4',connectTimeout:500});break;}catch{await sleep(200);}
  }
  assert.ok(connection,'Temporary MySQL did not become ready');
  const [[version]]=await connection.query('SELECT VERSION() AS version');assert.match(version.version,/^8\.4\./);
  console.log('Isolated server: MySQL '+version.version+' (temporary directory, random loopback port)');
  await connection.query('CREATE DATABASE hnag_import_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  await connection.changeUser({database:'hnag_import_test'});
  await applySchema(connection);await applySchema(connection);
  const seed=await loadSeed(),counts=seedCounts(seed);
  await assert.rejects(importSeed(connection,seed,{beforeCommit:async()=>{throw new Error('Simulated failure');}}),/Simulated failure/);
  for(const table of TABLES.filter(t=>t!=='schema_versions')){const [[row]]=await connection.query(`SELECT COUNT(*) AS n FROM \`${table}\``);assert.equal(row.n,0,table+' rollback');}
  const result=await importSeed(connection,seed);assert.equal(result.status,'imported');
  for(const [table,expected] of Object.entries({dishes:105,restaurants:105,recipes:14,restaurant_dishes:109,recipe_ingredients:158,recipe_steps:56,dish_reviews:15,dish_nutrition_profiles:3,users:0,favorite_dishes:0,favorite_restaurants:0})){
   const [[row]]=await connection.query(`SELECT COUNT(*) AS n FROM \`${table}\``);assert.equal(row.n,expected,table);
  }
  for(const [table,original,idKey] of [['dishes',seed.food.DISHES,'id'],['restaurants',seed.restaurants.restaurants,'id'],['recipes',Object.entries(seed.recipes).map(([id,r])=>({id,...r})),'dish_id']]){
   const [rows]=await connection.query(`SELECT \`${idKey}\` AS id, source_record FROM \`${table}\``);
   const sourceById=new Map(original.map(r=>[r.id,r]));
   for(const row of rows){const source=table==='recipes'?((({id,...rest})=>rest)(sourceById.get(row.id))):sourceById.get(row.id);assert.deepEqual(row.source_record,source,table+'/'+row.id);}
  }
  const [links]=await connection.query('SELECT dish_id,restaurant_id,match_type,offering,price_vnd FROM restaurant_dishes');
  for(const link of seed.associations.links){const found=links.find(r=>r.dish_id===link.dishId&&r.restaurant_id===link.restaurantId);assert.equal(found.match_type,link.type);assert.equal(found.offering,link.offering);assert.equal(found.price_vnd,null);}
  const [[review]]=await connection.query("SELECT evidence FROM dish_reviews WHERE dish_id='bruschetta' AND review_key='vegetarian'");assert.deepEqual(review.evidence,seed.food.DISHES.find(d=>d.id==='bruschetta').vegetarianReview);
  const [ingredientRows]=await connection.query('SELECT * FROM recipe_ingredients ORDER BY dish_id,sort_order');
  for(const [id,recipe] of Object.entries(seed.recipes))for(const [i,ingredient] of recipe.ingredients.entries()){
   const row=ingredientRows.find(r=>r.dish_id===id&&r.sort_order===i+1);assert.equal(row.name,ingredient.name);
   if(ingredient.text){assert.equal(row.amount_text,ingredient.text);assert.equal(row.amount_min,null);}else{const range=Array.isArray(ingredient.amount)?ingredient.amount:[ingredient.amount,null];assert.equal(Number(row.amount_min),range[0]);assert.equal(row.amount_max===null?null:Number(row.amount_max),range[1]);assert.equal(row.unit,ingredient.unit);}
  }
  const [stepRows]=await connection.query('SELECT * FROM recipe_steps ORDER BY dish_id,sort_order');
  for(const [id,recipe]of Object.entries(seed.recipes))for(const [i,step]of recipe.steps.entries()){const row=stepRows.find(r=>r.dish_id===id&&r.sort_order===i+1);assert.deepEqual([row.title,row.instruction],step);}
  await connection.execute("UPDATE dishes SET description=? WHERE id='pho-bo'",['Edited after import']);
  assert.equal((await importSeed(connection,seed)).status,'already-imported');
  const [[edited]]=await connection.query("SELECT description FROM dishes WHERE id='pho-bo'");assert.equal(edited.description,'Edited after import');
  const changed=structuredClone(seed);changed.food.DISHES[0].desc+=' changed';await assert.rejects(importSeed(connection,changed),/Source has changed/);
  await assert.rejects(connection.execute("INSERT INTO dish_meals VALUES ('missing','sang',1)"),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  await assert.rejects(connection.execute("INSERT INTO recipe_ingredients VALUES ('bruschetta',999,'bad',NULL,NULL,NULL,NULL)"),e=>e.code==='ER_CHECK_CONSTRAINT_VIOLATED');
  await assert.rejects(connection.execute("INSERT INTO favorite_dishes VALUES (999,'pho-bo',CURRENT_TIMESTAMP)"),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  const [[allDay]]=await connection.query("SELECT COUNT(*) AS n FROM restaurant_meals WHERE restaurant_id=?",[seed.restaurants.restaurants.find(r=>r.suggestedMeals.includes('Cả ngày')).id]);assert.equal(allDay.n,5);
  const [[manifest]]=await connection.query('SELECT counts FROM seed_imports');assert.deepEqual(manifest.counts,counts);
  // Exercise the actual documented CLI as well as the imported implementation.
  const runCli=async args=>{
   const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/import-mysql.mjs',import.meta.url)),...args],{windowsHide:true,env:{...process.env,DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:'root',DB_PASSWORD:'',DB_NAME:'hnag_cli_test',DB_SSL_CA:''},stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
   const [code]=await once(child,'exit');assert.equal(code,0,stderr);return JSON.parse(stdout);
  };
  assert.equal((await runCli(['--apply-schema'])).status,'imported');
  assert.equal((await runCli(['--apply-schema'])).status,'already-imported');
  assert.equal((await runCli([])).status,'already-imported');
  await connection.query('CREATE DATABASE hnag_nonempty_test');
  await connection.changeUser({database:'hnag_nonempty_test'});await applySchema(connection);
  await connection.execute("INSERT INTO meals VALUES ('custom','Custom',JSON_OBJECT())");
  await assert.rejects(importSeed(connection,seed),/not empty/);
  const [[kept]]=await connection.query('SELECT COUNT(*) AS n FROM meals');assert.equal(kept.n,1);
  console.log('Verified full import, source fidelity, 158 ingredient quantities, 56 steps, evidence, FKs, CHECKs, rollback and no overwrite.');
 }finally{
  if(connection){try{await connection.query('SHUTDOWN');}catch{}await connection.end().catch(()=>{});}
  if(server&&server.exitCode===null){await Promise.race([once(server,'exit'),sleep(10000)]);if(server.exitCode===null)throw new Error('Temporary server still running; kept data at '+temp);}
  // Only remove our newly-created temporary test directory, never any user database.
  const resolved=path.resolve(temp),base=path.resolve(tmpdir());
  assert.equal(path.dirname(resolved),base);assert.ok(path.basename(resolved).startsWith('hnag-mysql-test-'));
  await rm(resolved,{recursive:true,force:true});
 }
});
