import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
test('homepage font resources are local, licensed and match their recorded bytes',()=>{
 const html=fs.readFileSync('index.html','utf8');assert.doesNotMatch(html,/fonts\.(?:googleapis|gstatic)\.com/);
 const css=fs.readFileSync('assets/home-fonts.css','utf8');const manifest=JSON.parse(fs.readFileSync('assets/fonts/provenance.json','utf8'));
 for(const {path,sha256,bytes} of manifest.files){const data=fs.readFileSync(path);assert.equal(data.subarray(0,4).toString(),'wOF2');assert.equal(data.length,bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),sha256);assert.ok(css.includes('/'+path));}
 for(const family of ['montserrat','librebaskerville'])assert.match(fs.readFileSync('assets/fonts/'+family+'-OFL.txt','utf8'),/SIL OPEN FONT LICENSE/);
 for(const match of html.matchAll(/<link\b[^>]*as="font"[^>]*>/g)){const tag=match[0];assert.match(tag,/crossorigin/);const url=tag.match(/href="([^"]+)"/)[1];assert.ok(fs.existsSync('.'+url));assert.ok(css.includes(url));}
});
