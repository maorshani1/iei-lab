/** Dependency-free structural tests. Browser smoke tests are documented separately. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
assert.ok(fs.existsSync(out),'Run npm run build first.');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const htmlFiles=walk(out).filter(f=>f.endsWith('.html')),issues=[];
let refs=0;
for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8'),relative=path.relative(out,file);
 const check=(ok,message)=>{if(!ok)issues.push(`${relative}: ${message}`);};
 check((html.match(/<h1\b/g)||[]).length===1,'Expected one H1');
 check(/<html[^>]*lang="en"/.test(html),'Missing page language');
 check(/<title>[^<]+<\/title>/.test(html),'Missing title');
 check(/<main\b[^>]*id="main"/.test(html),'Missing main landmark / skip-link target');
 check(!/drive\.google\.com|docs\.google\.com|AIza[0-9A-Za-z_-]{30}|-----BEGIN .*PRIVATE KEY/.test(html),'Unexpected private-source link or secret');
 check(!/\b\d{9}\b/.test(html),'Unexpected nine-digit identifier: inspect for private data');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 check(ids.length===new Set(ids).size,'Duplicate element IDs');
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const ref=m[1].replace(/&amp;/g,'&');if(/^(?:https?:|mailto:|data:|blob:)/.test(ref))continue;
  const [pathname,fragment]=ref.split('#');
  const target=pathname?(pathname.startsWith('/')?path.join(out,pathname):path.resolve(path.dirname(file),pathname)):file;
  refs++;
  check(target.startsWith(out+path.sep)||target===out,'Link outside build directory: '+ref);
  check(fs.existsSync(target),'Broken local reference: '+ref);
  if(fragment&&fs.existsSync(target)&&target.endsWith('.html')){
   const targetText=target===file?html:fs.readFileSync(target,'utf8');
   check(targetText.includes(`id="${fragment}"`),'Missing fragment target: '+ref);
  }
 }
}
execFileSync(process.execPath,['--check',path.join(root,'site/assets/app.js')]);
execFileSync(process.execPath,['--check',path.join(root,'site/assets/forms.js')]);
execFileSync(process.execPath,['--check',path.join(root,'scripts/build.mjs')]);
execFileSync(process.execPath,['--check',path.join(root,'site/assets/results.js')]);
execFileSync(process.execPath,['--check',path.join(root,'scripts/results-template.mjs')]);
assert.equal(htmlFiles.length,32,'Unexpected page count');
for(const name of ['site','publications','people','theses','projects','posts','fellowships','explorer','images','forms'])JSON.parse(fs.readFileSync(path.join(root,'site/content',name+'.json'),'utf8'));
assert.ok(fs.existsSync(path.join(out,'assets/social-card.png')),'Social preview image missing');
assert.ok(fs.existsSync(path.join(out,'feed.xml')),'RSS feed missing');
assert.ok(fs.existsSync(path.join(out,'sitemap.xml')),'Sitemap missing');
const review=fs.readFileSync(path.join(out,'robots.txt'),'utf8').includes('Disallow: /');
for(const file of htmlFiles){const h=fs.readFileSync(file,'utf8');if(review)assert.ok(h.includes('noindex'),'Review page unexpectedly indexable');}
fs.mkdirSync(path.join(root,'review'),{recursive:true});
fs.writeFileSync(path.join(root,'review/structural-tests.json'),JSON.stringify({date:'2026-09-08',mode:review?'review':'production',htmlPages:htmlFiles.length,localReferencesChecked:refs,issues},null,2));
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log(`PASS: ${htmlFiles.length} pages; ${refs} local links/assets; unique IDs; JSON; JS syntax; review indexing; no private source links.`);
