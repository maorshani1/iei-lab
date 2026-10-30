import {equal} from '../server/submissions/security.mjs';
import {cleanupExpiredCredentials} from '../server/submissions/maintenance.mjs';
import {createNewsletterStore} from '../server/newsletter/runtime.mjs';

export function createNewsletterMaintenance({env=process.env,createStore=createNewsletterStore,cleanup=cleanupExpiredCredentials}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  const reply=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  if(env.VERCEL_ENV!=='production'||!env.CRON_SECRET||env.CRON_SECRET.length<32||!equal(req.headers.authorization||'','Bearer '+env.CRON_SECRET))return reply(404,{error:'NOT_FOUND'});
  if(req.method!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
  try{
   const store=createStore(env);
   if(store.collection!=='seri_newsletter_limits')throw Error('Wrong collection');
   let deleted=0,batches=0,last=0;
   do{last=(await cleanup(store)).deleted;deleted+=last;batches++;}while(last===200&&batches<5);
   return reply(200,{deleted,morePossible:last===200});
  }catch{
   console.error(JSON.stringify({component:'newsletter-maintenance',code:'CLEANUP_FAILED'}));
   return reply(503,{error:'CLEANUP_FAILED'});
  }
 };
}
export default createNewsletterMaintenance();
export const config={maxDuration:300};
