// Never load .env or connect to the user's database during tests.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {withTestDatabase} from './lib/test-database.mjs';
import {applySchema,importSeed} from './import-mysql.mjs';
import {loadSeed} from './mysql-seed-data.mjs';
try{
 if(process.argv.includes('--suite')){
  await withTestDatabase(async(connection,env)=>{
   await applySchema(connection);await importSeed(connection,await loadSeed());
   const child=spawn(process.execPath,['--import=./tests/helpers/close-database.mjs','--test','tests/*.test.js'],{stdio:'inherit',env:{...env,RUN_MYSQL_INTEGRATION:'0'}});const [code]=await once(child,'exit');process.exitCode=code??1;
  });
 }else{
  const child=spawn(process.execPath,['--test','tests/mysql-import.integration.test.js'],{stdio:'inherit',env:{...process.env,RUN_MYSQL_INTEGRATION:'1'}});const [code]=await once(child,'exit');process.exitCode=code??1;
 }
}catch(error){console.error(error.message);process.exitCode=1;}
