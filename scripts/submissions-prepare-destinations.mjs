/** Prepare empty owner-only coursework destinations; never changes intake settings. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {UserToken,DriveStorage} from '../server/submissions/adapters.mjs';
import {GoogleSheetsRegister} from '../server/submissions/sheets.mjs';
import {REGISTER_HEADERS} from '../server/submissions/register.mjs';
import {COURSES,POLICY} from '../server/submissions/catalogue.mjs';
import {fail} from '../server/submissions/security.mjs';

const PRIVATE=path.join(os.homedir(),'Library/Application Support/SERI Teaching Submissions');
const API='https://www.googleapis.com/drive/v3',PURPOSE='coursework-destinations-v1';
const FOLDER='application/vnd.google-apps.folder',SHEET='application/vnd.google-apps.spreadsheet';
export async function prepareDestinations(){
 fail(((await fs.stat(PRIVATE)).mode&0o777)===0o700,'SETUP_PRIVATE_DIRECTORY',503);
 const lock=path.join(PRIVATE,'destinations-setup.lock');
 const handle=await fs.open(lock,'wx',0o600);await handle.close();
 try{
  const credential=JSON.parse(await fs.readFile(path.join(PRIVATE,'google-oauth.json'),'utf8'));
  fail(credential.projectId==='seri-teaching-submissions'&&credential.ownerEmail==='maor.shani@gmail.com','SETUP_ACCOUNT_MISMATCH',503);
  const token=new UserToken(credential),drive=new DriveStorage({token,ownerEmail:credential.ownerEmail});
  async function json(url,options={}){
   const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+await token.get(),'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(30_000)});
   fail(response.ok,'SETUP_GOOGLE_HTTP_'+response.status,503);return response.json();
  }
  const query=new URLSearchParams({q:`trashed=false and appProperties has { key='seriSetup' and value='${PURPOSE}' }`,fields:'files(id,mimeType,appProperties),nextPageToken',pageSize:'100'});
  const listed=await json(API+'/files?'+query);
  fail(!listed.nextPageToken,'SETUP_DESTINATION_AMBIGUOUS',503);
  async function ensure(kind,name,mimeType,parent){
   const matches=listed.files.filter(file=>file.appProperties?.seriDestination===kind&&file.appProperties?.seriYear===POLICY.year);
   fail(matches.length<=1,'SETUP_DESTINATION_AMBIGUOUS',503);
   let id=matches[0]?.id;
   if(!id){
    if(parent)await drive.checkFolder(parent);
    const file=await json(API+'/files?fields=id',{method:'POST',body:JSON.stringify({name,mimeType,...(parent?{parents:[parent]}:{}),appProperties:{seriSetup:PURPOSE,seriDestination:kind,seriYear:POLICY.year,...(mimeType===SHEET?{seriRegister:'v1'}:{})}})});
    id=file.id;
   }
   const info=await drive.info(id);
   fail(!info.trashed&&info.mimeType===mimeType&&info.owners?.length===1&&info.owners[0].emailAddress===credential.ownerEmail,'STORAGE_NOT_PRIVATE',503);
   fail(info.appProperties?.seriSetup===PURPOSE&&info.appProperties?.seriDestination===kind&&info.appProperties?.seriYear===POLICY.year,'SETUP_DESTINATION_MISMATCH',503);
   if(parent)fail(info.parents?.length===1&&info.parents[0]===parent,'SETUP_PARENT_MISMATCH',503);
   await drive.privateOnly(id);return id;
  }
  const root=await ensure('root',`SERI Teaching Submissions ${POLICY.year} PRIVATE`,FOLDER);
  const folderMap={};
  for(const course of COURSES.filter(course=>course.assignments.length)){
   const parent=await ensure('course-'+course.id,course.title.en+' / '+course.title.he,FOLDER,root);
   for(const assignment of course.assignments)folderMap[assignment.id]=await ensure('assignment-'+assignment.id,assignment.code+' '+assignment.title.en,FOLDER,parent);
  }
  fail(new Set(Object.values(folderMap)).size===Object.keys(folderMap).length,'SETUP_DESTINATION_MISMATCH',503);
  const registerId=await ensure('register',`SERI Teaching Submission Register ${POLICY.year}`,SHEET,root);
  const base='https://sheets.googleapis.com/v4/spreadsheets/'+registerId;
  const book=await json(base+'?fields=sheets(properties)');
  fail(book.sheets?.length===1,'SETUP_REGISTER_SCHEMA',503);
  const properties=book.sheets[0].properties,tab="'"+properties.title.replaceAll("'","''")+"'";
  const headerPath='/values/'+encodeURIComponent(tab+'!A1:R1');
  const header=await json(base+headerPath);
  const existing=await json(base+'/values/'+encodeURIComponent(tab+'!A2:R'));
  fail(!existing.values?.some(row=>row.some(value=>value!=='')),'SETUP_REGISTER_NOT_EMPTY',503);
  if(!header.values?.some(row=>row.some(value=>value!=='')))await json(base+headerPath+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[REGISTER_HEADERS]})});
  // Expand only. Never shrink an existing grid or move application-managed rows.
  const rowCount=Math.max(10000,properties.gridProperties.rowCount),sheetId=properties.sheetId;
  await json(base+':batchUpdate',{method:'POST',body:JSON.stringify({requests:[
   {updateSheetProperties:{properties:{sheetId,gridProperties:{rowCount,frozenRowCount:1}},fields:'gridProperties.rowCount,gridProperties.frozenRowCount'}},
   {repeatCell:{range:{sheetId,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:18},cell:{userEnteredFormat:{backgroundColor:{red:0.09,green:0.19,blue:0.3},textFormat:{bold:true,foregroundColor:{red:1,green:1,blue:1}},wrapStrategy:'WRAP'}},fields:'userEnteredFormat'}},
   {updateDimensionProperties:{range:{sheetId,dimension:'COLUMNS',startIndex:0,endIndex:18},properties:{pixelSize:180},fields:'pixelSize'}}
  ]})});
  const sheets=new GoogleSheetsRegister({token,drive,spreadsheetId:registerId,sheetId});
  const verified=await sheets.check();fail(verified.rowCount>=10000,'SETUP_REGISTER_CAPACITY',503);
  const result={preparedAt:new Date().toISOString(),year:POLICY.year,rootFolderId:root,folderMap,spreadsheetId:registerId,sheetId,
   permissionsOwnerOnly:true,assignmentCount:Object.keys(folderMap).length,registerEmpty:true,registerCapacity:verified.rowCount-1,intakeEnabled:false,
   folderUrl:'https://drive.google.com/drive/folders/'+root,registerUrl:'https://docs.google.com/spreadsheets/d/'+registerId+'/edit'};
  await fs.writeFile(path.join(PRIVATE,'coursework-destinations.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  return {assignmentCount:result.assignmentCount,registerEmpty:true,permissionsOwnerOnly:true,intakeEnabled:false,folderUrl:result.folderUrl,registerUrl:result.registerUrl};
 }finally{await fs.unlink(lock);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))prepareDestinations().then(result=>console.log(JSON.stringify(result))).catch(error=>{
 const code=error.code==='EEXIST'?'SETUP_ALREADY_RUNNING':/^(SETUP_|STORAGE_|REGISTER_|PROVIDER_)[A-Z0-9_]+$/.test(error.code||'')?error.code:'DESTINATION_SETUP_FAILED';
 console.error(JSON.stringify({status:'failed',code}));process.exitCode=1;
});
