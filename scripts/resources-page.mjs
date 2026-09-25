/** Render the external research directory using the site's existing local filters. */
export function resourcesPage({page,intro,H,E,ext,button,resources}) {
  const categories = new Map(resources.categories.map(c => [c.id, c.label]));
  const records = resources.entries.map(r => {
    if (!categories.has(r.category)) throw new Error(`Unknown resource category: ${r.category}`);
    for (const link of [r.url, r.sourceUrl]) {
      if (new URL(link).protocol !== 'https:') throw new Error(`Resource must use HTTPS: ${r.id}`);
    }
    return `<article class="archive-record" id="${E(r.id)}" data-filter-item data-topic="${E(r.category)}" data-search="${E([r.name,r.institution,r.location,categories.get(r.category),r.description,...r.topics].join(' '))}">
      <div class="archive-meta">${E(categories.get(r.category))} · ${E(r.location)}</div>
      <h3>${ext(r.url,E(r.name))}</h3>
      <p class="small"><strong>${E(r.institution)}</strong></p>
      <p>${E(r.description)}</p>
      <p class="small muted">Topics: ${E(r.topics.join(' · '))}</p>
    </article>`;
  }).join('');
  page('resources','Related labs and research centres',
    'Useful links to antisemitism institutes and research groups working on Jewish life, intergroup relations, social identity and wellbeing.',
    () => `${intro('Useful links','Related labs and research centres','A selection of external research groups, institutes and projects relevant to the work of SERI Lab.')}
    <section class="container" style="padding-bottom:65px">
      <p class="lead" style="max-width:850px">Find research publications, survey reports, teaching resources and academic events on antisemitism and related areas of psychology.</p>
      <p class="small muted" style="max-width:850px">Organisations are listed for their topical relevance. Inclusion does not imply a formal partnership or endorsement of every publication or position. Descriptions are based on the organisations’ own websites.</p>
      <div data-filter-scope data-record-label="research resources">
        <div class="filter-panel">
          <div class="control grow"><label for="resources-query">Search the directory</label><input id="resources-query" type="search" data-filter-search placeholder="e.g., antisemitism, Germany, hope, or health"></div>
          <div class="control"><label for="resources-area">Research area</label><select id="resources-area" data-filter-topic><option value="">All research areas</option>${resources.categories.map(c=>`<option value="${E(c.id)}">${E(c.label)}</option>`).join('')}</select></div>
          <button class="ghost-button" data-reset-filters>Reset</button>
        </div>
        <p data-filter-count class="small" aria-live="polite"></p>
        ${records}
        <p data-empty hidden>No resources match this selection. Try another topic or reset the filters.</p>
      </div>
      <p class="small muted" style="margin-top:35px">Directory reviewed 25 September 2026. External websites are maintained by their respective organisations and open in a new tab.</p>
      <div class="actions">${button('contact','Suggest a resource or report a broken link',true)}<a class="text-link" href="${H('research')}">SERI Lab research →</a></div>
    </section>`,{category:'Research resources'});
}
