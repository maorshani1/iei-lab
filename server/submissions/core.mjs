/** Application service. Dependencies are injected; no transport credentials are returned. */
import {POLICY,COURSES,assignment,publicCatalogue} from './catalogue.mjs';
import {PortalError,fail,randomId,makeCode,digest,equal,email,person,studentNumber,text,slug,filename,maskNumber,onlyKeys,sha256} from './security.mjs';
import {descriptors,validateContent} from './validation.mjs';
const HOUR=3600_000,DAY=24*HOUR;
const cleanFile=f=>({name:f.finalName||f.originalName,size:f.size,role:f.role,index:f.index,state:f.state,offset:f.offset});
export class Portal {
 constructor({store,drive,mail,secret,ownerEmail,folderMap,register=null,trackers=null,alerts=null,now=()=>Date.now()}){
  Object.assign(this,{store,drive,mail,secret,folderMap,register,trackers,alerts,now});this.ownerEmail=email(ownerEmail);
 }
 uid(e){return digest(this.secret,'account:'+email(e));}
 async limit(parts){const now=this.now();const keys=parts.map(([name,max,period])=>'rate_'+digest(this.secret,name+':'+Math.floor(now/period)));await this.store.transaction(keys,tx=>{parts.forEach(([name,max,period],i)=>{const r=tx.get(keys[i])||{count:0,expiresAt:now+2*period};fail(r.count<max,'RATE_LIMIT',429);r.count++;tx.set(keys[i],r);});});}
 async requestCode(input,bind,ip){onlyKeys(input,['email','website']);fail(!input.website,'REQUEST_REJECTED');const e=email(input.email);fail(bind,'SESSION_REQUIRED',401);
  await this.limit([[`otp-email:${e}`,5,HOUR],[`otp-ip:${ip}`,20,HOUR],['otp-global',400,DAY]]);
  const id=randomId(),code=makeCode(),key='otp_'+id,expiresAt=this.now()+10*60_000;
  await this.store.transaction([key],tx=>tx.set(key,{email:e,code:digest(this.secret,`${id}:${code}`),bind:digest(this.secret,bind),attempts:0,expiresAt,used:false}));
  try{await this.mail.send({to:e,subject:'SERI Lab: your sign-in code / קוד הכניסה שלך',text:`Your code is ${code}. It expires in 10 minutes. Do not share it. If you did not request this code, ignore this message.\n\nקוד הכניסה שלך הוא ${code}. תוקפו 10 דקות. אין לשתף אותו. אם לא ביקשת קוד כניסה, אפשר להתעלם מהודעה זו.`,id:'otp-'+id});}
  catch{await this.store.transaction([key],tx=>tx.delete(key));throw new PortalError('EMAIL_UNAVAILABLE',503);}
  return {challenge:id,expiresAt};
 }
 async verify(input,bind){onlyKeys(input,['challenge','code']);fail(/^[A-Za-z0-9_-]{32}$/.test(input.challenge||'')&&/^\d{6}$/.test(input.code||''),'CODE_INVALID',401);
  const token=randomId(),csrf=randomId(),key='otp_'+input.challenge,sk='session_'+digest(this.secret,token),now=this.now();
  const result=await this.store.transaction([key,sk],tx=>{const c=tx.get(key);if(!c||c.used||c.expiresAt<=now||c.attempts>=5||!equal(c.bind,digest(this.secret,bind||'')))return null;
   c.attempts++;if(!equal(c.code,digest(this.secret,`${input.challenge}:${input.code}`))){tx.set(key,c);return null;}
   c.used=true;delete c.code;tx.set(key,c);const s={uid:this.uid(c.email),email:c.email,csrf,createdAt:now,expiresAt:now+8*HOUR};tx.set(sk,s);return s;});
  fail(result,'CODE_INVALID',401);return {token,session:{email:result.email,csrf,owner:result.email===this.ownerEmail,expiresAt:result.expiresAt}};
 }
 async session(token){fail(token,'SIGN_IN_REQUIRED',401);const s=await this.store.get('session_'+digest(this.secret,token));fail(s&&s.expiresAt>this.now(),'SIGN_IN_REQUIRED',401);return s;}
 async logout(token){if(token){const key='session_'+digest(this.secret,token);await this.store.transaction([key],tx=>tx.delete(key));}return {ok:true};}
 checkCsrf(s,value){fail(equal(s.csrf,value||''),'REQUEST_REJECTED',403);}
 owner(s){fail(s.email===this.ownerEmail,'NOT_FOUND',404);fail(this.now()-s.createdAt<=15*60_000,'OWNER_REAUTHENTICATE',401);}
 async extension(s,id){return this.store.get('extension_'+s.uid+'_'+id);}
 timing(a,ext,now=this.now()){
  const base=Date.parse(a.due),due=ext?.approvedUntil?Math.max(base,Date.parse(ext.approvedUntil)):base;
  // An extension is a firm new cutoff. The ordinary seven-day late window is not silently renewed.
  const close=Math.max(base+POLICY.lateDays*DAY,due);
  return {due,close,late:now>due,closed:now>close,extended:due>base};
 }
 async catalogue(s){const c=publicCatalogue();if(!s)return c;const rules={};for(const course of c.courses)for(const a of course.assignments){const ex=await this.extension(s,a.id);rules[a.id]=this.timing(a,ex);}return {...c,rules,serverTime:this.now()};}
 async owned(s,id){fail(/^[A-Za-z0-9_-]{32}$/.test(id||''),'NOT_FOUND',404);const r=await this.store.get('submission_'+id);fail(r?.uid===s.uid,'NOT_FOUND',404);return r;}
 async start(s,input){onlyKeys(input,['assignment','name','studentNumber','teamNames','files','key','lateAcknowledged','lateReason','consent']);
  const a=assignment(input.assignment);fail(a,'ASSIGNMENT_INVALID');fail(input.consent===true,'CONSENT_REQUIRED');
  fail(/^[A-Za-z0-9_-]{16,80}$/.test(input.key||''),'REQUEST_KEY');const name=person(input.name),number=studentNumber(input.studentNumber);
  const names=(input.teamNames||'').split('\n').map(n=>n.trim()).filter(Boolean).map(person);fail(a.team?(names.length>=1&&names.length<=2):names.length===0,'TEAM_NAMES');
  fail(new Set([name,...names].map(n=>n.toLowerCase())).size===names.length+1,'TEAM_NAMES');
  const files=descriptors(a,input.files);fail(typeof this.folderMap[a.id]==='string'&&this.folderMap[a.id],'STORAGE_NOT_CONFIGURED',503);
  const timing=this.timing(a,await this.extension(s,a.id));fail(!timing.closed,'SUBMISSIONS_CLOSED',409);
  if(timing.late)fail(input.lateAcknowledged===true&&text(input.lateReason||'',1000,5),'LATE_ACK_REQUIRED',409);
  await this.limit([[`start:${s.uid}`,25,DAY],['start-global',1000,DAY]]);
  const id=randomId(),line='line_'+s.uid+'_'+a.id,sk='submission_'+id,pk='profile_'+s.uid,now=this.now();
  // Permission preflight precedes any new content. Destination comes only from server configuration.
  await this.drive.checkFolder(this.folderMap[a.id]);
  const result=await this.store.transaction([line,sk,pk],tx=>{const l=tx.get(line)||{completed:[],pending:null,pendingKey:null,pendingUntil:0,requests:{}};
   if(l.requests?.[input.key])return {existing:l.requests[input.key]};
   if(l.pending&&l.pendingUntil>now){if(l.pendingKey===input.key)return {existing:l.pending};throw new PortalError('PENDING_SUBMISSION_EXISTS',409);}
   const r={id,uid:s.uid,email:s.email,name,studentNumber:number,teamNames:names,teamCode:a.team?'T'+s.uid.slice(0,6).toUpperCase():null,
    assignment:a.id,key:input.key,createdAt:now,expiresAt:now+2*HOUR,state:'pending',revision:l.completed.length,files,
    lateAcknowledged:input.lateAcknowledged===true,lateReason:input.lateReason?text(input.lateReason,1000):'',reference:'SERI-'+id.slice(0,10).toUpperCase(),course:a.course};
   r.files=r.files.map(f=>({...f,finalName:filename({revision:r.revision,assignmentCode:a.code,name,date:new Date(now).toISOString(),id,role:f.role,index:f.index,ext:f.ext})}));
   l.pending=id;l.pendingKey=input.key;l.pendingUntil=r.expiresAt;l.requests=l.requests||{};l.requests[input.key]=id;tx.set(line,l);tx.set(sk,r);
   const p=tx.get(pk)||{submissionIds:[],requestIds:[]};fail(p.submissionIds.length<1000,'ACCOUNT_LIMIT',429);p.submissionIds.push(id);tx.set(pk,p);return {record:r};});
  const record=result.record||await this.owned(s,result.existing);return this.publicStatus(record);
 }
 publicStatus(r){return {id:r.id,assignment:r.assignment,state:r.state,reference:r.reference,revision:r.revision,files:r.files.map(cleanFile),...(r.receipt?{receipt:r.receipt}:{})};}
 async status(s,id){return this.publicStatus(await this.owned(s,id));}
 async cancel(s,id){const r=await this.owned(s,id),k='submission_'+id,line='line_'+s.uid+'_'+r.assignment;await this.store.transaction([k,line],tx=>{const x=tx.get(k),l=tx.get(line);fail(x?.uid===s.uid,'NOT_FOUND',404);fail(x.state==='pending','ALREADY_FINAL',409);fail(!x.files.some(f=>f.leaseUntil>this.now()),'UPLOAD_BUSY',409);x.state='cancelled';tx.set(k,x);if(l?.pending===id){l.pending=null;l.pendingKey=null;tx.set(line,l);}});return {ok:true};}
 async lease(s,id,index){const r=await this.owned(s,id);fail(Number.isInteger(index)&&index>=0&&index<r.files.length,'FILE_INVALID');const key='submission_'+id,lease=randomId();await this.store.transaction([key],tx=>{const x=tx.get(key),f=x?.files[index];fail(x?.uid===s.uid,'NOT_FOUND',404);fail(x.state==='pending'&&x.expiresAt>this.now(),'UPLOAD_EXPIRED',409);fail(!f.leaseUntil||f.leaseUntil<this.now(),'UPLOAD_BUSY',409);f.lease=lease;f.leaseUntil=this.now()+120_000;tx.set(key,x);});return {record:r,lease};}
 async release(id,index,lease,patch){const key='submission_'+id;await this.store.transaction([key],tx=>{const r=tx.get(key),f=r?.files[index];fail(f?.lease===lease,'UPLOAD_BUSY',409);Object.assign(f,patch);delete f.lease;delete f.leaseUntil;tx.set(key,r);});}
 async privateFolder(key,parent,name){
  // Allocate a stable provider ID transactionally. Retries reuse it; the browser never chooses a parent.
  let folder=await this.store.get(key);
  if(!folder){const allocated=await this.drive.allocateId();folder=await this.store.transaction([key],tx=>{
   const existing=tx.get(key);if(existing)return existing;
   const item={id:allocated,parent};tx.set(key,item);return item;
  });}
  fail(folder.parent===parent,'STORAGE_CONFIGURATION_CHANGED',503);
  await this.drive.ensureFolder(folder.id,parent,name);await this.drive.checkFolder(folder.id);return folder.id;
 }
 async ensureDestination(r){
  const a=assignment(r.assignment),parent=this.folderMap[a.id];await this.drive.checkFolder(parent);
  const identity=a.team?r.teamCode:'S'+r.uid.slice(0,8).toUpperCase();
  const names=a.team?[r.name,...r.teamNames]:[r.name];
  // Account-bound folders distinguish identical names. Existing team keys are retained.
  const folderKey=(a.team?'team_':'student_')+r.uid+'_'+a.id;
  const personFolder=await this.privateFolder(folderKey,parent,`${identity}_${names.map(n=>slug(n,24)).join('_')}`);
  const stamp=new Date(r.createdAt).toISOString().replace(/[:.]/g,'-');
  return this.privateFolder('attempt_folder_'+r.id,personFolder,`R${r.revision}_${stamp}_${r.id.slice(0,8)}`);
 }
 async upload(s,id,index,offset,bytes){fail(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=POLICY.chunkBytes,'CHUNK_SIZE');fail(Number.isInteger(offset)&&offset>=0,'CHUNK_OFFSET');
  const {record:r,lease}=await this.lease(s,id,index);let f={...r.files[index]},patch={};
  try{
   if(f.state==='verified')return {offset:f.size,state:f.state};
   fail(f.state!=='rejected','FILE_REJECTED',409);
   if(!f.location){const parent=await this.ensureDestination(r),driveId=f.driveId||await this.drive.allocateId();
    const location=await this.drive.begin({id:driveId,parent,name:'INCOMPLETE_'+f.finalName,size:f.size,submission:id,index});
    f={...f,driveId,parent,location};patch={driveId,parent,location};
    // Persist resumable credential and fixed parent before transferring bytes.
    const key='submission_'+id;await this.store.transaction([key],tx=>{const x=tx.get(key);fail(x.files[index].lease===lease,'UPLOAD_BUSY',409);Object.assign(x.files[index],patch);tx.set(key,x);});
   }
   let remote=await this.drive.probe(f);
   if(!remote.complete&&remote.offset===offset){
    fail(offset+bytes.length<=f.size,'CHUNK_SIZE');fail(offset+bytes.length===f.size||bytes.length===POLICY.chunkBytes,'CHUNK_SIZE');
    remote=await this.drive.chunk(f,offset,bytes);
   }else if(!remote.complete){fail(offset<remote.offset,'CHUNK_OFFSET',409);}
   patch={...patch,offset:remote.offset,state:remote.complete?'stored':'uploading'};
   if(remote.complete){
    const receivedAt=this.now();const content=await this.drive.read(f.driveId,f.size);
    fail(content.length===f.size&&sha256(content)===f.sha256,'FILE_HASH_MISMATCH');validateContent(f.ext,content);
    await this.drive.checkFile(f.driveId,f.parent,f.size);patch={...patch,state:'verified',offset:f.size,receivedAt};
   }
   return {offset:patch.offset,state:patch.state};
  }catch(e){if(e instanceof PortalError&&['FILE_CONTENT','FILE_HASH_MISMATCH','ACTIVE_CONTENT','ACTIVE_OR_ENCRYPTED_PDF','ENCRYPTED_OR_UNSUPPORTED_FILE','JASP_STRUCTURE','SPV_STRUCTURE','ARCHIVE_LIMIT'].includes(e.code)){patch.state='rejected';}
   throw e;
  }finally{await this.release(id,index,lease,patch);}
 }
 receipt(r,when,timing){const a=assignment(r.assignment);return {reference:r.reference,assignment:a.title,course:a.courseTitle,name:r.name,studentNumber:maskNumber(r.studentNumber),revision:r.revision,receivedAt:new Date(when).toISOString(),timeZone:POLICY.timeZone,status:timing.late?'late':timing.extended?'extension':'on-time',files:r.files.map(f=>({name:f.finalName,size:f.size})),email:r.email,emailStatus:'queued'};}
 async finish(s,id,input={}){onlyKeys(input,['lateAcknowledged','lateReason']);let r=await this.owned(s,id);if(r.state==='completed')return r.receipt;
  fail(r.state==='pending'||r.state==='finalizing','SUBMISSION_INVALID',409);fail(r.files.every(f=>f.state==='verified'),'INCOMPLETE_FILES',409);
  fail(!r.files.some(f=>f.leaseUntil>this.now()),'UPLOAD_BUSY',409);
  const a=assignment(r.assignment),when=Math.max(...r.files.map(f=>f.receivedAt)),timing=this.timing(a,await this.extension(s,a.id),when);
  fail(!timing.closed,'SUBMISSIONS_CLOSED',409);const lateAck=input.lateAcknowledged===true||r.lateAcknowledged;
  const reason=input.lateReason?text(input.lateReason,1000,5):r.lateReason;
  if(timing.late)fail(lateAck&&reason?.length>=5,'LATE_ACK_REQUIRED',409);
  const key='submission_'+id,lease=randomId();await this.store.transaction([key],tx=>{const x=tx.get(key);if(x.state==='completed')return;fail(!x.finalLeaseUntil||x.finalLeaseUntil<this.now(),'UPLOAD_BUSY',409);x.state='finalizing';x.finalLease=lease;x.finalLeaseUntil=this.now()+120_000;x.lateAcknowledged=lateAck;x.lateReason=reason;tx.set(key,x);});
  try{
   await this.drive.checkFolder(this.folderMap[a.id]);for(const f of r.files){await this.drive.checkFile(f.driveId,f.parent,f.size);await this.drive.rename(f.driveId,f.finalName);}
   const line='line_'+s.uid+'_'+r.assignment,out='outbox_receipt_'+id,q='queue_mail';
   const receipt=await this.store.transaction([key,line,out,q,...(this.register?.keys(id)||[]),...(this.trackers?.keys(r.assignment)||[])],tx=>{const x=tx.get(key),l=tx.get(line);if(x.state==='completed')return x.receipt;fail(x.finalLease===lease&&l.pending===id&&l.completed.length===x.revision,'SUBMISSION_CONFLICT',409);
    x.receipt=this.receipt(x,when,timing);x.state='completed';x.completedAt=this.now();delete x.finalLease;delete x.finalLeaseUntil;tx.set(key,x);l.completed.push(id);l.pending=null;l.pendingKey=null;tx.set(line,l);
    const queued=tx.get(q)||{ids:[]};fail(queued.ids.length<3000,'NOTIFICATION_QUEUE_FULL',503);queued.ids.push(out);tx.set(q,queued);tx.set(out,{kind:'receipt',submission:id,email:s.email,attempts:0,state:'queued',nextTry:0});this.register?.enqueue(tx,x);this.trackers?.enqueue(tx,x);return x.receipt;});
   // Failure to notify never rolls back a successfully recorded submission.
   const delivered=await this.deliver(out).catch(()=>false);if(!delivered)await this.alerts?.report('email');if(this.register){const synced=await this.register.sync(id).catch(()=>false);if(!synced)await this.alerts?.report('register');}if(this.trackers)await this.trackers.sync(r.assignment).catch(()=>this.alerts?.report('tracker'));return (await this.owned(s,id)).receipt||receipt;
  }catch(e){await this.store.transaction([key],tx=>{const x=tx.get(key);if(x.finalLease===lease){delete x.finalLease;delete x.finalLeaseUntil;tx.set(key,x);}});throw e;}
 }
 async receipts(s,courseId=null){
  fail(courseId===null||COURSES.some(c=>c.id===courseId),'COURSE_INVALID');
  const matches=assignmentId=>courseId===null||COURSES.find(c=>c.id===courseId).assignments.some(a=>a.id===assignmentId);
  const p=await this.store.get('profile_'+s.uid)||{submissionIds:[],requestIds:[]},records=[],requests=[];
  // The account index and ownership checks remain the privacy boundary. Course is only a filter.
  for(const id of [...p.submissionIds].reverse()){const r=await this.owned(s,id);if(matches(r.assignment))records.push(this.publicStatus(r));if(records.length===50)break;}
  for(const id of [...p.requestIds].reverse()){const r=await this.store.get('request_'+id);if(r?.uid===s.uid&&matches(r.assignment))requests.push({id,state:r.state,assignment:r.assignment,requestedUntil:r.requestedUntil,decision:r.decision||null,createdAt:r.createdAt});if(requests.length===30)break;}
  return {submissions:records,requests};
 }
 async requestExtension(s,input){onlyKeys(input,['assignment','name','studentNumber','teamNames','requestedDate','reason','key']);const a=assignment(input.assignment);fail(a,'ASSIGNMENT_INVALID');
  const name=person(input.name),number=studentNumber(input.studentNumber),reason=text(input.reason,1000,5);fail(/^\d{4}-\d{2}-\d{2}$/.test(input.requestedDate||''),'DATE_INVALID');
  const requestedUntil=jerusalemEnd(input.requestedDate);fail(Date.parse(requestedUntil)>Math.max(this.now(),Date.parse(a.due)),'EXTENSION_DATE');
  const names=(input.teamNames||'').split('\n').map(x=>x.trim()).filter(Boolean).map(person);fail(a.team?(names.length>=1&&names.length<=2):names.length===0,'TEAM_NAMES');
  fail(/^[A-Za-z0-9_-]{16,80}$/.test(input.key||''),'REQUEST_KEY');await this.limit([[`extension:${s.uid}`,5,DAY],['extension-global',200,DAY]]);
  const id=digest(this.secret,s.uid+':extension:'+input.key).slice(0,32),key='request_'+id,q='queue_requests',pk='profile_'+s.uid,mq='queue_mail',o='outbox_request_'+id;
  return this.store.transaction([key,q,pk,mq,o,...(this.trackers?.keys(a.id)||[])],tx=>{const existing=tx.get(key);if(existing)return {id,state:existing.state};const row={id,uid:s.uid,email:s.email,name,studentNumber:number,teamNames:names,assignment:a.id,requestedUntil,reason,state:'pending',createdAt:this.now()};
   const pending=tx.get(q)||{ids:[]},p=tx.get(pk)||{submissionIds:[],requestIds:[]},messages=tx.get(mq)||{ids:[]};fail(pending.ids.length<1000&&messages.ids.length<3000&&p.requestIds.length<1000,'QUEUE_LIMIT',503);
   pending.ids.push(id);p.requestIds.push(id);messages.ids.push(o);tx.set(key,row);tx.set(q,pending);tx.set(pk,p);tx.set(mq,messages);tx.set(o,{kind:'extension-request',request:id,attempts:0,state:'queued',nextTry:0});this.trackers?.enqueue(tx,row,'extension');return {id,state:'pending'};});
 }
 async reviewQueue(s,courseId=null){this.owner(s);fail(courseId===null||COURSES.some(c=>c.id===courseId),'COURSE_INVALID');const q=await this.store.get('queue_requests')||{ids:[]};const rows=[];for(const id of q.ids){const r=await this.store.get('request_'+id);if(r&&(courseId===null||COURSES.find(c=>c.id===courseId).assignments.some(a=>a.id===r.assignment)))rows.push(r);}return {requests:rows.slice(0,100),remaining:Math.max(0,rows.length-100)};}
 async decide(s,input){this.owner(s);onlyKeys(input,['id','decision','date','message']);fail(['approve','decline'].includes(input.decision),'DECISION_INVALID');fail(/^[a-f0-9]{32}$/.test(input.id||''),'NOT_FOUND',404);const key='request_'+input.id,r=await this.store.get(key);fail(r,'NOT_FOUND',404);
  const deadline=input.decision==='approve'?jerusalemEnd(input.date):null;fail(!deadline||Date.parse(deadline)>Math.max(this.now(),Date.parse(assignment(r.assignment).due)),'EXTENSION_DATE');
  const message=input.message?text(input.message,1000,0):'',e='extension_'+r.uid+'_'+r.assignment,q='queue_requests',mq='queue_mail',o='outbox_decision_'+r.id;
  return this.store.transaction([key,e,q,mq,o,...(this.trackers?.keys(r.assignment)||[])],tx=>{const x=tx.get(key);fail(x.state==='pending','ALREADY_DECIDED',409);x.state=input.decision==='approve'?'approved':'declined';x.decision={deadline,message,decidedAt:this.now()};tx.set(key,x);if(deadline){const existing=tx.get(e);fail(!existing||Date.parse(deadline)>=Date.parse(existing.approvedUntil),'EXTENSION_CANNOT_SHORTEN');tx.set(e,{approvedUntil:deadline,request:x.id,by:s.uid});}
   const pending=tx.get(q)||{ids:[]};pending.ids=pending.ids.filter(i=>i!==x.id);tx.set(q,pending);const messages=tx.get(mq)||{ids:[]};fail(messages.ids.length<3000,'QUEUE_LIMIT',503);messages.ids.push(o);tx.set(mq,messages);tx.set(o,{kind:'extension-decision',request:x.id,attempts:0,state:'queued',nextTry:0});this.trackers?.enqueue(tx,x,'extension');return {ok:true};});
 }
 async notification(item){if(item.kind==='receipt'){const r=await this.store.get('submission_'+item.submission);fail(r?.state==='completed','NOT_FOUND',404);const x=r.receipt;return {to:r.email,subject:`SERI submission receipt / אישור הגשה: ${x.reference}`,text:[`Submission received / ההגשה התקבלה`,`${x.course.en} / ${x.course.he}`,`${x.assignment.en} / ${x.assignment.he}`,`Name / שם: ${x.name}`,`Revision / גרסה: R${x.revision}`,`Received / התקבל: ${new Intl.DateTimeFormat('en-GB',{timeZone:POLICY.timeZone,dateStyle:'full',timeStyle:'long'}).format(new Date(x.receivedAt))}`,`Status / מצב: ${x.status}`,`Reference / אסמכתה: ${x.reference}`,...x.files.map(f=>`${f.name} (${f.size} bytes)`),'This confirms receipt, not grading or approval of late work.','אישור זה מעיד על קבלת הקבצים, ולא על בדיקתם או אישור הגשה באיחור.'].join('\n')};}
  const r=await this.store.get('request_'+item.request);fail(r,'NOT_FOUND',404);const a=assignment(r.assignment);
  if(item.kind==='extension-request')return {to:this.ownerEmail,subject:'SERI: extension request / בקשת ארכה',text:`A new extension request awaits private review.\nבקשת ארכה חדשה ממתינה לבדיקה פרטית.\n${a.title.en} / ${a.title.he}\nOpen the owner review page and sign in. No decision is made by opening this email.\nיש להיכנס לעמוד המרצה כדי לקבל החלטה.`};
  return {to:r.email,subject:'SERI: extension decision / החלטה בבקשת ארכה',text:`${a.title.en} / ${a.title.he}\n${r.state==='approved'?'Approved / אושרה':'Declined / נדחתה'}\n${r.decision.deadline?'New deadline / מועד חדש: '+r.decision.deadline:''}\n${r.decision.message}`};
 }
 async deliver(key){const now=this.now(),lease=randomId();const row=await this.store.transaction([key],tx=>{const r=tx.get(key);if(!r||r.state==='sent'||r.nextTry>now||r.leaseUntil>now)return null;r.lease=lease;r.leaseUntil=now+90_000;r.attempts++;tx.set(key,r);return r;});if(!row)return false;
  try{const message=await this.notification(row);await this.mail.send({...message,id:key});const q='queue_mail',sk=row.submission?'submission_'+row.submission:null;
   await this.store.transaction([key,q,...(sk?[sk]:[])],tx=>{const x=tx.get(key);fail(x.lease===lease,'NOTIFICATION_BUSY',409);x.state='sent';x.sentAt=this.now();delete x.lease;delete x.leaseUntil;tx.set(key,x);const queue=tx.get(q)||{ids:[]};queue.ids=queue.ids.filter(i=>i!==key);tx.set(q,queue);if(sk){const sub=tx.get(sk);if(sub?.receipt){sub.receipt.emailStatus='accepted-by-email-provider';tx.set(sk,sub);}}});return true;
  }catch{await this.store.transaction([key],tx=>{const x=tx.get(key);if(x?.lease===lease){x.state='queued';x.nextTry=this.now()+Math.min(6*HOUR,60_000*2**Math.min(x.attempts,8));delete x.lease;delete x.leaseUntil;tx.set(key,x);}});return false;}
 }
 async drain({allTrackers=false}={}){const q=await this.store.get('queue_mail')||{ids:[]};let sent=0;let examined=0;for(const id of q.ids){const item=await this.store.get(id);if(!item||item.nextTry>this.now()||item.leaseUntil>this.now())continue;if(examined++>=25)break;if(await this.deliver(id))sent++;}return {sent,queued:Math.max(0,q.ids.length-sent),...(this.register?{register:await this.register.drain()}:{}),...(this.trackers?{trackers:await this.trackers.drain({all:allTrackers})}:{})};}
}
export function jerusalemEnd(date){fail(/^\d{4}-\d{2}-\d{2}$/.test(date||''),'DATE_INVALID');const probe=new Date(date+'T12:00:00Z');fail(!Number.isNaN(+probe)&&probe.toISOString().slice(0,10)===date,'DATE_INVALID');const tz=new Intl.DateTimeFormat('en',{timeZone:'Asia/Jerusalem',timeZoneName:'longOffset'}).formatToParts(probe).find(x=>x.type==='timeZoneName')?.value;fail(/^GMT\+0[23]:00$/.test(tz||''),'DATE_INVALID');return date+'T23:59:59.999'+tz.slice(3);}
