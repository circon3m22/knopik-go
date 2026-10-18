import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import postcss from 'postcss';
const read=x=>readFileSync(new URL(`../app/${x}`,import.meta.url),'utf8');
test('classic gameplay panels and controls stay opaque and unblurred on every graphics tier',()=>{
 const root=postcss.parse(read('gameplay-controls.css'));let panels=false,blur=false,attack=false,selected=false;
 root.walkRules(rule=>{
  assert.match(rule.selector,/:root \.(?:game-native-dialog\.)?adventure-game\.pixel-game/);
  assert.doesNotMatch(rule.selector,/data-knopik-graphics|game-shell|settings-backdrop|shop-backdrop/);
  const d=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
  if(rule.selector.includes('.adventure-hud,.adventure-controls')){panels=true;assert.equal(d.background,'var(--play-panel)');}
  if(d['backdrop-filter']){blur=true;assert.equal(d['backdrop-filter'],'none');assert.equal(d['-webkit-backdrop-filter'],'none');}
  if(rule.selector.endsWith('.adventure-attack')){attack=true;assert.equal(d.background,'#b76253');}
  if(rule.selector.endsWith('[aria-pressed="true"]')){selected=true;assert.equal(d.background,'#3a6359');}
 });assert.ok(panels&&blur&&attack&&selected);
 root.walkDecls(d=>assert.ok(!['height','width','position','inset','transform','overflow','grid-template-rows','grid-template-columns'].includes(d.prop)));
 assert.doesNotMatch(read('layout.tsx'),/import "\.\/gameplay-(?:glass|inset-hud)\.css"/);
 assert.match(read('adventure.css'),/\.adventure-viewport\s*\{[^}]*overflow:\s*hidden/);
 assert.match(read('game-play-ui.css'),/--play-panel:\s*#222c33;\s*--play-surface:\s*#2c3941/);
});
test('fully covered tap art remains paused and hidden without touching the world dialog or unmounting menu state',()=>{
 const css=postcss.parse(read('tap-environment.css'));let hidden=false,paused=false;
 css.walkRules(r=>{if(!r.selector.includes('data-world-active'))return;assert.doesNotMatch(r.selector,/adventure-game|game-native-dialog/);for(const d of r.nodes){hidden ||= d.prop==='visibility'&&d.value==='hidden';paused ||= d.prop==='animation-play-state'&&d.value==='paused';}});
 assert.ok(hidden&&paused);assert.match(read('knopik-go.tsx'),/data-world-active=\{runnerOpen\|\|adventureOpen\|\|neighborhoodOpen/);
 assert.match(read('runner-backdrop.tsx'),/return children/);
});
