import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {readFile} from 'node:fs/promises';import mysql from 'mysql2/promise';
import handler from '../api/index.js';import {handleRequest} from '../server/app.js';import {clientIp} from '../server/utils/client-ip.js';import {connectionConfig,closeDatabase,getPool} from '../server/config/database.js';import {resetAuth} from '../server/config/auth.js';import {applySchema,importSeed} from '../scripts/import-mysql.mjs';import {loadSeed} from '../scripts/mysql-seed-data.mjs';import {provisionAdmin} from '../server/services/provision-admin.js';
test('Vercel adapter retains raw-body login, protected HTML, live data and logout',{timeout:120000},async()=>{
 assert.equal(handler,handleRequest);const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));assert.deepEqual(config.routes,[{src:'/(.*)',dest:'/api/index'}]);assert.equal(config.outputDirectory,'dist');assert.equal(config.functions['api/index.js'].includeFiles,'public/**');
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;const app=http.createServer(handler);
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_vercel_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_vercel_test'});process.env.DB_NAME='hnag_vercel_test';await applySchema(c);await importSeed(c,await loadSeed());await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const password='VercelAdapterTestOnly!42';await provisionAdmin({email:'vercel@example.com',password});
  assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/api/dishes')).status,200);assert.equal((await fetch(base+'/admin.html',{redirect:'manual'})).status,302);
  const login=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({email:'vercel@example.com',password})});assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  assert.equal((await fetch(base+'/admin.html',{headers:{cookie}})).status,200);
  assert.equal((await fetch(base+'/api/admin/dishes',{headers:{cookie}})).status,200);
  const logout=await fetch(base+'/api/auth/sign-out',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},body:'{}'});assert.equal(logout.status,200);assert.equal((await fetch(base+'/api/admin/me',{headers:{cookie}})).status,401);
  const pool=getPool();
  await Promise.all(Array.from({length:8},()=>pool.execute('SELECT SLEEP(0.01)')));
  assert.ok(pool.pool._allConnections.length<=2,'concurrent requests stay within the pool connection budget');
  const deadline=Date.now()+4000;
  while(pool.pool._allConnections.length&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(pool.pool._allConnections.length,0,'idle database connections are actually closed');
  assert.equal((await fetch(base+'/api/dishes')).status,200,'the next request reconnects after idle cleanup');
 }finally{if(app.listening)await new Promise(r=>app.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();}
});
test('only Vercel runtime uses platform-provided client IP; local spoofed headers stay ignored',()=>{
 const req={headers:{'x-vercel-forwarded-for':'203.0.113.1','x-hnag-client-ip':'198.51.100.1'},socket:{remoteAddress:'127.0.0.1'}};
 assert.equal(clientIp(req,{}),'127.0.0.1');assert.equal(clientIp(req,{VERCEL:'1'}),'203.0.113.1');req.headers['x-vercel-forwarded-for']='not-an-ip';assert.equal(clientIp(req,{VERCEL:'1'}),'127.0.0.1');
});
