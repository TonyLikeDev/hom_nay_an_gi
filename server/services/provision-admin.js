import {createAuth} from '../config/auth.js';
import {rows} from '../config/database.js';
export async function provisionAdmin({email,password,name='Quản trị viên'}){
 email=String(email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Email không hợp lệ.');
 if(typeof password!=='string'||password.length<12||password.length>128)throw new Error('Mật khẩu cần từ 12 đến 128 ký tự.');
 const existing=await rows('SELECT id FROM users WHERE email=?',[email]);if(existing.length)throw new Error('Email đã có tài khoản. Không tự đổi mật khẩu hoặc nâng quyền tài khoản hiện có.');
 const auth=createAuth({provisioning:true});
 const result=await auth.api.signUpEmail({body:{email,password,name}});
 if(!result.user||result.user.role!=='admin')throw new Error('Chưa xác nhận được quyền admin.');
 return {id:String(result.user.id),email:result.user.email,role:result.user.role};
}
