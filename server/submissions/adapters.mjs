/** Server-only Google adapters, using documented REST APIs and Node built-ins.
 * Never export provider responses wholesale to browsers; URLs/tokens stay private.
 */
import {createSign} from 'node:crypto';
import {PortalError,fail,seal,unseal,email} from './security.mjs';
const API='https://www.googleapis.com/drive/v3';
const GOOGLE_TOKEN='https://oauth2.googleapis.com/token';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function checkedFetch(url,options={},allowed=[200]){
 const r=await fetch(url,{...options,redirect:options.redirect||'error',signal:AbortSignal.timeout(30_000)});
 if(!allowed.includes(r.status))throw new PortalError(r.status===429?'PROVIDER_BUSY':'PROVIDER_UNAVAILABLE',503);
 return r;
}
export class UserToken {
 constructor({clientId,clientSecret,refreshToken}){Object.assign(this,{clientId,clientSecret,refreshToken});}
 async get(){if(this.token&&this.until>Date.now()+60_000)return this.token;const r=await checkedFetch(GOOGLE_TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:this.clientId,client_secret:this.clientSecret,refresh_token:this.refreshToken,grant_type:'refresh_token'})});const v=await r.json();fail(v.access_token&&v.expires_in,'GOOGLE_AUTHORIZATION_FAILED',503);this.token=v.access_token;this.until=Date.now()+v.expires_in*1000;return this.token;}
}
export class ServiceToken {
 constructor(credentials){this.credentials=credentials;}
 async get(){if(this.token&&this.until>Date.now()+60_000)return this.token;const now=Math.floor(Date.now()/1000),c=this.credentials,encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  const assertion=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:GOOGLE_TOKEN,iat:now,exp:now+3600});const sig=createSign('RSA-SHA256').update(assertion).sign(c.private_key).toString('base64url');
  const r=await checkedFetch(GOOGLE_TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:assertion+'.'+sig})});const v=await r.json();fail(v.access_token,'DATABASE_AUTHORIZATION_FAILED',503);this.token=v.access_token;this.until=Date.now()+v.expires_in*1000;return this.token;
 }
}
export class FirestoreStore {
 constructor({projectId,databaseId='(default)',collection='seri_submissions',token,encryptionKey}){
  fail(/^[a-z][a-z0-9-]{4,62}$/.test(projectId)&&/^[a-z0-9_()-]+$/.test(databaseId)&&/^[a-z][a-z0-9_]+$/.test(collection),'CONFIGURATION_ERROR',503);
  this.database=`projects/${projectId}/databases/${databaseId}`;this.base=`https://firestore.googleapis.com/v1/${this.database}/documents`;this.collection=collection;this.token=token;this.key=encryptionKey;
 }
 name(id){fail(/^[A-Za-z0-9_-]{1,180}$/.test(id),'DATABASE_KEY');return `${this.database}/documents/${this.collection}/${id}`;}
 decode(doc){return doc?unseal(this.key,doc.fields.payload.stringValue):null;}
 encode(id,value){const doc={name:this.name(id),fields:{payload:{stringValue:seal(this.key,value)}}};
  // Enable Firestore TTL only on this field. Completed work and its audit trail have no automatic TTL.
  if(value.expiresAt&&/^(otp_|session_|rate_)/.test(id))doc.fields.deleteAfter={timestampValue:new Date(value.expiresAt).toISOString()};
  return doc;
 }
 async request(suffix,body){const r=await fetch(this.base+suffix,{method:'POST',headers:{Authorization:'Bearer '+await this.token.get(),'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30_000)});if(r.status===409){const e=new Error('TRANSACTION_RETRY');e.retry=true;throw e;}if(!r.ok)throw new PortalError('DATABASE_UNAVAILABLE',503);return r.json();}
 async get(id){const r=await checkedFetch(`https://firestore.googleapis.com/v1/${this.name(id)}`,{headers:{Authorization:'Bearer '+await this.token.get()}},[200,404]);return r.status===404?null:this.decode(await r.json());}
 async transaction(ids,fn){const unique=[...new Set(ids)];for(let attempt=0;attempt<5;attempt++){
   let transaction;
   try{({transaction}=await this.request(':beginTransaction',{}));const rows=await this.request(':batchGet',{documents:unique.map(id=>this.name(id)),transaction});
    fail(Array.isArray(rows),'DATABASE_RESPONSE',503);const initial=new Map(unique.map(id=>[id,null]));for(const row of rows){if(row.found){const id=row.found.name.split('/').pop();initial.set(id,this.decode(row.found));}}
    const writes=new Map();const tx={get:id=>{fail(initial.has(id),'TRANSACTION_KEY');return structuredClone(writes.has(id)?writes.get(id):initial.get(id));},set:(id,value)=>{fail(initial.has(id),'TRANSACTION_KEY');writes.set(id,structuredClone(value));},delete:id=>{fail(initial.has(id),'TRANSACTION_KEY');writes.set(id,null);}};
    const result=fn(tx);fail(!(result instanceof Promise),'ASYNC_TRANSACTION');
    await this.request(':commit',{transaction,writes:[...writes].map(([id,value])=>value===null?{delete:this.name(id)}:{update:this.encode(id,value)})});return result;
   }catch(e){if(transaction)await this.request(':rollback',{transaction}).catch(()=>{});if(!e.retry||attempt===4)throw e;await sleep(50*(attempt+1));}
  }
 }
}
export class DriveStorage {
 constructor({token,ownerEmail}){this.token=token;this.ownerEmail=email(ownerEmail);}
 async headers(extra={}){return {Authorization:'Bearer '+await this.token.get(),...extra};}
 async info(id){fail(/^[A-Za-z0-9_-]{10,120}$/.test(id),'STORAGE_CONFIGURATION_ERROR',503);const fields='id,name,mimeType,size,parents,trashed,owners(emailAddress),inheritedPermissionsDisabled,appProperties';const r=await checkedFetch(`${API}/files/${id}?fields=${encodeURIComponent(fields)}`,{headers:await this.headers()});return r.json();}
 async permissions(id){let pageToken='',permissions=[];do{const q=new URLSearchParams({fields:'permissions(type,role,emailAddress,deleted,permissionDetails),nextPageToken',pageSize:'100'});if(pageToken)q.set('pageToken',pageToken);const r=await checkedFetch(`${API}/files/${id}/permissions?${q}`,{headers:await this.headers()});const v=await r.json();permissions.push(...(v.permissions||[]));pageToken=v.nextPageToken||'';}while(pageToken);return permissions;}
 async privateOnly(id){const permissions=await this.permissions(id);fail(permissions.length===1&&permissions[0].type==='user'&&permissions[0].role==='owner'&&permissions[0].emailAddress?.toLowerCase()===this.ownerEmail&&!permissions[0].deleted,'STORAGE_NOT_PRIVATE',503);}
 async checkFolder(id){const f=await this.info(id);fail(!f.trashed&&f.mimeType==='application/vnd.google-apps.folder'&&f.owners?.length===1&&f.owners[0].emailAddress?.toLowerCase()===this.ownerEmail,'STORAGE_NOT_PRIVATE',503);await this.privateOnly(id);return f;}
 async checkFile(id,parent,size){const f=await this.info(id);fail(!f.trashed&&Number(f.size)===size&&f.parents?.length===1&&f.parents[0]===parent,'FILE_STORAGE_MISMATCH',503);await this.checkFolder(parent);await this.privateOnly(id);return f;}
 async allocateId(){const r=await checkedFetch(`${API}/files/generateIds?count=1&space=drive&type=files`,{headers:await this.headers()});const v=await r.json();fail(v.ids?.length===1,'STORAGE_UNAVAILABLE',503);return v.ids[0];}
 async ensureFolder(id,parent,name){await this.checkFolder(parent);const r=await checkedFetch(`${API}/files?fields=id`,{method:'POST',headers:await this.headers({'Content-Type':'application/json'}),body:JSON.stringify({id,name,mimeType:'application/vnd.google-apps.folder',parents:[parent]})},[200,201,409]);const f=await this.checkFolder(id);fail(f.parents?.length===1&&f.parents[0]===parent,'STORAGE_NOT_PRIVATE',503);return id;}
 validateLocation(location){const u=new URL(location);fail(u.protocol==='https:'&&u.hostname==='www.googleapis.com'&&u.pathname.startsWith('/upload/drive/v3/files')&&!u.username&&!u.password&&!u.port,'STORAGE_URL_REJECTED',503);return u.href;}
 async begin({id,parent,name,size,submission,index}){await this.checkFolder(parent);const q=new URLSearchParams({uploadType:'resumable',fields:'id,size,parents,md5Checksum'});const r=await checkedFetch(`https://www.googleapis.com/upload/drive/v3/files?${q}`,{method:'POST',headers:await this.headers({'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':'application/octet-stream','X-Upload-Content-Length':String(size)}),body:JSON.stringify({id,name,parents:[parent],appProperties:{seriSubmission:submission,seriItem:String(index)}})},[200,201]);const location=r.headers.get('location');fail(location,'STORAGE_UNAVAILABLE',503);return this.validateLocation(location);}
 result(r,total){if([200,201].includes(r.status))return {complete:true,offset:total};const range=r.headers.get('range');fail(!range||/^bytes=0-\d+$/.test(range),'STORAGE_RESPONSE',503);return {complete:false,offset:range?Number(range.split('-')[1])+1:0};}
 async probe(f){const r=await checkedFetch(this.validateLocation(f.location),{method:'PUT',redirect:'manual',headers:await this.headers({'Content-Length':'0','Content-Range':`bytes */${f.size}`})},[200,201,308]);return this.result(r,f.size);}
 async chunk(f,offset,bytes){const r=await checkedFetch(this.validateLocation(f.location),{method:'PUT',redirect:'manual',headers:await this.headers({'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),'Content-Range':`bytes ${offset}-${offset+bytes.length-1}/${f.size}`}),body:bytes},[200,201,308]);return this.result(r,f.size);}
 async read(id,size){const r=await checkedFetch(`${API}/files/${id}?alt=media`,{headers:await this.headers()});const declared=Number(r.headers.get('content-length'));fail(!declared||declared<=size,'FILE_SIZE');let total=0;const chunks=[];for await(const c of r.body){total+=c.length;fail(total<=size,'FILE_SIZE');chunks.push(Buffer.from(c));}fail(total===size,'FILE_SIZE');return Buffer.concat(chunks);}
 async rename(id,name){await checkedFetch(`${API}/files/${id}?fields=id`,{method:'PATCH',headers:await this.headers({'Content-Type':'application/json'}),body:JSON.stringify({name})});}
}
export class GmailSender {
 constructor({token,from,replyTo}){this.token=token;this.from=email(from);this.replyTo=email(replyTo);}
 async send({to,subject,text,id}){to=email(to);fail(!/[\r\n]/.test(subject)&&/^[A-Za-z0-9_-]+$/.test(id),'EMAIL_INVALID');
  const encodedSubject='=?UTF-8?B?'+Buffer.from(subject).toString('base64')+'?=';
  const body=Buffer.from(text,'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n')||'';
  const raw=[`From: SERI Lab Teaching <${this.from}>`,`To: ${to}`,`Reply-To: ${this.replyTo}`,`Subject: ${encodedSubject}`,`Message-ID: <${id}@maorshani.com>`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',''+body].join('\r\n');
  // Gmail may accept a message even if its response is lost. Queue retries are at-least-once;
  // repeated notifications retain the same receipt reference and Message-ID.
  const r=await checkedFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+await this.token.get(),'Content-Type':'application/json'},body:JSON.stringify({raw:Buffer.from(raw).toString('base64url')})});const result=await r.json();fail(result.id,'EMAIL_UNAVAILABLE',503);return {accepted:true};
 }
}
