import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('responsive hero preload and picture select the same complete local candidates',()=>{
 const home=fs.readFileSync('index.html','utf8');const preload=home.match(/<link[^>]*as="image"[^>]*>/)[0];const source=home.match(/<source[^>]*type="image\/webp"[^>]*>/)[0];const attr=(tag,name)=>tag.match(new RegExp(name+'="([^" ]+(?: [^" ]+)*|[^" ]*)"'))?.[1];
 assert.equal(attr(preload,'imagesrcset'),attr(source,'srcset'));assert.equal(attr(preload,'imagesizes'),attr(source,'sizes'));assert.match(preload,/fetchpriority="high"/);
 const candidates=attr(source,'srcset').split(',').map(c=>c.trim().split(' '));assert.deepEqual(candidates.map(c=>c[1]),['480w','768w','1000w']);for(const [url] of candidates){const bytes=fs.readFileSync('.'+url);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
 assert.ok(fs.statSync('.'+candidates[0][0]).size<40000);assert.ok(fs.statSync('.'+candidates[1][0]).size<70000);
});
