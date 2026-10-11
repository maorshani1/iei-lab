import {runtime} from '../server/submissions/runtime.mjs';
import {equal} from '../server/submissions/security.mjs';
import {snapshotRecords,cleanupExpiredCredentials} from '../server/submissions/maintenance.mjs';
export function createMaintenanceHandler(getRuntime=runtime,backupRecords=snapshotRecords,cleanup=cleanupExpiredCredentials){return async function maintenance(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const reply=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
 if(req.method!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 let rt,authorized=false;
 try{
  rt=getRuntime();if(!rt.enabled)return reply(503,{error:'SUBMISSIONS_NOT_OPEN'});
  if(!equal(req.headers.authorization||'','Bearer '+rt.cronSecret))return reply(404,{error:'NOT_FOUND'});authorized=true;
  const issues=[],result={};
  try{result.backup=await backupRecords({store:rt.portal.store,drive:rt.portal.drive,sheets:rt.portal.register.sheets});}catch{issues.push('backup-failed');}
  try{result.expiredCredentials=await cleanup(rt.portal.store);}catch{issues.push('credential-cleanup-failed');}
  try{Object.assign(result,await rt.portal.drain({allTrackers:true}));if(result.queued)issues.push('email-pending');if(result.register?.queued)issues.push('register-pending');if(result.trackers?.failed||result.trackers?.queued)issues.push('tracker-pending');}catch{issues.push('queue-processing-failed');}
  if(rt.portal.store.transaction)await rt.portal.store.transaction(['ops_health'],tx=>tx.set('ops_health',{lastMaintenanceAt:Date.now(),issues,result}));
  if(issues.length){await rt.portal.alerts?.report('maintenance');return reply(503,{...result,error:'MAINTENANCE_INCOMPLETE',issues});}
  return reply(200,{...result,issues:[]});
 }catch(error){
  console.error(JSON.stringify({component:'submission-maintenance',code:/^(BACKUP_|STORAGE_|REGISTER_|DATABASE_)[A-Z_]+$/.test(error.code||'')?error.code:'MAINTENANCE_FAILED'}));
  if(authorized)await rt?.portal?.alerts?.report('maintenance');
  return reply(503,{error:'MAINTENANCE_FAILED'});
 }
};}
export default createMaintenanceHandler();
export const config={maxDuration:300};
