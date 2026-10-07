import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://desgracias.es';
export function auditSeoDiscovery(root = process.cwd()) {
  const xml = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim());
  const known = new Set(urls);
  const graph = new Map();
  const incoming = new Map(urls.map(url=>[url,new Set()]));
  const errors=[];
  for(const url of urls) {
    const parsed=new URL(url);
    if(parsed.origin!==ORIGIN || parsed.search || parsed.hash) {errors.push(`invalid_sitemap_url:${url}`);continue;}
    const file=path.join(root,parsed.pathname.slice(1),parsed.pathname.endsWith('/')?'index.html':'');
    if(!fs.existsSync(file)){errors.push(`missing_page:${url}`);continue;}
    const html=fs.readFileSync(file,'utf8').replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/gi,'');
    const targets=new Set();
    for(const m of html.matchAll(/<a\b([^>]+)>/gi)) {
      const attrs=Object.fromEntries([...m[1].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(a=>[a[1].toLowerCase(),a[2]]));
      if(!attrs.href || (attrs.rel??'').split(/\s+/).includes('nofollow'))continue;
      try {
        const target=new URL(attrs.href,url); target.hash=''; target.search='';
        if(known.has(target.href) && target.href!==url){targets.add(target.href);incoming.get(target.href).add(url);}
      } catch {errors.push(`invalid_link:${url}`);}
    }
    graph.set(url,targets);
  }
  const depths=new Map([[ORIGIN+'/',0]]);
  const queue=[ORIGIN+'/'];
  for(let i=0;i<queue.length;i++)for(const target of graph.get(queue[i])??[]) {
    if(!depths.has(target)){depths.set(target,depths.get(queue[i])+1);queue.push(target);}
  }
  const pages=urls.map(url=>({url,depth:depths.get(url)??null,incoming_pages:incoming.get(url).size}));
  for(const p of pages)if(p.depth===null)errors.push(`unreachable_from_home:${p.url}`);
  if(!known.has(ORIGIN+'/'))errors.push('homepage_missing_from_sitemap');
  if(known.size!==urls.length)errors.push('duplicate_sitemap_urls');
  return {ok:errors.length===0,errors,pages};
}
