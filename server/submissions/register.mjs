/** Private, retryable projection of completed submissions into a fixed register. */
import {fail,randomId} from './security.mjs';

export const REGISTER_HEADERS = [
 'Submission ID','Receipt reference','Course ID','Assignment ID','Revision',
 'Received UTC','Received Israel','Timing status','Submitter name','Student number',
 'Verified email','Team names','Team reference','Stored filenames','Original filenames',
 'File sizes (bytes)','Drive file IDs','Late reason'
];
export const REGISTER_LAST_COLUMN = 'R';

export function registerValues(record){
 fail(record?.state==='completed'&&record.receipt,'REGISTER_RECORD_INVALID',503);
 const receipt=record.receipt;
 return [record.id,record.reference,record.course,record.assignment,`R${record.revision}`,
  receipt.receivedAt,new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',dateStyle:'short',timeStyle:'long'}).format(new Date(receipt.receivedAt)),
  receipt.status,record.name,record.studentNumber,record.email,record.teamNames.join('\n'),record.teamCode||'',
  record.files.map(f=>f.finalName).join('\n'),record.files.map(f=>f.originalName).join('\n'),
  record.files.map(f=>String(f.size)).join('\n'),record.files.map(f=>f.driveId).join('\n'),record.lateReason||''];
}

export class SubmissionRegister {
 constructor({store,sheets,now=()=>Date.now()}){Object.assign(this,{store,sheets,now});}
 keys(id){return ['register_cursor','queue_register','register_job_'+id];}
 enqueue(tx,record){
  const [cursorKey,queueKey,key]=this.keys(record.id);
  if(tx.get(key))return;
  const cursor=tx.get(cursorKey)||{target:this.sheets.target,nextRow:2};
  fail(cursor.target===this.sheets.target,'REGISTER_TARGET_CHANGED',503);
  fail(Number.isSafeInteger(cursor.nextRow)&&cursor.nextRow>=2,'REGISTER_CURSOR_INVALID',503);
  const queue=tx.get(queueKey)||{ids:[]};
  fail(queue.ids.length<3000,'REGISTER_QUEUE_FULL',503);
  tx.set(key,{submission:record.id,row:cursor.nextRow,target:cursor.target,state:'queued',attempts:0,nextTry:0});
  cursor.nextRow++;queue.ids.push(record.id);tx.set(cursorKey,cursor);tx.set(queueKey,queue);
 }
 async sync(id){
  const key='register_job_'+id,lease=randomId(),now=this.now();
  const job=await this.store.transaction([key],tx=>{
   const item=tx.get(key);
   if(!item||item.state==='synced'||item.nextTry>now||item.leaseUntil>now)return null;
   fail(item.target===this.sheets.target,'REGISTER_TARGET_CHANGED',503);
   item.lease=lease;item.leaseUntil=now+120_000;item.attempts++;tx.set(key,item);return item;
  });
  if(!job)return false;
  try{
   const record=await this.store.get('submission_'+job.submission);
   await this.sheets.writeRow(job.row,registerValues(record));
   await this.store.transaction([key,'queue_register'],tx=>{
    const item=tx.get(key);fail(item?.lease===lease,'REGISTER_BUSY',409);
    item.state='synced';item.syncedAt=this.now();delete item.lease;delete item.leaseUntil;delete item.lastError;
    const queue=tx.get('queue_register')||{ids:[]};queue.ids=queue.ids.filter(x=>x!==id);
    tx.set(key,item);tx.set('queue_register',queue);
   });
   return true;
  }catch(error){
   await this.store.transaction([key],tx=>{
    const item=tx.get(key);if(item?.lease!==lease)return;
    item.state='queued';item.nextTry=this.now()+Math.min(6*3600_000,60_000*2**Math.min(item.attempts,8));
    // Store a bounded diagnostic code, never a provider response or credential.
    item.lastError=/^(REGISTER_|STORAGE_)[A-Z_]+$/.test(error.code||'')?error.code:'REGISTER_UNAVAILABLE';
    delete item.lease;delete item.leaseUntil;tx.set(key,item);
   });
   return false;
  }
 }
 async drain(){
  const queue=await this.store.get('queue_register')||{ids:[]};let synced=0,examined=0;
  const started=Date.now();
  for(const id of queue.ids){
   const item=await this.store.get('register_job_'+id);
   if(!item||item.nextTry>this.now()||item.leaseUntil>this.now())continue;
   if(examined++>=10||Date.now()-started>90_000)break;
   if(await this.sync(id))synced++;
  }
  return {synced,queued:(await this.store.get('queue_register'))?.ids.length||0};
 }
}
