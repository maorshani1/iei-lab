import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||4173);
if(!fs.existsSync(path.join(root,'index.html')))throw Error('No build found. Run npm run build first.');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{try{
 const raw=new URL(req.url,'http://localhost').pathname;
 const decoded=decodeURIComponent(raw);let target=path.resolve(root,'.'+decoded);
 if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 if(decoded==='/')target=path.join(target,'index.html');
 else if(!path.extname(target)&&fs.existsSync(target+'.html'))target+='.html';
 else if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
 if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,'404.html')));return;}
 res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(target).pipe(res);
 }catch{res.writeHead(400);res.end('Invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`IEI Lab preview: http://127.0.0.1:${port}`));
