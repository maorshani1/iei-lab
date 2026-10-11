import {randomBytes,randomInt,createHmac,timingSafeEqual,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
export class PortalError extends Error {constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export const fail=(condition,code,status=400)=>{if(!condition)throw new PortalError(code,status);};
export const randomId=()=>randomBytes(24).toString('base64url');
export const makeCode=()=>String(randomInt(100000,1000000));
export const digest=(key,value)=>createHmac('sha256',key).update(String(value)).digest('hex');
export const sha256=data=>createHash('sha256').update(data).digest('hex');
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function email(value){fail(typeof value==='string'&&value.length<=254,'EMAIL_INVALID');const e=value.trim().toLowerCase();fail(/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(e),'EMAIL_INVALID');return e;}
export function text(value,max=120,min=1){fail(typeof value==='string','TEXT_INVALID');const v=value.normalize('NFC').trim();fail(v.length>=min&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(v),'TEXT_INVALID');return v;}
export function person(value){const v=text(value,100,2);fail(!/[<>\r\n]/.test(v),'NAME_INVALID');return v;}
export function studentNumber(value){const v=text(value,32,2);fail(/^[A-Za-z0-9-]+$/.test(v),'STUDENT_NUMBER_INVALID');return v;}
export function slug(value,max=44){return String(value).normalize('NFC').replace(/[^\p{L}\p{N}_-]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,max)||'Student';}
export function filename({revision,assignmentCode,name,date,role,index,ext}){const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(date));const get=t=>parts.find(p=>p.type===t).value;const stamp=get('year')+get('month')+get('day')+'-'+get('hour')+get('minute')+get('second');return `R${revision}_2026-27_${assignmentCode}_${slug(name)}_${stamp}_${role}${index+1}.${ext}`;}
export function seal(key,value){const k=Buffer.from(key,'base64');fail(k.length===32,'CONFIGURATION_ERROR',503);const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',k,iv);const ciphertext=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),ciphertext]).toString('base64');}
export function unseal(key,value){const b=Buffer.from(value,'base64'),d=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8'));}
export const maskNumber=n=>'••••'+String(n).slice(-3);
export function onlyKeys(obj,allowed){fail(obj&&typeof obj==='object'&&!Array.isArray(obj),'INPUT_INVALID');fail(Object.keys(obj).every(k=>allowed.includes(k)),'UNEXPECTED_FIELD');}
