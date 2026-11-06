import { after } from 'node:test';
import { closeDatabase } from '../../server/config/database.js';
import mysql from 'mysql2/promise';
import path from 'node:path';
import os from 'node:os';

// Loaded before test modules. Refuse persistent/local/cloud databases even if a caller passes .env.
if(process.env.RUN_MYSQL_INTEGRATION==='0'){
 const env=process.env,dir=env.HNAG_ISOLATED_TEST_DIR;
 if(env.DB_HOST!=='127.0.0.1'||env.DB_USER!=='root'||env.DB_PASSWORD!==''||env.DB_NAME!=='hnag_suite_test'||env.DB_SSL_CA||Number(env.DB_PORT)===3306||!dir||path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('hnag-mysql-suite-'))throw Error('Tests require the runner-created disposable MySQL instance.');
 const c=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),user:'root',password:''});
 try{const [[r]]=await c.query('SELECT @@datadir AS directory');const normalize=p=>path.resolve(p).replace(/[\\/]+$/,'').toLowerCase();if(normalize(r.directory)!==normalize(dir))throw Error('MySQL is not using the isolated test directory.');}finally{await c.end();}
}
after(closeDatabase);
