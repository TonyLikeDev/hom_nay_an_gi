import {readFile} from 'node:fs/promises';
export async function migrateDishes(c){
 const version='004-dish-writes';
 const [applied]=await c.execute('SELECT version FROM schema_versions WHERE version=?',[version]);if(applied.length)return;
 const sql=await readFile(new URL('../../database/migrations/004-dish-writes.sql',import.meta.url),'utf8');
 for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean)){
  const match=statement.match(/^ALTER TABLE dishes ADD COLUMN ([a-z_]+)/);
  if(match){const [exists]=await c.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dishes' AND COLUMN_NAME=?",[match[1]]);if(exists.length)continue;}
  await c.query(statement);
 }
 await c.execute('INSERT INTO schema_versions(version) VALUES (?)',[version]);
}
