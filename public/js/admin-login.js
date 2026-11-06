/* Cookie-based authentication; no passwords, roles or session tokens in localStorage. */
(() => {
 const form=document.getElementById('admin-login-form'),password=document.getElementById('admin-password'),status=document.getElementById('login-status'),button=form.querySelector('[type=submit]');
 document.getElementById('password-toggle').addEventListener('click',event=>{const show=password.type==='password';password.type=show?'text':'password';event.currentTarget.textContent=show?'Ẩn':'Hiện';event.currentTarget.setAttribute('aria-pressed',String(show));});
 if(new URLSearchParams(location.search).get('reason')==='forbidden')status.textContent='Tài khoản không có quyền quản trị. Vui lòng dùng tài khoản admin.';
 fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.user.role==='admin')location.replace('admin.html');}).catch(()=>{});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(button.disabled)return;button.disabled=true;button.textContent='Đang đăng nhập…';status.textContent='';form.setAttribute('aria-busy','true');
  try{
   const response=await fetch('/api/auth/sign-in/email',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('admin-email').value.trim(),password:password.value})});
   const result=await response.json();if(!response.ok){status.textContent=result.message||'Chưa đăng nhập được. Vui lòng thử lại.';return;}
   const me=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});if(!me.ok)throw new Error();const {user}=await me.json();
   if(user.role!=='admin'){
    await fetch('/api/auth/sign-out',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
    status.textContent='Tài khoản không có quyền quản trị. Vui lòng dùng tài khoản admin.';return;
   }
   password.value='';location.replace('admin.html');
  }catch{status.textContent='Không kết nối được hệ thống đăng nhập. Kiểm tra kết nối và thử lại.';}
  finally{button.disabled=false;button.textContent='Đăng nhập →';form.removeAttribute('aria-busy');}
 });
})();
