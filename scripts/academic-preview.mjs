/** Shared academic presentation. Source content and service configuration are unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const groups = [
  ['Research', [['research', 'Research overview'], ['antisemitism', 'Antisemitism research'], ['blog', 'Research summaries'], ['data', 'Data explorer'], ['explore', 'Reported findings']]],
  ['Publications', 'publications'],
  ['People', [['people', 'Lab members'], ['about', 'About Maor'], ['supervision', 'Supervision'], ['join', 'Join the lab']]],
  ['Media', [['media', 'Media coverage'], ['conferences', 'Conferences & talks']]],
  ['Teaching', 'teaching'],
  ['Contact', [['contact', 'Contact the lab'], ['participate', 'Participate in research'], ['newsletter', 'Newsletter'], ['ask', 'Ask the lab'], ['resources', 'Useful links']]],
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const link = (slug, label, current, base = './') => `<a href="${base}${slug}.html"${slug === current ? ' aria-current="page"' : current.startsWith(slug + '/') ? ' aria-current="location"' : ''}>${escape(label)}</a>`;
const externalIcon = '<svg class="academic-external-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3 11 13M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5"/></svg>';

export function styleAcademicLinks(html) {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (original, attributes, content) => {
    const href = attributes.match(/\bhref="([^"]+)"/)?.[1];
    if (!href || /<(?:img|svg)\b/.test(content)) return original;
    const label = content.replace(/\s*<span\b[^>]*aria-hidden="true"[^>]*>[→↗]<\/span>/g, '').replace(/\s*[→↗]\s*$/, '');
    const external = /^https?:\/\//.test(href) && !/^https?:\/\/(?:www\.)?maorshani\.com(?:[/:?#]|$)/.test(href);
    return `<a${attributes}>${external ? `<span class="academic-link-label">${label}</span>${externalIcon}` : label}</a>`;
  });
}

function navigation(slug, brand, search, base, newsletterVisible) {
  const teaching = slug === 'teaching' || slug.startsWith('teaching/') || slug.startsWith('submissions-');
  const active = p => p === slug || slug.startsWith(p + '/') || (p === 'research' && slug.startsWith('projects/'));
  const items = groups.map(([title, children], i) => typeof children === 'string'
    ? link(children, title, slug, base).replace(`>${title}</a>`, `><span class="academic-nav-label">${title}</span></a>`)
    : `<details class="academic-menu${children.some(([p]) => active(p)) ? ' academic-current' : ''}"><summary aria-controls="academic-menu-${i}"><span class="academic-nav-label">${title}</span><span aria-hidden="true" class="academic-chevron"></span></summary><ul id="academic-menu-${i}">${children.filter(([p]) => p !== 'newsletter' || (newsletterVisible && !teaching)).map(([p, label]) => `<li>${link(p, label, slug, base)}</li>`).join('')}</ul></details>`).join('');
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
  const files = walk(out).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const slug = path.relative(out, file).replaceAll(path.sep, '/').replace(/\.html$/, '');
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    const base = html.match(/data-base="([^"]+)"/)?.[1];
    assert.ok(base, 'Missing route base: ' + slug);
    const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, 'Missing shared header: ' + slug);
    const brand = header.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0];
    const search = header.match(/<button class="icon-btn" data-open-search[\s\S]*?<\/button>/)?.[0];
    assert.ok(brand && search, 'Missing logo or search: ' + slug);
    html = html.replace(header, navigation(slug, brand, search, base, header.includes('newsletter.html')));
    html = html.replace('<body ', '<body data-academic="true" ');
    html = html.replace('</head>', `<link rel="preload" href="${base}assets/fonts/SourceSans3-Regular.ttf.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${base}assets/academic.css"><script defer src="${base}assets/academic.js"></script></head>`);
    if (slug === 'research' || slug === 'media') {
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
    const originalHrefs = [...html.matchAll(/\bhref="([^"]*)"/g)].map(match => match[1]);
    html = html.replaceAll('<div class="table-wrap">', '<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable data table">');
    html = styleAcademicLinks(html);
    assert.deepEqual([...html.matchAll(/\bhref="([^"]*)"/g)].map(match => match[1]), originalHrefs, 'A link destination changed: ' + slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    fs.writeFileSync(file, html);
  }
  console.log(`Applied academic design to all ${files.length} pages; forms and research records preserved.`);
}
