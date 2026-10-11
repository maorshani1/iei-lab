/** Aggregate operational reporting. No student details or credentials enter alerts. */
import {COURSES} from './catalogue.mjs';
import {randomId} from './security.mjs';
export class FailureAlerts {
 constructor({store,mail,ownerEmail,now=()=>Date.now()}){Object.assign(this,{store,mail,ownerEmail,now});}
 async report(component,{test=false}={}){
  if(!['submission-api','maintenance','tracker','register','email','synthetic-test'].includes(component))component='maintenance';
  const key='ops_alert_'+component,now=this.now(),lease=randomId();
  try{
   const claimed=await this.store.transaction([key],tx=>{const old=tx.get(key)||{};if(old.lastAttemptAt&&now-old.lastAttemptAt<86400000)return false;tx.set(key,{lastAttemptAt:now,state:'sending',lease});return true;});
   if(!claimed)return {sent:false,deduplicated:true};
   await this.mail.send({to:this.ownerEmail,id:'seri-alert-'+component+'-'+lease,subject:test?'TEST: SERI submission system failure alert':'SERI submission system: attention required',text:test?'This is a synthetic test of the submission system failure alert.\nThe submission system is operating. No student records are included and no action is required.\n\nזוהי בדיקת התראה בלבד. מערכת ההגשות פועלת ואין צורך בפעולה.':`The SERI submission system detected an operational problem in: ${component}.\n\nOpen https://www.maorshani.com/teaching/submissions and sign in with the lecturer account. Review System status and retry pending updates. If the problem persists, inspect the Vercel function logs.\n\nCompleted work remains in private storage. This alert contains no student details.\n\nזוהתה תקלה תפעולית במערכת ההגשות. יש להיכנס לחשבון המרצה, לבדוק את מצב המערכת ולנסות שוב עדכונים ממתינים. עבודות שהושלמו נשמרות באחסון הפרטי.`});
   await this.store.transaction([key],tx=>{const old=tx.get(key);if(old?.lease===lease)tx.set(key,{...old,state:'sent',sentAt:this.now()});});return {sent:true};
  }catch{console.error(JSON.stringify({component:'submission-alert',code:'ALERT_DELIVERY_UNCONFIRMED'}));return {sent:false,failed:true};}
 }
}
export async function operationsStatus(portal,{now=Date.now()}={}){
 const [health,mail,register,tracking,config]=await Promise.all(['ops_health','queue_mail','queue_register','queue_trackers','tracker_config'].map(key=>portal.store.get(key)));
 const issues=[...(health?.issues||[])];
 if(!health?.lastMaintenanceAt||now-health.lastMaintenanceAt>36*3600000)issues.push('maintenance-overdue');
 const queues={email:mail?.ids?.length||0,register:register?.ids?.length||0,trackers:tracking?.ids?.length||0};
 const configured=Object.keys(config?.assignments||{});
 if(portal.trackers&&COURSES.flatMap(c=>c.assignments).some(a=>!configured.includes(a.id)))issues.push('tracker-configuration-incomplete');
 if(Object.values(queues).some(n=>n>0))issues.push('pending-updates');
 const states=await Promise.all(configured.map(id=>portal.store.get('tracker_state_'+id)));
 if(states.some(s=>s?.lastError))issues.push('tracker-sync-failed');
 if(states.some(s=>!s?.lastSyncAt||now-s.lastSyncAt>36*3600000))issues.push('tracker-refresh-overdue');
 return {ok:issues.length===0,lastMaintenanceAt:health?.lastMaintenanceAt||null,issues:[...new Set(issues)],queues,trackers:configured.length};
}
