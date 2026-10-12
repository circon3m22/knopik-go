import assert from 'node:assert/strict';
import test from 'node:test';
import {gpuContours,gpuTriangulate,gpuArea,gpuClip,gpuStroke,gpuHasHoles} from '../app/runner-gpu-geometry.ts';
import {runnerGpuColor} from '../app/runner-gpu-scene.ts';
import {RUNNER_GPU_CONTEXT,RunnerGpuBatch} from '../app/runner-gpu-batch.ts';
import {RunnerSceneDocument} from '../app/runner-scene-model.ts';
import {RunnerGpuScene} from '../app/runner-gpu-scene.ts';
import {fakeRunnerGl} from './helpers/runner-gpu-gl.mjs';

test('projected path parser retains relative coordinates, implicit lines, multiple contours and closure',()=>{
 const paths=gpuContours('M10 20h20v30h-20ZM0 0 10 0 10 10Z');assert.deepEqual(paths[0].points,[[10,20],[30,20],[30,50],[10,50]]);assert.equal(paths[0].closed,true);assert.equal(paths[1].points.length,3);assert.equal(gpuContours('M0 0Q10 20 30 40'),null);
});
test('GPU triangulation retains the area of convex and concave pixel silhouettes in either winding',()=>{
 for(const shape of [[[0,0],[10,0],[10,10],[0,10]],[[0,0],[4,0],[4,4],[10,4],[10,10],[0,10]],[[0,0],[10,0],[10,3],[6,3],[6,7],[10,7],[10,10],[0,10]]])for(const p of [shape,shape.slice().reverse()]){
  const triangles=gpuTriangulate(p);assert.ok(triangles);let area=0;for(let i=0;i<triangles.length;i+=3)area+=Math.abs(gpuArea(triangles.slice(i,i+3)));assert.ok(Math.abs(area-Math.abs(gpuArea(p)))<1e-6);
 }
});
test('holes request the exact SVG raster path instead of being silently filled',()=>{
 const contours=gpuContours('M0 0h20v20H0ZM5 5v10h10V5Z');assert.equal(gpuHasHoles(contours),true);assert.equal(gpuHasHoles(gpuContours('M0 0h4v4H0ZM10 10h4v4H10Z')),false);
});
test('terrain clips retain only the intersection and winding does not change coverage',()=>{
 const p=[[-5,-5],[15,-5],[15,15],[-5,15]],clip=[[0,0],[10,0],[10,10],[0,10]];
 for(const c of [clip,clip.slice().reverse()]){const clipped=gpuClip(p,c);assert.equal(Math.abs(gpuArea(clipped)),100);assert.ok(clipped.every(([x,y])=>x>=0&&x<=10&&y>=0&&y<=10));}
});
test('miter strokes keep native width and butt endpoints on open and closed pixel paths',()=>{
 const mesh=gpuStroke({points:[[0,0],[10,0]],closed:false},4);assert.equal(mesh.length,6);assert.deepEqual([...new Set(mesh.map(p=>p[1]))].sort((a,b)=>a-b),[-2,2]);assert.ok(mesh.every(p=>p[0]>=0&&p[0]<=10));
 const closed=gpuStroke({points:[[0,0],[10,0],[10,10],[0,10]],closed:true},4);assert.ok(closed.every(p=>p.every(Number.isFinite)));assert.equal(Math.min(...closed.map(p=>p[0])),-2);assert.equal(Math.max(...closed.map(p=>p[0])),12);
});
test('GPU colors retain 3/4/6/8 digit SVG alpha and the compositor is synchronized at native resolution',()=>{
 assert.deepEqual(runnerGpuColor('#abc'),[170/255,187/255,204/255,1]);assert.deepEqual(runnerGpuColor('#abcd'),[170/255,187/255,204/255,221/255]);assert.equal(runnerGpuColor('#12345680')[3],128/255);assert.equal(RUNNER_GPU_CONTEXT.desynchronized,false);assert.equal(RUNNER_GPU_CONTEXT.preserveDrawingBuffer,false);
});

function scene(){const doc=new RunnerSceneDocument(()=>({x:0,y:0,width:360,height:780})),root=doc.createElementNS('','svg');root.setAttribute('viewBox','0 0 360 780');return root;}
function node(root,tag,attrs={}){const n=root.ownerDocument.createElementNS('',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));root.append(n);return n;}
const unusedSurface=()=>({width:1,height:1});
test('hundreds of differently colored world paths share one ordered GPU span at full DPR',()=>{
 const root=scene();for(let i=0;i<500;i++)node(root,'path',{d:`M${i%30*10} ${Math.floor(i/30)*10}h9v9h-9Z`,fill:i%2?'#abc':'#fed'});
 const compiler=new RunnerGpuScene(root,unusedSurface,()=>{}),frame=compiler.prepare(3);assert.equal(frame.width,1080);assert.equal(frame.height,2340);assert.equal(frame.commands.length,1);assert.equal(frame.commands[0].count,3000);assert.ok(frame.vertices.every(Number.isFinite));
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),output={width:1,height:1};batch.present(frame,output);assert.equal(batch.stats.draws,1);assert.equal(gl.calls.filter(c=>c.name==='bufferData').length,1);assert.equal(output.width,1080);batch.dispose();compiler.dispose();
});
test('group opacity retains overlap order in one cropped GPU target, while single translucent particles stay batched',()=>{
 const root=scene(),g=node(root,'g',{opacity:.4,transform:'translate(100 200)'});node(g,'rect',{width:20,height:20,fill:'#f00'});node(g,'rect',{x:10,width:20,height:20,fill:'#00f'});
 for(let i=0;i<72;i++)node(root,'rect',{x:i%12*20,y:400+Math.floor(i/12)*20,width:4,height:4,opacity:.3,fill:'#abc'});
 const compiler=new RunnerGpuScene(root,unusedSurface,()=>{}),frame=compiler.prepare(3);assert.equal(frame.commands.length,2);const layer=frame.commands[0];assert.equal(layer.type,'layer');assert.ok(layer.width<=92&&layer.height<=62);assert.equal(layer.children.length,1);
 assert.equal(frame.commands[1].type,'span');const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl);batch.present(frame,{width:1,height:1});assert.equal(batch.stats.draws,3);assert.ok(batch.stats.layerPixels<6000);compiler.dispose();batch.dispose();
});
test('immutable textures upload once, release their CPU canvas, and are deleted when retired',()=>{
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),source={width:40,height:80},texture={key:'art',source,handle:null,width:40,height:80,scale:4,bytes:12800,used:1};
 const frame={vertices:new Float32Array(48),commands:[{type:'span',first:0,count:6,texture}],width:1080,height:2340,textures:[texture]};batch.present(frame,{width:1,height:1});assert.equal(batch.stats.uploads,1);assert.equal(source.width,1);assert.equal(texture.source,null);
 batch.present(frame,{width:1080,height:2340});assert.equal(batch.stats.uploads,0);batch.release(texture);assert.equal(texture.handle,null);assert.ok(gl.calls.some(c=>c.name==='deleteTexture'));batch.dispose();
});
