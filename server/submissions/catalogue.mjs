/** Public syllabus-derived catalogue. No folder IDs, credentials, or student data. */
export const POLICY = Object.freeze({year:'2026-27', timeZone:'Asia/Jerusalem', lateDays:7,
  maxFileBytes:25_000_000, maxSubmissionBytes:100_000_000, chunkBytes:2_097_152,
  fallbackEmail:'maorsha@ariel.ac.il'});
const report=['pdf','docx'];
const supporting=['pdf','docx','jasp','r','sps','spv','csv','xlsx','txt'];
const stat=(id,code,en,he,date,semester)=>({id,code,title:{en,he},due:`${date}T23:59:59.999${date>='2027-03-26'?'+03:00':'+02:00'}`,
  semester,team:false,maxFiles:2,requiredRoles:['report','analysis'],types:{report,analysis:['jasp']}});
// Explicit offset is checked against Asia/Jerusalem at build/test time. Cutoff includes the full 23:59 minute.
export const COURSES=[
 {id:'statistics',code:'STAT',title:{en:'Statistics I & II',he:'סטטיסטיקה א׳ וב׳'},numbers:['2-3683312-1','2-3683412-1'],instructions:{en:'Individual submissions: three assignments in each semester. Submit a Word or PDF report and a saved JASP file. An alternative analysis format requires prior agreement with the lecturer.',he:'הגשות אישיות: שלוש מטלות בכל סמסטר. יש להגיש דוח Word או PDF וקובץ JASP שמור. פורמט ניתוח חלופי דורש הסכמה מראש של המרצה.'},assignments:[
  stat('stat1-a01','STAT1_A01','Questionnaire report','דוח שאלון','2026-11-15','I'),
  stat('stat1-a02','STAT1_A02','Group comparison','השוואה בין קבוצות','2026-12-13','I'),
  stat('stat1-a03','STAT1_A03','Regression report','דוח רגרסיה','2027-01-10','I'),
  stat('stat2-a01','STAT2_A01','Logistic regression report','דוח רגרסיה לוגיסטית','2027-03-21','II'),
  stat('stat2-a02','STAT2_A02','Moderation or mediation report','דוח מיתון או תיווך','2027-04-18','II'),
  stat('stat2-a03','STAT2_A03','Research analysis report','דוח ניתוח מחקר','2027-06-13','II')]},
 {id:'seminar',code:'SEM',title:{en:'Antisemitism and Trauma',he:'אנטישמיות וטראומה'},numbers:['2-3630510-11'],instructions:{en:'One designated student submits for each pair or team of three and lists the additional members. Proposal, analysis dossier and final-paper requirements appear with the selected assignment. Do not include identifiable raw participant data.',he:'נציג או נציגה אחת מגישים בשם זוג או צוות של שלושה ומציינים את שמות החברים הנוספים. דרישות ההצעה, תיק הניתוח והעבודה הסופית מוצגות עם בחירת המטלה. אין לצרף נתוני גלם מזהים של משתתפים.'},assignments:[
  {id:'sem-a01',code:'SEM_A01',title:{en:'Revised research proposal',he:'הצעת מחקר מתוקנת'},due:'2027-01-10T23:59:59.999+02:00',team:true,maxFiles:1,requiredRoles:['report'],types:{report}},
  {id:'sem-a02',code:'SEM_A02',title:{en:'Analysis and research documentation dossier',he:'תיק ניתוח ותיעוד מחקר'},due:'2027-05-23T23:59:59.999+03:00',team:true,maxFiles:6,requiredRoles:['analysis'],types:{analysis:supporting,report,supporting}},
  {id:'sem-a03',code:'SEM_A03',title:{en:'Final seminar paper',he:'עבודה סמינריונית סופית'},due:'2027-07-18T23:59:59.999+03:00',team:true,maxFiles:6,requiredRoles:['report','analysis'],types:{report,analysis:supporting,supporting}}]},
 {id:'tests',code:'TESTS',title:{en:'Intelligence and Personality Tests',he:'מבחני אינטליגנציה ואישיות'},numbers:['363100-1'],assignments:[],
  note:{en:'No assignment uploads are scheduled. The syllabus proposes a final examination.',he:'לא נקבעו מטלות להגשה. הסילבוס מציע בחינה מסכמת.'}}
];
export function assignment(id){for(const c of COURSES){const a=c.assignments.find(x=>x.id===id);if(a)return {...a,course:c.id,courseTitle:c.title};}return null;}
export function publicCatalogue(){return {courses:COURSES,policy:POLICY};}
