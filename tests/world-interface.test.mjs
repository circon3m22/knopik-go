import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h,Children} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync,existsSync} from 'node:fs';import postcss from 'postcss';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import {dungeonMapLayout} from '../app/dungeon-map-layout.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {GamePlayHud}=await import('../app/game-play-hud.tsx');
const {GameModal}=await import('../app/game-modal.tsx');
const {AdventureWeaponPicker}=await import('../app/adventure-weapon-picker.tsx');
const {AdventureSupplies}=await import('../app/adventure-supplies.tsx');
const {DungeonMapArt}=await import('../app/dungeon-map-art.tsx');
const {WorldMapCard}=await import('../app/world-map-card.tsx');
const read=file=>readFileSync(new URL('../app/'+file,import.meta.url),'utf8');

test('bare HUD exposes exactly pause and map; concealed chrome is inert and the FPS meter is absent in pause',()=>{
 const calls=[],props={hp:2,balance:777777777,place:'Гостиная',eyebrow:'Дом',onPause:()=>calls.push('pause'),onMap:()=>calls.push('map')};
 const tree=GamePlayHud(props),row=Children.toArray(tree.props.children.props.children),actions=Children.toArray(row[1].props.children);
 assert.equal(row.length,2);assert.equal(actions.length,2);actions.forEach(b=>b.props.onClick());assert.deepEqual(calls,['pause','map']);
 const markup=render(h(GameModal,{className:'adventure-game pixel-game',label:'Пауза',hideFrameRate:true},h(GamePlayHud,{...props,concealed:true})));
 const parsed=parseAdventureSvg(markup),header=parsed.querySelector('[class="adventure-hud"]');assert.equal(header.getAttribute('inert'),'');assert.equal(header.getAttribute('aria-hidden'),'true');assert.ok(!markup.includes('game-frame-rate'));
 const css=postcss.parse(read('gameplay-control-art.css'));let hidden=false;
 css.walkRules(r=>{if(!r.selector.includes('data-world-chrome-hidden'))return;hidden=true;for(const d of r.nodes)assert.ok(['visibility','pointer-events'].includes(d.prop),'pausing must not resize the camera rows');});assert.ok(hidden);
 for(const file of ['adventure-game.tsx','neighborhood-game.tsx','coop-game.tsx']){const source=read(file);assert.match(source,/data-world-chrome-hidden=/);assert.match(source,/hideFrameRate=/);assert.doesNotMatch(source,/taskOpen|aria-label="Текущее задание"/);}
});

test('weapon and supply hit targets each contain one independently drawn surface; menus have no corner override',()=>{
 const markup=render(h('div',null,h(AdventureWeaponPicker,{phase:'playing',weapon:'rifle',weaponTier:7,onSelect(){}}),h(AdventureSupplies,{phase:'playing',healCount:2,shieldCount:1,surgeCount:3,surgeSeconds:0,canHeal:true,shieldReady:false,onHeal(){},onShield(){},onSurge(){}})));
 const root=parseAdventureSvg(markup),controls=root.querySelectorAll('[data-game-control]');assert.equal(controls.length,11);
 for(const control of controls){assert.equal(control.querySelectorAll('[class="game-control-glass"]').length,1);assert.equal(control.querySelectorAll('[class="game-control-rim"]').length,1);assert.ok(control.getAttribute('aria-label'));}
 assert.ok(!existsSync(new URL('../app/pixel-button-corners.css',import.meta.url)));
 const css=postcss.parse(read('gameplay-control-art.css'));
 css.walkDecls('clip-path',d=>{assert.match(d.parent.selector,/\.adventure-game/);assert.doesNotMatch(d.parent.selector,/game-shell|settings|shop/);});
 css.walkRules(r=>{if(r.selector.includes('.game-control-glass'))assert.ok(!r.selector.includes('[data-game-control]::'),'blur belongs on the independent surface');});
 for(const quality of ['low','medium','high','very-high','ultra']){
  const values={};css.walkRules(r=>{if(r.parent.type==='atrule'&&r.parent.name==='media')return;
   if(r.selector==='.adventure-game.pixel-game'||r.selector.includes(`[data-knopik-graphics="${quality}"]`))for(const d of r.nodes)if(d.type==='decl'&&d.prop.startsWith('--world-control'))values[d.prop]=d.value;
  });assert.equal(values['--world-control-alpha'],['low','medium'].includes(quality)?'1':'.58');assert.equal(values['--world-control-blur'],['low','medium'].includes(quality)?'none':'blur(12px) saturate(115%)');
 }
});

test('every campaign schematic keeps rooms separate and authored cardinal passages intact',()=>{
 for(const level of ADVENTURE_LEVELS){
  const map=dungeonMapLayout(level);
  for(let i=0;i<map.rooms.length;i++)for(let j=i+1;j<map.rooms.length;j++){const a=map.rooms[i],b=map.rooms[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${level.id}: overlapping room nodes`);}
  for(const gate of level.gates){const a=map.center(gate.from),b=map.center(gate.to);assert.ok((a.x===b.x)!==(a.y===b.y),`${level.id}: passage orientation`);}
  for(const [i,r]of level.rooms.entries()){
   const player=map.project({x:r.x+r.w/2,y:r.y+r.h/2}),node=map.rooms[i];assert.ok(player.x>node.x&&player.x<node.x+node.w&&player.y>node.y&&player.y<node.y+node.h);
  }
 }
});

test('room inspection works by touch and keyboard, and the current objective is readable outside the drawing',()=>{
 const e=dungeonGame(35),selected=[],map=DungeonMapArt({level:e.levelData,view:e.view(),player:e.player,cleared:e.cleared,gates:e.levelData.gates.map((_,i)=>e.gateOpen(i)),onSelectRoom:i=>selected.push(i)});
 const groups=Children.toArray(map.props.children).flatMap(n=>Array.isArray(n)?n:[n]).filter(n=>n?.props?.['data-map-room']!==undefined);
 // React flattens the authored room array, not the graph edges or markers.
 assert.equal(groups.length,e.levelData.rooms.length);
 groups[2].props.onClick();groups[3].props.onKeyDown({key:'Enter',preventDefault(){}});assert.deepEqual(selected,[2,3]);
 const html=render(h(WorldMapCard,{title:e.levelData.name,subtitle:'КАРТА',objective:e.view().objective,onClose(){},legend:h('span',null,'Вы')},map));
 assert.ok(html.includes('ТЕКУЩЕЕ ЗАДАНИЕ'));assert.ok(html.includes(e.view().objective));assert.ok(html.includes('Закрыть карту'));assert.ok(html.includes('Вернуться в игру'));
});

test('bare-paw attack and interaction share the equipped skin across every skin palette',async()=>{
 const {KNOPIK_SKINS,knopikSkinColor}=await import('../app/knopik-skins.ts');
 const {KNOPIK_FUR}=await import('../app/knopik-fur.ts');
 const {AdventureWeaponArt}=await import('../app/adventure-level-art.tsx');
 const {GameUiIcon}=await import('../app/game-ui-icon.tsx');
 const distinct=new Set();
 for(const skin of Object.keys(KNOPIK_SKINS)){
  const attack=render(h(AdventureWeaponArt,{weapon:'fist',icon:true,skin})),action=render(h(GameUiIcon,{kind:'interact',skin}));
  for(const markup of [attack,action]){assert.ok(markup.includes(`data-knopik-paw="${skin}"`));assert.ok(markup.includes(`fill="${knopikSkinColor(KNOPIK_FUR.fur,skin)}"`));}
  const picker=render(h(AdventureWeaponPicker,{phase:'playing',weapon:'fist',weaponTier:0,onSelect(){},skin}));
  assert.ok(picker.includes(`data-knopik-paw="${skin}"`));distinct.add(attack);
 }
 assert.equal(distinct.size,Object.keys(KNOPIK_SKINS).length);
 for(const kind of ['pause','map']){const icon=render(h(GameUiIcon,{kind}));assert.ok(icon.includes('fill="#fffdf1"'));assert.ok(icon.includes('fill="#162c36"'));assert.ok(!icon.includes('stroke='),'integer filled outlines stay crisp at pixel scale');}
 assert.match(read('coop-game.tsx'),/<CoopGameControls skin=\{engine\.actors\[slot\]\.equipment\.skin\}/);
});
