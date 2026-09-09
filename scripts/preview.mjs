/** Portable read-only review. Forms are disabled and the iframe does not grant allow-forms. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const pages={},images={};
for(const file of walk(dist).filter(f=>f.endsWith('.webp'))){
 const key=path.relative(dist,file).split(path.sep).join('/');
 images[key]=fs.readFileSync(file).toString('base64');
}
for(const file of walk(dist).filter(f=>f.endsWith('.html'))){
 const relative=path.relative(dist,file).split(path.sep).join('/');
 let html=fs.readFileSync(file,'utf8');const scripts=[];
 html=html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g,(_,href)=>'<style>'+fs.readFileSync(path.resolve(path.dirname(file),href),'utf8')+'</style>');
 html=html.replace(/<script src="([^"]+)" defer><\/script>/g,(_,href)=>{scripts.push(fs.readFileSync(path.resolve(path.dirname(file),href),'utf8'));return '';});
 html=html.replace(/<link rel="icon"[^>]+>/g,'');
 html=html.replace('<body ', '<body data-offline="true" ');
 // Every local image URL (including srcset variants) is replaced by a shared image token.
 html=html.replace(/(?:\.\.\/|\.\/)?assets\/images\/([a-z0-9-]+\.webp)/g,(_,name)=>'__IEI_IMAGE__assets/images/'+name+'__END_IMAGE__');
 // Prevent native submits even if scripts fail or a production build was accidentally used as input.
 html=html.replace(/<fieldset class="inquiry-fields"[^>]*>/g,'<fieldset class="inquiry-fields" disabled>');
 html=html.replace(/data-enabled="true"/g,'data-enabled="false"');
 html=html.replace(/<form([^>]+)action="[^"]+"/g,'<form$1action="#"');
 html=html.replace(/<input type="hidden" name="access_key" value="[^"]+">/g,'');
 const feedData='data:application/rss+xml;charset=utf-8,'+encodeURIComponent(fs.readFileSync(path.join(dist,'feed.xml'),'utf8'));
 html=html.replace(/href="(?:\.\.\/|\.\/)?feed\.xml"/g,`href="${feedData}" download="iei-research-summaries.xml"`);
 const bridge=`document.addEventListener('click',function(e){const a=e.target.closest('a');if(!a||a.hasAttribute('download'))return;const href=a.getAttribute('href')||'';if(/^(https?:|mailto:|blob:|data:)/i.test(href))return;const u=new URL(href,'https://preview.invalid/'+${JSON.stringify(relative)});if(href.startsWith('#')){const t=document.getElementById(decodeURIComponent(u.hash.slice(1)));if(t){e.preventDefault();let p=t.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}t.scrollIntoView();}return;}if(!u.pathname.endsWith('.html'))return;e.preventDefault();parent.postMessage({kind:'iei-preview-route',path:u.pathname.slice(1),hash:u.hash},'*');});`;
 html=html.replace('</body>',()=>scripts.map(js=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>').join('')+'<script>'+bridge+'</script></body>');
 pages[relative]=html;
}
const payload=JSON.stringify(pages).replace(/</g,'\\u003c');
const preview=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>IEI Lab · Review version 3</title><style>html,body{height:100%;margin:0;background:white}iframe{display:block;width:100%;height:100%;border:0;background:white}</style></head><body><iframe id="site" title="IEI Lab website review version 3" sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox" allow="clipboard-write"></iframe><script>const PAGES=${payload};const IMAGE_DATA=${JSON.stringify(images)};const IMAGES={};for(const [name,encoded] of Object.entries(IMAGE_DATA)){const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));IMAGES[name]=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));}const frame=document.getElementById('site');function show(path,fragment='',push=true){if(!Object.hasOwn(PAGES,path))path='404.html';frame.srcdoc=PAGES[path].replace(/__IEI_IMAGE__(.*?)__END_IMAGE__/g,(_,name)=>IMAGES[name]||'');if(push)history.pushState({path},'','#'+encodeURIComponent(path));if(fragment)frame.addEventListener('load',()=>{const t=frame.contentDocument.getElementById(decodeURIComponent(fragment.slice(1)));if(t){let p=t.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}t.scrollIntoView();}},{once:true});}addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.data?.kind!=='iei-preview-route')return;show(e.data.path,e.data.hash||'');});addEventListener('popstate',()=>show(decodeURIComponent(location.hash.slice(1))||'index.html','',false));show(decodeURIComponent(location.hash.slice(1))||'index.html','',false);</script></body></html>`;
fs.mkdirSync(path.join(root,'review'),{recursive:true});
const target=path.resolve(process.argv[2]||path.join(root,'review/IEI_Lab_Preview_v3.html'));
fs.writeFileSync(target,preview);
console.log(`Created offline preview with ${Object.keys(pages).length} pages and ${Object.keys(images).length} responsive image assets: ${target}`);
