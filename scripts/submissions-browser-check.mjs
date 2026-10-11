/** Loopback-only browser check with live isolated Google storage and simulated mail. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {UserToken, ServiceToken, FirestoreStore, DriveStorage} from '../server/submissions/adapters.mjs';
import {Portal} from '../server/submissions/core.mjs';
import {makeHandler} from '../server/submissions/http.mjs';
import {GoogleSheetsRegister} from '../server/submissions/sheets.mjs';
import {SubmissionRegister, registerValues} from '../server/submissions/register.mjs';
import {COURSES, POLICY} from '../server/submissions/catalogue.mjs';
import {sha256} from '../server/submissions/security.mjs';
import {FakeMail} from '../tests/submissions/fakes.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIVATE=path.join(os.homedir(), 'Library/Application Support/SERI Teaching Submissions');
const readPrivate=async name=>JSON.parse(await fs.readFile(path.join(PRIVATE, name), 'utf8'));
const progress=stage=>console.log(JSON.stringify({stage}));

// A valid one-page PDF, padded with a comment to exercise the exact file-size boundary.
function syntheticPdf(size=2000){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>',
  '<< /Length 0 >>\nstream\n\nendstream'];
 let text='%PDF-1.4\n', offsets=[0];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
 const tail=x=>`xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
 let padding=size-Buffer.byteLength(text)-Buffer.byteLength(tail(size))-2;
 for(let i=0;i<4;i++)padding=size-Buffer.byteLength(text)-Buffer.byteLength(tail(Buffer.byteLength(text)+padding+2))-2;
 const prefix=Buffer.from(text+'%'+' '.repeat(padding)+'\n');
 const result=Buffer.concat([prefix,Buffer.from(tail(prefix.length))]);
 assert.equal(result.length,size);return result;
}

async function main(){
 const args=process.argv.slice(2);
 assert(args.length===0||(args.length===1&&args[0]==='--logout-only'),'Unknown check option');
 const logoutOnly=args.includes('--logout-only');
 assert.equal((await fs.stat(PRIVATE)).mode&0o777,0o700);
 const playwrightPath=process.env.SERI_PLAYWRIGHT_MODULE;
 assert(playwrightPath,'Set SERI_PLAYWRIGHT_MODULE to an installed Playwright module.');
 const {chromium}=await import(pathToFileURL(path.resolve(playwrightPath)));
 const credentials=await readPrivate('firestore-service-account.json');
 const oauth=await readPrivate('google-oauth.json');
 const keys=await readPrivate('backend-check-keys.json');
 const fixture=await readPrivate('google-integration-check.json');
 const backend=await readPrivate('backend-integration-check.json');
 assert.equal(credentials.project_id,'seri-teaching-submissions');
 assert.equal(credentials.client_email,'seri-submissions-backend@seri-teaching-submissions.iam.gserviceaccount.com');
 assert.equal(oauth.projectId,credentials.project_id);
 assert.equal(oauth.ownerEmail,'maor.shani@gmail.com');
 assert.equal(backend.collection,'seri_submissions_integration_test');
 const token=new UserToken(oauth),drive=new DriveStorage({token,ownerEmail:oauth.ownerEmail});
 const root=await drive.checkFolder(fixture.rootFolderId);
 assert.equal(root.appProperties?.seriIntegration,'google-check-v1');
 assert.equal(root.appProperties?.seriFixture,'root');
 const registerInfo=await drive.info(backend.spreadsheetId);
 assert.equal(registerInfo.appProperties?.seriIntegration,'backend-check-v1');
 assert.deepEqual(registerInfo.parents,[fixture.rootFolderId]);
 const store=new FirestoreStore({projectId:credentials.project_id,collection:backend.collection,token:new ServiceToken(credentials),encryptionKey:keys.encryptionKey});
 const sheets=new GoogleSheetsRegister({token,drive,spreadsheetId:backend.spreadsheetId,sheetId:backend.sheetId});
 const sheet=await sheets.check();
 const clock={now:Date.parse('2026-10-11T12:00:00Z')};
 const register=new SubmissionRegister({store,sheets,now:()=>clock.now}),mail=new FakeMail();
 const run=randomBytes(8).toString('hex');
 const owner=`browser-owner-${run}@example.test`;
 const portal=new Portal({store,drive,mail,register,secret:keys.secret,ownerEmail:owner,
  folderMap:Object.fromEntries(COURSES.flatMap(c=>c.assignments.map(a=>[a.id,fixture.rootFolderId]))),now:()=>clock.now});
 let enabled=false,origin,loseChunkResponse=false,chunkRequests=0;
 const chunk=drive.chunk.bind(drive);
 drive.chunk=async(...args)=>{chunkRequests++;const result=await chunk(...args);if(loseChunkResponse){loseChunkResponse=false;throw new Error('SYNTHETIC_LOST_CHUNK_RESPONSE');}return result;};
 const handler=makeHandler(()=>({enabled,origin,portal,retentionNotice:'Synthetic browser test. No student records.',cronSecret:randomBytes(32).toString('hex')}));
 const settings=JSON.parse(await fs.readFile(path.join(ROOT,'vercel.json'),'utf8'));
 const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon'};
 const tlsDirectory=await fs.mkdtemp(path.join(os.tmpdir(),'seri-browser-tls-'));
 await fs.chmod(tlsDirectory,0o700);
 const keyFile=path.join(tlsDirectory,'key.pem'),certFile=path.join(tlsDirectory,'cert.pem');
 await promisify(execFile)('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',keyFile,'-out',certFile,'-subj','/CN=localhost','-days','1']);
 const server=https.createServer({key:await fs.readFile(keyFile),cert:await fs.readFile(certFile)},async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/submissions')return handler(req,res);
  for(const header of settings.headers[0].headers)res.setHeader(header.key,header.value);
  const file=url.pathname==='/teaching/submissions'?'teaching/submissions.html':url.pathname.replace(/^\//,'');
  const resolved=path.resolve(ROOT,'dist',file);
  if(!resolved.startsWith(path.join(ROOT,'dist')+path.sep)){res.writeHead(404);return res.end();}
  try{const bytes=await fs.readFile(resolved);res.setHeader('Content-Type',contentTypes[path.extname(resolved)]||'application/octet-stream');res.end(bytes);}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 origin=`https://127.0.0.1:${server.address().port}`;
 let browser,page;
 const errors=[],screenshots=[],receipts=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.SERI_CHROME_EXECUTABLE?{executablePath:process.env.SERI_CHROME_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(60_000);
  const screenshot=async name=>{const filename=path.join(PRIVATE,`browser-${name}.png`);await page.screenshot({path:filename,fullPage:true});await fs.chmod(filename,0o600);screenshots.push(filename);};
  await page.goto(origin+'/teaching/submissions');
  await page.waitForFunction(()=>document.querySelector('#course').options.length===4);
  assert.equal(await page.locator('#send-code').isDisabled(),true);
  for(const width of (logoutOnly?[]:[390,768,1440])){
   await page.setViewportSize({width,height:900});
   for(const course of ['statistics','seminar','tests']){
    await page.selectOption('#course',course);
    assert.equal(await page.locator('#course-workflow').isVisible(),course!=='tests');
    if(course!=='tests')assert.equal(await page.locator('#full-name').isDisabled(),true);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
   }
  }
  await page.selectOption('#course','seminar');await screenshot('closed-desktop');
  progress(logoutOnly?'closed-mode-verified':'closed-page-and-responsive-course-selection-verified');
  enabled=true;await page.reload();
  await page.waitForFunction(()=>document.querySelector('#course').options.length===4);
  await page.selectOption('#course','seminar');
  async function signIn(target,email){
   const start=mail.messages.length;
   await target.fill('#student-email',email);await target.click('#send-code');
   await target.locator('#code-form').waitFor({state:'visible'});
   const message=mail.messages.slice(start).find(m=>m.to===email&&m.id.startsWith('otp-'));
   assert(message);await target.fill('#email-code',message.text.match(/\b\d{6}\b/)[0]);
   await target.click('#code-form button');await target.locator('#signed-in').waitFor({state:'visible'});
  }
  const student=`browser-student-${run}@example.test`;
  await signIn(page,student);
  const cookies=await context.cookies(origin);
  assert(cookies.some(c=>c.name==='__Host-seri'&&c.secure&&c.httpOnly&&c.sameSite==='Strict'));
  const call=async(target,action,{method='GET',data,params={},csrf}={})=>target.evaluate(async({action,method,data,params,csrf})=>{
   const response=await fetch('/api/submissions?'+new URLSearchParams({action,...params}),{method,headers:{'X-SERI-Request':'1','Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},...(method==='POST'?{body:JSON.stringify(data||{})}:{})});
   return {status:response.status,body:await response.json()};
  },{action,method,data,params,csrf});
  assert.equal((await call(page,'session')).body.email,student);
  const verifyLogout=async()=>{
   const previous=(await context.cookies(origin)).find(c=>c.name==='__Host-seri').value;
   await Promise.all([page.waitForEvent('load'),page.click('#sign-out')]);
   await page.selectOption('#course','seminar');await page.locator('#auth-card').waitFor({state:'visible'});
   assert.equal((await call(page,'status',{params:{id:'0'.repeat(32)}})).status,401);
   const replay=await context.request.get(origin+'/api/submissions?action=session',{headers:{Cookie:'__Host-seri='+previous}});
   assert.equal(replay.status(),401);
   assert.deepEqual(errors,[]);
  };
  if(logoutOnly){
   await verifyLogout();
   const result={checkedAt:new Date().toISOString(),logoutVerified:true,revokedSessionReplayRejected:true,collection:backend.collection,realEmailSent:false,intakeEnabled:false};
   await fs.writeFile(path.join(PRIVATE,'browser-logout-check.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
   console.log(JSON.stringify(result));return;
  }
  const file=syntheticPdf(POLICY.maxFileBytes);
  await page.fill('#full-name','Synthetic Browser Student');await page.fill('#student-number','00000123');
  await page.fill('#team-names','Synthetic Test Partner');
  await page.setInputFiles('#files-report',{name:'synthetic-large.pdf',mimeType:'application/pdf',buffer:file});
  await page.check('#submission-consent');
  loseChunkResponse=true;
  await page.click('#upload-button');await page.locator('#upload-recovery').waitFor({state:'visible',timeout:120_000});
  assert.equal(loseChunkResponse,false);
  await page.click('#retry-upload');await page.locator('#receipt').waitFor({state:'visible',timeout:240_000});
  assert.match(await page.locator('#receipt').innerText(),/Submission received/);
  const history=(await call(page,'receipts',{params:{course:'seminar'}})).body.submissions;
  assert.equal(history.length,1);assert.equal(history[0].receipt.revision,0);
  const record=await store.get('submission_'+history[0].id);
  assert.equal(record.studentNumber,'00000123');
  assert.equal(sha256(await drive.read(record.files[0].driveId,file.length)),sha256(file));
  assert(chunkRequests>=Math.ceil(file.length/POLICY.chunkBytes));
  receipts.push(history[0]);await screenshot('large-upload-receipt');
  progress('25mb-upload-lost-response-recovery-and-cloud-hash-verified');
  for(const revision of [1,2]){
   await page.click('#new-version');
   await page.setInputFiles('#files-report',{name:`synthetic-revision-${revision}.pdf`,mimeType:'application/pdf',buffer:syntheticPdf()});
   await page.check('#submission-consent');await page.click('#upload-button');
   await page.locator('#receipt').waitFor({state:'visible',timeout:180_000});
   const rows=(await call(page,'receipts',{params:{course:'seminar'}})).body.submissions;
   assert.equal(rows.length,revision+1);assert.equal(rows[0].revision,revision);receipts.push(rows[0]);
  }
  for(const row of receipts){
   const job=await store.get('register_job_'+row.id),record=await store.get('submission_'+row.id);
   assert.equal(job.state,'synced');
   const cells=await sheets.request('/values/'+encodeURIComponent(`${sheet.tab}!A${job.row}:R${job.row}`));
   assert(registerValues(record).every((v,i)=>(cells.values?.[0]?.[i]??'')===v));
  }
  const column=await sheets.request('/values/'+encodeURIComponent(sheet.tab+'!A2:A'));
  for(const row of receipts)assert.equal(column.values.filter(v=>v[0]===row.id).length,1);
  const rejected=await call(page,'cancel',{method:'POST',data:{id:receipts[0].id}});
  assert.equal(rejected.status,403);
  await page.click('#tab-receipts');
  await page.waitForFunction(()=>document.querySelectorAll('.portal-receipt-card').length===3);
  progress('three-preserved-revisions-register-rows-history-and-csrf-verified');
  const otherContext=await browser.newContext({ignoreHTTPSErrors:true});
  await otherContext.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const other=await otherContext.newPage();other.setDefaultTimeout(60_000);other.on('pageerror',error=>errors.push(error.message));
  await other.goto(origin+'/teaching/submissions');await other.selectOption('#course','seminar');
  await signIn(other,`browser-other-${run}@example.test`);
  assert.equal((await call(other,'status',{params:{id:receipts[0].id}})).status,404);
  assert.equal((await call(other,'review')).status,404);
  assert.equal((await call(other,'receipts')).body.submissions.length,0);
  await page.click('#tab-extension');await page.fill('#extension-name','Synthetic Browser Student');
  await page.fill('#extension-number','00000123');await page.fill('#extension-team','Synthetic Test Partner');
  await page.fill('#extension-date','2027-01-12');await page.fill('#extension-reason','Synthetic browser workflow check.');
  await page.click('#extension-form button[type=submit]');
  await page.waitForFunction(()=>document.querySelector('#extension-status').textContent.includes('Your request has been received'));
  const ownerContext=await browser.newContext({ignoreHTTPSErrors:true});
  await ownerContext.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const ownerPage=await ownerContext.newPage();ownerPage.setDefaultTimeout(60_000);ownerPage.on('pageerror',error=>errors.push(error.message));
  await ownerPage.goto(origin+'/teaching/submissions');await ownerPage.selectOption('#course','seminar');await signIn(ownerPage,owner);
  await ownerPage.click('#tab-owner');
  await ownerPage.locator('[data-decision="approve"]').first().waitFor();
  // Earlier isolated checks may have pending requests. Select this synthetic account explicitly.
  const card=ownerPage.locator('.portal-owner-card').filter({hasText:student});
  await card.locator('[data-decision="approve"]').click();await card.waitFor({state:'detached'});
  const updated=(await call(page,'catalogue')).body.rules['sem-a01'];assert.equal(updated.extended,true);
  await page.click('#tab-receipts');await page.waitForFunction(()=>document.querySelector('#receipt-list').textContent.includes('approved'));
  await page.setViewportSize({width:390,height:844});await screenshot('mobile-confirmations');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  progress('separate-browser-account-isolation-and-owner-extension-decision-verified');
  await verifyLogout();
  const result={checkedAt:new Date().toISOString(),transport:'Chromium to loopback HTTPS handler to isolated live Google adapters',
   collection:backend.collection,simulatedEmail:true,realEmailSent:false,intakeEnabled:false,viewports:[390,768,1440],
   closedModeVerified:true,secureSessionCookiesVerified:true,maxFileBytesVerified:file.length,interruptedUploadRecovered:true,
   cloudHashVerified:true,revisionsVerified:[0,1,2],automaticRegisterReadbackVerified:true,csrfVerified:true,
   separateBrowserAccountIsolationVerified:true,ownerExtensionDecisionVerified:true,logoutVerified:true,pageErrors:errors,
   screenshots,submissionIds:receipts.map(r=>r.id)};
  await fs.writeFile(path.join(PRIVATE,'browser-integration-check.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({...result,screenshots:screenshots.map(p=>path.basename(p)),submissionIds:undefined}));
 }catch(error){
  if(page){const filename=path.join(PRIVATE,'browser-failure.png');await page.screenshot({path:filename,fullPage:true}).catch(()=>{});await fs.chmod(filename,0o600).catch(()=>{});}
  throw error;
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));await fs.rm(tlsDirectory,{recursive:true,force:true});}
}

main().catch(error=>{console.error(JSON.stringify({status:'failed',code:error.code||error.name,message:String(error.message).slice(0,700),location:error.stack?.split('\n').find(line=>line.includes('submissions-browser-check.mjs:'))?.trim()}));process.exitCode=1;});
