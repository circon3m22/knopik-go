import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import postcss from 'postcss';
const read=x=>readFileSync(new URL(`../app/${x}`,import.meta.url),'utf8');
test('inset Go header combines one outlined surface with bare vitals/actions and keeps the controller grid',()=>{
 const root=postcss.parse(read('gameplay-inset-hud.css'));let inset=false,frame=false,bare=false,glass=false;
 root.walkRules(rule=>{
  assert.match(rule.selector,/adventure-game:not\(\.neighborhood-game\)/);assert.doesNotMatch(rule.selector,/game-shell|settings-backdrop|shop-backdrop|adventure-viewport/);
  const d=Object.fromEntries(rule.nodes.filter(x=>x.type==='decl').map(x=>[x.prop,x.value]));
  if(rule.selector.endsWith('>.adventure-hud')){inset=true;assert.match(d.padding,/safe-area-inset-top/);assert.equal(d.background,'none');}
  if(rule.selector.endsWith('.adventure-hud-primary')){frame=true;assert.match(d.border,/1px solid/);assert.equal(d['backdrop-filter'],'var(--hud-header-blur)');}
  if(rule.selector.includes('.adventure-pause')){bare=true;assert.equal(d.background,'none');assert.equal(d['backdrop-filter'],'none');}
  if(rule.selector.includes('data-knopik-graphics')){glass=true;assert.match(rule.selector,/high/);assert.match(rule.selector,/very-high/);assert.match(rule.selector,/ultra/);assert.doesNotMatch(rule.selector,/low|medium/);assert.equal(d['--hud-control-surface'],'rgb(44 57 65 / 50%)');}
 });assert.ok(inset&&frame&&bare&&glass);
 root.walkDecls(d=>assert.ok(!['height','width','position','inset','transform','grid-template-rows','grid-template-columns'].includes(d.prop)));
 const layout=read('layout.tsx');assert.ok(layout.indexOf('import "./gameplay-inset-hud.css"')>layout.indexOf('import "./gameplay-controls.css"'));
});
test('fully covered tap art is paused and hidden without touching the world dialog or unmounting menu state',()=>{
 const css=postcss.parse(read('tap-environment.css'));let hidden=false,paused=false;
 css.walkRules(r=>{if(!r.selector.includes('data-world-active'))return;assert.doesNotMatch(r.selector,/adventure-game|game-native-dialog/);for(const d of r.nodes){hidden ||= d.prop==='visibility'&&d.value==='hidden';paused ||= d.prop==='animation-play-state'&&d.value==='paused';}});
 assert.ok(hidden&&paused);assert.match(read('knopik-go.tsx'),/data-world-active=\{runnerOpen\|\|adventureOpen\|\|neighborhoodOpen/);
 assert.match(read('runner-backdrop.tsx'),/return children/);
});
