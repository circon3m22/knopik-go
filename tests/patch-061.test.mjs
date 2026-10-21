import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import postcss from 'postcss';
import {vaultCoinPose} from '../app/vault-coin-physics.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {ARCADE_CATALOG} from '../app/arcade-catalog.ts';
import {emptyBuffStock} from '../app/buff-shelf-engine.ts';
import {defaultLaboratory} from '../app/laboratory-engine.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AdventureScene}=await import('../app/adventure-artwork.tsx');
const {NeighborhoodScene}=await import('../app/neighborhood-artwork.tsx');
const {ArcadeLibrary,ArcadeGamePanel}=await import('../app/arcade-library.tsx');
const {ArcadeGameCover}=await import('../app/arcade-game-cover.tsx');
const {knopikMotion}=await import('../app/knopik-adventure-animation.ts');
const read=name=>readFileSync(new URL('../app/'+name,import.meta.url),'utf8');

test('Ultra keeps the earlier surfaces and lighting without the rejected 0.6.1 textures',()=>{
 setGraphicsQuality('ultra');
 try{
  for(const level of [2,7,12,17,22,27,32]){
   const e=dungeonGame(level),html=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData}));
   assert.ok(html.includes('data-ultra-world=""'));assert.ok(html.includes('-level-floor'));
   assert.doesNotMatch(html,/data-ultra-material|materials-061|data-ultra-architecture|data-ultra-atmosphere|data-fx-ultra/);
   assert.equal((html.match(/data-dungeon-effect=/g)||[]).length,36);
  }
  for(const theme of ['classic','soda','mint','night','bath','emerald','skyline','observatory']){
   const html=render(h(AdventureScene,{area:'apartment',theme}));assert.ok(html.includes('data-ultra-world=""'));assert.ok(html.includes('-home-planks'));
   assert.doesNotMatch(html,/data-ultra-material|ultra-home-wood|ultra-home-stone|data-ultra-atmosphere/);
  }
  for(const night of [false,true]){
   const html=render(h(NeighborhoodScene,{night,prefix:'restored-ultra'}));
   assert.ok(html.includes('data-city-life='),'the living city remains');assert.doesNotMatch(html,/data-ultra-material|data-ultra-river|data-ultra-river-wave/);
  }
 }finally{setGraphicsQuality('medium');}
});

test('quarter poses keep separated grounded feet, shared wrists and three distinct useful actions',()=>{
 const e=dungeonGame(5),states=new Set();
 for(const facing of ['front-right','front-left','back-right','back-left']){
  e.moving=false;e.punchTime=0;e.weapon='fist';const idle=knopikMotion(e,facing);assert.equal(idle.legs[0].foot.y,-4);assert.equal(idle.legs[1].foot.y,3);assert.equal(idle.quarterAction,'idle');
  e.moving=true;e.walkDistance=14;states.add(knopikMotion(e,facing).quarterAction);
  e.weapon='rifle';e.punchTime=.08;states.add(knopikMotion(e,facing).quarterAction);
  e.moving=false;e.punchTime=0;e.dodgeTime=.2;states.add(knopikMotion(e,facing).quarterAction);e.dodgeTime=0;
  assert.doesNotMatch(JSON.stringify(knopikMotion(e,facing)),/NaN|Infinity/);
 }
 assert.deepEqual([...states],['walk','focus','burst']);
});

test('the gallery exposes all games without placing purchase and launch controls on every cover',()=>{
 const covers=ARCADE_CATALOG.map(g=>render(h(ArcadeGameCover,{kind:g.id})));assert.equal(new Set(covers).size,17);
 for(let i=0;i<covers.length;i++){assert.ok(covers[i].includes(`data-game-cover="${ARCADE_CATALOG[i].id}"`));assert.doesNotMatch(covers[i],/<image|<filter|<.*Gradient|NaN|undefined/);}
 const noop=()=>{},props={stock:emptyBuffStock(),laboratory:defaultLaboratory(),balance:1000,resting:false,busy:false,records:{},onPlay:noop,onBuy:noop,onBrew:noop,onUseBuff:noop,onClose:noop,onNavigate:noop},html=render(h(ArcadeLibrary,props));
 assert.equal((html.match(/data-arcade-tile=/g)||[]).length,17);assert.ok(html.includes('data-library-layout="gallery-3"'));assert.ok(!html.includes('class="arcade-game-actions"'));
 assert.ok(html.includes('Игры'));assert.ok(!html.includes('>Настройки<'));assert.ok(!html.includes('>Припасы<'));
});

test('the redrawn covers have distinct visible scenes and no unpainted transparent areas',async()=>{
 const hashes=new Set();
 for(const {id}of ARCADE_CATALOG){
  const html=render(h(ArcadeGameCover,{kind:id}));assert.ok(html.includes('viewBox="0 0 256 160"'));assert.ok(html.includes(`data-cover-revision="${['tralalero','ballerina'].includes(id)?'character-scenes-3':'pixel-scenes-2'}"`));assert.ok(!html.includes('<text'));
  const pixels=await sharp(Buffer.from(html)).ensureAlpha().raw().toBuffer(),colors=new Set();
  for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i+3],255,id+' fills its own canvas');colors.add(pixels.subarray(i,i+3).toString('hex'));}
  assert.ok(colors.size>=10,id+' has shaded artwork');hashes.add(createHash('sha256').update(pixels).digest('hex'));
 }
 assert.equal(hashes.size,17,'artwork is different even without ids or labels');
});

test('gallery titles stay with their artwork and each game page preserves entry and purchase conditions',()=>{
 const noop=()=>{},stock=Object.fromEntries(Object.keys(emptyBuffStock()).map(k=>[k,1])),before=JSON.stringify(stock);
 const props={stock,laboratory:{...defaultLaboratory(),unlocked:ARCADE_CATALOG.map(g=>g.id)},balance:777777777,resting:false,busy:false,records:{},onPlay:noop,onBuy:noop,onBrew:noop,onUseBuff:noop,onClose:noop,onNavigate:noop,onBack:noop};
 const gallery=parseAdventureSvg(render(h(ArcadeLibrary,props))),cards=gallery.querySelectorAll('[class="arcade-library-card"]');assert.equal(cards.length,17);
 for(const [i,card]of cards.entries()){
  const tile=card.querySelector('[class="arcade-game-tile"]'),title=card.querySelector('[role="heading"]');
  assert.equal(tile.getAttribute('data-arcade-tile'),ARCADE_CATALOG[i].id);assert.equal(title.textContent,ARCADE_CATALOG[i].title);assert.equal(card.getAttribute('aria-labelledby'),title.id);
  assert.equal(card.querySelector('[class="arcade-library-cover"]').children[0].getAttribute('data-game-cover'),ARCADE_CATALOG[i].id);
 }
 for(const state of [{},{busy:true},{resting:true},{balance:0},{stock:emptyBuffStock()}])for(const game of ARCADE_CATALOG){
  const tree=parseAdventureSvg(render(h(ArcadeGamePanel,{...props,...state,kind:game.id}))),actions=tree.querySelector('[class="arcade-game-actions"]');assert.equal(actions.children.length,2);
  const skillGame=['lime','matcha','tralalero','ballerina','bombardiro','verity'].includes(game.id),blocked=!!state.stock||state.busy===true||!skillGame&&(state.resting===true||state.balance===0),play=actions.children[0];
  assert.equal(play.getAttribute('disabled')!==null,blocked);assert.ok(tree.querySelector(`[id="${play.getAttribute('aria-describedby')}"]`));
  assert.equal(tree.querySelector('[class="arcade-game-hero"]').children[0].getAttribute('data-game-cover'),game.id);assert.ok(tree.querySelector('details'));
 }
 assert.equal(JSON.stringify(stock),before,'opening an illustration never spends a drink');
 const styles=postcss.parse(read('patch-061.css'));let opaqueDisabled=false,hiddenGallery=false;
 styles.walkRules(r=>{const d=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));if(r.selector==='.arcade-library .arcade-game-actions>button:disabled'){assert.equal(d.opacity,'1');assert.equal(d.color,'var(--menu-muted)');opaqueDisabled=true;}if(r.selector==='.arcade-library .arcade-gallery[hidden]'){assert.equal(d.display,'none');hiddenGallery=true;}});assert.ok(opaqueDisabled&&hiddenGallery);
});

test('the selected game uses exactly one shared callback for play, purchase, first brew and return',()=>{
 const calls=[],stock=Object.fromEntries(Object.keys(emptyBuffStock()).map(k=>[k,1])),props={stock,laboratory:{...defaultLaboratory(),unlocked:ARCADE_CATALOG.map(g=>g.id)},balance:1000,resting:false,busy:false,records:{},kind:'lime',onPlay:id=>calls.push(['play',id]),onBuy:id=>calls.push(['buy',id]),onBrew:id=>calls.push(['brew',id]),onBack:()=>calls.push(['back'])};
 const buttons=tree=>{const result=[];const visit=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(visit);return;}if(n.type==='button')result.push(n);visit(n.props?.children);};visit(tree);return result;};
 const page=buttons(ArcadeGamePanel(props));page.find(b=>b.props.className==='arcade-play-button').props.onClick();page.find(b=>b.props.className==='arcade-supply-button').props.onClick();page.find(b=>b.props.className==='arcade-game-back').props.onClick();
 const locked=buttons(ArcadeGamePanel({...props,laboratory:defaultLaboratory()}));locked.find(b=>b.props.className==='arcade-supply-button').props.onClick();
 assert.deepEqual(calls,[['play','lime'],['buy','lime'],['back'],['brew','lime']]);assert.equal(stock.lime,1);
});

test('coins accelerate downwards, converge on the safe and finish without a persistent particle loop',()=>{
 const target={x:290,y:620};
 for(let i=0;i<44;i++){
  const delay=(i*73%420)/1000,duration=.8+(i*19%33)/100;
  const a=vaultCoinPose(i,delay+.1,390,target),b=vaultCoinPose(i,delay+.2,390,target),c=vaultCoinPose(i,delay+.3,390,target),land=vaultCoinPose(i,delay+duration,390,target);
  assert.ok(a.y<b.y&&b.y<c.y);assert.ok(c.y-b.y>b.y-a.y);assert.ok(Math.abs(land.x-target.x)<.001);assert.ok(Math.abs(land.y-target.y)<.001);assert.equal(vaultCoinPose(i,2,390,target).visible,false);
  for(let t=0;t<2;t+=.03){const p=vaultCoinPose(i,t,390,target);assert.ok(Object.values(p).every(v=>typeof v==='boolean'||Number.isFinite(v)));assert.ok(p.flip>=.13&&p.flip<=1);assert.ok(p.opacity>=0&&p.opacity<=1);}
 }
 const component=read('vault-deposit-rain.tsx');assert.match(component,/return\(\)=>cancelAnimationFrame\(frame\)/);assert.match(component,/prefers-reduced-motion:reduce/);assert.doesNotMatch(component,/setInterval|setState|updateCoins|setVaultCoins/);
});

test('all eight menu palettes retain readable opaque navigation and the requested header order',()=>{
 const css=postcss.parse(read('menu-readability.css')),palettes=[];
 css.walkRules(r=>{const d=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));if(d['--menu-card-rgb'])palettes.push(d);});assert.equal(palettes.length,8);
 const lum=c=>{const rgb=c.startsWith('#')?c.slice(1).match(/../g).map(v=>parseInt(v,16)):c.split(' ').map(Number);return rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
 for(const p of palettes)for(const key of ['--menu-ink','--menu-muted']){const a=lum(p[key]),b=lum(p['--menu-card-rgb']);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,key);}
 const source=read('knopik-go.tsx');assert.ok(source.indexOf('className="tap-header-tools"')<source.indexOf('className="tap-quick-actions"'));assert.ok(source.indexOf('className="tap-quick-actions"')<source.indexOf('className="tap-buffs"'));assert.match(source,/progress-compact-title[\s\S]{0,100}levelState.level/);
 assert.doesNotMatch(read('tap-menu.css'),/display:contents|width:62px|grid-template-rows:23px 15px/,'the former single-row layout must not constrain the full-width progress button');
 assert.doesNotMatch(read('patch-061.css'),/backdrop-filter/);
});
