import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'site/assets/analytics.js'),'utf8');
function run({url='https://www.maorshani.com/research?email=private@example.test#secret',canonical='https://www.maorshani.com/research',mode='production',navigator={},duplicate=false}={}){
  const scripts=[],window={};
  const document={body:{dataset:{mode}},head:{appendChild:s=>scripts.push(s)},querySelector:selector=>selector.includes('canonical')?(canonical?{href:canonical}:null):(duplicate?{}:null),createElement:()=>({setAttribute(){}})};
  vm.runInNewContext(source,{window,document,navigator,location:new URL(url),URL,Set});
  return {scripts,beforeSend:window.vaq?.[0]?.[1]};
}
const live=run();assert.equal(live.scripts.length,1);assert.equal(live.scripts[0].src,'/_vercel/insights/script.js');
assert.equal(live.beforeSend({type:'pageview',url:'https://www.maorshani.com/research?email=private@example.test#secret'}).url,'https://www.maorshani.com/research');
assert.equal(live.beforeSend({type:'pageview',url:'https://maorshani.com/research.html?token=secret'}).url,'https://www.maorshani.com/research');
assert.equal(live.beforeSend({type:'event',url:'https://www.maorshani.com/research',payload:{name:'identify',data:{email:'private@example.test'}}}),null);
for(const url of ['https://other.example/research','https://www.maorshani.com/teaching/submissions','https://www.maorshani.com/api/submissions','https://www.maorshani.com/admin','https://www.maorshani.com/unknown','not a URL'])assert.equal(live.beforeSend({type:'pageview',url}),null);
for(const route of ['/teaching/submissions','/teaching/submissions.html','/teaching/submissions/receipt','/submissions-info','/submissions-privacy','/api/submissions','/admin','/404'])assert.equal(run({url:'https://www.maorshani.com'+route,canonical:'https://www.maorshani.com'+route}).scripts.length,0,route);
for(const options of [{mode:'review'},{url:'http://localhost:4173/research'},{url:'https://preview.vercel.app/research'},{navigator:{doNotTrack:'1'}},{navigator:{globalPrivacyControl:true}},{canonical:null},{canonical:'https://other.example/research'},{duplicate:true}])assert.equal(run(options).scripts.length,0,JSON.stringify(options));
assert.equal(run({url:'https://www.maorshani.com/index.html',canonical:'https://www.maorshani.com/'}).scripts.length,1);
const out=path.join(root,'dist');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let included=0,excluded=0;
for(const file of walk(out).filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8'),rel=path.relative(out,file).replaceAll(path.sep,'/');
  const privatePage=['404.html','teaching/submissions.html','submissions-info.html','submissions-privacy.html'].includes(rel);
  const expected=html.includes('data-mode="production"')&&!privatePage;
  assert.equal((html.match(/data-seri-analytics\b/g)||[]).length,expected?1:0,rel);
  expected?included++:excluded++;
}
const privacy=fs.readFileSync(path.join(out,'privacy.html'),'utf8');
assert.ok(privacy.includes('Vercel Web Analytics')&&privacy.includes('query parameters'));
assert.ok(!privacy.includes('does not use advertising trackers, analytics scripts'));
console.log(`PASS: analytics URL redaction, private-page exclusions, production/host guards, browser privacy preferences, and ${included} included / ${excluded} excluded pages.`);
