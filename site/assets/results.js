/* Published-result explorers. Values and confidence intervals are transcribed, not estimated.
 * Keep source metadata in site/content/explorer.json when updating any numerical record.
 */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const dataset = $('#explorer-data');
  if (!dataset || !$('#study4-chart')) return;
  let data;
  try { data = JSON.parse(dataset.textContent); }
  catch { return; } // The static numerical tables remain readable.
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => (n < 0 ? '−' : '') + Math.abs(n).toFixed(2);
  const INK = '#172d3c', BLUE = '#245d81', GREY = '#6a7884', GRID = '#e0e5e9';
  const RESPONSE = ['#e1e6eb','#b6c9d8','#7c9fb9','#416c8f','#193c59'];
  const state = {mode:'means'};
  const width = id => Math.max(220, Math.round($(id).getBoundingClientRect().width) || 780);
  const text = (x,y,t,size=15,anchor='start',color=INK) => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="${anchor}" fill="${color}" style="fill:${color}">${esc(t)}</text>`;
  const line = (x1,y1,x2,y2,color=GRID,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
  function wrap(value, max) {
    const rows=[]; let row='';
    for (const word of String(value).split(/\s+/).flatMap(w=>w.length>max?w.match(new RegExp('.{1,'+max+'}','g')):[w])) {
      if (row && (row+' '+word).length>max) { rows.push(row); row=word; }
      else row+=(row?' ':'')+word;
    }
    if(row) rows.push(row);
    return rows;
  }
  function label(value, y, W) {
    const lines=wrap(value,Math.max(22,Math.floor((W-32)/7.7)));
    return {markup:lines.map((l,i)=>text(14,y+20*i,l,15)).join(''),height:20*lines.length};
  }
  const accessible = (detail, graphic) => `<g class="result-mark" tabindex="0" role="button" aria-label="${esc(detail)}" data-result-detail="${esc(detail)}"><title>${esc(detail)}</title>${graphic}</g>`;
  function marker(x,y,time,detail) {
    const graphic = time===0 ? `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${BLUE}" stroke-width="2.5"/>` : `<rect x="${x-5.5}" y="${y-5.5}" width="11" height="11" fill="${BLUE}"/>`;
    return accessible(detail,`<circle cx="${x}" cy="${y}" r="13" fill="transparent"/>`+graphic);
  }
  function setup(id, W, H, markup, title, desc) {
    const svg=$(id);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.setAttribute('aria-label',title+'. '+desc);
    svg.innerHTML=`<title>${esc(title)}</title><desc>${esc(desc)}</desc>`+markup;
  }
  const tableHead = names => '<thead><tr>'+names.map(n=>`<th scope="col">${esc(n)}</th>`).join('')+'</tr></thead>';
  const cellRow = values => '<tr>'+values.map((v,i)=>`<${i?'td':'th scope="row"'}>${esc(v)}</${i?'td':'th'}>`).join('')+'</tr>';
  function sourceLink(url, name) { return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`; }
  function meanRows() {
    const g=$('#study4-group').value;
    return data.study4.meanVariables.filter(v=>g==='all'||v.group===g);
  }
  function correlationRows() {
    const s=data.study4, o=Number($('#study4-outcome').value);
    return [1,0].flatMap(p=>[0,1].map(t=>({label:s.correlationVariables[p]+' · '+(t?'2023':'2021'),r:s.matrices[t][p][o],time:t,predictor:s.correlationVariables[p],outcome:s.correlationVariables[o]})));
  }
  function coefficientChart(id, rows, title, ci=false, timeMarkers=false) {
    const W=width(id), left=18, right=W-24, x=v=>left+(v+1)/2*(right-left);
    let y=30, body='', positions=[];
    for(const row of rows){
      const l=label(row.label,y,W); body+=l.markup; y+=l.height+15;
      positions.push(y);
      body+=line(left,y,right,y,GRID,'stroke-dasharray="2 5"');
      if(ci && row.lo!==undefined) body+=line(x(row.lo),y,x(row.hi),y,BLUE,'stroke-width="2"')+line(x(row.lo),y-6,x(row.lo),y+6,BLUE,'stroke-width="2"')+line(x(row.hi),y-6,x(row.hi),y+6,BLUE,'stroke-width="2"');
      else body+=line(x(0),y,x(row.r),y,BLUE,'stroke-width="2"');
      const detail=row.label+': Pearson r = '+fmt(row.r)+(ci&&row.lo!==undefined?', published 95% confidence interval ['+fmt(row.lo)+', '+fmt(row.hi)+']':'');
      body+= timeMarkers ? marker(x(row.r),y,row.time,detail) : accessible(detail,`<circle cx="${x(row.r)}" cy="${y}" r="13" fill="transparent"/><circle cx="${x(row.r)}" cy="${y}" r="5.5" fill="${BLUE}"/>`);
      body+=text(x(row.r),y+25,fmt(row.r),15,'middle',BLUE);
      y+=66;
    }
    const axisY=y-20;
    let grid='';
    for(const t of [-1,-.5,0,.5,1]){
      grid+=line(x(t),positions[0]-12,x(t),axisY,t===0?'#9aa8b2':GRID,t===0?'':'stroke-dasharray="2 6"')+text(x(t),axisY+24,t===0?'0':fmt(t),13,'middle',GREY);
    }
    grid+=text(W/2,axisY+52,'Pearson correlation (r)',14,'middle',GREY);
    setup(id,W,axisY+66,grid+body,title,'The axis runs from −1 to +1. '+(ci?'Whiskers show published 95% confidence intervals. ':'')+'Select a mark or use the numerical table to inspect values.');
  }
  function renderStudy4(){
    const s=data.study4, isMean=state.mode==='means';
    $('#study4-mean-controls').hidden=!isMean;
    $('#study4-correlation-controls').hidden=isMean;
    $('#study4-readout').textContent='Select a point to inspect its value. All values are also available in the table.';
    document.querySelectorAll('[data-study4-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.study4Mode===state.mode)));
    if(isMean){
      const rows=meanRows(), W=width('#study4-chart'), left=18,right=W-24,x=v=>left+(v-1)/6*(right-left);
      let y=30, markup='', positions=[];
      for(const r of rows){const l=label(r.label,y,W);markup+=l.markup;y+=l.height+22;positions.push(y);
        markup+=line(left,y,right,y,GRID,'stroke-dasharray="2 5"')+line(x(r.values[0]),y,x(r.values[1]),y,'#95a5b2','stroke-width="2"');
        r.values.forEach((v,t)=>{markup+=marker(x(v),y,t,r.label+', '+s.times[t]+': adjusted mean '+fmt(v)+' (scale 1–7)')+text(x(v),y+(t?-16:29),fmt(v),15,'middle',BLUE);});
        y+=76;
      }
      const axis=y-23;let grid='';
      for(const t of (W<360?[1,3,5,7]:[1,2,3,4,5,6,7]))grid+=line(x(t),positions[0]-17,x(t),axis,GRID,'stroke-dasharray="2 6"')+text(x(t),axis+22,t,14,'middle',GREY);
      grid+=text(W/2,axis+50,'Adjusted mean score (1–7)',14,'middle',GREY);
      setup('#study4-chart',W,axis+64,grid+markup,'Study 4: mean scores at the two waves','Open circles show 2021; filled squares show October 2023. Points are adjusted group means, not individual participants.');
      $('#study4-title').textContent='Mean scores at the two waves';
      $('#study4-subtitle').textContent='Estimated marginal means · N = 129 · Scale 1–7';
      $('#study4-method').textContent='Adjusted group means from Figure 3. The connecting lines compare means, not individual trajectories.';
      $('#study4-table').innerHTML='<caption>Study 4 adjusted means, Figure 3; N = 129; scale 1–7</caption>'+tableHead(['Measure','2021','October 2023'])+'<tbody>'+rows.map(r=>cellRow([r.label,...r.values.map(fmt)])).join('')+'</tbody>';
      $('#study4-stat-note').textContent=s.meanNote;
      $('#study4-source').innerHTML=sourceLink(s.source,s.label+', '+s.meanSource)+'.';
    }else{
      const rows=correlationRows(),outcome=rows[0].outcome;
      coefficientChart('#study4-chart',rows,'Hope and '+outcome.toLowerCase()+': within-wave correlations',false,true);
      $('#study4-title').textContent='Hope and '+outcome.toLowerCase();
      $('#study4-subtitle').textContent='Within-wave Pearson correlations · Same panel, N = 129';
      $('#study4-method').textContent='Bivariate Pearson correlations from Table 7. Both forms of hope and both waves are shown on the same scale.';
      $('#study4-table').innerHTML='<caption>Correlations with '+esc(outcome.toLowerCase())+', Table 7</caption>'+tableHead(['Form of hope','2021 r','2023 r'])+'<tbody>'+[1,0].map(p=>cellRow([s.correlationVariables[p],...s.matrices.map(m=>fmt(m[p][Number($('#study4-outcome').value)]))])).join('')+'</tbody>';
      $('#study4-stat-note').textContent=s.correlationNote;
      $('#study4-source').innerHTML=sourceLink(s.source,s.label+', '+s.correlationSource)+'.';
    }
  }
  function selectedItems(){return $('#experience-item').value==='all'?data.experiences.items:[data.experiences.items[Number($('#experience-item').value)]];}
  function renderExperience(){
    const d=data.experiences,rows=selectedItems(),all=$('#experience-item').value==='all',W=width('#experience-chart'),left=14,right=W-22,x=p=>left+p/100*(right-left);
    let y=30,markup='';
    if(all){
      for(const row of rows){const l=label(row.label,y,W);markup+=l.markup;y+=l.height+7;let start=0,total=row.percentages.reduce((a,b)=>a+b,0);
        row.percentages.forEach((v,i)=>{
          const x0=x(start/total*100),rw=v/total*(right-left),detail=row.label+': '+d.categories[i]+', '+v+'% (published percentage)';
          markup+=accessible(detail,`<rect x="${x0}" y="${y}" width="${rw}" height="31" fill="${RESPONSE[i]}" stroke="#fff" stroke-width=".7"/>`);
          if(rw>=34)markup+=text(x0+rw/2,y+21,v+'%',13,'middle',i>=3?'#fff':INK);
          start+=v;
        });y+=61;
      }
    }else{
      const row=rows[0];
      row.percentages.forEach((v,i)=>{markup+=text(left,y,d.categories[i],15);y+=13;
        markup+=line(left,y+14,right,y+14,GRID,'stroke-dasharray="2 6"');
        markup+=accessible(d.categories[i]+': '+v+'% (published percentage)',`<rect x="${left}" y="${y}" width="${x(v)-left}" height="28" fill="${RESPONSE[i]}"/>`)+text(x(v)+8,y+20,v+'%',15);
        y+=56;
      });
    }
    const axis=y-14;
    [0,25,50,75,100].forEach(v=>{markup+=line(x(v),axis,x(v),axis+5,GREY)+text(x(v),axis+24,v+'%',13,'middle',GREY);});
    markup+=text(W/2,axis+53,all?'Response distribution':'Percentage of valid responses',14,'middle',GREY);
    setup('#experience-chart',W,axis+67,markup,all?'Distributions of reported antisemitic experiences':rows[0].label,all?d.roundingNote:'Each bar is a published percentage from Figure 1.');
    $('#experience-title').textContent=all?'Response distributions by item':rows[0].label;
    $('#experience-subtitle').textContent=all?'Published percentages of valid responses to each item':'Frequency of this reported experience';
    $('#experience-readout').textContent='Select a bar segment to see its category and percentage. Small segments are reported in the table even when their label cannot fit on the bar.';
    $('#experience-table').innerHTML='<caption>Published percentages, Figure 1 (rounding retained)</caption>'+tableHead(['Experience',...d.categories])+'<tbody>'+rows.map(r=>cellRow([r.label,...r.percentages.map(v=>v+'%')])).join('')+'</tbody>';
  }
  function associationRows(){
    const a=data.associations,v=$('#association-view').value,f=Number($('#association-focus').value);
    if(v==='predictor'){const p=a.predictors[f];return p.estimates.map((r,i)=>({...r,label:a.outcomes[i],predictor:p.label,outcome:a.outcomes[i]}));}
    return a.predictors.map(p=>({...p.estimates[f],label:p.label,predictor:p.label,outcome:a.outcomes[f]}));
  }
  function changeAssociationView(){
    const v=$('#association-view').value,a=data.associations;
    $('#association-focus-label').textContent=v==='predictor'?'Antisemitism-related measure':'Psychosocial outcome';
    const options=v==='predictor'?a.predictors.map(p=>p.label):a.outcomes;
    $('#association-focus').innerHTML=options.map((s,i)=>`<option value="${i}">${esc(s)}</option>`).join('');renderAssociation();
  }
  function renderAssociation(){
    const a=data.associations,rows=associationRows(),v=$('#association-view').value,f=Number($('#association-focus').value),ci=$('#association-ci').checked;
    const title=v==='predictor'?a.predictors[f].label+' and psychosocial outcomes':a.outcomes[f]+' and antisemitism-related measures';
    coefficientChart('#association-chart',rows,title,ci);
    $('#association-title').textContent=title;
    $('#association-definition').textContent=v==='predictor'?a.predictors[f].definition:'The five measures concern different aspects of experience and response. Vigilance is precautionary behavior; perceived prevalence is an estimate of others’ attitudes.';
    $('#association-readout').textContent=ci?'Select a point to inspect its correlation and published 95% confidence interval.':'Select a point to inspect its correlation. Published confidence intervals remain available in the table.';
    $('#association-table').innerHTML='<caption>Published Pearson correlations and 95% confidence intervals, Table S1</caption>'+tableHead(['Measure','Outcome','Pearson r','95% CI'])+'<tbody>'+rows.map(r=>cellRow([r.predictor,r.outcome,fmt(r.r),'['+fmt(r.lo)+', '+fmt(r.hi)+']'])).join('')+'</tbody>';
  }
  // Mouse, touch, and keyboard access to individual marks.
  for(const key of ['study4','experience','association']){
    const svg=$('#'+key+'-chart');
    function inspect(e){const g=e.target.closest('[data-result-detail]');if(g)$('#'+key+'-readout').textContent=g.dataset.resultDetail;}
    svg.addEventListener('click',inspect);svg.addEventListener('focusin',inspect);svg.addEventListener('mouseover',inspect);
    svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(e);}});
  }
  document.querySelectorAll('[data-study4-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.study4Mode;renderStudy4();}));
  $('#study4-group').addEventListener('change',renderStudy4);
  $('#study4-outcome').addEventListener('change',renderStudy4);
  $('#experience-item').addEventListener('change',renderExperience);
  $('#association-view').addEventListener('change',changeAssociationView);
  $('#association-focus').addEventListener('change',renderAssociation);
  $('#association-ci').addEventListener('change',renderAssociation);
  function download(name,content,type){
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  function csv(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');}
  function exportCSV(key){
    let rows,name;
    if(key==='study4'){
      const s=data.study4;name='iei-study4-'+state.mode+'.csv';
      if(state.mode==='means')rows=[['measure','wave','adjusted_mean','scale_min','scale_max','panel_n','statistic','source_location','source','timing_note'],...meanRows().flatMap(r=>r.values.map((v,t)=>[r.label,s.times[t],v,1,7,s.sampleN,s.meanKind,s.meanSource,s.source,s.timingNote]))];
      else rows=[['hope_measure','outcome','wave','pearson_r','panel_n','statistic','source_location','source','interpretation'],...correlationRows().map(r=>[r.predictor,r.outcome,s.times[r.time],r.r,s.sampleN,s.correlationKind,s.correlationSource,s.source,s.correlationNote])];
    }else if(key==='experience'){
      const d=data.experiences;name='iei-antisemitic-experience-distributions.csv';
      rows=[['item','response_category','published_percentage','reported_row_total','statistic','collection_period','sample_note','rounding_note','source_location','source'],...selectedItems().flatMap(r=>r.percentages.map((v,i)=>[r.label,d.categories[i],v,r.percentages.reduce((a,b)=>a+b,0),d.kind,d.collection,d.sampleNote,d.roundingNote,d.sourceLocation,d.source]))];
    }else{
      const a=data.associations;name='iei-antisemitism-outcome-correlations.csv';
      rows=[['measure','outcome','pearson_r','published_95ci_lower','published_95ci_upper','statistic','sample_note','source_location','source'],...associationRows().map(r=>[r.predictor,r.outcome,r.r,r.lo,r.hi,a.kind,a.sampleNote,a.sourceLocation,a.source])];
    }
    download(name,'\ufeff'+csv(rows),'text/csv;charset=utf-8');
  }
  function exportSVG(key){
    const svg=$('#'+key+'-chart'),box=svg.getAttribute('viewBox').split(/\s+/).map(Number),W=box[2],H=box[3];
    let notes;
    if(key==='study4'){const s=data.study4;notes=[s.label+'; N = 129. '+s.times.join(' and ')+'.',state.mode==='means'?s.meanKind:s.correlationKind,state.mode==='means'?'Source: '+s.meanSource:'Source: '+s.correlationSource,s.source,state.mode==='means'?'Scale 1–7. Open circles: 2021; filled squares: 2023. Adjusted group means; no error bars reconstructed.':s.correlationNote];}
    else if(key==='experience'){const d=data.experiences;notes=[d.sourceLocation,d.source,d.collection+'. '+d.sampleNote,d.roundingNote];}
    else{const a=data.associations;notes=[a.sourceLocation,a.source,a.sampleNote,$('#association-ci').checked?'Whiskers show published 95% confidence intervals.':'Confidence intervals are hidden in this chart, but retained in the CSV.',a.note];}
    const maxChars=Math.max(25,Math.floor((W-28)/6.5));
    const heading=wrap($('#'+key+'-title').textContent,Math.max(22,Math.floor((W-28)/9)));
    let headHeight=heading.length*23+26, legend='';
    if(key==='experience'){let lx=14,ly=headHeight;data.experiences.categories.forEach((c,i)=>{const needed=c.length*7.2+30;if(lx+needed>W-14){lx=14;ly+=23;}legend+=`<rect x="${lx}" y="${ly-11}" width="12" height="12" fill="${RESPONSE[i]}"/>`+text(lx+19,ly,c,13);lx+=needed;});headHeight=ly+23;}
    let y=headHeight+H+20;
    let foot='';notes.forEach(note=>{wrap(note,maxChars).forEach(row=>{foot+=text(14,y,row,12,'start',GREY);y+=17;});y+=7;});
    // Inline palette/text colors make the exported chart independent of site CSS.
    const content=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y+10}" viewBox="0 0 ${W} ${y+10}" style="background:#fff"><title>${esc($('#'+key+'-title').textContent)}</title><rect width="100%" height="100%" fill="#fff"/>${heading.map((l,i)=>text(14,24+i*23,l,17)).join('')}${legend}<g transform="translate(0 ${headHeight})">${svg.innerHTML}</g>${foot}</svg>`;
    download('iei-'+key+'-published-results.svg',content,'image/svg+xml;charset=utf-8');
  }
  document.querySelectorAll('[data-results-export]').forEach(b=>b.addEventListener('click',()=>{const [key,type]=b.dataset.resultsExport.split('-');if(type==='csv')exportCSV(key);else exportSVG(key);}));
  let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{renderStudy4();renderExperience();renderAssociation();},120);});
  renderStudy4();renderExperience();renderAssociation();
})();
