import {readFile} from 'node:fs/promises';
export async function migrateVisibility(c){
 const version='006-catalog-visibility';const [applied]=await c.execute('SELECT version FROM schema_versions WHERE version=?',[version]);if(applied.length)return;
 const sql=await readFile(new URL('../../database/migrations/006-catalog-visibility.sql',import.meta.url),'utf8');
 for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean)){
  const table=statement.match(/^ALTER TABLE (dishes|restaurants) /)?.[1];
  const [exists]=await c.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='is_visible'",[table]);if(!exists.length)await c.query(statement);
 }
 await c.execute('INSERT INTO schema_versions(version) VALUES (?)',[version]);
}
