import test from 'node:test';
import assert from 'node:assert/strict';
import {SubmissionRegister,REGISTER_HEADERS,registerValues} from '../../server/submissions/register.mjs';
import {GoogleSheetsRegister} from '../../server/submissions/sheets.mjs';
import {configuration} from '../../server/submissions/runtime.mjs';
import {PortalError} from '../../server/submissions/security.mjs';
import {fixture,login,complete,proposalInput,pdf} from './fakes.mjs';

function registered(){
 const f=fixture();
 const sheets={target:'synthetic-register:0',rows:new Map(),calls:0,fail:false,loseResponse:false,
  async writeRow(row,values){this.calls++;if(this.fail)throw new PortalError('REGISTER_UNAVAILABLE',503);this.rows.set(row,values);
   if(this.loseResponse){this.loseResponse=false;throw new PortalError('REGISTER_UNAVAILABLE',503);}}
 };
 const register=new SubmissionRegister({store:f.store,sheets,now:()=>f.clock.now});
 f.portal.register=register;return {...f,sheets,register};
}

test('completed attempts automatically populate one private register row',async()=>{
 const f=registered(),s=await login(f),r=await complete(f,s.session);
 assert.equal(f.sheets.rows.size,1);const row=f.sheets.rows.get(2);
 assert.equal(row.length,REGISTER_HEADERS.length);assert.equal(row[0],r.record.id);assert.equal(row[9],'00123456');
 assert.equal(row[10],'student@example.test');assert.equal(row[7],'on-time');
 assert.deepEqual((await f.store.get('queue_register')).ids,[]);
 assert.equal((await f.store.get('register_job_'+r.record.id)).state,'synced');
 const publicJson=JSON.stringify(await f.portal.receipts(s.session));
 assert.ok(!publicJson.includes(f.sheets.target));assert.ok(!publicJson.includes(row[16]));
});
test('a lost Sheets response retries the same row without another revision',async()=>{
 const f=registered(),s=await login(f);f.sheets.loseResponse=true;const r=await complete(f,s.session);
 assert.equal(r.receipt.revision,0);assert.equal((await f.store.get('queue_register')).ids.length,1);
 f.clock.now+=3600_000;const result=await f.portal.drain();
 assert.deepEqual(result.register,{synced:1,queued:0});assert.equal(f.sheets.calls,2);assert.equal(f.sheets.rows.size,1);
 assert.equal((await f.portal.status(s.session,r.record.id)).state,'completed');
});
test('register failure preserves completed work and delivered receipt',async()=>{
 const f=registered(),s=await login(f);f.sheets.fail=true;const r=await complete(f,s.session);
 assert.equal(r.receipt.emailStatus,'accepted-by-email-provider');assert.equal((await f.portal.status(s.session,r.record.id)).state,'completed');
 const job=await f.store.get('register_job_'+r.record.id);assert.equal(job.state,'queued');assert.equal(job.lastError,'REGISTER_UNAVAILABLE');
 await f.portal.drain();assert.equal(f.sheets.calls,1,'retry backoff is respected');
 f.sheets.fail=false;f.clock.now+=3600_000;await f.portal.drain();assert.equal(f.sheets.rows.size,1);
});
test('repeated completion and start requests do not allocate duplicate rows',async()=>{
 const f=registered(),s=await login(f),r=await complete(f,s.session);
 await f.portal.finish(s.session,r.record.id);await f.portal.start(s.session,proposalInput());
 assert.equal(f.sheets.rows.size,1);assert.equal((await f.store.get('register_cursor')).nextRow,3);
});
test('R0, R1 and separate accounts retain distinct register rows',async()=>{
 const f=registered(),s=await login(f),other=await login(f,'other@example.test');
 await complete(f,s.session);await complete(f,s.session,proposalInput(pdf(),{key:'next_revision_request_12345'}));await complete(f,other.session);
 assert.equal(f.sheets.rows.size,3);assert.deepEqual([...f.sheets.rows.values()].map(x=>x[4]),['R0','R1','R0']);
 assert.equal(new Set([...f.sheets.rows.values()].map(x=>x[0])).size,3);
});
test('parallel completions reserve unique rows transactionally',async()=>{
 const f=registered(),a=await login(f),b=await login(f,'other@example.test');
 await Promise.all([complete(f,a.session),complete(f,b.session)]);
 assert.deepEqual([...f.sheets.rows.keys()].sort(),[2,3]);
});
test('incomplete and cancelled attempts never enter the register queue',async()=>{
 const f=registered(),s=await login(f),r=await f.portal.start(s.session,proposalInput());
 await assert.rejects(()=>f.portal.finish(s.session,r.id),e=>e.code==='INCOMPLETE_FILES');await f.portal.cancel(s.session,r.id);
 assert.equal(await f.store.get('register_cursor'),null);assert.equal(f.sheets.calls,0);
});
test('full register queue prevents completion without losing a retryable attempt',async()=>{
 const f=registered(),s=await login(f),r=await f.portal.start(s.session,proposalInput());await f.portal.upload(s.session,r.id,0,0,pdf());
 await f.store.transaction(['queue_register'],tx=>tx.set('queue_register',{ids:Array.from({length:3000},(_,i)=>String(i))}));
 await assert.rejects(()=>f.portal.finish(s.session,r.id),e=>e.code==='REGISTER_QUEUE_FULL');
 assert.equal((await f.store.get('submission_'+r.id)).receipt,undefined);assert.equal(await f.store.get('register_cursor'),null);
 await f.store.transaction(['queue_register'],tx=>tx.set('queue_register',{ids:[]}));await f.portal.finish(s.session,r.id);
 assert.equal(f.sheets.rows.get(2)[4],'R0');
});
test('queued records cannot be redirected to a different spreadsheet',async()=>{
 const f=registered(),s=await login(f);f.sheets.fail=true;const r=await complete(f,s.session);
 f.clock.now+=3600_000;f.sheets.target='another-register:0';
 await assert.rejects(()=>f.register.sync(r.record.id),e=>e.code==='REGISTER_TARGET_CHANGED');assert.equal(f.sheets.calls,1);
});
test('concurrent retry workers deliver a queued register record once',async()=>{
 const f=registered(),s=await login(f);f.sheets.fail=true;const r=await complete(f,s.session);
 f.sheets.fail=false;f.clock.now+=3600_000;const before=f.sheets.calls;
 await Promise.all([f.register.sync(r.record.id),f.register.sync(r.record.id)]);assert.equal(f.sheets.calls-before,1);
});
test('register values accept only completed records',()=>{
 assert.throws(()=>registerValues({state:'pending'}),e=>e.code==='REGISTER_RECORD_INVALID');
});

function google(t,{shared=false,owner='owner@example.test',marker='v1',header=REGISTER_HEADERS,current=[],rowCount=1000,readback=true}={}){
 const requests=[],drive={ownerEmail:'owner@example.test',async info(){return {mimeType:'application/vnd.google-apps.spreadsheet',owners:[{emailAddress:owner}],appProperties:{seriRegister:marker}};},async privateOnly(){if(shared)throw new PortalError('STORAGE_NOT_PRIVATE',503);}};
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  requests.push({url,options});let value;
  if(options.method==='PUT'){const body=JSON.parse(options.body);value={updatedRows:1,updatedData:{values:readback?body.values:[['unexpected']]}};}
  else if(url.includes('?fields='))value={sheets:[{properties:{sheetId:0,title:"Lecturer's register",sheetType:'GRID',gridProperties:{rowCount,columnCount:18}}}]};
  else if(decodeURIComponent(url).includes('!A1:R1'))value={values:[header]};
  else value={values:[current]};
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
 });
 const sheets=new GoogleSheetsRegister({token:{async get(){return 'synthetic-token';}},drive,spreadsheetId:'synthetic_register_id',sheetId:'0'});
 const values=Array(18).fill('');values[0]='synthetic_submission';values[8]='=IMPORTXML("https://example.test","//x")';values[9]='00123456';
 return {sheets,requests,values};
}
test('Sheets writes a fixed RAW range and verifies returned values',async t=>{
 const {sheets,requests,values}=google(t);await sheets.writeRow(2,values);
 const write=requests.find(x=>x.options.method==='PUT');assert.match(write.url,/valueInputOption=RAW/);
 assert.equal(JSON.parse(write.options.body).range,"'Lecturer''s register'!A2:R2");
 assert.equal(JSON.parse(write.options.body).values[0][9],'00123456');assert.equal(requests.filter(x=>x.options.method==='PUT').length,1);
});
for(const [name,options,code] of [
 ['shared register',{shared:true},'STORAGE_NOT_PRIVATE'],
 ['different owner',{owner:'other@example.test'},'STORAGE_NOT_PRIVATE'],
 ['missing purpose marker',{marker:''},'REGISTER_CONFIGURATION_ERROR'],
 ['changed schema',{header:['Wrong header']},'REGISTER_SCHEMA_CHANGED'],
 ['row belonging to another submission',{current:['other-submission']},'REGISTER_ROW_CONFLICT'],
 ['occupied row with missing identity',{current:['','Existing data']},'REGISTER_ROW_CONFLICT'],
 ['exhausted grid capacity',{rowCount:1},'REGISTER_CAPACITY']
])test(`Sheets refuses ${name} before writing`,async t=>{
 const {sheets,requests,values}=google(t,options);await assert.rejects(()=>sheets.writeRow(2,values),e=>e.code===code);
 assert.ok(requests.every(x=>x.options.method!=='PUT'));
});
test('same submission may safely retry the same row',async t=>{
 const {sheets,values}=google(t,{current:['synthetic_submission']});await sheets.writeRow(2,values);
});
test('mismatched provider readback remains a retryable failure',async t=>{
 const {sheets,values}=google(t,{readback:false});await assert.rejects(()=>sheets.writeRow(2,values),e=>e.code==='REGISTER_WRITE_UNCONFIRMED');
});
test('all preview activation flags still leave intake disabled with register configuration',()=>{
 assert.deepEqual(configuration({VERCEL_ENV:'preview',SUBMISSIONS_ENABLED:'true',SUBMISSIONS_POLICY_APPROVED:'true',SUBMISSIONS_INTEGRATION_TESTED:'true',SUBMISSIONS_REGISTER_ID:'synthetic_register_id',SUBMISSIONS_REGISTER_SHEET_ID:'0'}),{enabled:false});
});
