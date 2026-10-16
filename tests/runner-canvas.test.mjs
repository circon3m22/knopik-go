import assert from 'node:assert/strict';
import test from 'node:test';
import {RunnerSceneDocument,cloneRunnerScene} from '../app/runner-scene-model.ts';
import {RunnerCanvasPainter,runnerCanvasTransform,RUNNER_CANVAS_CONTEXT} from '../app/runner-canvas.ts';
import {RunnerRenderer} from '../app/runner-renderer.ts';
import {RunnerEngine} from '../app/runner-engine.ts';
import {runnerSvgScene,resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {runnerPathBounds} from '../app/runner-path-bounds.ts';

function model(width=360,height=780) {
 const doc=new RunnerSceneDocument(()=>({x:0,y:0,width,height})),root=doc.createElementNS('','svg');root.setAttribute('viewBox',`0 0 360 ${height}`);return root;
}
function node(root,tag,attrs={}) {const n=root.ownerDocument.createElementNS('',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));root.append(n);return n;}
class FakePath {constructor(source=''){this.source=source;}addPath(){}rect(){}}
const multiply=(m,n)=>({a:m.a*n.a+m.c*n.b,b:m.b*n.a+m.d*n.b,c:m.a*n.c+m.c*n.d,d:m.b*n.c+m.d*n.d,e:m.a*n.e+m.c*n.f+m.e,f:m.b*n.e+m.d*n.f+m.f});
function surface() {
 const canvas={width:1,height:1,draws:[],requests:[]},stack=[];
 const context={canvas,globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineJoin:'miter',lineCap:'butt',imageSmoothingEnabled:true,matrix:{a:1,b:0,c:0,d:1,e:0,f:0},
 save(){stack.push({...this});},restore(){Object.assign(this,stack.pop());},
 setTransform(a,b,c,d,e,f){this.matrix={a,b,c,d,e,f};},getTransform(){return this.matrix;},
 transform(a,b,c,d,e,f){this.matrix=multiply(this.matrix,{a,b,c,d,e,f});},translate(e,f){this.transform(1,0,0,1,e,f);},scale(a,d){this.transform(a,0,0,d,0,0);},
 clearRect(){canvas.draws.push({type:'clear'});},fillRect(){canvas.draws.push({type:'background'});},clip(){canvas.draws.push({type:'clip'});},
 fill(path){canvas.draws.push({type:'fill',d:path.source,alpha:this.globalAlpha,color:this.fillStyle});},stroke(path){canvas.draws.push({type:'stroke',d:path.source,width:this.lineWidth});},
 drawImage(image){canvas.draws.push({type:'image',image,alpha:this.globalAlpha,composite:this.globalCompositeOperation});},fillText(text){canvas.draws.push({type:'text',text});}};
 canvas.getContext=(_type,options)=>{canvas.requests.push(options);return context;};return canvas;
}
const frameSurface=screen=>screen.draws.filter(d=>d.type==='image').at(-1).image;
function withPaths(fn){const original=globalThis.Path2D;globalThis.Path2D=FakePath;try{const result=fn();if(result?.then)return result.finally(()=>{globalThis.Path2D=original;});globalThis.Path2D=original;return result;}catch(error){globalThis.Path2D=original;throw error;}}

test('canvas transform order agrees with SVG, including rotations around a point',()=>{
 assert.deepEqual(runnerCanvasTransform('translate(10 -20) scale(2 3)'),[2,0,0,3,10,-20]);
 const m=runnerCanvasTransform('rotate(90 4 5)');assert.ok(Math.abs(m[0]*4+m[2]*5+m[4]-4)<1e-10);assert.ok(Math.abs(m[1]*4+m[3]*5+m[5]-5)<1e-10);
 assert.deepEqual(runnerCanvasTransform('matrix(2 0 0 3 10 -20)'),[2,0,0,3,10,-20]);
});

test('canvas output retains native pixel density, culls only offscreen sprites, and frees its bounded cache',()=>withPaths(()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'tree'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'#abc'});
 const use=node(root,'use',{href:'#tree',transform:'translate(30 40)'}),screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface,32768);
 painter.paint(3);assert.equal(screen.width,1080);assert.equal(screen.height,2340);assert.equal(painter.stats.sprites,1);assert.equal(painter.stats.textures,1);assert.equal(painter.stats.textureBytes,6400);
 use.setAttribute('transform','translate(900 40)');painter.paint(3);assert.equal(painter.stats.culled,1);assert.equal(painter.stats.sprites,0);
 const buffer=frameSurface(screen),textures=buffer.draws.filter(d=>d.type==='image').map(d=>d.image);painter.dispose();assert.ok(textures.every(t=>t.width===1&&t.height===1));assert.equal(buffer.width,1);
}));

test('sprite colors invalidate only when the sprite uses that variable',()=>withPaths(()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'coin'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'var(--coin, #ffc)'});node(root,'use',{href:'#coin',transform:'translate(30 40)'});
 const painter=new RunnerCanvasPainter(root,surface(),surface);root.style.setProperty('--coin','#ffc');painter.paint(1);const count=painter.stats.textures;
 root.style.setProperty('--run-sky','#bbc');painter.paint(1);assert.equal(painter.stats.textures,count);
 root.style.setProperty('--coin','#aae');painter.paint(1);assert.equal(painter.stats.textures,count+1);painter.dispose();
}));

test('cache eviction releases backing stores and never reduces a large sprite resolution',()=>withPaths(()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'tree'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'var(--leaf, #abc)'});node(root,'use',{href:'#tree',transform:'translate(30 40)'});
 const screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface,8192),made=[];
 for(let i=0;i<30;i++){root.style.setProperty('--leaf',`#${i.toString(16).padStart(6,'0')}`);painter.paint(2);made.push(frameSurface(screen).draws.filter(d=>d.type==='image').at(-1).image);assert.ok(painter.stats.textureBytes<=8192);}
 assert.ok(made.some(s=>s.width===1));
 painter.paint(8);assert.equal(painter.stats.sprites,0);assert.ok(painter.stats.paths>0);assert.equal(screen.width,2880);painter.dispose();
}));

test('cloning the source preserves its DOM and makes only static rig paths into cacheable SVG symbols',()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'coin'});node(art,'path',{d:'M0 0h10v10Z'});
 const head=node(root,'g',{'data-runner-head':'',transform:'rotate(5)'});node(head,'path',{d:'M-4-8h8v8H-4Z',fill:'#abc'});head.bounds={x:-4,y:-8,width:8,height:8};
 const wrap=(n,parent=null)=>{const e={localName:n.tag,attributes:[...n.attrs].map(([name,value])=>({name,value})),style:{length:0},id:n.id,textContent:n.textContent,getBBox:()=>n.bounds??{x:0,y:0,width:10,height:10},hasAttribute:k=>n.attrs.has(k),closest:s=>s==='defs'&&(n.tag==='defs'||parent?.closest(s))?e:null};e.children=n.children.map(c=>wrap(c,e));return e;};
 const source=wrap(root),before=head.children.slice(),clone=cloneRunnerScene(source,()=>({x:0,y:0,width:360,height:780}));
 assert.deepEqual(head.children,before);assert.equal(head.parent,root);
 const virtual=clone.querySelector('[data-runner-head]');assert.equal(virtual.getAttribute('transform'),'rotate(5)');assert.equal(virtual.children.length,1);assert.equal(virtual.children[0].tag,'use');
 const cached=clone.ownerDocument.ids.get(virtual.children[0].getAttribute('href').slice(1));assert.equal(cached.children[0].getAttribute('d'),before[0].getAttribute('d'));assert.ok(cached.bounds.width>=8);
});

test('translucent groups composite once and hidden pools never paint',()=>withPaths(()=>{
 const root=model(),group=node(root,'g',{opacity:.5});node(group,'path',{d:'M0 0h20v20H0Z',fill:'#f00'});node(group,'path',{d:'M10 0h20v20H10Z',fill:'#00f'});
 const hidden=node(root,'g',{display:'none'});node(hidden,'path',{d:'M90 90h5v5Z'});
 const screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface);painter.paint(1);
 const layers=frameSurface(screen).draws.filter(d=>d.type==='image');assert.equal(layers.length,1);assert.equal(layers[0].alpha,.5);assert.deepEqual(layers[0].image.draws.filter(d=>d.type==='fill').map(d=>d.alpha),[1,1]);assert.equal(painter.stats.paths,2);painter.dispose();
}));

test('72 fading particle slots with a hidden alternate do not allocate Retina-sized alpha layers',()=>withPaths(()=>{
 const root=model(),defs=node(root,'defs'),coin=node(defs,'g',{id:'coin'});coin.bounds={x:-4,y:-4,width:8,height:8};node(coin,'path',{d:'M-4-4h8v8h-8Z',fill:'#ff0'});
 for(let i=0;i<72;i++) {
  const g=node(root,'g',{opacity:.3,transform:`translate(${20+i%12*25} ${100+Math.floor(i/12)*25})`});
  node(g,'rect',{x:-2,y:-2,width:4,height:4,display:i%2?'none':'block'});node(g,'use',{href:'#coin',display:i%2?'block':'none'});
 }
 const screen=surface(),made=[],painter=new RunnerCanvasPainter(root,screen,()=>{const s=surface();made.push(s);return s;});painter.paint(3);
 assert.equal(painter.stats.alphaLayers,0);assert.equal(painter.stats.alphaPixels,0);
 assert.equal(made.filter(s=>s.width===1080&&s.height===2340).length,1);assert.equal(painter.stats.sprites,36);
 assert.ok(frameSurface(screen).draws.filter(d=>d.type==='fill'||d.type==='image').every(d=>d.alpha===.3));painter.dispose();
}));

test('overlapping translucent art keeps one group opacity in a cropped buffer at full DPR',()=>withPaths(()=>{
 const root=model(),g=node(root,'g',{opacity:.4,transform:'translate(100 200)'});node(g,'rect',{width:12,height:12,fill:'#f00'});node(g,'rect',{x:8,width:12,height:12,fill:'#00f'});
 const screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface);painter.paint(3);
 const composite=frameSurface(screen).draws.filter(d=>d.type==='image')[0];assert.equal(composite.alpha,.4);
 assert.ok(composite.image.width<=80&&composite.image.height<=64);assert.ok(painter.stats.alphaPixels<6000);assert.equal(screen.width,1080);
 assert.deepEqual(composite.image.draws.filter(d=>d.type==='fill').map(d=>d.alpha),[1,1]);painter.dispose();
}));

test('path crop bounds retain relative commands, repeated segments and Bézier control points',()=>{
 assert.deepEqual(runnerPathBounds('M10 20h20v30h-20Z'),{x:10,y:20,width:20,height:30});
 assert.deepEqual(runnerPathBounds('M10 20 30 40l-15 -30 5 10Z'),{x:10,y:10,width:20,height:30});
 assert.deepEqual(runnerPathBounds('M0 0C-10 -20 20 30 10 10'),{x:-10,y:-20,width:30,height:50});
 assert.equal(runnerPathBounds('M0 0A10 10 0 0 0 20 0'),null);
});

test('immutable bitmap sprites replace their canvas storage and close on disposal',()=>withPaths(async()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'tree'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'#abc'});node(root,'use',{href:'#tree',transform:'translate(30 40)'});
 let source,closed=0;const bitmap={width:40,height:40,close(){closed++;}},screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface,32768,s=>{source=s;return Promise.resolve(bitmap);});
 painter.paint(3);await Promise.resolve();assert.equal(source.width,1);painter.paint(3);
 assert.equal(frameSurface(screen).draws.filter(d=>d.type==='image').at(-1).image,bitmap);assert.equal(painter.stats.textureBytes,6400);assert.equal(painter.stats.bitmaps,1);
 painter.dispose();assert.equal(closed,1);
}));

test('a bitmap completing after eviction or teardown is closed and never resurrects the texture',()=>withPaths(async()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'tree'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'var(--leaf, #abc)'});node(root,'use',{href:'#tree',transform:'translate(30 40)'});
 const jobs=[];let closed=0;const painter=new RunnerCanvasPainter(root,surface(),surface,8192,()=>new Promise(resolve=>jobs.push(resolve)));
 for(const color of ['#abc','#def','#ffe']){root.style.setProperty('--leaf',color);painter.paint(2);}
 assert.equal(jobs.length,2);painter.dispose();for(const done of jobs)done({width:20,height:20,close(){closed++;}});await Promise.resolve();
 assert.equal(closed,2);assert.equal(painter.stats.bitmaps,0);
}));

test('unsupported bitmap creation keeps using the original cached canvas',()=>withPaths(async()=>{
 const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'tree'});art.bounds={x:0,y:0,width:10,height:10};node(art,'path',{d:'M0 0h10v10H0Z',fill:'#abc'});node(root,'use',{href:'#tree'});
 let tries=0;const screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface,32768,()=>{tries++;return Promise.reject(Error('unsupported'));});painter.paint(3);await Promise.resolve();painter.paint(3);
 assert.equal(tries,1);assert.equal(painter.stats.bitmaps,0);assert.equal(frameSurface(screen).draws.filter(d=>d.type==='image').at(-1).image.width,40);painter.dispose();
}));

test('the visible canvas receives one complete synchronized frame and never an intermediate clear',()=>withPaths(()=>{
 const root=model();node(root,'path',{d:'M0 0h360v780H0Z',fill:'#abc'});
 const screen=surface(),made=[],painter=new RunnerCanvasPainter(root,screen,()=>{const s=surface();made.push(s);return s;});
 for(let i=0;i<10;i++) {
  painter.paint(3);assert.equal(screen.draws.length,i+1);assert.equal(screen.draws.at(-1).type,'image');assert.equal(screen.draws.at(-1).composite,'copy');
  assert.ok(frameSurface(screen).draws.some(d=>d.type==='fill'));assert.equal(screen.requests.at(-1).desynchronized,false);
 }
 assert.equal(made.length,1);assert.equal(RUNNER_CANVAS_CONTEXT.desynchronized,false);painter.dispose();assert.equal(made[0].width,1);
}));

test('an interrupted frame leaves the previously presented canvas untouched',()=>withPaths(()=>{
 const root=model(),shape=node(root,'path',{d:'M0 0h360v780H0Z',fill:'#abc'}),screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface);
 painter.paint(3);const previous=screen.draws.slice(),size=[screen.width,screen.height];
 globalThis.Path2D=class extends FakePath {constructor(source){if(source==='bad')throw Error('interrupted');super(source);}};
 shape.setAttribute('d','bad');assert.throws(()=>painter.paint(2),/interrupted/);
 assert.deepEqual(screen.draws,previous);assert.deepEqual([screen.width,screen.height],size);painter.dispose();
}));

test('font cache refresh retains the visible frame; closing frees the Retina output',()=>withPaths(()=>{
 const root=model();node(root,'rect',{width:360,height:780,fill:'#abc'});const screen=surface(),painter=new RunnerCanvasPainter(root,screen,surface);
 painter.paint(3);painter.dispose();assert.equal(screen.width,1080);assert.equal(screen.height,2340);
 painter.paint(3);painter.dispose(true);assert.equal(screen.width,1);assert.equal(screen.height,1);
}));

test('virtual projection emits the same paths and draw order without writing browser DOM',()=>{
 const real=runnerSvgScene(),virtual=model();
 const copy=(from,to)=>{for(const [k,v] of from.attrs)to.setAttribute(k,v);for(const child of from.children){const next=node(to,child.tag);copy(child,next);}};copy(real,virtual);
 const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
 const engine=new RunnerEngine(events,{immortal:true}),a=new RunnerRenderer(real,'test'),b=new RunnerRenderer(virtual,'test');engine.start();
 const snapshot=n=>{if(n.projectedPath)n.getAttribute('d');return {tag:n.tag,attrs:[...n.attrs].filter(([k])=>!k.startsWith('style:')&&k!=='id'&&k!=='clip-path').sort(([a],[b])=>a.localeCompare(b)),children:n.children.map(snapshot)};};
 for(let i=0;i<30;i++){engine.update(1/60);a.render(engine);resetSvgMetrics();b.render(engine);assert.equal(svgMetrics.writes+svgMetrics.moves+svgMetrics.created+svgMetrics.removals,0);assert.deepEqual(snapshot(real),snapshot(virtual));}
});

test('changing a Shiba skin replaces cached Run art in both Canvas and GPU, and returning reuses its texture',()=>withPaths(async()=>{
 const {KnopikSkinPainter,knopikSkinColor}=await import('../app/knopik-skins.ts');
 const {RunnerGpuScene}=await import('../app/runner-gpu-scene.ts');
 for(const mode of ['canvas','gpu']){
  const root=model(),defs=node(root,'defs'),art=node(defs,'g',{id:'skin-head'});art.bounds={x:0,y:0,width:10,height:10};const fur=node(art,'path',{d:'M0 0h10v10H0Z',fill:'#d69a5b'}),player=node(root,'g');node(player,'use',{href:'#skin-head',transform:'translate(30 40)'});
  const skin=new KnopikSkinPainter(player,id=>root.ownerDocument.ids.get(id)??null),compiler=mode==='canvas'?new RunnerCanvasPainter(root,surface(),surface):new RunnerGpuScene(root,surface,()=>{});
  const paint=()=>mode==='canvas'?compiler.paint(1):compiler.prepare(1);
  skin.paint('shiba-white');paint();const initial=compiler.stats.textures;
  skin.paint('shiba-black');paint();assert.equal(fur.getAttribute('fill'),knopikSkinColor('#d69a5b','shiba-black'));assert.equal(compiler.stats.textures,initial+1,mode+' must redraw the new coat');
  skin.paint('shiba-white');paint();assert.equal(compiler.stats.textures,initial+1,mode+' reuses the previous white coat');compiler.dispose();
 }
}));
