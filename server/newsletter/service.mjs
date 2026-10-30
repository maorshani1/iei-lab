import {createHmac, randomUUID} from 'node:crypto';
export const CONSENT_VERSION = '2026-10-30';
export const ORIGIN = 'https://www.maorshani.com';
export class NewsletterError extends Error { constructor(code,status=400){super(code);this.code=code;this.status=status;} }
const check=(test,code,status)=>{if(!test)throw new NewsletterError(code,status);};
export function newsletterConfig(env=process.env){
 if(env.NEWSLETTER_ENABLED!=='true'||env.VERCEL_ENV!=='production')return {enabled:false};
 const positive=v=>/^\d{1,10}$/.test(v||'')&&Number(v)>0;
 check(env.BREVO_API_KEY?.length>20&&positive(env.BREVO_NEWSLETTER_LIST_ID)&&positive(env.BREVO_NEWSLETTER_TEMPLATE_ID)&&env.NEWSLETTER_CONFIG_VERIFIED==='true','NEWSLETTER_UNAVAILABLE',503);
 let url;try{url=new URL(env.NEWSLETTER_UNSUBSCRIBE_URL);}catch{throw new NewsletterError('NEWSLETTER_UNAVAILABLE',503);}
 check(url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&(url.hostname==='sibforms.com'||url.hostname.endsWith('.sibforms.com')),'NEWSLETTER_UNAVAILABLE',503);
 return {enabled:true,apiKey:env.BREVO_API_KEY,listId:Number(env.BREVO_NEWSLETTER_LIST_ID),templateId:Number(env.BREVO_NEWSLETTER_TEMPLATE_ID),unsubscribeUrl:url.href};
}
export class Newsletter {
 constructor({config,store,secret,fetcher=fetch,now=()=>Date.now()}){Object.assign(this,{config,store,secret,fetcher,now});}
 publicStatus(){return {enabled:true,unsubscribeUrl:this.config.unsubscribeUrl};}
 digest(value){return createHmac('sha256',this.secret).update('seri-newsletter-rate-v1\0'+value).digest('hex');}
 async reserve(address,ip){
  const now=this.now(),hour=3600000,day=24*hour;
  const limits=[['email:'+address,day,3],['ip:'+ip,hour,8],['global',day,200]];
  const rows=limits.map(([value,window,max])=>({id:'rate_'+this.digest(value),window,max}));
  await this.store.transaction(rows.map(x=>x.id),tx=>{
   for(const {id,window,max} of rows){const old=tx.get(id),value=old&&old.expiresAt>now?old:{count:0,expiresAt:now+window};check(value.count<max,'RATE_LIMITED',429);value.count++;tx.set(id,value);}
  });
 }
 async subscribe(input,ip){
  check(input&&typeof input==='object'&&!Array.isArray(input),'INPUT_INVALID');
  check(typeof input.email==='string'&&input.email.length<=254&&input.consent===true&&input.consentVersion===CONSENT_VERSION,'INPUT_INVALID');
  const address=input.email.trim().toLowerCase();
  check(/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(address),'INPUT_INVALID');
  check(typeof input.website==='string'&&input.website.length===0,'INPUT_INVALID');
  await this.reserve(address,String(ip||'unknown').slice(0,128));
  let r;
  try{r=await this.fetcher('https://api.brevo.com/v3/contacts/doubleOptinConfirmation',{method:'POST',headers:{'api-key':this.config.apiKey,'Content-Type':'application/json',Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),body:JSON.stringify({email:address,includeListIds:[this.config.listId],templateId:this.config.templateId,contactPixelTrackingConsent:false,redirectionUrl:ORIGIN+'/newsletter/confirmed',attributes:{SERI_CONSENT_VERSION:CONSENT_VERSION,SERI_SIGNUP_SOURCE:ORIGIN+'/newsletter',SERI_REQUESTED_AT:new Date(this.now()).toISOString()}})});}catch{throw new NewsletterError('NEWSLETTER_UNAVAILABLE',503);}
  // Never expose provider diagnostics or infer signup success from an error response.
  if(!r.ok)throw new NewsletterError(r.status===429?'RATE_LIMITED':'NEWSLETTER_UNAVAILABLE',r.status===429?429:503);
  return {ok:true};
 }
}
export function makeNewsletterHandler(getRuntime){return async(req,res)=>{
 const reply=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
 for(const [k,v] of Object.entries({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}))res.setHeader(k,v);
 try{
  check(['GET','POST'].includes(req.method),'METHOD_NOT_ALLOWED',405);
  const rt=getRuntime();if(!rt.enabled)return reply(req.method==='GET'?200:503,req.method==='GET'?{enabled:false}:{error:'NEWSLETTER_UNAVAILABLE'});
  if(req.method==='GET')return reply(200,rt.newsletter.publicStatus());
  check(req.headers.origin===ORIGIN&&req.headers['x-seri-newsletter']==='1'&&(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin'),'REQUEST_REJECTED',403);
  check((req.headers['content-type']||'').split(';')[0]==='application/json','CONTENT_TYPE',415);
  let input=req.body;
  if(input===undefined){const parts=[];let total=0;for await(const part of req){total+=part.length;check(total<=2048,'REQUEST_TOO_LARGE',413);parts.push(Buffer.from(part));}input=Buffer.concat(parts);}
  if(Buffer.isBuffer(input)||typeof input==='string'){check(Buffer.byteLength(input)<=2048,'REQUEST_TOO_LARGE',413);try{input=JSON.parse(input.toString());}catch{throw new NewsletterError('INPUT_INVALID');}}
  else check(input&&Buffer.byteLength(JSON.stringify(input))<=2048,'REQUEST_TOO_LARGE',413);
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  return reply(202,await rt.newsletter.subscribe(input,ip));
 }catch(e){const known=e instanceof NewsletterError,code=known?e.code:'NEWSLETTER_UNAVAILABLE',status=known?e.status:503;
  if(status>=500)console.error(JSON.stringify({component:'newsletter',code,reference:randomUUID()}));
  if(status===429)res.setHeader('Retry-After','3600');
  return reply(status,{error:code});
 }
};}
