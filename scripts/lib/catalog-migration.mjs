import {readFile} from 'node:fs/promises';
export async function migrateCatalog(c){
 const version='005-admin-catalog';const [found]=await c.execute('SELECT version FROM schema_versions WHERE version=?',[version]);if(found.length)return;
 const sql=await readFile(new URL('../../database/migrations/005-admin-catalog.sql',import.meta.url),'utf8');
 for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await c.query(statement);
 await c.execute('INSERT INTO schema_versions(version) VALUES (?)',[version]);
}
