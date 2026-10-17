import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {attachGameplayGlass} from '../app/gameplay-glass.ts';
function fixture(quality='high'){
 const props=new Map(),observers={resize:[],mutation:[]};let writes=0;
 class Resize{constructor(fn){this.fn=fn;this.nodes=[];observers.resize.push(this);}observe(node){this.nodes.push(node);}disconnect(){this.closed=true;}}
 class Mutation{constructor(fn){this.fn=fn;observers.mutation.push(this);}observe(node,options){this.node=node;this.options=options;}disconnect(){this.closed=true;}}
 const original={ResizeObserver:globalThis.ResizeObserver,MutationObserver:globalThis.MutationObserver};
 globalThis.ResizeObserver=Resize;globalThis.MutationObserver=Mutation;
 const header={offsetHeight:54},controls={offsetHeight:178,offsetWidth:390},root={dataset:{knopikGraphics:quality}};
 const layout={dataset:{},style:{getPropertyValue:key=>props.get(key)||'',setProperty:(key,value)=>{writes++;props.set(key,value);},removeProperty:key=>props.delete(key)},querySelector:selector=>selector.includes('hud')?header:controls};
 const dialog={querySelector:()=>layout,ownerDocument:{documentElement:root}};
 return {props,observers,header,controls,root,layout,dialog,writes:()=>writes,restore:()=>Object.assign(globalThis,original)};
}
test('glass uses the real panel sizes without shrinking or rebuilding controls and updates after rotation',()=>{
 const f=fixture();try{
  const detach=attachGameplayGlass(f.dialog);
  assert.equal(f.layout.dataset.gameGlass,'on');assert.equal(f.props.get('--glass-hud-height'),'54px');assert.equal(f.props.get('--glass-controls-height'),'178px');assert.equal(f.props.get('--glass-controls-width'),'390px');
  assert.deepEqual(f.observers.resize[0].nodes,[f.header,f.controls]);
  const writes=f.writes();f.observers.resize[0].fn();assert.equal(f.writes(),writes,'unchanged layout causes no style writes');
  f.controls.offsetWidth=210;f.controls.offsetHeight=290;f.observers.resize[0].fn();assert.equal(f.props.get('--glass-controls-width'),'210px');assert.equal(f.props.get('--glass-controls-height'),'290px');
  f.root.dataset.knopikGraphics='very-high';f.observers.mutation[0].fn();assert.equal(f.observers.resize.length,1,'upper-tier changes keep the same layout observer');
  detach();assert.equal(f.props.size,0);assert.equal(f.layout.dataset.gameGlass,undefined);assert.ok(f.observers.resize[0].closed);assert.ok(f.observers.mutation[0].closed);
  f.observers.resize[0].fn();f.observers.mutation[0].fn();assert.equal(f.props.size,0,'late callbacks cannot reactivate a closed dialog');
 }finally{f.restore();}
});
test('low and medium do not activate the scene extension or a resize observer; switching back restores normal rows',()=>{
 for(const quality of ['low','medium']){const f=fixture(quality);try{
  const detach=attachGameplayGlass(f.dialog);assert.equal(f.layout.dataset.gameGlass,undefined);assert.equal(f.observers.resize.length,0);assert.equal(f.props.size,0);
  assert.deepEqual(f.observers.mutation[0].options,{attributes:true,attributeFilter:['data-knopik-graphics']});
  f.root.dataset.knopikGraphics='high';f.observers.mutation[0].fn();assert.equal(f.layout.dataset.gameGlass,'on');
  f.root.dataset.knopikGraphics=quality;f.observers.mutation[0].fn();assert.equal(f.layout.dataset.gameGlass,undefined);assert.equal(f.props.size,0);assert.ok(f.observers.resize[0].closed);
  detach();
 }finally{f.restore();}}
});
test('other dialogs are untouched and need no observers',()=>{
 assert.doesNotThrow(()=>attachGameplayGlass({querySelector:()=>null})());
});

test('the actual adventure scene fills behind both panels on tall phones and in landscape without opaque letterbox bands',async()=>{
 const {createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
 const {parseAdventureSvg}=await import('./helpers/adventure-svg-dom.mjs');
 const {dungeonGame}=await import('./helpers/dungeon-fixtures.mjs');
 const engine=dungeonGame(1),svg=parseAdventureSvg(renderToStaticMarkup(createElement(AdventureScene,{area:'sewer',layout:engine.levelData,theme:'classic',level:1})));
 let enabled=true;svg.closest=()=>enabled?{}:null;
 const renderer=new AdventureRenderer(svg,true);
 for(const [width,height]of [[393,852],[320,700],[844,390]]){
  renderer.resize(width,height);renderer.paint(engine,true);
  const box=svg.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(Math.abs(box[3]/box[2]-height/width)<.0001,'world projection matches the entire glass viewport');
 }
 enabled=false;renderer.resize(393,852);renderer.paint(engine,true);
 assert.equal(Number(svg.getAttribute('viewBox').split(' ')[3]),800,'ordinary graphics retain the previous camera limits');
});
