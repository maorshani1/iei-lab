/** Local owner authorization. Never imported into the deployed application. */
import http from 'node:http';
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {execFile} from 'node:child_process';

export const REDIRECT_URI='http://127.0.0.1:8765/oauth2/callback';
export const SCOPES=['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/gmail.send'];
const OWNER='maor.shani@gmail.com',PROJECT='seri-teaching-submissions';
const TOKEN_URL='https://oauth2.googleapis.com/token';
const COOKIE='seri_oauth_setup';
const same=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
function requireValue(condition,code){if(!condition){const e=new Error(code);e.code=code;throw e;}}
export function validateClient(data){
 const client=data.web;
 requireValue(client&&client.project_id===PROJECT&&client.redirect_uris?.includes(REDIRECT_URI)&&typeof client.client_id==='string'&&typeof client.client_secret==='string'&&client.client_secret.length>0,'CLIENT_CONFIGURATION_INVALID');
 return client;
}
export async function saveCredential(file,credential){
 const directory=path.dirname(file);
 await fs.mkdir(directory,{recursive:true,mode:0o700});
 requireValue(await fs.realpath(directory)===directory,'CREDENTIAL_DIRECTORY_INVALID');
 const info=await fs.stat(directory);
 requireValue(info.uid===process.getuid()&&(info.mode&0o077)===0,'CREDENTIAL_DIRECTORY_NOT_PRIVATE');
 const handle=await fs.open(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{await handle.writeFile(JSON.stringify(credential,null,2)+'\n');await handle.sync();}finally{await handle.close();}
}

export function createAuthorizationFlow({client,save,request=fetch,onResult=()=>{}}){
 const state=randomBytes(32).toString('base64url'),binding=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url');
 const authorization=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 authorization.search=new URLSearchParams({client_id:client.client_id,redirect_uri:REDIRECT_URI,response_type:'code',scope:SCOPES.join(' '),
  access_type:'offline',prompt:'consent',include_granted_scopes:'false',login_hint:OWNER,state,
  code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 let started=false,consumed=false,status='waiting',failure=null;
 const finish=(next,code=null)=>{status=next;failure=code;onResult({status,code});};
 async function json(url,options){
  const result=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(20_000)});
  requireValue(result.ok,'GOOGLE_REQUEST_FAILED');return result.json();
 }
 const token=body=>json(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
 function checkScopes(value){
  const scopes=String(value||'').split(/\s+/).filter(Boolean);
  requireValue(scopes.length===SCOPES.length&&SCOPES.every(scope=>scopes.includes(scope)),'GOOGLE_SCOPE_MISMATCH');return scopes;
 }
 const handler=async(req,res)=>{
  for(const [key,value]of Object.entries({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff','Content-Type':'text/html; charset=utf-8'}))res.setHeader(key,value);
  const page=(code,message)=>{res.statusCode=code;res.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>SERI Google setup</title><h1>SERI Google setup</h1><p>'+message+'</p></html>');};
  if(req.method!=='GET'||req.headers.host!=='127.0.0.1:8765'||(req.url||'').length>8192)return page(400,'Invalid setup request.');
  const url=new URL(req.url,'http://127.0.0.1:8765');
  if(url.pathname==='/'){
   if(status!=='waiting'||consumed)return page(200,'This setup attempt has finished. Return to the chat.');
   if(req.headers['sec-fetch-site']==='cross-site')return page(403,'Open the setup directly on this Mac.');
   started=true;res.setHeader('Set-Cookie',`${COOKIE}=${binding}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1200`);
   res.statusCode=303;res.setHeader('Location',authorization.href);res.end();return;
  }
  if(url.pathname==='/result'){
   return page(status==='authorized'?200:400,status==='authorized'?'Google authorization was saved privately on this Mac. Drive account access and token renewal were verified. No email was sent. You can return to the chat.':'Google authorization was not completed. Return to the chat for the next step.');
  }
  if(url.pathname!=='/oauth2/callback')return page(404,'Not found.');
  const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!started||consumed||url.searchParams.getAll('state').length!==1||!same(url.searchParams.get('state'),state)||!same(cookie,binding))return page(400,'This authorization attempt could not be matched to the local setup. Return to the chat.');
  consumed=true;
  try{
   requireValue(!url.searchParams.has('error'),'GOOGLE_CONSENT_NOT_GRANTED');
   requireValue(url.searchParams.getAll('code').length===1&&url.searchParams.get('code'),'GOOGLE_CODE_MISSING');
   const issued=await token({client_id:client.client_id,client_secret:client.client_secret,redirect_uri:REDIRECT_URI,grant_type:'authorization_code',code:url.searchParams.get('code'),code_verifier:verifier});
   const scopes=checkScopes(issued.scope);
   requireValue(typeof issued.refresh_token==='string'&&issued.refresh_token.length>0,'GOOGLE_REFRESH_TOKEN_MISSING');
   const renewed=await token({client_id:client.client_id,client_secret:client.client_secret,grant_type:'refresh_token',refresh_token:issued.refresh_token});
   requireValue(typeof renewed.access_token==='string'&&renewed.access_token.length>0,'GOOGLE_REFRESH_FAILED');
   if(renewed.scope!==undefined)checkScopes(renewed.scope);
   const about=await json('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',{headers:{Authorization:'Bearer '+renewed.access_token}});
   requireValue(about.user?.emailAddress?.toLowerCase()===OWNER,'GOOGLE_ACCOUNT_MISMATCH');
   await save({projectId:PROJECT,clientId:client.client_id,clientSecret:client.client_secret,refreshToken:issued.refresh_token,ownerEmail:OWNER,scopes,
    authorizedAt:new Date().toISOString(),consentStatus:'not-reported-by-token-endpoint',refreshTokenExpiresIn:issued.refresh_token_expires_in||null});
   finish('authorized');
  }catch(error){
   const code=/^(GOOGLE_|CREDENTIAL_)[A-Z_]+$/.test(error.code||'')?error.code:error.code==='EEXIST'?'CREDENTIAL_ALREADY_EXISTS':'AUTHORIZATION_FAILED';
   finish('failed',code);
  }
  res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.statusCode=303;res.setHeader('Location','/result');res.end();
 };
 return {handler,status:()=>({status,code:failure})};
}

async function main(){
 const args=process.argv.slice(2);
 requireValue(args.length===0||(args.length===1&&args[0]==='--stage-renewal'),'SETUP_ARGUMENT_INVALID');
 const stageRenewal=args.includes('--stage-renewal');
 const clientFile=path.join(os.homedir(),'Downloads/seri-google-client.json');
 const output=path.join(os.homedir(),'Library/Application Support/SERI Teaching Submissions',stageRenewal?'google-oauth-renewal.json':'google-oauth.json');
 try{await fs.access(output);throw Object.assign(new Error(),{code:'CREDENTIAL_ALREADY_EXISTS'});}catch(error){if(error.code!=='ENOENT')throw error;}
 const client=validateClient(JSON.parse(await fs.readFile(clientFile,'utf8')));
 const flow=createAuthorizationFlow({client,save:credential=>saveCredential(output,credential),onResult:result=>{
  console.log(JSON.stringify({component:'seri-google-authorization',...result}));
  // Allow the browser to load the clean result URL, then close the callback listener.
  setTimeout(()=>server.close(),15_000);
 }});
 const server=http.createServer((req,res)=>flow.handler(req,res).catch(()=>{res.statusCode=500;res.end('Setup failed. Return to the chat.');}));
 server.on('error',()=>{console.error(JSON.stringify({status:'failed',code:'LOCAL_LISTENER_UNAVAILABLE'}));process.exitCode=1;});
 server.listen(8765,'127.0.0.1',()=>{
  console.log(JSON.stringify({status:'waiting-for-owner-consent',clientValidated:true,stagedRenewal:stageRenewal,scopes:['drive.file','gmail.send']}));
  execFile('/usr/bin/open',['-a','Google Chrome','http://127.0.0.1:8765/'],error=>{if(error)console.log(JSON.stringify({status:'open-local-setup-in-browser',url:'http://127.0.0.1:8765/'}));});
 });
 const timeout=setTimeout(()=>{console.log(JSON.stringify({status:'expired'}));server.close();},20*60_000);
 timeout.unref();server.on('close',()=>clearTimeout(timeout));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
 const known=['CREDENTIAL_ALREADY_EXISTS','CLIENT_CONFIGURATION_INVALID','SETUP_ARGUMENT_INVALID','ENOENT'];
 console.error(JSON.stringify({status:'failed',code:known.includes(error.code)?error.code:'SETUP_FAILED'}));process.exitCode=1;
});
