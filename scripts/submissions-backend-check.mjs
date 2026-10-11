/** Live synthetic integration check. Never imports the runtime or Gmail sender. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {UserToken,ServiceToken,FirestoreStore,DriveStorage} from '../server/submissions/adapters.mjs';
import {Portal} from '../server/submissions/core.mjs';
import {GoogleSheetsRegister} from '../server/submissions/sheets.mjs';
import {SubmissionRegister,REGISTER_HEADERS,registerValues} from '../server/submissions/register.mjs';
import {fail,sha256} from '../server/submissions/security.mjs';
import {FakeMail,login,pdf,proposalInput,complete} from '../tests/submissions/fakes.mjs';

const PRIVATE=path.join(os.homedir(),'Library/Application Support/SERI Teaching Submissions');
const PROJECT='seri-teaching-submissions',OWNER='maor.shani@gmail.com';
const COLLECTION='seri_submissions_integration_test',PURPOSE='backend-check-v1';
const MIME='application/vnd.google-apps.spreadsheet';
const DRIVE='https://www.googleapis.com/drive/v3';

async function privateFile(name,create){
 const filename=path.join(PRIVATE,name);
 try{return JSON.parse(await fs.readFile(filename,'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const value=await create();
 await fs.writeFile(filename,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
 return value;
}
async function json(token,url,options={}){
 const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+await token.get(),'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30_000)});
 fail(response.ok,'CHECK_GOOGLE_HTTP_'+response.status,503);return response.json();
}
export async function checkBackend({progress=()=>{}}={}){
 await fs.mkdir(PRIVATE,{recursive:true,mode:0o700});
 fail(((await fs.stat(PRIVATE)).mode&0o777)===0o700,'CHECK_PRIVATE_DIRECTORY',503);
 const credentials=await privateFile('firestore-service-account.json',async()=>{
  const value=JSON.parse(await fs.readFile(path.join(os.homedir(),'Downloads/seri-firestore-service-account.json'),'utf8'));
  fail(value.type==='service_account'&&value.project_id===PROJECT&&value.client_email===`seri-submissions-backend@${PROJECT}.iam.gserviceaccount.com`&&value.private_key,'CHECK_ACCOUNT_MISMATCH',503);
  return value;
 });
 fail(credentials.type==='service_account'&&credentials.project_id===PROJECT&&credentials.client_email===`seri-submissions-backend@${PROJECT}.iam.gserviceaccount.com`,'CHECK_ACCOUNT_MISMATCH',503);
 const state=await privateFile('backend-check-keys.json',async()=>({encryptionKey:randomBytes(32).toString('base64'),secret:randomBytes(48).toString('base64url')}));
 const serviceToken=new ServiceToken(credentials);
 const database=await json(serviceToken,`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)`);
 fail(database.name===`projects/${PROJECT}/databases/(default)`&&database.type==='FIRESTORE_NATIVE','CHECK_DATABASE_MISMATCH',503);
 const store=new FirestoreStore({projectId:PROJECT,collection:COLLECTION,token:serviceToken,encryptionKey:state.encryptionKey});
 const run=randomBytes(12).toString('hex'),probe='check_'+run;
 await store.transaction([probe],tx=>tx.set(probe,{kind:'synthetic-connection-check',count:0}));
 await Promise.all([1,2,3].map(()=>store.transaction([probe],tx=>{const value=tx.get(probe);value.count++;tx.set(probe,value);})));
 assert.deepEqual(await store.get(probe),{kind:'synthetic-connection-check',count:3});
 const raw=await json(serviceToken,'https://firestore.googleapis.com/v1/'+store.name(probe));
 assert.deepEqual(Object.keys(raw.fields),['payload']);
 fail(typeof raw.fields.payload.stringValue==='string'&&!raw.fields.payload.stringValue.includes('synthetic-connection-check'),'CHECK_ENCRYPTION',503);
 progress({stage:'firestore-verified',databaseType:database.type,location:database.locationId,encryptedTransactions:true,concurrentUpdates:true});

 const credential=JSON.parse(await fs.readFile(path.join(PRIVATE,'google-oauth.json'),'utf8'));
 fail(credential.projectId===PROJECT&&credential.ownerEmail===OWNER,'CHECK_ACCOUNT_MISMATCH',503);
 const previous=JSON.parse(await fs.readFile(path.join(PRIVATE,'google-integration-check.json'),'utf8'));
 const token=new UserToken(credential),drive=new DriveStorage({token,ownerEmail:OWNER});
 const root=previous.rootFolderId,rootInfo=await drive.checkFolder(root);
 fail(rootInfo.appProperties?.seriIntegration==='google-check-v1'&&rootInfo.appProperties?.seriFixture==='root','CHECK_FIXTURE_MISMATCH',503);
 const query=new URLSearchParams({q:`trashed=false and '${root}' in parents and appProperties has { key='seriIntegration' and value='${PURPOSE}' }`,fields:'files(id,mimeType),nextPageToken',pageSize:'10'});
 const listed=await json(token,DRIVE+'/files?'+query);
 fail(!listed.nextPageToken&&listed.files.length<=1,'CHECK_FIXTURE_AMBIGUOUS',503);
 let registerId=listed.files[0]?.id;
 if(registerId)fail(listed.files[0].mimeType===MIME,'CHECK_FIXTURE_MISMATCH',503);
 else registerId=(await json(token,DRIVE+'/files?fields=id',{method:'POST',body:JSON.stringify({name:'SERI backend workflow TEST - synthetic records only',mimeType:MIME,parents:[root],appProperties:{seriIntegration:PURPOSE,seriRegister:'v1'}})})).id;
 await drive.privateOnly(registerId);
 const base='https://sheets.googleapis.com/v4/spreadsheets/'+registerId;
 const book=await json(token,base+'?fields=sheets(properties)');
 fail(book.sheets?.length===1,'CHECK_FIXTURE_SCHEMA',503);
 const properties=book.sheets[0].properties,tab="'"+properties.title.replaceAll("'","''")+"'";
 const headerPath='/values/'+encodeURIComponent(tab+'!A1:R1'),header=await json(token,base+headerPath);
 if(!header.values?.some(row=>row.some(v=>v!==''))){
  await json(token,base+headerPath+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[REGISTER_HEADERS]})});
  await json(token,base+':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{updateSheetProperties:{properties:{sheetId:properties.sheetId,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}}]})});
 }
 const sheets=new GoogleSheetsRegister({token,drive,spreadsheetId:registerId,sheetId:properties.sheetId});
 await sheets.check();
 // Keep synthetic coursework inside a fixed catalogue window. Advance only for retry backoff.
 const clock={now:Date.parse('2026-10-11T12:00:00.000Z')+parseInt(run.slice(0,6),16)};
 const register=new SubmissionRegister({store,sheets,now:()=>clock.now}),mail=new FakeMail();
 const portal=new Portal({store,drive,mail,register,secret:state.secret,ownerEmail:OWNER,folderMap:{'sem-a01':root},now:()=>clock.now});
 const fixture={portal,mail};
 const account=await login(fixture,`synthetic-${run}@example.test`),other=await login(fixture,`other-${run}@example.test`);
 const bytes=pdf(),firstInput=proposalInput(bytes,{name:'Synthetic Integration Student',studentNumber:'00000000',teamNames:'Synthetic Test Partner',key:'synthetic_r0_'+run});
 const first=await complete(fixture,account.session,firstInput);
 assert.equal(first.receipt.revision,0);
 assert.equal((await store.get('register_job_'+first.record.id)).state,'synced');
 assert.equal((await portal.start(account.session,firstInput)).id,first.record.id);
 assert.deepEqual(await portal.finish(account.session,first.record.id),first.receipt);
 await assert.rejects(()=>portal.status(other.session,first.record.id),error=>error.code==='NOT_FOUND');
 progress({stage:'first-submission-verified',revision:0,automaticRegister:true,duplicateCompletionSafe:true,accountIsolation:true});

 // Model a successful Sheets write whose response is lost. The outbox must retry the same row.
 let loseResponse=true;
 const writeRow=sheets.writeRow.bind(sheets);
 sheets.writeRow=async(row,values)=>{await writeRow(row,values);if(loseResponse){loseResponse=false;throw new Error('SYNTHETIC_LOST_RESPONSE');}};
 const second=await complete(fixture,account.session,{...firstInput,key:'synthetic_r1_'+run});
 assert.equal(second.receipt.revision,1);
 const queued=await store.get('register_job_'+second.record.id);
 assert.equal(queued.state,'queued');
 clock.now=queued.nextTry+1;
 await register.drain();
 assert.equal((await store.get('register_job_'+second.record.id)).state,'synced');
 assert.deepEqual(await portal.finish(account.session,second.record.id),second.receipt);
 for(const submission of [first,second]){
  const id=submission.record.id,record=await store.get('submission_'+id),job=await store.get('register_job_'+id);
  const actual=await json(token,base+'/values/'+encodeURIComponent(`${tab}!A${job.row}:R${job.row}`));
  fail(registerValues(record).every((value,index)=>(actual.values?.[0]?.[index]??'')===value),'CHECK_REGISTER_READBACK',503);
  for(const file of record.files){
   await drive.checkFile(file.driveId,file.parent,file.size);
   assert.equal(sha256(await drive.read(file.driveId,file.size)),sha256(bytes));
   assert.equal((await drive.info(file.driveId)).name,file.finalName);
  }
 }
 const column=await json(token,base+'/values/'+encodeURIComponent(tab+'!A2:A'));
 for(const submission of [first,second])assert.equal(column.values.filter(row=>row[0]===submission.record.id).length,1);
 assert.equal((await portal.receipts(account.session)).submissions.length,2);
 const result={checkedAt:new Date().toISOString(),projectId:PROJECT,databaseId:'(default)',databaseType:database.type,location:database.locationId,collection:COLLECTION,
  encryptedTransactionsVerified:true,concurrentUpdatesVerified:true,syntheticOtpVerified:true,accountIsolationVerified:true,driveUploadAndRenameVerified:true,
  revisionsVerified:[0,1],automaticRegisterVerified:true,lostResponseRetryKeptOneRow:true,receiptReadbackVerified:true,emailSent:false,intakeEnabled:false,
  spreadsheetId:registerId,sheetId:properties.sheetId,registerUrl:'https://docs.google.com/spreadsheets/d/'+registerId+'/edit',submissionIds:[first.record.id,second.record.id]};
 await fs.writeFile(path.join(PRIVATE,'backend-integration-check.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))checkBackend({progress:value=>console.log(JSON.stringify(value))}).then(result=>console.log(JSON.stringify(result))).catch(error=>{
 const code=/^(CHECK_|STORAGE_|REGISTER_|PROVIDER_|DATABASE_)[A-Z0-9_]+$/.test(error.code||'')?error.code:error.code==='ERR_ASSERTION'?'CHECK_ASSERTION':'BACKEND_INTEGRATION_CHECK_FAILED';
 console.error(JSON.stringify({status:'failed',code}));process.exitCode=1;
});
