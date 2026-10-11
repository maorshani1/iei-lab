import {runtime} from '../server/submissions/runtime.mjs';
import {equal} from '../server/submissions/security.mjs';
import {operationsStatus} from '../server/submissions/operations.mjs';
export function createHealthHandler(getRuntime=runtime){return async function health(req,res){
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 const reply=(code,value)=>{res.statusCode=code;res.end(JSON.stringify(value));};
 if(req.method!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 try{const rt=getRuntime();if(!rt.enabled||!equal(req.headers.authorization||'','Bearer '+rt.cronSecret))return reply(404,{error:'NOT_FOUND'});
  const status=await operationsStatus(rt.portal);
  // A fresh Google token and private-register lookup also detect revoked account access.
  await rt.portal.register.sheets.check();
  return reply(status.ok?200:503,status);
 }catch{return reply(503,{ok:false,issues:['service-unavailable']});}
};}
export default createHealthHandler();
