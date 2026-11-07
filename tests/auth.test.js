import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {connectionConfig,closeDatabase} from '../server/config/database.js';
import {applySchema,importSeed} from '../scripts/import-mysql.mjs';
import {loadSeed} from '../scripts/mysql-seed-data.mjs';
import {provisionAdmin} from '../server/services/provision-admin.js';
import {createAuth,resetAuth,getAuth} from '../server/config/auth.js';
import {server} from '../server/app.js';

test('real auth: MySQL passwords, sessions, admin guards, CSRF, revocation and rate limits',{timeout:120000},async()=>{
 const previous={name:process.env.DB_NAME,url:process.env.BETTER_AUTH_URL};let c;
 const password='PrivateTestPassword!42';
 try{
  c=await mysql.createConnection(connectionConfig());await c.query('CREATE DATABASE hnag_auth_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await c.changeUser({database:'hnag_auth_test'});process.env.DB_NAME='hnag_auth_test';
  await applySchema(c);await importSeed(c,await loadSeed());
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.BETTER_AUTH_URL=base;resetAuth();
  const call=(route,{cookie,body,origin=base,method=body?'POST':'GET',headers={}}={})=>fetch(base+route,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json',origin}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  const signIn=async(email,extra={})=>{const response=await call('/api/auth/sign-in/email',{body:{email,password,...extra}});const cookies=response.headers.getSetCookie();return {response,cookie:cookies.map(s=>s.split(';')[0]).join('; '),cookies};};
  assert.equal((await call('/admin.html')).status,302);assert.equal((await call('/adm%69n.html')).status,302);
  assert.equal((await call('/api/admin/me')).status,401);assert.equal((await call('/api/admin/users')).status,401);
  assert.equal((await call('/api/auth/sign-up/email',{body:{email:'attacker@example.com',password,role:'admin'}})).status,404);
  const admin=await provisionAdmin({email:'admin@example.com',password});assert.equal(admin.role,'admin');
  await assert.rejects(provisionAdmin({email:'admin@example.com',password}),/đã có tài khoản/);
  const normal=await createAuth({provisioning:true}).api.signUpEmail({body:{email:'reader@example.com',password,name:'Reader'}});
  await c.execute("UPDATE users SET role='user' WHERE id=?",[normal.user.id]);
  const [[hash]]=await c.query("SELECT password FROM auth_accounts WHERE user_id=?",[admin.id]);assert.ok(hash.password.length>60);assert.notEqual(hash.password,password);
  assert.equal((await call('/api/auth/sign-in/email',{body:{email:'admin@example.com',password},origin:'https://evil.example'})).status,403);
  assert.equal((await call('/api/auth/sign-in/email',{body:{email:'admin@example.com',password},headers:{origin:''}})).status,403);
  assert.equal((await call('/api/auth/sign-in/email',{body:{email:'admin@example.com',password:'wrong'}})).status,401);
  let login=await signIn('admin@example.com');assert.equal(login.response.status,200);assert.deepEqual(await login.response.json(),{success:true});
  assert.ok(login.cookies.some(s=>/HttpOnly/i.test(s)&&/SameSite=Lax/i.test(s)));assert.ok(login.cookie);
  const cookie=login.cookie;
  resetAuth(); // Recreating the auth instance still reads the durable MySQL session.
  assert.equal((await call('/api/admin/me',{cookie:'hnag.session_token=forged-role-admin'})).status,401);
  let response=await call('/api/auth/me',{cookie});assert.equal(response.status,200);assert.equal((await response.json()).user.role,'admin');
  response=await call('/admin.html',{cookie});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  response=await call('/api/admin/users',{cookie});assert.equal(response.status,200);const users=await response.json();assert.equal(users.total,2);assert.ok(users.items.every(u=>!('password_hash'in u)&&!('password'in u)));
  assert.equal((await call('/api/admin/users',{cookie,body:{role:'admin'}})).status,405);
  login=await signIn('reader@example.com',{role:'admin'});assert.equal(login.response.status,200);
  assert.equal((await call('/api/admin/me',{cookie:login.cookie})).status,403);assert.equal((await call('/admin.html',{cookie:login.cookie})).status,302);
  await c.execute("UPDATE users SET role='user' WHERE id=?",[admin.id]);assert.equal((await call('/api/admin/me',{cookie})).status,403);
  await c.execute("UPDATE users SET role='admin' WHERE id=?",[admin.id]);
  assert.equal((await call('/api/auth/sign-out',{cookie,body:{},origin:'https://evil.example'})).status,403);
  assert.equal((await call('/api/auth/sign-out',{cookie,body:{}})).status,200);assert.equal((await call('/api/admin/me',{cookie})).status,401);
  await c.query('DELETE FROM auth_rate_limits');
  login=await signIn('admin@example.com');assert.equal(login.response.status,200);
  await c.query('UPDATE auth_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 HOUR)');
  assert.equal((await call('/api/admin/me',{cookie:login.cookie})).status,401);
  await c.query('DELETE FROM auth_rate_limits');
  const statuses=[];for(let i=0;i<6;i++)statuses.push((await call('/api/auth/sign-in/email',{body:{email:'unknown@example.com',password:'wrong'},headers:{'x-forwarded-for':'198.51.100.'+i,'x-hnag-client-ip':'198.51.100.'+i}})).status);
  assert.equal(statuses.at(-1),429);assert.ok(statuses.slice(0,5).every(s=>s===401));
  const [[count]]=await c.query('SELECT COUNT(*) AS n FROM dishes');assert.equal(count.n,105);
 }finally{
  if(server.listening)await new Promise(r=>server.close(r));await closeDatabase();resetAuth();process.env.DB_NAME=previous.name;process.env.BETTER_AUTH_URL=previous.url;if(c)await c.end();
 }
});
