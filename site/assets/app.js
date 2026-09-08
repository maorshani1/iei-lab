'use strict';
(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const base=document.body.dataset.base||'./';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let toastTimer;
  function toast(message){const t=$('.toast');if(!t)return;t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,4200);}
  async function copy(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);}else{const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.top='-9999px';document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw Error('copy');}toast('Copied to clipboard.');}catch{const dlg=document.createElement('dialog');dlg.className='search-dialog';const div=document.createElement('div');div.className='search-body';const p=document.createElement('p');p.textContent='Automatic copying is unavailable. Select and copy the text below.';const ta=document.createElement('textarea');ta.value=text;ta.rows=7;const b=document.createElement('button');b.textContent='Close';b.className='button secondary';b.addEventListener('click',()=>dlg.close());div.append(p,ta,b);dlg.append(div);document.body.append(dlg);dlg.addEventListener('close',()=>dlg.remove());dlg.showModal();ta.focus();ta.select();}}
  $$('[data-copy]').forEach(b=>b.addEventListener('click',()=>copy(b.dataset.copy)));
  const menu=$('.menu-toggle'), nav=$('#main-nav');
  function closeMenu(){nav?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation menu');}
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');nav?.classList.toggle('is-open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();document.querySelector('.search-dialog[open]')?.close();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  $$('a',nav||document.createElement('nav')).forEach(a=>a.addEventListener('click',closeMenu));
  // All filtering is local; no query is transmitted to a server.
  $$('[data-filter-scope]').forEach(scope=>{
    const items=$$('[data-filter-item]',scope), q=$('[data-filter-search]',scope), year=$('[data-filter-year]',scope), topic=$('[data-filter-topic]',scope);
    let buttonTopic='';
    function run(){const terms=normalize(q?.value).trim().split(/\s+/).filter(Boolean), selected=normalize(topic?.value||buttonTopic);let count=0;
      items.forEach(item=>{const ok=terms.every(t=>normalize(item.dataset.search).includes(t))&&(!year?.value||item.dataset.year===year.value)&&(!selected||normalize(item.dataset.topic).split('|').includes(selected));item.hidden=!ok;if(ok)count++;});
      const c=$('[data-filter-count]',scope);if(c)c.textContent=`${count} of ${items.length} ${scope.querySelector('.thesis-record')?'completed theses':scope.querySelector('.publication-row')?'publication records':scope.querySelector('.project-card')?'projects and programs':'research summaries'}`;
      const empty=$('[data-empty]',scope);if(empty)empty.hidden=count>0;
    }
    [q,year,topic].filter(Boolean).forEach(el=>el.addEventListener(el===q?'input':'change',run));
    $$('[data-topic-button]',scope).forEach(b=>b.addEventListener('click',()=>{buttonTopic=b.dataset.topicButton;$$('[data-topic-button]',scope).forEach(other=>other.setAttribute('aria-pressed',String(other===b)));run();}));
    $('[data-reset-filters]',scope)?.addEventListener('click',()=>{if(q)q.value='';if(year)year.value='';if(topic)topic.value='';buttonTopic='';run();q?.focus();});run();
  });
  // Native dialog supplies keyboard focus containment and Escape behavior.
  const dialog=$('.search-dialog'), search=$('#site-search'), results=$('#search-results'), count=$('#search-count');
  let searchOpener=null;
  function openSearch(opener){closeMenu();searchOpener=opener||document.activeElement;dialog.showModal();search.focus();}
  $$('[data-open-search]').forEach(b=>b.addEventListener('click',()=>openSearch(b)));
  $('[data-close-search]')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('close',()=>searchOpener?.focus());
  dialog?.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.open)dialog.close();else openSearch();}});
  search?.addEventListener('input',()=>{const terms=normalize(search.value).trim().split(/\s+/).filter(Boolean);results.replaceChildren();if(!terms.length){count.textContent='Enter a name, title, or topic. Press Escape to close.';return;}
    const found=(window.IEI_SEARCH||[]).filter(x=>terms.every(t=>normalize(x.title+' '+x.description).includes(t))).sort((a,b)=>Number(terms.every(t=>normalize(b.title).includes(t)))-Number(terms.every(t=>normalize(a.title).includes(t))));
    count.textContent=found.length?`${found.length} matches${found.length>10?'; showing the first 10':''}.`:'No results. Try a topic, surname, or a shorter search.';
    found.slice(0,10).forEach(item=>{const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small'),title=document.createElement('span');small.textContent=item.category;title.textContent=item.title;a.href=base+item.url;a.append(small,title);li.append(a);results.append(li);});
  });
  function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function csv(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');}
  function bibtex(p){const short=/…|\.\.\.|et al/i.test(p.authors);const normalized=p.authors.replace(/,?\s*&\s*/g,', ').trim();const names=normalized.split(/,\s+(?=[\p{L}][\p{L}\s'’\-]*,\s*[\p{Lu}]\.)/u);const author=Array.isArray(p.bibAuthors)?p.bibAuthors.join(' and '):(short?names[0]+' and others':names.join(' and '));const venue=p.type==='article'?p.venue.match(/^(.*?),\s*(\d+)(?:\(([^)]+)\))?(?:,\s*(.*))?$/):null;const fields=[`title = {${p.title}}`,`author = {${author}}`,`year = {${p.year}}`,`${p.type==='article'?'journal':'booktitle'} = {${venue?venue[1]:p.venue}}`];if(venue){fields.push(`volume = {${venue[2]}}`);if(venue[3])fields.push(`number = {${venue[3]}}`);if(venue[4])fields.push(`${/^[a-zA-Z]*\d{5,}$/.test(venue[4])?'eid':'pages'} = {${venue[4].replace(/[–—]/g,'--')}}`);}if(p.doi)fields.push(`doi = {${p.doi}}`);if(p.url)fields.push(`url = {${p.url}}`);if(short)fields.push('note = {Author list abbreviated in supplied record. Verify and replace using publisher metadata before submission.}');if(p.forthcoming)fields.push('pubstate = {forthcoming}');return `@${p.type==='article'?'article':p.type==='chapter'?'incollection':'misc'}{${p.id},\n  ${fields.join(',\n  ')}\n}\n`;}
  $$('[data-bib]').forEach(b=>b.addEventListener('click',()=>{const p=(window.IEI_PUBLICATIONS||[]).find(p=>p.id===b.dataset.bib);if(p){download(p.id+'.bib',bibtex(p),'application/x-bibtex;charset=utf-8');toast(/…|\.\.\.|et al/i.test(p.authors)?'Downloaded. This record has an abbreviated author list.':'Reference downloaded.');}}));
  if(document.body.dataset.article){const progress=$('.reading-progress');const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,Math.max(0,scrollY/max*100)):0)+'%';};addEventListener('scroll',update,{passive:true});update();}
  const dataset=$('#explorer-data');if(!dataset)return;
  let data;try{data=JSON.parse(dataset.textContent);}catch{toast('Chart data could not be loaded. Please consult the numerical tables.');return;}
  const BLUE='#245d81',TEAL='#426e66',THIRD='#8b9baa',INK='#172d3c',MUTED='#52626c',LINE='#d9dfda';
  const fmt=r=>(r>0?'+':r<0?'−':'')+Math.abs(r).toFixed(2);
  const txt=(x,y,text,size=12,anchor='start',color=MUTED)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" text-anchor="${anchor}" fill="${color}">${esc(text)}</text>`;
  const ln=(x1,y1,x2,y2,color=LINE,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
  const size=(s,h)=>{const w=Math.max(280,Math.round(s.getBoundingClientRect().width)||650);s.setAttribute('viewBox',`0 0 ${w} ${h}`);return w;};
  function renderHope(){const h=data.hope,st=h.studies[Number($('#hope-study').value)],oi=Number($('#hope-outcome').value),outcome=h.outcomes[oi],s=$('#hope-chart'),W=size(s,215),left=W<440?112:150,right=W-27,xf=v=>left+(v+1)/2*(right-left),axisY=170;const rows=[{label:'Hope for peace',v:st.peace[oi],c:BLUE,y:62},{label:'Hope for victory',v:st.victory[oi],c:TEAL,y:117}];let markup=txt((left+right)/2,207,'Pearson correlation (r)',11,'middle');
    for(const t of [-1,-.5,0,.5,1]){const x=xf(t);markup+=ln(x,24,x,axisY,t===0?'#a8b5b5':LINE,t===0?'':'stroke-dasharray="2 5"')+txt(x,190,t===0?'0':(t>0?'+':'−')+Math.abs(t).toFixed(1),10,'middle');}
    for(const r of rows){markup+=txt(0,r.y+4,r.label,W<440?11:13)+ln(xf(0),r.y,xf(r.v),r.y,r.c,'stroke-width="3"')+`<circle cx="${xf(r.v)}" cy="${r.y}" r="5.5" fill="${r.c}"/>`+txt(xf(r.v),r.y-15,fmt(r.v),13,'middle',r.c);}
    s.innerHTML=markup;s.setAttribute('aria-label',`${st.label}, ${outcome}. Hope for peace: r ${st.peace[oi]}; hope for victory: r ${st.victory[oi]}. Published associations, not causal effects.`);
    $('#hope-title').textContent=outcome;$('#hope-subtitle').textContent=st.label;$('#hope-note').textContent=st.sample+' The chart does not test whether the two correlations differ significantly.';
    $('#hope-table tbody').innerHTML=h.outcomes.map((o,i)=>`<tr><th scope="row">${esc(o)}</th><td>${fmt(st.peace[i])}</td><td>${fmt(st.victory[i])}</td></tr>`).join('');
  }
  function renderProfiles(){const p=data.profiles,o=p.outcomes[Number($('#profile-outcome').value)],show=$('#profile-sd').checked,s=$('#profile-chart'),W=size(s,275),left=W<440?124:178,right=W-25,max=Math.ceil(Math.max(...o.means.map((m,i)=>m+o.sd[i]))),xf=v=>left+v/max*(right-left);let markup='';
    for(let v=0;v<=max;v++){markup+=ln(xf(v),17,xf(v),224,LINE,'stroke-dasharray="2 5"')+txt(xf(v),244,String(v),10,'middle');}
    p.groups.forEach((g,i)=>{const y=50+i*75,c=[BLUE,TEAL,THIRD][i],parts=g.name.split(' · ');markup+=txt(0,y-3,parts[0],W<440?11:13)+txt(0,y+14,parts[1],W<440?10:12);if(show){const lo=xf(o.means[i]-o.sd[i]),hi=xf(o.means[i]+o.sd[i]);markup+=ln(lo,y,hi,y,c,'stroke-width="2"')+ln(lo,y-6,lo,y+6,c)+ln(hi,y-6,hi,y+6,c);}markup+=`<circle cx="${xf(o.means[i])}" cy="${y}" r="6" fill="${c}"/>`+txt(xf(o.means[i]),y-14,o.means[i].toFixed(2),12,'middle',INK);});markup+=txt((left+right)/2,268,'Reported mean score',11,'middle');s.innerHTML=markup;
    s.setAttribute('aria-label',`${o.name}. `+p.groups.map((g,i)=>`${g.name}: mean ${o.means[i]}, standard deviation ${o.sd[i]}, n ${g.n}`).join('. ')+(show?'. Whiskers show one standard deviation, not confidence intervals.':''));
    $('#profile-title').textContent=o.name+' across profiles';$('#profile-table tbody').innerHTML=p.groups.map((g,i)=>`<tr><th scope="row">${esc(g.name)}</th><td>${g.n}</td><td>${o.means[i].toFixed(2)}</td><td>${o.sd[i].toFixed(2)}</td></tr>`).join('');
  }
  let seed=41812,vectors;
  function rng(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return(seed+.5)/4294967296;}
  const normal=()=>Math.sqrt(-2*Math.log(rng()))*Math.cos(2*Math.PI*rng());
  function standardize(v){const n=v.length,m=v.reduce((a,b)=>a+b,0)/n,c=v.map(x=>x-m),sd=Math.sqrt(c.reduce((a,b)=>a+b*b,0)/(n-1));return c.map(x=>x/sd);}
  function generate(){const n=Number($('#sandbox-n').value),x=standardize(Array.from({length:n},normal)),z=standardize(Array.from({length:n},normal)),dot=x.reduce((a,b,i)=>a+b*z[i],0)/(n-1),e=standardize(z.map((v,i)=>v-dot*x[i]));vectors={x,e};renderSandbox();}
  function renderSandbox(){const r=Number($('#correlation-range').value)/100,{x,e}=vectors,y=x.map((v,i)=>r*v+Math.sqrt(1-r*r)*e[i]),measured=x.reduce((a,b,i)=>a+b*y[i],0)/(x.length-1),s=$('#sandbox-chart'),W=size(s,WHeight()),H=WHeight(),pad=38,bound=Math.ceil(Math.max(3,...x.map(Math.abs),...y.map(Math.abs))*2)/2,xf=v=>pad+(v+bound)/(bound*2)*(W-pad-16),yf=v=>H-40-(v+bound)/(bound*2)*(H-63);let markup='';
    for(let v=-Math.floor(bound);v<=Math.floor(bound);v++){markup+=ln(xf(v),20,xf(v),H-40,v===0?'#a8b5b5':LINE,v===0?'':'stroke-dasharray="2 5"')+ln(pad,yf(v),W-16,yf(v),v===0?'#a8b5b5':LINE,v===0?'':'stroke-dasharray="2 5"');if(v%2===0){markup+=txt(xf(v),H-23,v,10,'middle')+txt(pad-10,yf(v)+3,v,10,'end');}}
    markup+=x.map((v,i)=>`<circle cx="${xf(v)}" cy="${yf(y[i])}" r="${x.length>200?2.5:3.2}" fill="${BLUE}" fill-opacity=".6"/>`).join('');markup+=txt(W/2,H-4,'Synthetic X (standardized)',11,'middle')+txt(pad,12,'Synthetic Y (standardized)',11);s.innerHTML=markup;
    $('#r-readout').textContent='r = '+fmt(r);$('#sandbox-summary').textContent=`${x.length} synthetic points · Sample r = ${fmt(measured)} · Not participant data`;s.setAttribute('aria-label',`Synthetic scatterplot of ${x.length} generated points, sample correlation ${measured.toFixed(2)}. X and Y are arbitrary standardized variables.`);
  }
  function WHeight(){return innerWidth<700?310:380;}
  $('#hope-study').addEventListener('change',renderHope);$('#hope-outcome').addEventListener('change',renderHope);$('#profile-outcome').addEventListener('change',renderProfiles);$('#profile-sd').addEventListener('change',renderProfiles);$('#correlation-range').addEventListener('input',renderSandbox);$('#sandbox-n').addEventListener('change',generate);$('#regenerate').addEventListener('click',()=>{seed=(seed+100003)>>>0;generate();});
  function exportSVG(id,name){const s=$(id).cloneNode(true),isHope=id==='#hope-chart';const source=isHope?'Shani et al. (2024), Table 1. DOI: 10.1111/bjso.12722':'Shani et al. (2025), Table 2. DOI: 10.3389/fpsyg.2024.1499295';s.setAttribute('xmlns','http://www.w3.org/2000/svg');s.setAttribute('style','background:#ffffff');const box=s.getAttribute('viewBox').split(/\s+/).map(Number),height=box[3];s.setAttribute('viewBox',`${box[0]} ${box[1]} ${box[2]} ${height+58}`);s.removeAttribute('height');s.querySelectorAll('text').forEach(t=>{t.setAttribute('font-family','Arial, sans-serif');if(!t.hasAttribute('fill'))t.setAttribute('fill',MUTED);});[source,isHope?'Published bivariate correlations. Association does not establish causation.':($('#profile-sd').checked?'Published means; error bars show one standard deviation, not confidence intervals.':'Published means. Profile membership is model-based; complete-case sample N = 344.')].forEach((text,i)=>{const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x','16');t.setAttribute('y',String(height+23+i*17));t.setAttribute('font-size','10');t.setAttribute('font-family','Arial, sans-serif');t.setAttribute('fill',MUTED);t.textContent=text;s.append(t);});download(name,new XMLSerializer().serializeToString(s),'image/svg+xml;charset=utf-8');}
  $$('[data-download]').forEach(b=>b.addEventListener('click',()=>{switch(b.dataset.download){case'hope-csv':{const h=data.hope,s=h.studies[Number($('#hope-study').value)];download('iei-hope-published-correlations.csv',csv([['study','outcome','hope_for_peace_r','hope_for_victory_r','source','source_location','data_kind','sample_note'],...h.outcomes.map((o,i)=>[s.label,o,s.peace[i],s.victory[i],h.source,h.sourceLocation,h.kind,s.sample])]),'text/csv;charset=utf-8');break;}case'profile-csv':{const p=data.profiles;download('iei-germany-published-profile-summaries.csv',csv([['profile','profile_n','outcome','mean','standard_deviation','source','source_location','data_kind'],...p.outcomes.flatMap(o=>p.groups.map((g,i)=>[g.name,g.n,o.name,o.means[i],o.sd[i],p.source,p.sourceLocation,'Published aggregate; not individual observations']))]),'text/csv;charset=utf-8');break;}case'hope-svg':exportSVG('#hope-chart','iei-hope-correlation-chart.svg');break;case'profile-svg':exportSVG('#profile-chart','iei-germany-profile-chart.svg');break;}}));
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{renderHope();renderProfiles();renderSandbox();},140);});
  document.querySelectorAll('details.additional-results').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)dispatchEvent(new Event('resize'));}));
  renderHope();renderProfiles();generate();
})();
