import {timingSafeEqual} from 'node:crypto';
import {CONSENT_VERSION,providerConfig,NewsletterError} from './service.mjs';
import {createNewsletter} from './runtime.mjs';

// Operator-only verification. Public signup launch gates are independent.
// The token, expiry and single approved recipient must be explicitly provisioned.
export function verificationHandler({env=process.env,fetcher=fetch,now=()=>Date.now(),create=createNewsletter}={}){
 return async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  const reply=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  const token=env.NEWSLETTER_CHECK_TOKEN,until=Date.parse(env.NEWSLETTER_CHECK_EXPIRES||'');
  const supplied=Buffer.from(String(req.headers.authorization||'')),expected=Buffer.from('Bearer '+token);
  if(env.VERCEL_ENV!=='production'||!token||token.length<43||!Number.isFinite(until)||until<=now()||until>now()+4*3600000||supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply(404,{error:'NOT_FOUND'});
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'METHOD_NOT_ALLOWED'});
  try{
   const config=providerConfig(env);
   if(req.method==='GET'){
    const get=async path=>{const r=await fetcher('https://api.brevo.com/v3'+path,{headers:{'api-key':config.apiKey},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new NewsletterError('PROVIDER_CHECK_FAILED',503);return r.json();};
    const [list,template,attributes]=await Promise.all([get('/contacts/lists/'+config.listId),get('/smtp/templates/'+config.templateId),get('/contacts/attributes')]);
    const result={listExists:list.id===config.listId,templateActive:template.isActive===true,doiTemplate:template.doiTemplate===true,confirmationLink:/\{\{\s*params\.DOIurl\s*\}\}/.test(template.htmlContent||''),senderMatches:template.sender?.email==='lab@maorshani.com',consentAttributes:['SERI_CONSENT_VERSION','SERI_SIGNUP_SOURCE','SERI_REQUESTED_AT'].every(n=>attributes.attributes?.some(a=>a.name===n&&a.type==='text'))};
    return reply(Object.values(result).every(Boolean)?200:503,result);
   }
   // Reject payloads so callers cannot supply an address, list, template or action.
   if(Number(req.headers['content-length']||0)>0||req.headers['transfer-encoding']||req.body&&Object.keys(req.body).length)return reply(400,{error:'BODY_NOT_ALLOWED'});
   const email=env.NEWSLETTER_CHECK_RECIPIENT;
   if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply(503,{error:'CHECK_RECIPIENT_MISSING'});
   const newsletter=create(config,env);
   await newsletter.subscribe({email,consent:true,consentVersion:CONSENT_VERSION,website:''},'operator-verification');
   return reply(202,{confirmationRequested:true});
  }catch(e){return reply(e instanceof NewsletterError?e.status:503,{error:e instanceof NewsletterError?e.code:'CHECK_UNAVAILABLE'});}
 };
}
