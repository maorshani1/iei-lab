/** Add the submission area AFTER elegant-build finishes. Fail closed on shell drift. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {portalContent} from './submissions-page.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist'),teaching=path.join(out,'teaching.html');
assert.ok(fs.existsSync(teaching),'Build the existing site before adding the submissions page.');
let shell=fs.readFileSync(teaching,'utf8');assert.equal([...shell.matchAll(/<main id="main"[^>]*>[\s\S]*?<\/main>/g)].length,1,'Unexpected Teaching page shell.');
const cta='<section class="container ser-section" id="assignment-submissions"><p class="eyebrow">Teaching · 2026–27</p><h2>Assignment submissions / הגשת מטלות</h2><p>Submit coursework, retain a confirmation, or request an extension. / הגשת עבודות, שמירת אישורי הגשה ובקשות ארכה.</p><a class="button" href="./teaching/submissions.html">Open submission area / מעבר להגשה →</a></section>';
assert.ok(!shell.includes('id="assignment-submissions"'),'Submission link already exists; refusing a duplicate.');
fs.writeFileSync(teaching,shell.replace('</main>',cta+'</main>'));
let html=shell.replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/,`<main id="main" tabindex="-1">${portalContent()}</main>`)
 .replaceAll('href="./','href="../').replaceAll('src="./','src="../').replace('data-base="./"','data-base="../"')
 .replace(/data-page="[^"]*"/,'data-page="teaching/submissions"').replace(/<title>[\s\S]*?<\/title>/,'<title>Assignment submissions | SERI Lab</title>')
 .replace(/<link rel="canonical"[^>]*>/,'<link rel="canonical" href="https://www.maorshani.com/teaching/submissions">')
 .replace(/<meta name="robots"[^>]*>/g,'')
 .replace('</head>','<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="../assets/submissions.css"><script defer src="../assets/submissions.js"></script></head>');
assert.equal([...html.matchAll(/<h1\b/g)].length,1,'Expected one submission-page H1.');
assert.ok(!html.includes('__seriReviewTransport'),'Review transport must never enter the production HTML.');
fs.mkdirSync(path.join(out,'teaching'),{recursive:true});fs.writeFileSync(path.join(out,'teaching/submissions.html'),html);
console.log('Added the submission page. Live upload remains controlled by server-only activation gates.');
