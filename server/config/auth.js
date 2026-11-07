import {betterAuth} from 'better-auth';
import {getPool} from './database.js';

export function authOrigin(env=process.env){
 const url=new URL(env.BETTER_AUTH_URL||'http://127.0.0.1:3000');
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('BETTER_AUTH_URL must be the website origin.');
 if(env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Production auth requires HTTPS.');
 return url.origin;
}
export function createAuth({provisioning=false}={}){
 const secret=process.env.BETTER_AUTH_SECRET;
 if(!secret||secret.length<32){const error=new Error('Set a random BETTER_AUTH_SECRET (at least 32 characters).');error.code='AUTH_CONFIG_INVALID';throw error;}
 const origin=authOrigin();
 return betterAuth({
  appName:'Hôm nay ăn gì?',baseURL:origin,basePath:'/api/auth',secret,
  database:getPool(),trustedOrigins:[origin],
  logger:{disabled:true},
  emailAndPassword:{enabled:true,disableSignUp:!provisioning,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128},
  user:{modelName:'users',fields:{name:'display_name',emailVerified:'email_verified',createdAt:'created_at',updatedAt:'updated_at'},additionalFields:{role:{type:'string',required:false,defaultValue:provisioning?'admin':'user',input:false}}},
  session:{modelName:'auth_sessions',fields:{userId:'user_id',expiresAt:'expires_at',createdAt:'created_at',updatedAt:'updated_at',ipAddress:'ip_address',userAgent:'user_agent'},expiresIn:8*60*60,updateAge:30*60,cookieCache:{enabled:false}},
  account:{modelName:'auth_accounts',fields:{userId:'user_id',accountId:'account_id',providerId:'provider_id',accessToken:'access_token',refreshToken:'refresh_token',idToken:'id_token',accessTokenExpiresAt:'access_token_expires_at',refreshTokenExpiresAt:'refresh_token_expires_at',createdAt:'created_at',updatedAt:'updated_at'}},
  verification:{modelName:'auth_verifications',fields:{expiresAt:'expires_at',createdAt:'created_at',updatedAt:'updated_at'}},
  rateLimit:{enabled:true,storage:'database',modelName:'auth_rate_limits',fields:{lastRequest:'last_request'},window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5}}},
  advanced:{database:{generateId:'serial'},useSecureCookies:origin.startsWith('https:'),cookiePrefix:'hnag',defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['x-hnag-client-ip']}},
 });
}
let instance;
export function getAuth(){return instance??=createAuth();}
export function resetAuth(){instance=undefined;}
