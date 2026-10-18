import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import postcss from 'postcss';
const read=x=>readFileSync(new URL(`../app/${x}`,import.meta.url),'utf8');
test('individual gameplay controls stay opaque and unblurred on every graphics tier',()=>{
 const root=postcss.parse(read('gameplay-controls.css'));let blur=false,attack=false,selected=false;
 root.walkRules(rule=>{
  assert.match(rule.selector,/:root \.(?:game-native-dialog\.)?adventure-game\.pixel-game/);
  assert.doesNotMatch(rule.selector,/data-knopik-graphics|game-shell|settings-backdrop|shop-backdrop/);
  const d=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
  if(d['backdrop-filter']){blur=true;assert.equal(d['backdrop-filter'],'none');assert.equal(d['-webkit-backdrop-filter'],'none');}
  if(rule.selector.endsWith('.adventure-attack')){attack=true;assert.equal(d.background,'#b76253');}
  if(rule.selector.endsWith('[aria-pressed="true"]')){selected=true;assert.equal(d.background,'#3a6359');}
 });assert.ok(blur&&attack&&selected);
 root.walkDecls(d=>assert.ok(!['height','width','position','inset','transform','overflow','grid-template-rows','grid-template-columns'].includes(d.prop)));
 assert.match(read('layout.tsx'),/import "\.\/gameplay-inset-hud\.css"/);
 assert.match(read('adventure.css'),/\.adventure-viewport\s*\{[^}]*overflow:\s*hidden/);
 assert.match(read('game-play-ui.css'),/--play-panel:\s*#222c33;\s*--play-surface:\s*#2c3941/);
});
test('one opaque inset header and a bare footer share the same world paint and lighting boundary',()=>{
 const root=postcss.parse(read('gameplay-inset-hud.css'));let header=false,footer=false,scene=false,viewport=false;
 root.walkRules(r=>{
  const d=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
  if(r.selector.endsWith('.adventure-hud-primary')){header=true;assert.equal(d.background,'#1f2d38');assert.equal(d.border,'1px solid #94aaa6');}
  if(r.selector.endsWith('>.adventure-controls')){footer=true;assert.equal(d.background,'none');assert.equal(d['border-color'],'transparent');assert.equal(d['z-index'],'5');}
  if(r.selector.endsWith('>:is(.adventure-viewport,.neighborhood-viewport)')){viewport=true;assert.equal(d.overflow,'visible');assert.equal(d.isolation,'auto');}
  if(r.selector.endsWith('>:is(.adventure-scene,.neighborhood-scene)')){scene=true;assert.equal(d.overflow,'visible');assert.equal(d['z-index'],'0');}
 });assert.ok(header&&footer&&scene&&viewport);
 root.walkDecls(d=>assert.ok(!['height','width','min-height','inset','transform','grid-template-rows','grid-template-columns'].includes(d.prop),'paint must not change the measured camera or controller'));
 const graphics=postcss.parse(read('world-graphics.css'));let fullFrame=0;
 graphics.walkRules(r=>{if(!/::(?:before|after)/.test(r.selector))return;if(r.selector.includes('.adventure-layout')){assert.doesNotMatch(r.selector,/\.adventure-viewport::|\.neighborhood-viewport::/);fullFrame++;}});
 assert.ok(fullFrame>=5,'every world lighting tier covers the same full layout');
});
test('fully covered tap art remains paused and hidden without touching the world dialog or unmounting menu state',()=>{
 const css=postcss.parse(read('tap-environment.css'));let hidden=false,paused=false;
 css.walkRules(r=>{if(!r.selector.includes('data-world-active'))return;assert.doesNotMatch(r.selector,/adventure-game|game-native-dialog/);for(const d of r.nodes){hidden ||= d.prop==='visibility'&&d.value==='hidden';paused ||= d.prop==='animation-play-state'&&d.value==='paused';}});
 assert.ok(hidden&&paused);assert.match(read('knopik-go.tsx'),/data-world-active=\{runnerOpen\|\|adventureOpen\|\|neighborhoodOpen/);
 assert.match(read('runner-backdrop.tsx'),/return children/);
});
