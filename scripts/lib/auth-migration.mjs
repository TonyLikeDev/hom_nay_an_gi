import {readFile} from 'node:fs/promises';
export async function migrateAuth(connection){
 const [applied]=await connection.execute('SELECT version FROM schema_versions WHERE version=?',['002-admin-auth']);if(applied.length)return;
 const sql=await readFile(new URL('../../database/migrations/002-admin-auth.sql',import.meta.url),'utf8');
 for(const statement of sql.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)){
  const match=statement.match(/^ALTER TABLE users ADD COLUMN ([a-z_]+)/);
  if(match){const [existing]=await connection.execute('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=\'users\' AND COLUMN_NAME=?',[match[1]]);if(existing.length)continue;}
  await connection.query(statement);
 }
 await connection.execute('INSERT INTO schema_versions(version) VALUES (?)',['002-admin-auth']);
}
