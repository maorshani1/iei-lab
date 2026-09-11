(()=>{'use strict';
// Genuine page previews can be enlarged without misrepresenting them as full-text downloads.
const dlg=document.getElementById('publication-preview');let opener;
document.querySelectorAll('[data-publication-preview]').forEach(b=>b.addEventListener('click',()=>{opener=b;const img=dlg.querySelector('img');img.src=b.dataset.publicationPreview;img.alt=b.dataset.title+' — publication page preview';dlg.querySelector('h2').textContent=b.dataset.title;dlg.showModal()}));dlg?.querySelector('button')?.addEventListener('click',()=>dlg.close());dlg?.addEventListener('close',()=>opener?.focus());
// Graceful source link if a remote campus photograph is unavailable; never substitute a fake campus.
document.querySelectorAll('[data-campus-img]').forEach(img=>{const fail=()=>{img.hidden=true;img.closest('figure').querySelector('.campus-unavailable').hidden=false};img.addEventListener('error',fail);if(img.complete&&!img.naturalWidth)fail()});
})();
