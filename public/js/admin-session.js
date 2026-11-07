const AdminSession=(()=>{
 const account=document.getElementById('admin-account'),button=document.getElementById('admin-logout');
 let checking;
 async function check(){
  if(checking)return checking;
  checking=(async()=>{try{
   const response=await fetch('/api/admin/me',{credentials:'same-origin',cache:'no-store'});
   if(response.status===401||response.status===403){document.getElementById('admin-content').replaceChildren();location.replace('admin-login.html'+(response.status===403?'?reason=forbidden':''));return null;}
   if(!response.ok)throw new Error();const {user}=await response.json();account.textContent=user.email;return user;
  }catch{document.getElementById('admin-status').textContent='Chưa kiểm tra được phiên đăng nhập. Vui lòng tải lại trang để thử lại.';return null;}finally{checking=undefined;}})();return checking;
 }
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{const response=await fetch('/api/auth/sign-out',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error();document.getElementById('admin-content').replaceChildren();location.replace('admin-login.html');}
  catch{document.getElementById('admin-status').textContent='Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại.';button.disabled=false;}
 });
 addEventListener('pageshow',event=>{if(event.persisted)check();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 return {ready:check(),check};
})();
