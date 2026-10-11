/** Test-only adapters. Never imported by api/, server runtime, or the site build. */
import {Portal} from '../../server/submissions/core.mjs';
import {COURSES} from '../../server/submissions/catalogue.mjs';
import {PortalError,sha256} from '../../server/submissions/security.mjs';
export class MemoryStore {
 constructor(){this.data=new Map();this.chain=Promise.resolve();}
 async get(id){return structuredClone(this.data.get(id)||null);}
 async transaction(ids,fn){const run=this.chain.then(()=>{const changes=new Map(),allowed=new Set(ids);const check=id=>{if(!allowed.has(id))throw Error('Unexpected transaction key: '+id);};const tx={get:id=>{check(id);return structuredClone(changes.has(id)?changes.get(id):this.data.get(id)||null);},set:(id,v)=>{check(id);changes.set(id,structuredClone(v));},delete:id=>{check(id);changes.set(id,null);}};const result=fn(tx);if(result instanceof Promise)throw Error('Async transaction');for(const [k,v]of changes){if(v===null)this.data.delete(k);else this.data.set(k,v);}return structuredClone(result);});this.chain=run.catch(()=>{});return run;}
}
export class FakeDrive {
 constructor(){this.files=new Map();this.folders=new Map();this.counter=0;this.private=true;this.failRename=false;this.failRead=false;this.loseChunkResponse=false;}
 async checkFolder(id){if(!this.private)throw new PortalError('STORAGE_NOT_PRIVATE',503);return {id};}
 async allocateId(){return 'fakeDriveId'+(++this.counter);}
 async ensureFolder(id,parent,name){await this.checkFolder(parent);if(!this.folders.has(id))this.folders.set(id,{id,parent,name});else if(this.folders.get(id).parent!==parent)throw Error('Parent changed');return id;}
 async begin(row){this.files.set(row.id,{...row,bytes:Buffer.alloc(0)});return 'https://www.googleapis.com/upload/drive/v3/files?upload_id='+row.id;}
 async probe(f){const r=this.files.get(f.driveId);return {offset:r.bytes.length,complete:r.bytes.length===r.size};}
 async chunk(f,offset,bytes){const r=this.files.get(f.driveId);if(offset!==r.bytes.length)throw new PortalError('CHUNK_OFFSET',409);r.bytes=Buffer.concat([r.bytes,bytes]);if(this.loseChunkResponse){this.loseChunkResponse=false;throw new PortalError('PROVIDER_UNAVAILABLE',503);}return this.probe(f);}
 async read(id){if(this.failRead)throw new PortalError('PROVIDER_UNAVAILABLE',503);return this.files.get(id).bytes;}
 async checkFile(id,parent,size){await this.checkFolder(parent);const f=this.files.get(id);if(f.parent!==parent||f.bytes.length!==size)throw new PortalError('FILE_STORAGE_MISMATCH',503);return f;}
 async rename(id,name){if(this.failRename)throw new PortalError('PROVIDER_UNAVAILABLE',503);this.files.get(id).name=name;}
}
export class FakeMail {constructor(){this.messages=[];this.fail=false;}async send(v){if(this.fail)throw new PortalError('EMAIL_UNAVAILABLE',503);this.messages.push({...v});return {accepted:true};}}
export function fixture(){const store=new MemoryStore(),drive=new FakeDrive(),mail=new FakeMail(),clock={now:Date.parse('2026-10-02T12:00:00Z')};const portal=new Portal({store,drive,mail,secret:'test-only-key-not-for-deployment',ownerEmail:'owner@example.test',folderMap:Object.fromEntries(COURSES.flatMap(c=>c.assignments.map(a=>[a.id,'folder_'+a.id]))),now:()=>clock.now});return {portal,store,drive,mail,clock};}
export async function login(f,e='student@example.test'){const bind='browser-'+e,r=await f.portal.requestCode({email:e},bind,'192.0.2.1');const code=f.mail.messages.at(-1).text.match(/\b\d{6}\b/)[0];const v=await f.portal.verify({challenge:r.challenge,code},bind);return {token:v.token,session:await f.portal.session(v.token)};}
export const pdf=()=>Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
export const file=(name,bytes,role='report')=>({name,size:bytes.length,role,sha256:sha256(bytes)});
export function proposalInput(bytes=pdf(),extra={}){return {assignment:'sem-a01',name:'Demo Student',studentNumber:'00123456',teamNames:'Demo Partner',files:[file('proposal.pdf',bytes)],key:'abcdefghijk12345request',lateAcknowledged:false,lateReason:'',consent:true,...extra};}
export async function complete(f,s,input=proposalInput(),bytes=[pdf()]){const r=await f.portal.start(s,input);for(let i=0;i<bytes.length;i++)await f.portal.upload(s,r.id,i,0,bytes[i]);const receipt=await f.portal.finish(s,r.id);return {record:r,receipt};}
