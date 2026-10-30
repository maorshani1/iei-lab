import test from 'node:test';
import assert from 'node:assert/strict';
import {Newsletter,newsletterConfig,makeNewsletterHandler,CONSENT_VERSION} from '../../server/newsletter/service.mjs';
import {verificationHandler} from '../../server/newsletter/verification.mjs';
const config={apiKey:'private-key-not-for-browser',listId:42,templateId:7,unsubscribeUrl:'https://example.sibforms.com/serve/test'};
const good={email:'reader@example.test',consent:true,consentVersion:CONSENT_VERSION,website:''};
function fixture(fetcher=async()=>({ok:true})){const map=new Map();let queue=Promise.resolve();const store={transaction(ids,fn){const p=queue.then(()=>{const changes=new Map();const v=fn({get:id=>structuredClone(map.get(id)),set:(id,v)=>changes.set(id,structuredClone(v))});for(const [id,val]of changes)map.set(id,val);return v;});queue=p.catch(()=>{});return p;}};const service=new Newsletter({config,store,secret:'a'.repeat(50),fetcher,now:()=>1793361600000});return {service,map};}
test('only confirmed DOI flow is requested; client cannot choose lists or redirect',async()=>{let call;const {service,map}=fixture(async(...x)=>{call=x;return {ok:true}});await service.subscribe({...good,listId:999,redirect:'https://bad.test'},'192.0.2.1');const body=JSON.parse(call[1].body);assert.equal(call[0],'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');assert.deepEqual(body.includeListIds,[42]);assert.equal(body.templateId,7);assert.equal(body.contactPixelTrackingConsent,false);assert.equal(body.redirectionUrl,'https://www.maorshani.com/newsletter/confirmed');assert.equal(body.attributes.SERI_CONSENT_VERSION,CONSENT_VERSION);assert.equal(JSON.stringify([...map]).includes(good.email),false);assert.equal(JSON.stringify([...map]).includes('192.0.2.1'),false);assert.equal(service.publicStatus().apiKey,undefined);});
test('consent, email validity, version and honeypot enforced before sending',async()=>{let sent=0;const {service}=fixture(async()=>{sent++;return{ok:true}});for(const input of [{...good,consent:false},{...good,email:'bad'},{...good,email:'a@example.test\r\nBcc:other@example.test'},{...good,website:'bot'},{...good,consentVersion:'old'},null])await assert.rejects(service.subscribe(input,'test'));assert.equal(sent,0);});
test('durable transaction enforces concurrent recipient limits',async()=>{let sent=0;const{service}=fixture(async()=>{sent++;return {ok:true}});const r=await Promise.allSettled(Array.from({length:8},()=>service.subscribe(good,'ip')));assert.equal(r.filter(x=>x.status==='fulfilled').length,3);assert.equal(sent,3);});
test('network and provider failures never produce successful signup',async()=>{for(const fn of [async()=>{throw Error('secret response')},async()=>({ok:false,status:401}),async()=>({ok:false,status:429})]){const{service}=fixture(fn);await assert.rejects(service.subscribe(good,'ip'),e=>['NEWSLETTER_UNAVAILABLE','RATE_LIMITED'].includes(e.code));}});
test('configuration closed for previews, missing integration verification or bad unsubscribe URL',()=>{assert.equal(newsletterConfig({}).enabled,false);assert.equal(newsletterConfig({NEWSLETTER_ENABLED:'true',VERCEL_ENV:'preview'}).enabled,false);const env={NEWSLETTER_ENABLED:'true',VERCEL_ENV:'production',BREVO_API_KEY:'x'.repeat(30),BREVO_NEWSLETTER_LIST_ID:'42',BREVO_NEWSLETTER_TEMPLATE_ID:'7',NEWSLETTER_CONFIG_VERIFIED:'true',NEWSLETTER_UNSUBSCRIBE_URL:config.unsubscribeUrl};assert.equal(newsletterConfig(env).enabled,true);for(const patch of [{NEWSLETTER_CONFIG_VERIFIED:'false'},{NEWSLETTER_UNSUBSCRIBE_URL:'https://sibforms.com.evil.test/'},{BREVO_NEWSLETTER_LIST_ID:'bad'}])assert.throws(()=>newsletterConfig({...env,...patch}));});
async function request(handler,req){const headers={};let body;const res={setHeader:(k,v)=>headers[k]=v,end:v=>body=JSON.parse(v)};await handler(req,res);return{status:res.statusCode,body,headers};}
const req={method:'POST',url:'/api/newsletter',headers:{origin:'https://www.maorshani.com','x-seri-newsletter':'1','sec-fetch-site':'same-origin','content-type':'application/json'},body:good};
test('HTTP: cross-origin requests rejected and no raw exception or credentials exposed',async()=>{const {service}=fixture();const handler=makeNewsletterHandler(()=>({enabled:true,newsletter:service}));assert.equal((await request(handler,req)).status,202);assert.equal((await request(handler,{...req,headers:{...req.headers,origin:'https://bad.test'}})).status,403);assert.equal((await request(handler,{...req,method:'DELETE'})).status,405);assert.equal((await request(handler,{...req,body:'x'.repeat(3000)})).status,413);const status=await request(handler,{method:'GET',url:'/api/newsletter',headers:{}});assert.equal(status.body.enabled,true);assert.equal(JSON.stringify(status).includes(config.apiKey),false);});
test('closed service returns an honest unavailable state',async()=>{const h=makeNewsletterHandler(()=>({enabled:false}));assert.deepEqual((await request(h,{method:'GET',headers:{}})).body,{enabled:false});assert.equal((await request(h,req)).status,503);});
const checkNow=1793361600000;
const checkEnv={VERCEL_ENV:'production',BREVO_API_KEY:'x'.repeat(32),BREVO_NEWSLETTER_LIST_ID:'42',BREVO_NEWSLETTER_TEMPLATE_ID:'7',NEWSLETTER_UNSUBSCRIBE_URL:config.unsubscribeUrl,NEWSLETTER_CHECK_TOKEN:'t'.repeat(48),NEWSLETTER_CHECK_EXPIRES:new Date(checkNow+3600000).toISOString(),NEWSLETTER_CHECK_RECIPIENT:'owner@example.test'};
const checkReq={method:'POST',headers:{authorization:'Bearer '+checkEnv.NEWSLETTER_CHECK_TOKEN}};
test('operator check remains closed without a current secret and on every preview',async()=>{
 let calls=0;
 for(const [patch,headers] of [[{VERCEL_ENV:'preview'},checkReq.headers],[{NEWSLETTER_CHECK_TOKEN:undefined},checkReq.headers],[{NEWSLETTER_CHECK_EXPIRES:new Date(checkNow-1).toISOString()},checkReq.headers],[{NEWSLETTER_CHECK_EXPIRES:new Date(checkNow+5*3600000).toISOString()},checkReq.headers],[{},{}],[{},{authorization:'Bearer '+'é'.repeat(48)}]]){
  const h=verificationHandler({env:{...checkEnv,...patch},now:()=>checkNow,create:()=>{calls++;throw Error('must not construct');}});
  assert.equal((await request(h,{...checkReq,headers})).status,404);
 }
 assert.equal(calls,0);assert.equal(newsletterConfig(checkEnv).enabled,false);
});
test('operator check permits only the server-selected recipient and rejects arbitrary inputs',async()=>{
 let calls=[];const h=verificationHandler({env:checkEnv,now:()=>checkNow,create:()=>({subscribe:async(input,ip)=>calls.push({input,ip})})});
 for(const body of [{email:'other@example.test'},{listId:99},'other'])assert.equal((await request(h,{...checkReq,body})).status,400);
 assert.equal((await request(h,{...checkReq,headers:{...checkReq.headers,'content-length':'10'}})).status,400);
 assert.equal((await request(h,{...checkReq,method:'DELETE'})).status,405);
 assert.equal((await request(h,checkReq)).status,202);assert.equal(calls.length,1);assert.equal(calls[0].input.email,checkEnv.NEWSLETTER_CHECK_RECIPIENT);
});
test('operator requests share durable recipient limits and expose no private errors',async()=>{
 const {service}=fixture();const h=verificationHandler({env:checkEnv,now:()=>checkNow,create:()=>service});
 for(let i=0;i<3;i++)assert.equal((await request(h,checkReq)).status,202);
 assert.equal((await request(h,checkReq)).status,429);
 const broken=verificationHandler({env:checkEnv,now:()=>checkNow,create:()=>{throw Error('private credentials');}});
 const result=await request(broken,checkReq);assert.equal(result.status,503);assert.ok(!JSON.stringify(result).includes('private credentials'));
});
test('read-only operator checks validate configuration without sending or exposing secrets',async()=>{
 let sent=0;const h=verificationHandler({env:checkEnv,now:()=>checkNow,create:()=>{sent++;},fetcher:async url=>({ok:true,json:async()=>url.includes('/lists/')?{id:42}:url.includes('/templates/')?{isActive:true,sender:{email:'lab@maorshani.com'},htmlContent:'<a href="{{ params.DOIurl }}">Confirm</a>'}:{attributes:['SERI_CONSENT_VERSION','SERI_SIGNUP_SOURCE','SERI_REQUESTED_AT'].map(name=>({name,type:'text'}))}})});
 const result=await request(h,{...checkReq,method:'GET'});assert.equal(result.status,200);assert.ok(Object.values(result.body).every(Boolean));assert.equal(sent,0);assert.ok(!JSON.stringify(result).includes(checkEnv.BREVO_API_KEY));
});
