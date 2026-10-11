import {PortalError,fail,randomId,equal} from './security.mjs';
import {publicCatalogue,POLICY} from './catalogue.mjs';
const COOKIE='__Host-seri',PREAUTH='__Host-seri-preauth';
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')).filter(v=>v.length===2));}
function cookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
async function body(req,max=24_000,binary=false){let b=req.body;if(b===undefined){const parts=[];let length=0;for await(const part of req){length+=part.length;fail(length<=max,'REQUEST_TOO_LARGE',413);parts.push(Buffer.from(part));}b=Buffer.concat(parts);}if(binary){fail(Buffer.isBuffer(b)&&b.length<=max,'REQUEST_TOO_LARGE',413);return b;}if(Buffer.isBuffer(b)||typeof b==='string'){fail(Buffer.byteLength(b)<=max,'REQUEST_TOO_LARGE',413);try{return JSON.parse(b.toString());}catch{throw new PortalError('INPUT_INVALID');}}fail(b&&typeof b==='object'&&!Array.isArray(b)&&Buffer.byteLength(JSON.stringify(b))<=max,'INPUT_INVALID');return b;}
export function makeHandler(getRuntime){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('CDN-Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Type','application/json; charset=utf-8');
 const reply=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
 try{const {searchParams:q}=new URL(req.url,'https://www.maorshani.com'),action=q.get('action')||'catalogue';const rt=getRuntime();
  if(!rt.enabled){if(action==='catalogue')return reply(200,{...publicCatalogue(),enabled:false});return reply(503,{error:'SUBMISSIONS_NOT_OPEN'});}
  const {portal,origin}=rt,cs=cookies(req),token=cs[COOKIE];
  if(action==='drain'&&req.method==='GET'){fail(equal(req.headers.authorization||'','Bearer '+rt.cronSecret),'NOT_FOUND',404);return reply(200,await portal.drain());}
  if(req.method==='POST'){fail(req.headers.origin===origin&&req.headers['x-seri-request']==='1','REQUEST_REJECTED',403);fail(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin','REQUEST_REJECTED',403);}
  else fail(req.method==='GET','METHOD_NOT_ALLOWED',405);
  if(action==='catalogue'&&req.method==='GET'){let session=null;if(token)session=await portal.session(token).catch(()=>null);return reply(200,{...await portal.catalogue(session),enabled:true,retentionNotice:rt.retentionNotice});}
  if(action==='request-code'&&req.method==='POST'){fail((req.headers['content-type']||'').startsWith('application/json'),'CONTENT_TYPE',415);const bind=randomId();res.setHeader('Set-Cookie',cookie(PREAUTH,bind,600));
   // Use the Vercel-provided client IP, not a student-supplied body field. Global/email limits still apply.
   const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();return reply(200,await portal.requestCode(await body(req),bind,ip));}
  if(action==='verify-code'&&req.method==='POST'){const result=await portal.verify(await body(req),cs[PREAUTH]);res.setHeader('Set-Cookie',[cookie(COOKIE,result.token,8*3600),cookie(PREAUTH,'',0)]);return reply(200,result.session);}
  if(action==='logout'&&req.method==='POST'){const s=await portal.session(token);portal.checkCsrf(s,req.headers['x-csrf-token']);await portal.logout(token);res.setHeader('Set-Cookie',cookie(COOKIE,'',0));return reply(200,{ok:true});}
  const s=await portal.session(token);if(req.method==='POST')portal.checkCsrf(s,req.headers['x-csrf-token']);
  if(action==='session'&&req.method==='GET')return reply(200,{email:s.email,csrf:s.csrf,owner:s.email===portal.ownerEmail,expiresAt:s.expiresAt});
  if(action==='receipts'&&req.method==='GET')return reply(200,await portal.receipts(s,q.get('course')));
  if(action==='status'&&req.method==='GET')return reply(200,await portal.status(s,q.get('id')));
  if(action==='review'&&req.method==='GET')return reply(200,await portal.reviewQueue(s,q.get('course')));
  fail(req.method==='POST','METHOD_NOT_ALLOWED',405);
  if(action==='chunk'){fail((req.headers['content-type']||'').startsWith('application/octet-stream'),'CONTENT_TYPE',415);return reply(200,await portal.upload(s,q.get('id'),Number(q.get('index')),Number(q.get('offset')),await body(req,POLICY.chunkBytes,true)));}
  fail((req.headers['content-type']||'').startsWith('application/json'),'CONTENT_TYPE',415);const input=await body(req);
  if(action==='start')return reply(200,await portal.start(s,input));
  if(action==='finish')return reply(200,await portal.finish(s,q.get('id'),input));
  if(action==='cancel')return reply(200,await portal.cancel(s,input.id));
  if(action==='extension'){const result=await portal.requestExtension(s,input);await portal.drain().catch(()=>{});return reply(200,result);}
  if(action==='decide'){const result=await portal.decide(s,input);await portal.drain().catch(()=>{});return reply(200,result);}
  if(action==='drain'){portal.owner(s);return reply(200,await portal.drain());}
  throw new PortalError('NOT_FOUND',404);
 }catch(e){const id=randomId().slice(0,10); // Log only a non-personal diagnostic identifier, never request/provider data.
  const known=e instanceof PortalError;console.error(JSON.stringify({component:'submissions',reference:id,code:known?e.code:'SERVICE_UNAVAILABLE'}));
  return reply(known?e.status:503,{error:known?e.code:'SERVICE_UNAVAILABLE',reference:id});}
 };}
