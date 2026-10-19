import './helpers/tsx-loader.mjs';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import postcss from'postcss';import sharp from'sharp';
const css=postcss.parse(readFileSync(new URL('../app/gameplay-control-art.css',import.meta.url),'utf8')),svg=readFileSync(new URL('../public/ui/game-control-frame.svg',import.meta.url),'utf8');
test('the solid two-tone rim is unconditional across every graphics tier and the inline artwork stays in sync',()=>{
 let source;css.walkDecls('--control-edge-image',d=>source=d.value);const encoded=source.match(/data:image\/svg\+xml,([^"\)]+)/)[1];assert.equal(decodeURIComponent(encoded),svg.trim().replace(/\s+/g,' '));
 const rim=[];css.walkRules(r=>{if(!r.selector.includes('.game-control-rim'))return;assert.notEqual(r.parent.type,'atrule','quality gates may only change the glass');for(const d of r.nodes)if(d.type==='decl')rim.push([d.prop,d.value]);});
 const values=Object.fromEntries(rim);for(const quality of['low','medium','high','very-high','ultra']){assert.equal(values.display,'block',quality);assert.equal(values.opacity,'1',quality);assert.equal(values.visibility,'visible',quality);assert.equal(values['border-image-slice'],'12');}
 assert.ok(!svg.includes('fill-opacity'));assert.ok(svg.includes('#132e39')&&svg.includes('#d8e5c6'));
});

test('the frame is hollow and has a continuous straight edge at native pixel size',async()=>{
 const {data}=await sharp(Buffer.from(svg)).resize(48,48).ensureAlpha().raw().toBuffer({resolveWithObject:true}),alpha=(x,y)=>data[(y*48+x)*4+3];
 assert.equal(alpha(24,24),0);for(let n=13;n<35;n++){assert.equal(alpha(n,0),255);assert.equal(alpha(n,1),255);assert.equal(alpha(n,47),255);assert.equal(alpha(0,n),255);assert.equal(alpha(47,n),255);}
 assert.equal(alpha(0,0),0);assert.equal(alpha(47,47),0);
});
