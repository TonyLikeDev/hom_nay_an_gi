import {isIP} from 'node:net';
export function clientIp(req,env=process.env){
 if(env.VERCEL==='1'){
  const header=req.headers['x-vercel-forwarded-for'];
  const candidate=typeof header==='string'?header.split(',')[0].trim():'';
  if(isIP(candidate))return candidate;
 }
 return req.socket?.remoteAddress||'127.0.0.1';
}
