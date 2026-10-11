/** Explicit, one-message owner delivery check. Requires --send-test-email. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {UserToken,GmailSender} from '../server/submissions/adapters.mjs';
import {fail} from '../server/submissions/security.mjs';

const PRIVATE=path.join(os.homedir(),'Library/Application Support/SERI Teaching Submissions');
const OWNER='maor.shani@gmail.com';
export const TEST_MESSAGE={to:OWNER,subject:'SERI Lab: submission system test',text:'This is a synthetic delivery test for the SERI Lab teaching submission system.\n\nThe backend is checking its Gmail connection. Student submissions remain closed.\n\nSERI Lab'};
export async function checkMail(){
 const credential=JSON.parse(await fs.readFile(path.join(PRIVATE,'google-oauth.json'),'utf8'));
 fail(credential.projectId==='seri-teaching-submissions'&&credential.ownerEmail===OWNER,'CHECK_ACCOUNT_MISMATCH',503);
 fail(((await fs.stat(PRIVATE)).mode&0o777)===0o700,'CHECK_PRIVATE_DIRECTORY',503);
 const filename=path.join(PRIVATE,'mail-integration-check.json');
 const record={status:'attempt-started',startedAt:new Date().toISOString(),messageId:'seri-test-'+randomBytes(18).toString('hex'),to:OWNER,subject:TEST_MESSAGE.subject};
 // A prior attempt, including an uncertain provider response, must be reviewed before resending.
 await fs.writeFile(filename,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});
 const sender=new GmailSender({token:new UserToken(credential),from:OWNER,replyTo:'maorsha@ariel.ac.il'});
 await sender.send({...TEST_MESSAGE,id:record.messageId});
 record.status='accepted-by-gmail';record.acceptedAt=new Date().toISOString();
 await fs.writeFile(filename,JSON.stringify(record,null,2)+'\n',{mode:0o600});
 return {status:record.status,to:OWNER,subject:record.subject,emailCount:1,intakeEnabled:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3||process.argv[2]!=='--send-test-email'){
  console.error('Explicit owner authorization is required before running with --send-test-email.');process.exitCode=1;
 }else checkMail().then(value=>console.log(JSON.stringify(value))).catch(error=>{
  const code=error.code==='EEXIST'?'PRIOR_MAIL_ATTEMPT_REQUIRES_REVIEW':/^(CHECK_|PROVIDER_|EMAIL_)[A-Z0-9_]+$/.test(error.code||'')?error.code:'MAIL_CHECK_FAILED';
  console.error(JSON.stringify({status:'failed',code}));process.exitCode=1;
 });
}
