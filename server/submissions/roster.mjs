/** Server-only roster preparation and reporting helpers.
 * Never use a roster match as authentication, never return a roster to a student,
 * and never merge sessions or transfer submission ownership between email aliases.
 */
import {fail,email,text} from './security.mjs';
export function identifierText(value){
 if(typeof value==='number'){fail(Number.isSafeInteger(value)&&value>=0,'ROSTER_IDENTIFIER');return String(value);}
 return text(value,32,1);
}
export function emailAddresses(value){
 fail(typeof value==='string','ROSTER_EMAIL');
 const entries=value.split(';').map(s=>s.trim()).filter(Boolean);
 fail(entries.length>0&&entries.length<=8,'ROSTER_EMAIL');
 return [...new Set(entries.map(email))];
}
export function prepareRoster(dataset){
 fail(dataset&&dataset.schema_version===1&&['statistics','seminar','tests'].includes(dataset.course_id),'ROSTER_SCHEMA');
 fail(Array.isArray(dataset.records)&&dataset.records.length<=500,'ROSTER_SIZE');
 const refs=new Set(),ids=new Set(),addresses=new Set();
 return dataset.records.map(row=>{
  fail(row&&row.course_id===dataset.course_id&&/^[a-z]+_[a-f0-9]{16}$/.test(row.record_ref||''),'ROSTER_SCHEMA');
  const id=identifierText(row.student_identifier),name=text(row.full_name,100,2);
  fail(Array.isArray(row.email_addresses)&&row.email_addresses.length>0&&row.email_addresses.length<=8,'ROSTER_EMAIL');
  const emails=[...new Set(row.email_addresses.map(email))];
  fail(!refs.has(row.record_ref)&&!ids.has(id)&&!emails.some(e=>addresses.has(e)),'ROSTER_DUPLICATE');
  refs.add(row.record_ref);ids.add(id);emails.forEach(e=>addresses.add(e));
  // Deliberate allowlist excludes phone, address, status and the original full export.
  return {recordRef:row.record_ref,course:dataset.course_id,name,identifier:id,emails};
 });
}
export function classifyForStaff(rows,{course,verifiedEmail,declaredIdentifier}){
 const address=email(verifiedEmail),identifier=identifierText(declaredIdentifier);
 const matches=rows.filter(r=>r.course===course&&r.emails.includes(address));
 if(matches.length!==1)return {status:matches.length?'ambiguous':'unmatched',recordRef:null};
 const row=matches[0];
 if(row.identifier===identifier)return {status:'exact',recordRef:row.recordRef};
 // A missing leading zero is only a comparison candidate for staff, not a repaired identifier.
 if(/^0\d{8}$/.test(row.identifier)&&/^\d{8}$/.test(identifier)&&'0'+identifier===row.identifier)
  return {status:'leading-zero-review',recordRef:row.recordRef};
 return {status:'identifier-review',recordRef:row.recordRef};
}
