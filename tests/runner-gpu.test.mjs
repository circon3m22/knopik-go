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

test('stepped roofs with zero-area extensions remain vector geometry through camera movement',()=>{
 for(const y of [-394.1053195949644,0,230.25])for(const winding of [1,-1]){
  const p=[[-103,y],[-61.8,y],[-61.8,y-15],[-15,y-15],[-15,y-30],[15,y-30],[15,y-15],[61.8,y-15],[61.8,y],[103,y]];
  if(winding<0)p.reverse();const triangles=gpuTriangulate(p);assert.ok(triangles);let area=0;for(let i=0;i<triangles.length;i+=3)area+=Math.abs(gpuArea(triangles.slice(i,i+3)));assert.ok(Math.abs(area-Math.abs(gpuArea(p)))<1e-6);
 }
});

test('changing layer crops reuse GPU storage and clear only the active rectangle',()=>{
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),output={width:1,height:1},vertices=new Float32Array(144);
 const layer=(width,height,children=[{type:'span',first:0,count:6,texture:null}])=>({type:'layer',first:6,count:6,x:0,y:0,width,height,children});
 const frame=(commands)=>({vertices,commands,width:1080,height:2340,textures:[]});
 batch.present(frame([layer(91,61),layer(200,95)]),output);assert.equal(batch.stats.targetAllocations,1);
 const initialBytes=batch.stats.targetBytes;
 gl.calls.length=0;batch.present(frame([layer(199,94),layer(20,30)]),output);
 assert.equal(batch.stats.targetAllocations,0);assert.equal(batch.stats.targetBytes,initialBytes);assert.equal(gl.calls.filter(c=>c.name==='texImage2D'||c.name==='checkFramebufferStatus').length,0);
 assert.ok(gl.calls.some(c=>c.name==='scissor'&&c.args.join(',')==='0,0,20,30'));
 assert.ok(gl.calls.some(c=>c.name==='uniform2f'&&c.args[0]==='u_uv_scale'&&c.args[1]===20/256&&c.args[2]===30/128));
 gl.calls.length=0;batch.present(frame([layer(201,96),{type:'span',first:12,count:6,texture:null}]),output);assert.equal(batch.stats.targetAllocations,0);
 const scales=gl.calls.filter(c=>c.name==='uniform2f'&&c.args[0]==='u_uv_scale');assert.deepEqual(scales.at(-1).args,['u_uv_scale',1,1]);batch.dispose();
});

test('nested opacity buffers stay separate and are retired when the renderer closes',()=>{
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),leaf={type:'span',first:0,count:6,texture:null};
 const child={type:'layer',first:6,count:6,x:0,y:0,width:90,height:80,children:[leaf]},parent={type:'layer',first:12,count:6,x:0,y:0,width:200,height:150,children:[child]};
 const frame={vertices:new Float32Array(144),commands:[parent],width:1080,height:2340,textures:[]};batch.present(frame,{width:1,height:1});assert.equal(batch.stats.targetAllocations,2);gl.calls.length=0;batch.present(frame,{width:1080,height:2340});assert.equal(batch.stats.targetAllocations,0);batch.dispose();assert.equal(gl.calls.filter(c=>c.name==='deleteFramebuffer').length,2);
});

test('unsupported paths outside the screen never allocate a raster surface or evict visible art',()=>{
 const root=scene();node(root,'path',{d:'M0 0Q10 20 30 40',fill:'#abc',transform:'translate(1000 1000)'});
 const compiler=new RunnerGpuScene(root,unusedSurface,()=>{}),frame=compiler.prepare(3);assert.equal(frame.textures.length,0);assert.equal(compiler.stats.rasterized,0);assert.equal(compiler.stats.culled,1);compiler.dispose();
});

test('old camera versions of an exact fallback are retired after presentation instead of filling the sprite cache',()=>{
 const original=globalThis.Path2D;globalThis.Path2D=class {};
 const ctx=new Proxy({globalAlpha:1},{get:(target,key)=>key in target?target[key]:()=>{}}),surface=()=>({width:1,height:1,getContext:()=>ctx});
 let retired=0,current;
 try {
  const root=scene(),path=node(root,'path',{fill:'#abc'}),compiler=new RunnerGpuScene(root,surface,t=>{assert.notEqual(t,current);retired++;});
  for(let i=0;i<12;i++){
   path.setAttribute('d',`M${20+i} 20Q${30+i} 40 ${50+i} 60Z`);
   const frame=compiler.prepare(3);current=frame.textures[0];assert.ok(current);assert.equal(retired,Math.max(0,i-1));compiler.trim();assert.equal(retired,i);assert.equal(compiler.stats.textureBytes,current.bytes);
  }
  current=null;compiler.dispose();assert.equal(retired,12);
 }finally{globalThis.Path2D=original;}
});

test('rotation retires old viewport capacities instead of retaining a square made from both orientations',()=>{
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),layer={type:'layer',first:6,count:6,x:0,y:0,width:1080,height:2000,children:[{type:'span',first:0,count:6,texture:null}]},frame={vertices:new Float32Array(96),commands:[layer],width:1080,height:2340,textures:[]};
 batch.present(frame,{width:1,height:1});gl.calls.length=0;
 batch.present({...frame,width:2340,height:1080,commands:[{...layer,width:2200,height:900}]},{width:1080,height:2340});assert.equal(gl.calls.filter(c=>c.name==='deleteFramebuffer').length,1);assert.ok(batch.stats.targetBytes<=2340*1080*4);batch.dispose();assert.equal(batch.stats.targetBytes,0);
});

test('GPU vertex storage is retained across motion and grows only when its capacity is exhausted',()=>{
 const gl=fakeRunnerGl(),batch=new RunnerGpuBatch(gl),canvas={width:1,height:1};
 const frame=n=>({vertices:new Float32Array(n),commands:[],width:1080,height:2340,textures:[]});
 batch.present(frame(96),canvas);batch.present(frame(192),canvas);batch.present(frame(96),canvas);
 assert.equal(gl.calls.filter(c=>c.name==='bufferData').length,1);
 assert.equal(gl.calls.filter(c=>c.name==='bufferSubData').length,3);
 assert.equal(gl.calls.filter(c=>c.name==='bufferData')[0].bytes,4096);
 batch.present(frame(2048),canvas);batch.present(frame(1024),canvas);
 assert.equal(gl.calls.filter(c=>c.name==='bufferData').length,2);
 assert.equal(gl.calls.filter(c=>c.name==='bufferSubData').at(-1).bytes,4096);
 batch.dispose();
});

test('direct vertex writing and the clipped path retain identical color and UV interpolation',()=>{
 const root=scene();node(root,'path',{d:'M-10 10L20 10 20 40Z',fill:'#aabbcc80'});
 const compiler=new RunnerGpuScene(root,unusedSurface,()=>{}),f=compiler.prepare(1);
 assert.ok(f.vertices.length>0);for(let i=0;i<f.vertices.length;i+=8){assert.ok(f.vertices[i]>=0&&f.vertices[i]<=360);assert.ok(f.vertices[i+1]>=0&&f.vertices[i+1]<=780);assert.equal(f.vertices[i+2],0);assert.equal(f.vertices[i+3],0);assert.ok(Math.abs(f.vertices[i+4]-170/255)<1e-6);assert.ok(Math.abs(f.vertices[i+7]-128/255)<1e-6);}
 compiler.dispose();
});

test('retained per-node paint state never leaks between symbol instances or after inherited attributes are removed',()=>{
 const root=scene(),defs=node(root,'defs'),art=node(defs,'g',{id:'shared'});node(art,'rect',{width:10,height:10});
 const red=node(root,'g',{fill:'#ff0000',transform:'translate(10 10)'}),blue=node(root,'g',{fill:'#0000ff',transform:'translate(40 40)'});node(red,'use',{href:'#shared'});node(blue,'use',{href:'#shared'});
 const compiler=new RunnerGpuScene(root,unusedSurface,()=>{});
 for(let i=0;i<3;i++){const f=compiler.prepare(1);assert.equal(f.vertices[0],10);assert.equal(f.vertices[4],1);assert.equal(f.vertices[6],0);assert.equal(f.vertices[48],40);assert.equal(f.vertices[52],0);assert.equal(f.vertices[54],1);}
 red.removeAttribute('fill');red.removeAttribute('transform');const f=compiler.prepare(1);assert.equal(f.vertices[0],0);assert.equal(f.vertices[4],0);assert.equal(f.vertices[6],0);assert.equal(f.vertices[54],1);compiler.dispose();
});

test('streamed polygon parsing handles exponent notation, adjacent signs and malformed geometry without dropping vertices',()=>{
 const p=gpuContours('M.5,-1e1 12.25-10 l0 2e1 H.5z');assert.deepEqual(p,[{points:[[.5,-10],[12.25,-10],[12.25,10],[.5,10]],closed:true}]);
 for(const bad of['M0','M0 0L2','M0 0L1e+ 2','M0 0C1 2 3 4 5 6'])assert.equal(gpuContours(bad),null);
 const q=gpuTriangulate([[0,0],[4,0],[8,0],[8,8]]);assert.ok(q);assert.equal(q.length,3);assert.equal(Math.abs(gpuArea(q)),32);
});
test('cached presentation follows inherited changes, removal and live palette variables while geometry alone leaves it intact',()=>{
 const root=scene(),g=node(root,'g',{fill:'#f00'}),p=node(g,'path',{d:'M10 10h20v20H10Z'}),compiler=new RunnerGpuScene(root,unusedSurface,()=>{});
 const color=()=>Array.from(compiler.prepare(1).vertices.slice(4,8));assert.deepEqual(color(),[1,0,0,1]);p.setAttribute('fill','#0f0');assert.deepEqual(color(),[0,1,0,1]);const version=p.presentationVersion;p.setAttribute('d','M12 12h20v20H12Z');assert.equal(p.presentationVersion,version);assert.deepEqual(color(),[0,1,0,1]);p.removeAttribute('fill');g.setAttribute('fill','#00f');assert.deepEqual(color(),[0,0,1,1]);g.setAttribute('fill','var(--accent)');g.style.setProperty('--accent','#ff0');assert.deepEqual(color(),[1,1,0,1]);g.style.setProperty('--accent','#0ff');assert.deepEqual(color(),[0,1,1,1]);compiler.dispose();
});
