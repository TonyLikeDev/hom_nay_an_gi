import mysql from 'mysql2/promise';
import {attachDatabasePool} from '@vercel/functions';

export function databaseName(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(value)) throw new Error('DB_NAME must use lowercase ASCII letters, digits or underscores and start with a letter (max 64).');
  return value;
}
export function connectionConfig(env = process.env) {
  if (!env.DB_USER || env.DB_PASSWORD == null) throw new Error('Set DB_USER and DB_PASSWORD in your private .env file.');
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid DB_PORT.');
  return { host: env.DB_HOST || '127.0.0.1', port, user: env.DB_USER, password: env.DB_PASSWORD,
    database: databaseName(env.DB_NAME || 'hom_nay_an_gi'), charset: 'utf8mb4', timezone:'Z', multipleStatements: false, connectTimeout: 10000,
    ...(env.DB_SSL_CA ? {ssl:{ca:env.DB_SSL_CA, rejectUnauthorized:true}} : {}) };
}
let pool;
export function getPool() {
  if (!pool) {
    // mysql2 only starts its idle cleanup timer when maxIdle < connectionLimit.
    // Release every idle connection so suspended serverless instances do not
    // exhaust the shared database's connection budget.
    try { pool=mysql.createPool({...connectionConfig(),connectionLimit:2,maxIdle:0,idleTimeout:1000,waitForConnections:true,queueLimit:100,enableKeepAlive:true});if(process.env.VERCEL==='1')attachDatabasePool(pool.pool); }
    catch { const error=new Error('Database configuration is missing or invalid.');error.code='DB_CONFIG_INVALID';throw error; }
  }
  return pool;
}
export async function rows(sql,params=[]) { const [result]=await getPool().execute(sql,params); return result; }
export async function closeDatabase(){const current=pool;pool=undefined;if(current)await current.end();}
