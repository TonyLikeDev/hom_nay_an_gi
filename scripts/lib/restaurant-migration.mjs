import {readFile} from 'node:fs/promises';
export async function migrateRestaurants(connection){
 const version='003-restaurant-writes';const [applied]=await connection.execute('SELECT version FROM schema_versions WHERE version=?',[version]);if(applied.length)return;
 const sql=await readFile(new URL('../../database/migrations/003-restaurant-writes.sql',import.meta.url),'utf8');
 for(const statement of sql.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)){
  const match=statement.match(/^ALTER TABLE restaurants ADD COLUMN ([a-z_]+)/);
  if(match){const [existing]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='restaurants' AND COLUMN_NAME=?",[match[1]]);if(existing.length)continue;}
  await connection.query(statement);
 }
 await connection.execute('INSERT INTO schema_versions(version) VALUES (?)',[version]);
}
