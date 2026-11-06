import {authOrigin} from '../config/auth.js';
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export async function jsonMutation(req,{limit=16384}={}){
 if(req.headers.origin!==authOrigin()||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'Yêu cầu không hợp lệ. Hãy thao tác từ website.');
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw new HttpError(415,'Yêu cầu phải có định dạng JSON.');
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>limit)throw new HttpError(413,'Nội dung vượt quá dung lượng cho phép.');chunks.push(chunk);}
 let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'Nội dung JSON không hợp lệ.');}
 if(!value||Array.isArray(value)||typeof value!=='object')throw new HttpError(400,'Nội dung gửi lên không hợp lệ.');return value;
}
