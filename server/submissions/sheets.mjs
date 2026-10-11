/** Google Sheets adapter. Uses drive.file; all identifiers are server settings. */
import {fail,PortalError} from './security.mjs';
import {REGISTER_HEADERS,REGISTER_LAST_COLUMN} from './register.mjs';

export class GoogleSheetsRegister {
 constructor({token,drive,spreadsheetId,sheetId}){
  fail(/^[A-Za-z0-9_-]{10,120}$/.test(spreadsheetId||'')&&/^\d{1,10}$/.test(String(sheetId))&&Number(sheetId)<=2147483647,'REGISTER_CONFIGURATION_ERROR',503);
  Object.assign(this,{token,drive,spreadsheetId,sheetId:Number(sheetId)});
  this.target=`${spreadsheetId}:${this.sheetId}`;
  this.base=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
 }
 async request(suffix,options={}){
  const response=await fetch(this.base+suffix,{...options,headers:{Authorization:'Bearer '+await this.token.get(),'Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(10_000)});
  if(!response.ok)throw new PortalError('REGISTER_UNAVAILABLE',503);
  return response.json();
 }
 async check(){
  const file=await this.drive.info(this.spreadsheetId);
  fail(!file.trashed&&file.mimeType==='application/vnd.google-apps.spreadsheet'&&file.owners?.length===1&&file.owners[0].emailAddress?.toLowerCase()===this.drive.ownerEmail,'STORAGE_NOT_PRIVATE',503);
  await this.drive.privateOnly(this.spreadsheetId);
  // A separate app-authorized spreadsheet is required, with an explicit purpose marker.
  fail(file.appProperties?.seriRegister==='v1','REGISTER_CONFIGURATION_ERROR',503);
  const metadata=await this.request('?fields=sheets(properties)');
  const sheet=metadata.sheets?.find(x=>x.properties.sheetId===this.sheetId)?.properties;
  fail(sheet&&sheet.sheetType==='GRID'&&sheet.gridProperties.columnCount>=REGISTER_HEADERS.length,'REGISTER_SCHEMA_CHANGED',503);
  const tab="'"+sheet.title.replaceAll("'","''")+"'";
  const header=await this.request('/values/'+encodeURIComponent(`${tab}!A1:${REGISTER_LAST_COLUMN}1`));
  fail(JSON.stringify(header.values?.[0])===JSON.stringify(REGISTER_HEADERS),'REGISTER_SCHEMA_CHANGED',503);
  return {tab,rowCount:sheet.gridProperties.rowCount};
 }
 async writeRow(row,values){
  fail(Number.isSafeInteger(row)&&row>=2&&values.length===REGISTER_HEADERS.length&&values.every(v=>typeof v==='string'),'REGISTER_RECORD_INVALID',503);
  const {tab,rowCount}=await this.check();
  // Capacity is provisioned explicitly. A retry must never shrink a concurrently expanded grid.
  fail(row<=rowCount,'REGISTER_CAPACITY',503);
  const range=`${tab}!A${row}:${REGISTER_LAST_COLUMN}${row}`;
  const suffix='/values/'+encodeURIComponent(range);
  const existing=await this.request(suffix);
  const current=existing.values?.[0]||[];
  fail(!current.some(v=>v!=='')||current[0]===values[0],'REGISTER_ROW_CONFLICT',503);
  // RAW preserves leading zeros and stores formula-like names as literal text.
  const result=await this.request(suffix+'?valueInputOption=RAW&includeValuesInResponse=true',{method:'PUT',body:JSON.stringify({range,majorDimension:'ROWS',values:[values]})});
  const actual=result.updatedData?.values?.[0]||[];
  fail(result.updatedRows===1&&actual.length<=values.length&&values.every((v,i)=>(actual[i]??'')===v),'REGISTER_WRITE_UNCONFIRMED',503);
 }
}
