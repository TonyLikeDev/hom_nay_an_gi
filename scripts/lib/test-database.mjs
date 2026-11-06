import {mkdtemp,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import mysql from 'mysql2/promise';
import {randomBytes} from 'node:crypto';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function withTestDatabase(run){
 const executable=process.env.MYSQLD_PATH||'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe';await access(executable);
 const dir=await mkdtemp(path.join(tmpdir(),'hnag-mysql-suite-'));let server,connection;
 try{
  const init=spawn(executable,['--no-defaults','--initialize-insecure',`--datadir=${dir}`,'--console'],{windowsHide:true,stdio:['ignore','ignore','pipe']});let log='';init.stderr.on('data',d=>log+=d);const [code]=await once(init,'exit');if(code!==0)throw new Error('Could not initialize isolated MySQL: '+log);
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
  server=spawn(executable,['--no-defaults',`--datadir=${dir}`,`--port=${port}`,'--bind-address=127.0.0.1','--mysqlx=OFF','--console'],{windowsHide:true,stdio:['ignore','ignore','pipe']});server.stderr.on('data',d=>log+=d);
  for(let n=0;n<100;n++){if(server.exitCode!==null)throw new Error('Isolated server exited: '+log);try{connection=await mysql.createConnection({host:'127.0.0.1',port,user:'root',password:'',connectTimeout:500});break;}catch{await sleep(200);}}
  if(!connection)throw new Error('Isolated server did not become ready');
  await connection.query('CREATE DATABASE hnag_suite_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');await connection.changeUser({database:'hnag_suite_test'});
  return await run(connection,{...process.env,HNAG_ISOLATED_TEST_DIR:dir,DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:'root',DB_PASSWORD:'',DB_NAME:'hnag_suite_test',DB_SSL_CA:'',BETTER_AUTH_SECRET:randomBytes(48).toString('base64url'),BETTER_AUTH_URL:'http://127.0.0.1:3000'});
 }finally{
  if(connection){try{await connection.query('SHUTDOWN');}catch{}await connection.end().catch(()=>{});}
  if(server&&server.exitCode===null){await Promise.race([once(server,'exit'),sleep(10000)]);if(server.exitCode===null)throw new Error('Isolated MySQL still running; kept its directory '+dir);}
  const target=path.resolve(dir);if(path.dirname(target)!==path.resolve(tmpdir())||!path.basename(target).startsWith('hnag-mysql-suite-'))throw new Error('Unsafe test cleanup path');
  await rm(target,{recursive:true,force:true});
 }
}
