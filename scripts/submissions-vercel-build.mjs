/** Additive test installation. Preserve the existing site's complete build and tests. */
import './vercel-build.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const originals=new Map(walk(out).filter(f=>f.endsWith('.html')).map(f=>[f,fs.readFileSync(f,'utf8')]));
await import('./submissions-build.mjs');
for(const [file,html] of originals)if(path.basename(file)!=='teaching.html')assert.equal(fs.readFileSync(file,'utf8'),html,'Existing page changed: '+path.basename(file));
const pages=walk(out).filter(f=>f.endsWith('.html'));assert.equal(pages.length,43);
for(const file of pages){const html=fs.readFileSync(file,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'Expected one page heading');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate element identifier');
 assert.ok(!/-----BEGIN .*PRIVATE KEY|GOOGLE_REFRESH_TOKEN|FIRESTORE_SERVICE_ACCOUNT_JSON|__seriReviewTransport/.test(html),'Private configuration or demo transport in output');
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){const ref=match[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:|blob:)/.test(ref))continue;
  const [pathname,fragment]=ref.split('#');const target=pathname?(pathname.startsWith('/')?path.join(out,pathname):path.resolve(path.dirname(file),pathname)):file;
  assert.ok(target.startsWith(out+path.sep)||target===out,'Reference escaped build directory');assert.ok(fs.existsSync(target),'Missing local reference: '+ref);
  if(fragment&&target.endsWith('.html'))assert.ok(fs.readFileSync(target,'utf8').includes(`id="${fragment}"`),'Missing fragment');
 }
}
const p=fs.readFileSync(path.join(out,'teaching/submissions.html'),'utf8');assert.ok(p.includes('noindex, nofollow'));
for(const dir of ['server/submissions','site/assets'])for(const file of fs.readdirSync(path.join(root,dir))){if((dir==='server/submissions'||file==='submissions.js')&&/\.(?:mjs|js)$/.test(file))execFileSync(process.execPath,['--check',path.join(root,dir,file)]);}
const tests=fs.readdirSync(path.join(root,'tests/submissions')).filter(f=>f.endsWith('.test.mjs')).map(f=>path.join(root,'tests/submissions',f));
execFileSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
console.log('PASS: original pages preserved; 43-page reference checks; assignment module tests. Intake remains disabled unless all server launch gates are met.');
