import { rows } from '../config/database.js';

export async function getDocument(id) {
  const records=await rows('SELECT document FROM dataset_documents WHERE id=?',[id]);
  if (!records.length) { const error=new Error('Database seed metadata is missing. Run db:setup.');error.code='DB_SCHEMA_NOT_READY';throw error; }
  return records[0].document;
}
export function ordered(records, ids, key='id') {
  const positions=new Map(ids.map((id,index)=>[id,index]));
  return records.sort((a,b)=>(positions.get(a[key])??Number.MAX_SAFE_INTEGER)-(positions.get(b[key])??Number.MAX_SAFE_INTEGER)||String(a[key]).localeCompare(String(b[key])));
}
export function optional(record,key,value) { if(value!==null&&value!==undefined)record[key]=value;return record; }
