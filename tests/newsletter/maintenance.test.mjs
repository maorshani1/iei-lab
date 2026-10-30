import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewsletterMaintenance} from '../../api/newsletter-maintenance.js';
const env={VERCEL_ENV:'production',CRON_SECRET:'x'.repeat(40)};
const req={method:'GET',headers:{authorization:'Bearer '+env.CRON_SECRET}};
async function call(h,r=req){const headers={};let body;const res={setHeader:(k,v)=>headers[k]=v,end:s=>body=JSON.parse(s)};await h(r,res);return {status:res.statusCode,body,headers};}
test('cleanup requires production and current cron authentication before opening storage',async()=>{
 let touched=0;const createStore=()=>{touched++;};
 for(const [patch,request] of [[{}, {...req,headers:{}}],[{VERCEL_ENV:'preview'},req],[{CRON_SECRET:''},req]]){
  assert.equal((await call(createNewsletterMaintenance({env:{...env,...patch},createStore}),request)).status,404);
 }
 assert.equal(touched,0);
});
test('cleanup is restricted to the newsletter collection and bounded to 1000 records',async()=>{
 let count=0;const createStore=()=>({collection:'seri_newsletter_limits'});
 const h=createNewsletterMaintenance({env,createStore,cleanup:async s=>{assert.equal(s.collection,'seri_newsletter_limits');count++;return {deleted:200};}});
 assert.deepEqual((await call(h)).body,{deleted:1000,morePossible:true});assert.equal(count,5);
 count=0;const wrong=createNewsletterMaintenance({env,createStore:()=>({collection:'seri_submissions'}),cleanup:async()=>{count++;}});
 assert.equal((await call(wrong)).status,503);assert.equal(count,0);
});
test('cleanup stops when caught up and returns no private exception details',async()=>{
 let count=0;const createStore=()=>({collection:'seri_newsletter_limits'});
 const h=createNewsletterMaintenance({env,createStore,cleanup:async()=>{count++;return {deleted:2};}});
 assert.deepEqual((await call(h)).body,{deleted:2,morePossible:false});assert.equal(count,1);
 const broken=createNewsletterMaintenance({env,createStore,cleanup:async()=>{throw Error('private data');}});
 const result=await call(broken);assert.equal(result.status,503);assert.equal(JSON.stringify(result).includes('private data'),false);
});
