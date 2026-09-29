/** Presentation regression tests, run in both review and production builds. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const read=p=>fs.readFileSync(path.join(out,p),'utf8');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const pages=walk(out).filter(p=>p.endsWith('.html'));
assert.equal(pages.length,40);
for(const p of pages){const h=fs.readFileSync(p,'utf8');assert.ok(h.includes('data-design="elegant"'),p);assert.ok(h.includes('assets/elegant.css')&&h.includes('assets/elegant.js'));assert.equal((h.match(/id="main-nav"/g)||[]).length,1);assert.ok(h.includes('>Useful links</a>'));assert.ok(h.includes('data-open-search'));}
const home=read('index.html');assert.ok(home.includes('class="ser-hero container"'));assert.ok(home.includes('campus-library.jpg'));assert.ok(home.includes('visiting scholar at '));
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const d=JSON.parse(fs.readFileSync(path.join(root,'site/content/data-explorer.json'),'utf8')).find(d=>d.id==='germany-published');
for(const p of ['index.html','projects/antisemitism-health.html']){
 const h=read(p),s=JSON.parse(decode(h.match(/data-series="([^"]+)"/)[1]));
 for(const i of [3,4,5])for(let k=0;k<4;k++){const v=d.groups[0].pairs[`${i}|${k+6}`];assert.deepEqual(s[i].values[k],[v.pearson,...v.ci]);}
 assert.equal((h.match(/data-ser-chart\b/g)||[]).length,1);assert.ok(h.includes('View values in a table'));assert.ok(h.includes('Correlations do not establish causation'));
}
for(const p of JSON.parse(fs.readFileSync(path.join(root,'site/content/projects.json'),'utf8'))){const h=read('projects/'+p.id+'.html');assert.ok(h.includes('aria-label="On this page"'));assert.ok(h.includes('id="overview"'));for(const id of p.outputs)assert.ok(h.includes(`data-bib="${id}"`));}
for(const p of ['contact.html','participate.html']){const h=read(p);assert.ok(h.includes('<form '));assert.ok(h.includes('inquiry-fields'));assert.ok(h.includes('form-privacy'));}
console.log('PASS: elegant layout on 40 pages; all 12 chart estimates and intervals match the source; publication actions and inquiry forms retained.');
