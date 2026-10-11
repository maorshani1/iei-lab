import {runtime} from '../server/submissions/runtime.mjs';
import {equal} from '../server/submissions/security.mjs';
import {snapshotRecords,cleanupExpiredCredentials} from '../server/submissions/maintenance.mjs';
export function createMaintenanceHandler(getRuntime=runtime,backupRecords=snapshotRecords,cleanup=cleanupExpiredCredentials){return async function maintenance(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const reply=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
 if(req.method!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 try{
  const rt=getRuntime();
  if(!rt.enabled)return reply(503,{error:'SUBMISSIONS_NOT_OPEN'});
  if(!equal(req.headers.authorization||'','Bearer '+rt.cronSecret))return reply(404,{error:'NOT_FOUND'});
  const backup=await backupRecords({store:rt.portal.store,drive:rt.portal.drive,sheets:rt.portal.register.sheets});
  const expiredCredentials=await cleanup(rt.portal.store);
  return reply(200,{backup,expiredCredentials,...await rt.portal.drain()});
 }catch(error){console.error(JSON.stringify({component:'submission-maintenance',code:/^(BACKUP_|STORAGE_|REGISTER_|DATABASE_)[A-Z_]+$/.test(error.code||'')?error.code:'MAINTENANCE_FAILED'}));return reply(503,{error:'MAINTENANCE_FAILED'});}
};}
export default createMaintenanceHandler();
export const config={maxDuration:300};
