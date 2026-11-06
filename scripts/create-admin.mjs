import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {spawn} from 'node:child_process';
import {provisionAdmin} from '../server/services/provision-admin.js';
import {closeDatabase} from '../server/config/database.js';

async function secret(prompt){
 if(!process.stdin.isTTY)throw new Error('Hãy chạy trong terminal tương tác, hoặc dùng --desktop trên Windows.');
 process.stdout.write(prompt);const output=new Writable({write(_chunk,_encoding,done){done();}});
 const rl=createInterface({input:process.stdin,output,terminal:true});
 try{return await rl.question('');}finally{rl.close();process.stdout.write('\n');}
}
async function desktop(email){
 if(process.platform!=='win32')throw new Error('--desktop chỉ dành cho Windows.');
 const script=`Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$form=New-Object System.Windows.Forms.Form
$form.Text='Create website admin'
$form.Size=New-Object System.Drawing.Size(490,260)
$form.StartPosition='CenterScreen'
$form.TopMost=$true
$label=New-Object System.Windows.Forms.Label
$label.Text='Website admin: '+$env:HNAG_SETUP_EMAIL+'\nEnter NEW password, then repeat (12-128 characters).'
$label.Location=New-Object System.Drawing.Point(20,15)
$label.Size=New-Object System.Drawing.Size(440,50)
$a=New-Object System.Windows.Forms.TextBox
$a.Location=New-Object System.Drawing.Point(20,75)
$a.Width=430
$a.UseSystemPasswordChar=$true
$b=New-Object System.Windows.Forms.TextBox
$b.Location=New-Object System.Drawing.Point(20,115)
$b.Width=430
$b.UseSystemPasswordChar=$true
$button=New-Object System.Windows.Forms.Button
$button.Text='Create admin'
$button.Width=120
$button.Location=New-Object System.Drawing.Point(330,165)
$button.Add_Click({if($a.Text.Length -lt 12 -or $a.Text.Length -gt 128 -or $a.Text -cne $b.Text){[void][System.Windows.Forms.MessageBox]::Show('Enter the same password twice, 12-128 characters.');return};$form.Tag=$a.Text;$form.DialogResult=[System.Windows.Forms.DialogResult]::OK;$form.Close()})
$form.Controls.AddRange(@($label,$a,$b,$button))
$form.AcceptButton=$button
if($form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){@{password=$form.Tag}|ConvertTo-Json -Compress}
`;
 return await new Promise((resolve,reject)=>{
  const child=spawn('powershell.exe',['-NoProfile','-STA','-WindowStyle','Normal','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:false,env:{...process.env,HNAG_SETUP_EMAIL:email},stdio:['ignore','pipe','pipe']});
  let out='';child.stdout.on('data',d=>out+=d);child.stderr.resume();child.on('error',()=>reject(new Error('Không mở được hộp nhập.')));child.on('exit',code=>{try{if(code!==0||!out.trim())throw new Error();resolve(JSON.parse(out).password);}catch{reject(new Error('Đã hủy hoặc không nhập được mật khẩu.'));}});
 });
}
let password;
try{
 const args=process.argv.slice(2),email=args.find(a=>!a.startsWith('--'));
 if(!email||args.some(a=>a.startsWith('--')&&a!=='--desktop'))throw new Error('Cách chạy: npm run admin:create -- EMAIL [--desktop]');
 if(args.includes('--desktop'))password=await desktop(email);
 else{password=await secret('Mật khẩu admin mới (ẩn ký tự): ');const confirm=await secret('Nhập lại mật khẩu: ');if(password!==confirm)throw new Error('Hai mật khẩu không khớp.');}
 const user=await provisionAdmin({email,password});password=undefined;
 console.log(JSON.stringify({created:true,user},null,2));
}catch(error){console.error(error.code?'Không tạo được admin ('+error.code+').':error.message);process.exitCode=1;}
finally{password=undefined;await closeDatabase();}
