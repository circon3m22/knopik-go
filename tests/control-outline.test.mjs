import './helpers/tsx-loader.mjs';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import postcss from'postcss';import sharp from'sharp';
const css=postcss.parse(readFileSync(new URL('../app/gameplay-control-art.css',import.meta.url),'utf8')),svg=readFileSync(new URL('../public/ui/game-control-frame.svg',import.meta.url),'utf8');
test('the solid two-tone rim is unconditional across every graphics tier and the inline artwork stays in sync',async()=>{
 let source;css.walkDecls('--control-edge-image',d=>source=d.value);const encoded=source.match(/data:image\/png;base64,([^"\)]+)/)[1];assert.ok(encoded);const metadata=await sharp(Buffer.from(encoded,'base64')).metadata();assert.equal(metadata.width,48);assert.equal(metadata.height,48);const actual=await sharp(Buffer.from(encoded,'base64')).ensureAlpha().raw().toBuffer(),expected=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();assert.deepEqual(actual,expected);
 const rim=[];css.walkRules(r=>{if(!r.selector.includes('.game-control-rim'))return;assert.notEqual(r.parent.type,'atrule','quality gates may only change the glass');for(const d of r.nodes)if(d.type==='decl')rim.push([d.prop,d.value]);});
 const values=Object.fromEntries(rim);for(const quality of['low','medium','high','very-high','ultra']){assert.equal(values.display,'block',quality);assert.equal(values.opacity,'1',quality);assert.equal(values.visibility,'visible',quality);assert.equal(values['border-image-slice'],'25%');assert.equal(values['z-index'],'1');assert.equal(values['backdrop-filter'],'none');}
 assert.match(svg,/<svg[^>]*width="48" height="48"/,'intrinsic dimensions prevent vector source ambiguity');
 assert.ok(!svg.includes('fill-opacity'));assert.ok(svg.includes('#102733')&&svg.includes('#eef5d8'));
});

test('the frame is hollow and has a continuous straight edge at native pixel size',async()=>{
 const {data}=await sharp(Buffer.from(svg)).resize(48,48).ensureAlpha().raw().toBuffer({resolveWithObject:true}),alpha=(x,y)=>data[(y*48+x)*4+3];
 assert.equal(alpha(24,24),0);for(let n=13;n<35;n++){for(let inset=0;inset<3;inset++){assert.equal(alpha(n,inset),255);assert.equal(alpha(n,47-inset),255);assert.equal(alpha(inset,n),255);assert.equal(alpha(47-inset,n),255);}}
 assert.deepEqual([...data.subarray((1*48+24)*4,(1*48+24)*4+4)],[238,245,216,255]);
 assert.deepEqual([...data.subarray((2*48+24)*4,(2*48+24)*4+4)],[238,245,216,255]);
 assert.equal(alpha(0,0),0);assert.equal(alpha(47,47),0);
});
