/** Private class-wide assignment views. Roster matching never changes account access. */
import {assignment,COURSES} from './catalogue.mjs';
import {classifyForStaff} from './roster.mjs';
import {fail,randomId} from './security.mjs';

export const TRACKER_HEADERS=['Student key','Student name / שם','Student number / מספר סטודנט','Email / דוא״ל','Submission status / מצב הגשה','Effective deadline / מועד הגשה','Received / התקבל','Revision / גרסה','Receipt / אסמכתה','Files / קבצים','Team / צוות','Matching / התאמה','Grade / ציון','Grading status / מצב בדיקה','Feedback / משוב','Lecturer notes / הערות','Graded revision / גרסה שנבדקה','Grading check / בדיקת גרסה'];
export const REVIEW_HEADERS=['Record key','Receipt / אסמכתה','Record type','Submitter / מגיש','Declared number','Verified email','Team names','Review reason','Confirmed student numbers','Lecturer notes'];
export const STATUS={waiting:'Awaiting submission / טרם הוגש',missing:'Missing / חסר',submitted:'Submitted / הוגש',late:'Submitted late / הוגש באיחור',extended:'Submitted with extension / הוגש בארכה',extension:'Extension approved / אושרה ארכה',team:'Team submission: confirm member / הגשה צוותית: אישור שיוך',review:'Identity needs review / התאמה לבדיקה'};
const normalized=value=>String(value).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
export function israelTime(value){return value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)):'';}
function match(rows,record){try{return classifyForStaff(rows,{course:assignment(record.assignment).course,verifiedEmail:record.email,declaredIdentifier:record.studentNumber});}catch{return {status:'invalid-details',recordRef:null};}}
export function trackerReport({assignmentId,roster,submissions=[],requests=[],confirmed={},now=Date.now()}){
 const a=assignment(assignmentId);fail(a,'TRACKER_ASSIGNMENT');
 fail(roster.length>0&&roster.length<=500&&roster.every(r=>r.course===a.course),'TRACKER_ROSTER');
 const members=new Map(roster.map(r=>[r.recordRef,{roster:r,submissions:[],claims:[],deadline:Date.parse(a.due),notes:[]}])) ,review=[];
 const ids=new Map(roster.map(r=>[r.identifier,r.recordRef]));
 function resolve(record,kind){
  const matchResult=match(roster,record),exact=matchResult.status==='exact'?matchResult.recordRef:null;
  const raw=String(confirmed[record.id]||'').trim();
  const approved=raw?raw.split(/[;,\n]+/).map(s=>s.trim()).filter(Boolean):[];
  const valid=approved.length>0&&approved.length<=(a.team?3:1)&&new Set(approved).size===approved.length&&approved.every(x=>ids.has(x));
  const targets=new Set(valid?approved.map(x=>ids.get(x)):exact?[exact]:[]);
  const claimed=[];const reasons=[];
  if(raw&&!valid)reasons.push('Check confirmed student numbers');
  if(!exact&&!valid)reasons.push(matchResult.status==='leading-zero-review'?'Student number needs leading-zero review':'Email and student number need lecturer confirmation');
  if(kind==='submission'&&a.team&&!valid)for(const name of record.teamNames||[]){
   const candidates=roster.filter(r=>normalized(r.name)===normalized(name)&&r.recordRef!==exact);
   if(candidates.length===1){claimed.push(candidates[0].recordRef);reasons.push('Confirm named team member: '+name);}
   else reasons.push('Team name needs matching: '+name);
  }
  if(reasons.length||raw||a.team)review.push([record.id,record.reference||'',kind,record.name,record.studentNumber,record.email,(record.teamNames||[]).join('\n'),valid?'Lecturer confirmation applied':reasons.join('; ')||'Exact submitter match']);
  if(!exact&&!valid){const candidate=roster.find(r=>r.identifier===record.studentNumber||r.emails.includes(record.email));if(candidate)members.get(candidate.recordRef).notes.push('Unconfirmed '+kind+'; see Needs review');}
  return {targets:[...targets],claimed:[...new Set(claimed)].filter(x=>!targets.has(x)),label:valid?'Confirmed by lecturer':'Exact email and student number'};
 }
 for(const r of requests.filter(r=>r.assignment===a.id&&r.state==='approved'&&r.decision?.deadline)){
  const resolved=resolve(r,'extension');for(const key of resolved.targets){const member=members.get(key);member.deadline=Math.max(member.deadline,Date.parse(r.decision.deadline));}
 }
 for(const r of submissions.filter(r=>r.assignment===a.id&&r.state==='completed'&&r.receipt)){
  const resolved=resolve(r,'submission');for(const key of resolved.targets)members.get(key).submissions.push({record:r,label:resolved.label});
  for(const key of resolved.claimed)members.get(key).claims.push(r);
 }
 const rows=[...members.values()].map(m=>{
  m.submissions.sort((x,y)=>(y.record.completedAt||Date.parse(y.record.receipt.receivedAt))-(x.record.completedAt||Date.parse(x.record.receipt.receivedAt)));
  m.claims.sort((x,y)=>(y.completedAt||0)-(x.completedAt||0));
  const resolved=m.submissions[0],r=resolved?.record||m.claims[0];
  let status=now>m.deadline?STATUS.missing:m.deadline>Date.parse(a.due)?STATUS.extension:STATUS.waiting;
  if(m.notes.length)status=STATUS.review;
  if(r)status=resolved?({late:STATUS.late,extension:STATUS.extended}[r.receipt.status]||STATUS.submitted):STATUS.team;
  const parent=r?.files?.[0]?.parent;
  return [m.roster.recordRef,m.roster.name,m.roster.identifier,m.roster.emails.join('\n'),status,israelTime(m.deadline),r?israelTime(r.receipt.receivedAt):'',r?'R'+r.revision:'',r?.reference||'',parent?'https://drive.google.com/drive/folders/'+parent:'',r?[r.name,...(r.teamNames||[])].join('\n'):'',resolved?.label||(r?'Confirm team membership in Needs review':m.notes.join('; '))];
 });
 return {rows,review,updatedAt:new Date(now).toISOString(),assignment:a};
}

export class AssignmentTrackers {
 constructor({store,sheets,now=()=>Date.now()}){Object.assign(this,{store,sheets,now});}
 keys(id){return ['tracker_state_'+id,'queue_trackers'];}
 enqueue(tx,record,kind='submission'){
  const [key,q]=this.keys(record.assignment),state=tx.get(key)||{latest:{},requests:{},approved:{},generation:0};
  if(kind==='submission'){const previous=state.latest[record.uid];if(!previous||previous.time<=(record.completedAt||0))state.latest[record.uid]={id:record.id,time:record.completedAt||0};}
  else {state.requests[record.uid]={id:record.id};if(record.state==='approved')state.approved[record.uid]={id:record.id};}
  state.generation++;state.dirty=true;tx.set(key,state);
  const queue=tx.get(q)||{ids:[]};if(!queue.ids.includes(record.assignment))queue.ids.push(record.assignment);tx.set(q,queue);
 }
 async sync(id){
  const config=await this.store.get('tracker_config'),target=config?.assignments?.[id];if(!target)return false;
  const key='tracker_state_'+id,lease=randomId(),now=this.now();
  const state=await this.store.transaction([key],tx=>{const value=tx.get(key)||{latest:{},requests:{},approved:{},generation:0};if(value.leaseUntil>now)return null;value.lease=lease;value.leaseUntil=now+240000;tx.set(key,value);return value;});
  if(!state)return false;
  try{
   const roster=(await this.store.get('tracker_roster_'+assignment(id).course))?.rows;fail(roster,'TRACKER_ROSTER');
   const submissions=await Promise.all(Object.values(state.latest||{}).map(x=>this.store.get('submission_'+x.id)));
   const requestIds=[...new Set([...Object.values(state.approved||{}),...Object.values(state.requests||{})].map(x=>x.id))];
   const requests=await Promise.all(requestIds.map(x=>this.store.get('request_'+x)));
   const existing=await this.sheets.read(target,roster);
   const report=trackerReport({assignmentId:id,roster,submissions:submissions.filter(Boolean),requests:requests.filter(Boolean),confirmed:existing.confirmed,now});
   await this.sheets.write(target,report,existing);
   await this.store.transaction([key,'queue_trackers'],tx=>{const current=tx.get(key);fail(current.lease===lease,'TRACKER_BUSY');current.lastSyncAt=this.now();current.lastError=null;current.dirty=current.generation!==state.generation;delete current.lease;delete current.leaseUntil;tx.set(key,current);if(!current.dirty){const q=tx.get('queue_trackers')||{ids:[]};q.ids=q.ids.filter(x=>x!==id);tx.set('queue_trackers',q);}});
   return true;
  }catch(error){await this.store.transaction([key,'queue_trackers'],tx=>{const current=tx.get(key);if(current?.lease===lease){current.dirty=true;current.lastError='TRACKER_SYNC_FAILED';current.failedAt=this.now();const q=tx.get('queue_trackers')||{ids:[]};if(!q.ids.includes(id))q.ids.push(id);tx.set('queue_trackers',q);delete current.lease;delete current.leaseUntil;tx.set(key,current);}});throw error;}
 }
 async drain({all=false}={}){const config=await this.store.get('tracker_config');if(!config)return {synced:0,queued:0};const q=await this.store.get('queue_trackers')||{ids:[]};let synced=0,failed=0;for(const id of (all?Object.keys(config.assignments):q.ids)){try{if(await this.sync(id))synced++;}catch{failed++;}}return {synced,queued:(await this.store.get('queue_trackers'))?.ids.length||0,failed};}
}

/** Writes only automatic fields; grade/feedback columns remain owned by the lecturer. */
export class GoogleAssignmentSheets {
 constructor({token,drive}){Object.assign(this,{token,drive});}
 async request(id,path,options={}){const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+id+path,{...options,headers:{Authorization:'Bearer '+await this.token.get(),'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});fail(r.ok,'TRACKER_SHEETS_UNAVAILABLE',503);return r.json();}
 async read(target,roster){
  const info=await this.drive.info(target.spreadsheetId);fail(info.appProperties?.seriTracker==='v1'&&info.parents?.[0]===target.parentId,'TRACKER_DESTINATION');await this.drive.privateOnly(target.spreadsheetId);
  const r=await this.request(target.spreadsheetId,'/values:batchGet?'+new URLSearchParams([['ranges',"'Class status'!A8:R"+(8+roster.length)],['ranges',"'Needs review'!A8:J1008"]]));
  const values=r.valueRanges?.[0]?.values||[];fail(JSON.stringify(values[0])===JSON.stringify(TRACKER_HEADERS),'TRACKER_SCHEMA');
  const keys=values.slice(1).map(row=>row[0]);fail(keys.length===roster.length&&new Set(keys).size===keys.length&&roster.every(row=>keys.includes(row.recordRef)),'TRACKER_ROWS_CHANGED');
  const review=r.valueRanges?.[1]?.values||[];fail(JSON.stringify(review[0])===JSON.stringify(REVIEW_HEADERS),'TRACKER_SCHEMA');
  const reviewRows=review.slice(1),reviewKeys=reviewRows.map(row=>row[0]).filter(Boolean);fail(new Set(reviewKeys).size===reviewKeys.length,'TRACKER_ROWS_CHANGED');
  return {positions:Object.fromEntries(keys.map((key,i)=>[key,i+9])),reviewPositions:Object.fromEntries(reviewRows.map((row,i)=>[row[0],i+9]).filter(([key])=>key)),confirmed:Object.fromEntries(reviewRows.filter(row=>row[0]).map(row=>[row[0],row[8]||''])),reviewEnd:9+reviewRows.length};
 }
 async write(target,report,existing){
  const data=report.rows.map(row=>({range:`'Class status'!A${existing.positions[row[0]]}:L${existing.positions[row[0]]}`,values:[row]}));
  let next=existing.reviewEnd;
  for(const row of report.review){const line=existing.reviewPositions[row[0]]||next++;fail(line<=1008,'TRACKER_REVIEW_CAPACITY');data.push({range:`'Needs review'!A${line}:H${line}`,values:[row]});}
  data.push({range:"'Class status'!D5",values:[[israelTime(report.updatedAt)]]});
  await this.request(target.spreadsheetId,'/values:batchUpdate',{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data})});
  const checked=await this.request(target.spreadsheetId,'/values/'+encodeURIComponent("'Class status'!A9:L"+(8+report.rows.length)));
  const byKey=new Map((checked.values||[]).map(row=>[row[0],row]));
  fail(report.rows.every(row=>row.every((v,i)=>(byKey.get(row[0])?.[i]??'')===v)),'TRACKER_WRITE_UNCONFIRMED');
 }
}
