/** Isolated Drive/Sheets integration fixture. Uses no real coursework or email. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {UserToken,DriveStorage} from '../server/submissions/adapters.mjs';
import {GoogleSheetsRegister} from '../server/submissions/sheets.mjs';
import {REGISTER_HEADERS,registerValues} from '../server/submissions/register.mjs';
import {fail,sha256} from '../server/submissions/security.mjs';

const PRIVATE=path.join(os.homedir(),'Library/Application Support/SERI Teaching Submissions');
const DRIVE='https://www.googleapis.com/drive/v3';
const PURPOSE='google-check-v1';
export async function checkGoogle(){
 const credential=JSON.parse(await fs.readFile(path.join(PRIVATE,'google-oauth.json'),'utf8'));
 fail(credential.projectId==='seri-teaching-submissions'&&credential.ownerEmail==='maor.shani@gmail.com','CHECK_ACCOUNT_MISMATCH',503);
 const token=new UserToken(credential),drive=new DriveStorage({token,ownerEmail:credential.ownerEmail});
 async function json(url,options={}){
  const r=await fetch(url,{...options,headers:{Authorization:'Bearer '+await token.get(),'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30_000)});
  fail(r.ok,'CHECK_GOOGLE_HTTP_'+r.status,503);return r.json();
 }
 const listed=await json(DRIVE+'/files?'+new URLSearchParams({q:`trashed=false and appProperties has { key='seriIntegration' and value='${PURPOSE}' }`,fields:'files(id,mimeType,appProperties),nextPageToken',pageSize:'100'}));
 fail(!listed.nextPageToken,'CHECK_FIXTURE_AMBIGUOUS',503);
 async function ensure(kind,name,mimeType,parents){
  const matches=listed.files.filter(f=>f.appProperties?.seriFixture===kind);fail(matches.length<=1,'CHECK_FIXTURE_AMBIGUOUS',503);
  if(matches[0]){fail(matches[0].mimeType===mimeType,'CHECK_FIXTURE_MISMATCH',503);return matches[0].id;}
  const f=await json(DRIVE+'/files?fields=id',{method:'POST',body:JSON.stringify({name,mimeType,...(parents?{parents}:{}),appProperties:{seriIntegration:PURPOSE,seriFixture:kind,...(kind==='register'?{seriRegister:'v1'}:{})}})});
  return f.id;
 }
 const root=await ensure('root','SERI Submissions PRIVATE integration tests','application/vnd.google-apps.folder');
 await drive.checkFolder(root);
 const registerId=await ensure('register','SERI submission register TEST - synthetic records only','application/vnd.google-apps.spreadsheet',[root]);
 const metadata=await drive.info(registerId);await drive.privateOnly(registerId);
 fail(metadata.parents?.length===1&&metadata.parents[0]===root&&metadata.owners?.length===1&&metadata.owners[0].emailAddress===credential.ownerEmail,'CHECK_FIXTURE_NOT_PRIVATE',503);
 const sheetsBase='https://sheets.googleapis.com/v4/spreadsheets/'+registerId;
 const book=await json(sheetsBase+'?fields=sheets(properties)');
 fail(book.sheets?.length===1,'CHECK_FIXTURE_SCHEMA',503);const properties=book.sheets[0].properties;
 const tab="'"+properties.title.replaceAll("'","''")+"'";
 const headerPath='/values/'+encodeURIComponent(tab+'!A1:R1');
 const header=await json(sheetsBase+headerPath);
 if(!header.values?.some(row=>row.some(value=>value!==''))){
  await json(sheetsBase+headerPath+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[REGISTER_HEADERS]})});
  await json(sheetsBase+':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{updateSheetProperties:{properties:{sheetId:properties.sheetId,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}}]})});
 }
 const sheets=new GoogleSheetsRegister({token,drive,spreadsheetId:registerId,sheetId:properties.sheetId});
 await sheets.check();
 const bytes=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
 const fileList=await json(DRIVE+'/files?'+new URLSearchParams({q:`trashed=false and '${root}' in parents and appProperties has { key='seriSubmission' and value='${PURPOSE}' }`,fields:'files(id),nextPageToken',pageSize:'10'}));
 fail(!fileList.nextPageToken&&fileList.files.length<=1,'CHECK_FIXTURE_AMBIGUOUS',503);
 let fileId=fileList.files[0]?.id;
 if(!fileId){
  fileId=await drive.allocateId();
  const location=await drive.begin({id:fileId,parent:root,name:'SYNTHETIC_CONNECTION_CHECK.pdf',size:bytes.length,submission:PURPOSE,index:0});
  const uploaded=await drive.chunk({location,size:bytes.length},0,bytes);fail(uploaded.complete,'CHECK_UPLOAD_INCOMPLETE',503);
 }
 await drive.checkFile(fileId,root,bytes.length);
 fail(sha256(await drive.read(fileId,bytes.length))===sha256(bytes),'CHECK_UPLOAD_HASH',503);
 // Fixed synthetic identity and values make repeat checks idempotent.
 const record={id:'SYNTHETIC_CONNECTION_CHECK_V1',reference:'SERI-TEST-ONLY',course:'synthetic',assignment:'synthetic-connection-check',revision:0,
  state:'completed',name:'Synthetic Test Student',studentNumber:'00000000',email:'synthetic@example.test',teamNames:[],teamCode:null,lateReason:'',
  receipt:{receivedAt:'2026-10-11T00:00:00.000Z',status:'synthetic-test'},
  files:[{finalName:'SYNTHETIC_CONNECTION_CHECK.pdf',originalName:'synthetic.pdf',size:bytes.length,driveId:fileId}]};
 const values=registerValues(record);await sheets.writeRow(2,values);await sheets.writeRow(2,values);
 const readback=await json(sheetsBase+'/values/'+encodeURIComponent(tab+'!A2:R3'));
 fail(readback.values?.length===1&&values.every((v,i)=>(readback.values[0][i]??'')===v),'CHECK_REGISTER_READBACK',503);
 const result={checkedAt:new Date().toISOString(),driveUploadVerified:true,drivePermissionsOwnerOnly:true,registerPermissionsOwnerOnly:true,sheetsWriteAndReadbackVerified:true,retryKeptOneRow:true,
  emailSent:false,firestoreTested:false,intakeEnabled:false,rootFolderId:root,spreadsheetId:registerId,sheetId:properties.sheetId,syntheticFileId:fileId,
  registerUrl:'https://docs.google.com/spreadsheets/d/'+registerId+'/edit'};
 await fs.writeFile(path.join(PRIVATE,'google-integration-check.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))checkGoogle().then(result=>console.log(JSON.stringify(result))).catch(error=>{
 const code=/^(CHECK_|STORAGE_|REGISTER_|PROVIDER_)[A-Z0-9_]+$/.test(error.code||'')?error.code:'GOOGLE_INTEGRATION_CHECK_FAILED';
 console.error(JSON.stringify({status:'failed',code}));process.exitCode=1;
});
