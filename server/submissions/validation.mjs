/** Bounded structural validation. This is NOT an antivirus or academic-content review. */
import {inflateRawSync} from 'node:zlib';
import {fail,PortalError} from './security.mjs';
import {POLICY} from './catalogue.mjs';
export const extOf=name=>String(name).split('.').pop().toLowerCase();
export function descriptors(a,files){
 fail(Array.isArray(files)&&files.length>0&&files.length<=a.maxFiles,'FILE_COUNT');
 let total=0;const roles=new Set();
 const out=files.map((f,index)=>{fail(f&&Object.keys(f).every(k=>['name','size','role','sha256'].includes(k)),'FILE_FIELDS');
  fail(typeof f.name==='string'&&f.name.length<=180&&!/[\\/\x00-\x1f\u202a-\u202e\u2066-\u2069]/u.test(f.name),'FILE_NAME');
  const ext=extOf(f.name);fail(a.types[f.role]?.includes(ext),'FILE_TYPE');
  fail(Number.isInteger(f.size)&&f.size>0&&f.size<=POLICY.maxFileBytes,'FILE_SIZE');
  fail(/^[a-f0-9]{64}$/.test(f.sha256),'FILE_HASH');total+=f.size;roles.add(f.role);
  return {index,originalName:f.name,role:f.role,size:f.size,sha256:f.sha256,ext,offset:0,state:'waiting'};
 });
 fail(total<=POLICY.maxSubmissionBytes,'SUBMISSION_SIZE');
 fail(a.requiredRoles.every(r=>roles.has(r)),'REQUIRED_FILES');
 if(a.course==='statistics')fail(out.filter(f=>f.role==='report').length===1&&out.filter(f=>f.role==='analysis').length===1,'REQUIRED_FILES');
 return out;
}
function zipEntries(b){
 fail(b.length>=22&&b.readUInt32LE(0)===0x04034b50,'FILE_CONTENT');
 let end=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--){if(b.readUInt32LE(i)===0x06054b50&&i+22+b.readUInt16LE(i+20)===b.length){end=i;break;}}
 fail(end>=0,'FILE_CONTENT');const count=b.readUInt16LE(end+10),size=b.readUInt32LE(end+12),offset=b.readUInt32LE(end+16);
 fail(b.readUInt16LE(end+4)===0&&b.readUInt16LE(end+6)===0&&b.readUInt16LE(end+8)===count,'FILE_CONTENT');
 fail(count>0&&count<=5000&&offset+size===end,'FILE_CONTENT');
 let p=offset,total=0;const entries=new Map(),ranges=[];
 for(let i=0;i<count;i++){
  fail(p+46<=end&&b.readUInt32LE(p)===0x02014b50,'FILE_CONTENT');
  const flags=b.readUInt16LE(p+8),method=b.readUInt16LE(p+10),packed=b.readUInt32LE(p+20),unpacked=b.readUInt32LE(p+24),nl=b.readUInt16LE(p+28),el=b.readUInt16LE(p+30),cl=b.readUInt16LE(p+32),local=b.readUInt32LE(p+42);
  fail(!(flags&1)&&!(flags&64)&&[0,8].includes(method),'ENCRYPTED_OR_UNSUPPORTED_FILE');
  fail(p+46+nl+el+cl<=end&&nl>0&&nl<600,'FILE_CONTENT');
  const name=b.subarray(p+46,p+46+nl).toString('utf8');
  fail(!entries.has(name)&&!/[\\\x00-\x1f]/.test(name)&&!name.startsWith('/')&&!name.split('/').includes('..')&&!/^[a-z]:/i.test(name),'FILE_CONTENT');
  total+=unpacked;fail(total<=100_000_000&&unpacked<=40_000_000&&(unpacked<1_000_000||unpacked<=Math.max(packed,1)*200),'ARCHIVE_LIMIT');
  fail(local+30<=offset&&b.readUInt32LE(local)===0x04034b50,'FILE_CONTENT');
  const localFlags=b.readUInt16LE(local+6),ln=b.readUInt16LE(local+26),le=b.readUInt16LE(local+28),start=local+30+ln+le;
  fail(localFlags===flags&&b.readUInt16LE(local+8)===method&&start+packed<=offset&&b.subarray(local+30,local+30+ln).toString('utf8')===name,'FILE_CONTENT');
  fail(!/vbaproject|activex|(^|\/)embeddings\//i.test(name),'ACTIVE_CONTENT');
  ranges.push([local,start+packed]);
  entries.set(name,{unpacked,read(){const raw=b.subarray(start,start+packed);const result=method===0?raw:inflateRawSync(raw,{maxOutputLength:Math.min(40_000_001,unpacked+1)});fail(result.length===unpacked,'FILE_CONTENT');return result;}});
  p+=46+nl+el+cl;
 }
 fail(p===end,'FILE_CONTENT');ranges.sort((a,b)=>a[0]-b[0]);for(let i=1;i<ranges.length;i++)fail(ranges[i-1][1]<=ranges[i][0],'FILE_CONTENT');
 return entries;
}
export function validateContent(ext,b){try{
 fail(Buffer.isBuffer(b)&&b.length>0&&b.length<=POLICY.maxFileBytes,'FILE_SIZE');
 if(ext==='pdf'){
  fail(b.subarray(0,8).toString('ascii').startsWith('%PDF-')&&b.subarray(-2048).includes(Buffer.from('%%EOF')),'FILE_CONTENT');
  fail(!/\/Encrypt\b|\/JavaScript\b|\/JS\b|\/Launch\b|\/EmbeddedFile\b/.test(b.toString('latin1').replace(/#([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))),'ACTIVE_OR_ENCRYPTED_PDF');return;
 }
 if(['docx','xlsx','jasp','spv'].includes(ext)){
  const entries=zipEntries(b);if(['docx','xlsx'].includes(ext)){
   fail(entries.has('[Content_Types].xml')&&entries.has(ext==='docx'?'word/document.xml':'xl/workbook.xml'),'FILE_CONTENT');
   const ct=entries.get('[Content_Types].xml').read().toString('utf8');fail(!/macroEnabled|vbaProject/i.test(ct),'ACTIVE_CONTENT');
   fail(ct.includes(ext==='docx'?'wordprocessingml.document.main+xml':'spreadsheetml.sheet.main+xml'),'FILE_CONTENT');
  }else if(ext==='jasp'){
   // JASP desktop archive recognition is deliberately conservative; real course-version fixture is a launch gate.
   fail(entries.has('manifest.json')||entries.has('META-INF/MANIFEST.MF'),'JASP_STRUCTURE');
   fail([...entries.keys()].some(n=>/data|analys|result/i.test(n)),'JASP_STRUCTURE');
  }else fail([...entries.keys()].some(n=>/output|viewer|lightTable/i.test(n)),'SPV_STRUCTURE');
  return;
 }
 fail(['r','sps','csv','txt'].includes(ext),'FILE_TYPE');
 const decoded=new TextDecoder('utf-8',{fatal:true}).decode(b);fail(!decoded.includes('\0')&&!/^\s*<(?:!doctype|html|script|svg)/i.test(decoded),'FILE_CONTENT');
 }catch(e){if(e instanceof PortalError)throw e;throw new PortalError('FILE_CONTENT');}}
