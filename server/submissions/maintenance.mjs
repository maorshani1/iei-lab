/** Daily owner-only recovery snapshots of encrypted application records. */
import {fail,sha256,randomId} from './security.mjs';

export async function snapshotRecords({store,drive,sheets,now=()=>Date.now()}){
 const register=await drive.info(sheets.spreadsheetId);
 await drive.privateOnly(sheets.spreadsheetId);
 fail(register.parents?.length===1,'BACKUP_DESTINATION_INVALID',503);
 const root=register.parents[0];await drive.checkFolder(root);
 const day=new Date(now()).toISOString().slice(0,10),stateKey='backup_'+day.replaceAll('-','');
 const lease=randomId();
 const previous=await store.transaction([stateKey],tx=>{const old=tx.get(stateKey)||{};if(old.state==='completed')return old;fail(!old.leaseUntil||old.leaseUntil<now(),'BACKUP_BUSY',409);tx.set(stateKey,{...old,state:'pending',lease,leaseUntil:now()+300000});return old;});
 if(previous.state==='completed')return {state:'completed',date:day,documents:previous.documents};
 if(previous.fileId){
  const response=await fetch('https://www.googleapis.com/drive/v3/files/'+previous.fileId+'?fields=id,size',{headers:await drive.headers(),redirect:'error',signal:AbortSignal.timeout(30000)});
  fail(response.ok||response.status===404,'BACKUP_READ_FAILED',503);
  if(response.ok){
   const info=await response.json();
   if(previous.hash&&Number(info.size)===previous.bytes){
    await drive.checkFile(previous.fileId,root,previous.bytes);
    fail(sha256(await drive.read(previous.fileId,previous.bytes))===previous.hash,'BACKUP_HASH_MISMATCH',503);
    await store.transaction([stateKey],tx=>{fail(tx.get(stateKey)?.lease===lease,'BACKUP_BUSY',409);tx.set(stateKey,{...previous,state:'completed',completedAt:now(),lease:null,leaseUntil:0});});
    return {state:'completed',date:day,documents:previous.documents};
   }
   delete previous.fileId;
  }
 }
 const readTime=new Date(now()-5000).toISOString(),documents=[];let pageToken='',seen=0;
 do{
  const query=new URLSearchParams({pageSize:'300',readTime});if(pageToken)query.set('pageToken',pageToken);
  const response=await fetch(store.base+'/'+store.collection+'?'+query,{headers:{Authorization:'Bearer '+await store.token.get()},redirect:'error',signal:AbortSignal.timeout(30000)});
  fail(response.ok,'BACKUP_READ_FAILED',503);
  const page=await response.json();
  for(const document of page.documents||[]){
   seen++;fail(seen<=20000,'BACKUP_CAPACITY',503);const id=document.name.split('/').pop();
   if(/^(?:otp_|session_|rate_|backup_|hosted_)/.test(id))continue;
   fail(document.fields?.payload?.stringValue,'BACKUP_RECORD_INVALID',503);
   documents.push({id,fields:document.fields});
  }
  fail(documents.length<=10000,'BACKUP_CAPACITY',503);pageToken=page.nextPageToken||'';
 }while(pageToken);
 const data=Buffer.from(JSON.stringify({format:'seri-encrypted-records-v1',createdAt:new Date(now()).toISOString(),readTime,database:store.database,collection:store.collection,documents})+'\n');
 fail(data.length<=25000000,'BACKUP_CAPACITY',503);
 const proposed=previous.fileId||await drive.allocateId();
 const state=await store.transaction([stateKey],tx=>{fail(tx.get(stateKey)?.lease===lease,'BACKUP_BUSY',409);const value={state:'pending',fileId:proposed,documents:documents.length,bytes:data.length,hash:sha256(data),lease,leaseUntil:now()+300000};tx.set(stateKey,value);return value;});
 const location=await drive.begin({id:state.fileId,parent:root,name:'SERI_ENCRYPTED_RECORDS_'+day+'.json',size:data.length,submission:'encrypted-records-backup',index:0});
 let offset=0;
 while(offset<data.length){const part=data.subarray(offset,Math.min(offset+2097152,data.length));const result=await drive.chunk({location,size:data.length},offset,part);offset=result.offset;}
 await drive.checkFile(state.fileId,root,data.length);
 fail(sha256(await drive.read(state.fileId,data.length))===sha256(data),'BACKUP_HASH_MISMATCH',503);
 await store.transaction([stateKey],tx=>{fail(tx.get(stateKey)?.lease===lease,'BACKUP_BUSY',409);tx.set(stateKey,{state:'completed',fileId:state.fileId,documents:documents.length,bytes:data.length,hash:sha256(data),completedAt:now()});});
 return {state:'completed',date:day,documents:documents.length};
}

/** Remove only authentication/rate-limit records expired for at least one day. */
export async function cleanupExpiredCredentials(store,now=()=>Date.now()){
 const cutoff=now()-86400000;
 const rows=await store.request(':runQuery',{structuredQuery:{from:[{collectionId:store.collection}],where:{fieldFilter:{field:{fieldPath:'deleteAfter'},op:'LESS_THAN',value:{timestampValue:new Date(cutoff).toISOString()}}},select:{fields:[{fieldPath:'deleteAfter'}]},limit:200}});
 fail(Array.isArray(rows),'MAINTENANCE_QUERY_FAILED',503);
 const ids=rows.filter(row=>row.document).map(row=>row.document.name.split('/').pop()).filter(id=>/^(?:otp_|session_|rate_)/.test(id));
 let deleted=0;
 for(let offset=0;offset<ids.length;offset+=50){const batch=ids.slice(offset,offset+50);deleted+=await store.transaction(batch,tx=>{let count=0;for(const id of batch){const value=tx.get(id);if(value&&Number.isFinite(value.expiresAt)&&value.expiresAt<cutoff){tx.delete(id);count++;}}return count;});}
 return {deleted};
}
