/** A bounded design preview. Source content and service configuration are unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const pages = ['index', 'research', 'media'];
const groups = [
  ['Research', [['research', 'Research overview'], ['antisemitism', 'Antisemitism research'], ['blog', 'Research summaries'], ['data', 'Data explorer'], ['explore', 'Reported findings']]],
  ['Publications', 'publications'],
  ['People', [['people', 'Lab members'], ['about', 'About Maor'], ['supervision', 'Supervision'], ['join', 'Join the lab']]],
  ['Media', [['media', 'Media coverage'], ['conferences', 'Conferences & talks']]],
  ['Teaching', 'teaching'],
  ['Contact', [['contact', 'Contact the lab'], ['participate', 'Participate in research'], ['newsletter', 'Newsletter'], ['ask', 'Ask the lab'], ['resources', 'Useful links']]],
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const link = (slug, label, current) => `<a href="./${slug}.html"${slug === current ? ' aria-current="page"' : ''}>${escape(label)}</a>`;

function navigation(slug, brand, search) {
  const items = groups.map(([title, children], i) => typeof children === 'string'
    ? link(children, title, slug)
    : `<details class="academic-menu${children.some(([p]) => p === slug) ? ' academic-current' : ''}"><summary aria-controls="academic-menu-${i}">${title}<span aria-hidden="true" class="academic-chevron"></span></summary><ul id="academic-menu-${i}">${children.map(([p, label]) => `<li>${link(p, label, slug)}</li>`).join('')}</ul></details>`).join('');
  return `<header class="site-header academic-header"><div class="container academic-masthead">${brand}<p class="academic-affiliation">Social Experiences, Resilience, and Identity<br><span>Department of Psychology · Ariel University</span></p><div class="academic-tools">${search}<button class="academic-menu-toggle" aria-controls="main-nav" aria-expanded="false"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>Menu</span></button></div></div><div class="academic-nav-wrap"><nav id="main-nav" class="container academic-nav" aria-label="Main navigation">${items}</nav></div></header>`;
}

function sidebar(slug) {
  const research = slug === 'research';
  const title = research ? 'Research' : 'Media & public engagement';
  const sections = research
    ? [['research', 'Research overview'], ['antisemitism', 'Antisemitism research'], ['blog', 'Research summaries'], ['publications', 'Publications'], ['data', 'Data explorer'], ['explore', 'Reported findings'], ['supervision', 'Supervision']]
    : [['media', 'Media coverage'], ['conferences', 'Conferences & talks'], ['blog', 'Research summaries'], ['contact', 'Media & speaking inquiries']];
  return `<aside class="academic-sidebar"><button class="academic-section-toggle" aria-expanded="true" aria-controls="academic-section-links">${title}<span class="academic-chevron" aria-hidden="true"></span></button><nav id="academic-section-links" aria-label="${title}">${sections.map(([p, label]) => link(p, label, slug)).join('')}</nav><div class="academic-sidebar-note"><p>${research ? 'Interested in our work?' : 'From research to conversation'}</p><p>${research ? 'Explore opportunities for research and collaboration.' : 'Interviews, research coverage, and public discussions.'}</p>${link(research ? 'join' : 'contact', research ? 'Join the lab' : 'Get in touch', slug)}</div></aside>`;
}

export function applyAcademicPreview(out) {
  for (const slug of pages) {
    const file = path.join(out, slug + '.html');
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, 'Missing shared header: ' + slug);
    const brand = header.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0];
    const search = header.match(/<button class="icon-btn" data-open-search[\s\S]*?<\/button>/)?.[0];
    assert.ok(brand && search, 'Missing logo or search: ' + slug);
    html = html.replace(header, navigation(slug, brand, search));
    html = html.replace('<body ', '<body data-academic="true" ');
    html = html.replace('</head>', '<link rel="preload" href="./assets/fonts/SourceSans3-Regular.ttf.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="./assets/academic.css"><script defer src="./assets/academic.js"></script></head>');
    if (slug !== 'index') {
      let main = html.match(/<main id="main"[^>]*>([\s\S]*?)<\/main>/)?.[1];
      assert.ok(main, 'Missing main content: ' + slug);
      if (slug === 'media') {
        // Keep the campus photograph and attribution, but put the coverage first.
        const photo = main.match(/<figure class="[^"]*campus-wide[^"]*"[\s\S]*?<\/figure>/)?.[0];
        assert.ok(photo, 'Missing media campus photograph');
        main = main.replace(photo, '');
        main += `<div class="academic-campus">${photo}</div>`;
      }
      const title = slug === 'research' ? 'Research' : 'Media';
      html = html.replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/, `<main id="main" tabindex="-1"><div class="academic-breadcrumb-wrap"><nav class="container academic-breadcrumb" aria-label="Breadcrumb"><a href="./index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">${title}</span></nav></div><div class="container academic-layout">${sidebar(slug)}<div class="academic-content">${main}</div></div></main>`);
    }
    for (const form of original.matchAll(/<form\b[\s\S]*?<\/form>/g)) assert.ok(html.includes(form[0]), 'A form changed: ' + slug);
    for (const record of original.matchAll(/<article\b[\s\S]*?<\/article>/g)) assert.ok(html.includes(record[0]), 'A record changed: ' + slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    fs.writeFileSync(file, html);
  }
  console.log('Applied academic design preview to home, research, and media; forms and research records preserved.');
}
