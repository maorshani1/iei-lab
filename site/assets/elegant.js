/* Progressive enhancement: published chart values already exist in the HTML.
   Inputs update the SVG and accessible table; no requests or personal data. */
'use strict';
(() => {
 const fmt=n=>(n<0?'−':n>0?'+':'')+Math.abs(n).toFixed(2);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.querySelectorAll('[data-ser-chart]').forEach(el=>{
  let series,outcomes;try{series=JSON.parse(el.dataset.series);outcomes=JSON.parse(el.dataset.outcomes);}catch{return;}
  const select=el.querySelector('[data-ser-measure]'),ci=el.querySelector('[data-ser-ci]');
  function update(){const s=series[select.value];if(!s)return;const X=r=>210+(r+.6)/1.2*365;
   let svg=`<svg class="ser-forest" viewBox="0 0 650 272" role="img" aria-label="${esc(s.label)}: published Pearson correlations. Exact values are in the table below.">`;
   for(const t of [-.6,-.3,0,.3,.6])svg+=`<line x1="${X(t)}" x2="${X(t)}" y1="18" y2="215" class="${t===0?'ser-zero':'ser-grid'}"/><text x="${X(t)}" y="237" text-anchor="middle" class="ser-axis">${t===0?'0':fmt(t)}</text>`;
   s.values.forEach(([r,lo,hi],i)=>{const y=43+i*49;svg+=`<text x="0" y="${y+5}" class="ser-outcome">${esc(outcomes[i])}</text>`;if(ci.checked)svg+=`<path class="ser-ci" d="M${X(lo)} ${y-5}V${y+5}M${X(lo)} ${y}H${X(hi)}M${X(hi)} ${y-5}V${y+5}"/>`;svg+=`<circle class="ser-dot" cx="${X(r)}" cy="${y}" r="5.5"><title>${esc(outcomes[i])}: r = ${r.toFixed(2)}; 95% CI [${lo.toFixed(2)}, ${hi.toFixed(2)}]</title></circle><text x="630" y="${y+5}" class="ser-value" text-anchor="end">${fmt(r)}</text>`;});
   el.querySelector('.ser-plot').innerHTML=svg+'<text class="ser-axis" x="392" y="265" text-anchor="middle">Pearson correlation (r)</text></svg>';
   el.querySelector('tbody').innerHTML=s.values.map(([r,lo,hi],i)=>`<tr><th scope="row">${esc(outcomes[i])}</th><td>${fmt(r)}</td><td>[${fmt(lo)}, ${fmt(hi)}]</td></tr>`).join('');
   el.querySelector('caption').textContent=s.label+': published correlations';
   el.querySelector('.ser-reading').textContent=s.label+': r = '+s.values.map(v=>fmt(v[0])).join(', ')+' for well-being, anxiety, depression, and social participation, respectively.';
  }
  select.addEventListener('change',update);ci.addEventListener('change',update);
 });
})();
