import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createAuthorizationFlow,validateClient,saveCredential,SCOPES,REDIRECT_URI} from '../../scripts/submissions-google-authorize.mjs';

const client={project_id:'seri-teaching-submissions',client_id:'synthetic-client',client_secret:'synthetic-secret',redirect_uris:[REDIRECT_URI]};
function response(){return {statusCode:0,headers:{},setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(value=''){this.body=value;}};}
async function call(flow,url,headers={}){const res=response();await flow.handler({url,method:'GET',headers:{host:'127.0.0.1:8765',...headers}},res);return res;}
function fixture({scopes=SCOPES,account='maor.shani@gmail.com',refresh=true,saveFailure=false}={}){
 const calls=[],saved=[],results=[];
 const flow=createAuthorizationFlow({client,save:async x=>{if(saveFailure)throw Object.assign(new Error(),{code:'EEXIST'});saved.push(x);},onResult:x=>results.push(x),request:async(url,options)=>{
  calls.push({url,options});
  if(url.includes('/about?'))return Response.json({user:{emailAddress:account}});
  if(options.body.get('grant_type')==='authorization_code')return Response.json({access_token:'synthetic-access',...(refresh?{refresh_token:'synthetic-refresh'}:{}),scope:scopes.join(' ')});
  return Response.json({access_token:'synthetic-renewed',scope:SCOPES.join(' ')});
 }});
 return {flow,calls,saved,results};
}
async function start(f){const res=await call(f.flow,'/');const url=new URL(res.headers.location);return {state:url.searchParams.get('state'),cookie:res.headers['set-cookie'].split(';')[0],url};}
const callback=state=>'/oauth2/callback?state='+state+'&code=synthetic-code';

test('client configuration must match the approved project and exact local callback',()=>{
 assert.equal(validateClient({web:client}),client);
 for(const patch of [{project_id:'another-project'},{redirect_uris:['https://example.test']},{client_secret:''}])assert.throws(()=>validateClient({web:{...client,...patch}}),e=>e.code==='CLIENT_CONFIGURATION_INVALID');
});
test('owner flow requests exactly two scopes, offline access and PKCE',async()=>{
 const f=fixture(),{url,cookie}=await start(f);
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('scope'),SCOPES.join(' '));
 assert.equal(url.searchParams.get('access_type'),'offline');assert.equal(url.searchParams.get('include_granted_scopes'),'false');
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('code_challenge'));
 assert.ok(!url.href.includes('synthetic-secret'));assert.match(cookie,/^seri_oauth_setup=/);
});
test('successful flow verifies renewal and owner identity before saving',async()=>{
 const f=fixture(),{state,cookie}=await start(f),res=await call(f.flow,callback(state),{cookie});
 assert.equal(f.saved.length,1);assert.equal(f.saved[0].refreshToken,'synthetic-refresh');assert.equal(f.calls.length,3);
 assert.equal(f.calls[1].options.body.get('grant_type'),'refresh_token');assert.equal(f.calls[2].options.headers.Authorization,'Bearer synthetic-renewed');
 assert.equal(res.headers.location,'/result');assert.deepEqual(f.results,[{status:'authorized',code:null}]);
 const page=await call(f.flow,'/result');assert.equal(page.statusCode,200);
 assert.ok(!JSON.stringify(f.results).includes('synthetic-secret'));assert.ok(!page.body.includes('synthetic-refresh'));
});
test('wrong state or missing browser cookie cannot exchange a code',async()=>{
 const f=fixture(),{state,cookie}=await start(f);
 assert.equal((await call(f.flow,callback('wrong'),{cookie})).statusCode,400);
 assert.equal((await call(f.flow,callback(state))).statusCode,400);
 assert.equal(f.calls.length,0);assert.equal(f.saved.length,0);
});
test('a consumed authorization code cannot be replayed',async()=>{
 const f=fixture(),{state,cookie}=await start(f);await call(f.flow,callback(state),{cookie});
 assert.equal((await call(f.flow,callback(state),{cookie})).statusCode,400);assert.equal(f.calls.length,3);
});
test('foreign Host headers and cross-site launches are rejected',async()=>{
 const f=fixture();assert.equal((await call(f.flow,'/',{host:'attacker.example'})).statusCode,400);
 assert.equal((await call(f.flow,'/',{'sec-fetch-site':'cross-site'})).statusCode,403);assert.equal(f.calls.length,0);
});
for(const [name,options,code]of [
 ['wrong Google account',{account:'other@example.test'},'GOOGLE_ACCOUNT_MISMATCH'],
 ['broader scope',{scopes:[...SCOPES,'https://www.googleapis.com/auth/drive']},'GOOGLE_SCOPE_MISMATCH'],
 ['missing scope',{scopes:[SCOPES[0]]},'GOOGLE_SCOPE_MISMATCH'],
 ['missing refresh token',{refresh:false},'GOOGLE_REFRESH_TOKEN_MISSING'],
 ['existing credential file',{saveFailure:true},'CREDENTIAL_ALREADY_EXISTS']
])test(`authorization refuses ${name}`,async()=>{
 const f=fixture(options),{state,cookie}=await start(f);await call(f.flow,callback(state),{cookie});
 assert.equal(f.saved.length,0);assert.deepEqual(f.results,[{status:'failed',code}]);
});
test('denied consent does not contact the token endpoint or expose provider text',async()=>{
 const f=fixture(),{state,cookie}=await start(f);
 const res=await call(f.flow,`/oauth2/callback?state=${state}&error=access_denied&error_description=private-provider-text`,{cookie});
 assert.equal(f.calls.length,0);assert.equal(res.headers.location,'/result');
 assert.deepEqual(f.results,[{status:'failed',code:'GOOGLE_CONSENT_NOT_GRANTED'}]);
});
test('credentials are saved with private permissions and never overwritten',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seri-oauth-test-'));
 try{
  const file=path.join(await fs.realpath(dir),'private','google.json');await saveCredential(file,{synthetic:true});
  assert.equal((await fs.stat(file)).mode&0o777,0o600);assert.equal((await fs.stat(path.dirname(file))).mode&0o777,0o700);
  await assert.rejects(()=>saveCredential(file,{synthetic:false}),e=>e.code==='EEXIST');
  assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),{synthetic:true});
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
