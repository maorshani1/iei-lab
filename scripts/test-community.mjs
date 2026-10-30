import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,'dist',file),'utf8');
const ready=process.env.NEWSLETTER_ENABLED==='true'&&process.env.NEWSLETTER_CONFIG_VERIFIED==='true';
const home=read('index.html'),privacy=read('privacy.html'),signup=read('newsletter.html');
const search=read('assets/search-index.js'),sitemap=read('sitemap.xml');
const visible=ready||home.includes('data-mode="review"');
assert.equal(home.includes('newsletter.html'),visible,'Public signup invitation must follow the launch gate');
for(const file of ['index','research','contact','publications','antisemitism','people','about','supervision','join','blog']) {
 const html=read(file+'.html');
 assert.equal(html.includes('id="newsletter-form"'),visible,'Inline signup visibility: '+file);
 assert.equal((html.match(/id="newsletter-form"/g)||[]).length,visible?1:0,'One signup form per page: '+file);
}
for(const file of ['teaching.html','teaching/submissions.html','submissions-info.html','submissions-privacy.html']) {
 assert.ok(!read(file).includes('id="newsletter-form"'),'No newsletter form on coursework pages');
 assert.ok(!read(file).includes('href="./newsletter.html"')&&!read(file).includes('href="../newsletter.html"'),'No newsletter invitation on coursework pages');
}
assert.equal(search.includes('newsletter.html'),ready,'Closed signup must not appear in website search');
assert.equal(sitemap.includes('<loc>https://www.maorshani.com/newsletter</loc>'),ready);
assert.ok(!search.includes('newsletter/confirmed.html'),'Confirmation page is not a search result');
assert.ok(!sitemap.includes('/newsletter/confirmed'),'Confirmation page is not indexed');
assert.equal(privacy.includes('No newsletter addresses are being collected'),!ready);
assert.ok(signup.includes('<fieldset disabled>'),'Registration starts closed until the API confirms availability');
assert.ok(!signup.includes('data-seri-analytics'),'Subscription pages do not collect page analytics');
assert.ok(read('newsletter/confirmed.html').includes('noindex,nofollow'));
const consentScript=home.indexOf('assets/privacy.js'),analyticsScript=home.indexOf('assets/analytics.js');
assert.ok(consentScript>=0,'Privacy controls are available in every build');
if(home.includes('data-mode="production"')) {
  assert.ok(analyticsScript>consentScript,'Production loads consent before analytics');
} else {
  assert.ok(home.includes('data-mode="review"'),'Expected a production or review build');
  assert.equal(analyticsScript,-1,'Review builds do not include analytics');
}
assert.ok(home.includes('accessibility.html')&&home.includes('data-privacy-choices'));
assert.ok(read('accessibility.html').includes('maorsha@ariel.ac.il'));
console.log('PASS: public newsletter launch gate, confirmation privacy, consent order, and accessibility links.');
