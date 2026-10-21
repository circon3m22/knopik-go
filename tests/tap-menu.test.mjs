import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {Children,createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';import postcss from 'postcss';
import {BUFF_CATALOG} from '../app/buff-shelf-engine.ts';
const {BottomNavigation}=await import('../app/bottom-navigation.tsx');
const {BuffShelfItem}=await import('../app/buff-shelf-item.tsx');
const {TapBalances}=await import('../app/tap-balances.tsx');
const read=p=>readFileSync(new URL('../app/'+p,import.meta.url),'utf8');

test('menu tabs change once on a completed click and never transfer pointer capture into a new dialog',()=>{
 for(const computer of [false,true])for(let activeIndex=0;activeIndex<3;activeIndex++){
  const selected=[],footer=BottomNavigation({computer,activeIndex,onSelect:n=>selected.push(n)});
  assert.equal(footer.props.onPointerDown,undefined);assert.equal(footer.props.onPointerMove,undefined);assert.equal(footer.props.onPointerUp,undefined);
  const buttons=Children.toArray(footer.props.children).filter(n=>n.type==='button');assert.equal(buttons.length,3);assert.deepEqual(selected,[]);
  for(const [i,button]of buttons.entries()){assert.equal(button.props.onPointerDown,undefined);button.props.onClick();assert.equal(selected.length,i+1);assert.equal(selected.at(-1),i);}
 }
 const source=read('knopik-go.tsx'),handler=source.slice(source.indexOf('const navigateSettings='),source.indexOf('const settingsDialog='));
 assert.match(handler,/if\(index===2\)setComputerOpen\(true\)/,'the games tab opens the computer library even from in-world settings');
 assert.equal((handler.match(/setComputerOpen\(/g)||[]).length,1,'shop and tapper preserve their entry origin');
 assert.doesNotMatch(source,/moveNavigationThumb|handleNavigationDown|navDidDragRef/);
});

test('compact buffs keep use and purchase separate, expose full prices and preserve active and unavailable states',()=>{
 for(const kind of ['food','zhivchik','pepsi','heal']){
  const events=[],props={kind,variant:'tap',count:2,canUse:true,canBuy:true,active:true,status:'12с',onUse:()=>events.push('use'),onBuy:()=>events.push('buy')};
  const item=BuffShelfItem(props),buttons=Children.toArray(item.props.children);assert.equal(buttons.length,2);assert.ok(item.props.className.includes('is-active'));
  buttons[0].props.onClick();buttons[1].props.onClick();assert.deepEqual(events,['use','buy']);assert.match(buttons[0].props['aria-label'],/2 в запасе/);assert.ok(buttons[1].props['aria-label'].includes(String(BUFF_CATALOG[kind].price)));
  const unavailable=Children.toArray(BuffShelfItem({...props,count:0,canUse:false,canBuy:false}).props.children);assert.equal(unavailable[0].props.disabled,true);assert.equal(unavailable[1].props.disabled,true);
  const locked=Children.toArray(BuffShelfItem({...props,recipeLocked:true}).props.children);assert.equal(locked[1].props.disabled,true);
  assert.ok(render(h(BuffShelfItem,{...props,variant:'bar'})).includes('bar-drink-card'),'bar layout remains independent');
 }
});

test('the themed menu dock stays opaque and in-world surface styles never repaint menu tabs',()=>{
 const controls=postcss.parse(read('gameplay-controls.css'));
 controls.walkRules(r=>assert.doesNotMatch(r.selector,/game-shell|settings-backdrop|shop-backdrop/,'world controls must never repaint menu tabs'));
 const nav=postcss.parse(read('bottom-navigation.css'));let solid=false;
 nav.walkRules(r=>{if(r.selector===':root .pixel-game:is(.game-shell,.settings-backdrop,.shop-backdrop) .bottom-bar'){const d=Object.fromEntries(r.nodes.map(n=>[n.prop,n.value]));assert.equal(d.background,'rgb(var(--menu-card-rgb,255 241 209))');assert.equal(d['backdrop-filter'],'none');solid=true;}});assert.ok(solid);
 const menu=postcss.parse(read('tap-menu.css'));let flat=false;
 menu.walkRules(r=>{if(r.selector==='.pixel-game.game-shell .dog-button>.portrait-surface'){const d=Object.fromEntries(r.nodes.map(n=>[n.prop,n.value]));assert.equal(d.background,'#fff1d1');assert.equal(d['box-shadow'],'none');assert.equal(d['background-image'],'none');flat=true;}});assert.ok(flat);
 assert.doesNotMatch(read('tap-menu.css'),/(?:linear|radial)-gradient\(/);
});

test('the reduced portrait mask follows a symmetric pixel circle without clipping shield and effect layers',()=>{
 const css=postcss.parse(read('tap-menu.css'));let mask,orbit,clipped=[];
 css.walkDecls(d=>{if(d.prop==='--tap-circle')mask=d.value;if(d.prop==='clip-path'&&d.value==='var(--tap-circle)')clipped.push(...d.parent.selectors);if(d.parent.selector==='.pixel-game.game-shell .dog-orbit'&&d.prop==='width')orbit=d.value;});
 assert.equal(orbit,'min(340px,86cqw,86cqh)');
 assert.deepEqual(clipped,['.pixel-game.game-shell .dog-button>.portrait-surface','.pixel-game.game-shell .dog-portrait-clip']);
 const vertices=[...mask.matchAll(/([\d.]+)% ([\d.]+)%/g)].map(m=>[+m[1],+m[2]]);
 for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];assert.ok(a[0]===b[0]||a[1]===b[1],'only horizontal/vertical steps');}
 const inside=(x,y)=>{let hit=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 for(let y=0;y<32;y++)for(let x=0;x<32;x++)assert.equal(inside((x+.5)*100/32,(y+.5)*100/32),(x+.5-16)**2+(y+.5-16)**2<=16**2,`circle cell ${x}/${y}`);
});

test('the centered wallet preserves exact balances and removes the old mood badge from the tapper',()=>{
 for(const [active,aura]of [[0,0],[8450,127],[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]]){
  const item=TapBalances({active,aura,pulse:1}),rows=Children.toArray(item.props.children);assert.equal(rows.length,2);
  assert.equal(rows[0].props.className,'tap-balance tap-balance-kc');assert.equal(rows[1].props.className,'tap-balance tap-balance-aura');
  for(const [i,value]of [active,aura].entries()){const children=Children.toArray(rows[i].props.children),amount=children[1];assert.equal(amount.props.children,value.toLocaleString('ru-RU'));assert.ok(rows[i].props['aria-label'].includes(value.toLocaleString('ru-RU')));}
 }
 const source=read('knopik-go.tsx');assert.doesNotMatch(source,/status-cluster|moodLabel|progress-lvl|progress-reward-button/);
 assert.match(source,/tap-progress-level/);
 assert.match(source,/<span className="dog-portrait-clip" aria-hidden="true"><span className="dog-images"/);
 assert.match(read('tap-menu.css'),/\.dog-button \.dog-images\{inset:9%;clip-path:none/);
});

test('portrait and wallet share one stack while the transfer gesture owns a separate row',()=>{
 const css=postcss.parse(read('tap-menu.css'));const values=selector=>{const result={};css.walkRules(r=>{if(r.selector===selector)for(const d of r.nodes)if(d.type==='decl')result[d.prop]=d.value;});return result;};
 const stage=values('.pixel-game.game-shell .game-stage'),center=values('.pixel-game.game-shell .tap-center'),transfer=values('.pixel-game.game-shell .game-data>.vault-swipe');
 assert.equal(stage['grid-template-rows'],'minmax(0,1fr) 44px');assert.equal(center['grid-template-rows'],'minmax(0,1fr) auto');assert.equal(center['align-self'],'center');assert.equal(center.height,'min(100%,440px)');
 assert.equal(transfer.position,'relative');assert.equal(transfer.height,'44px');
 assert.doesNotMatch(read('tap-menu.css'),/tap-portrait-drop|translate:/,'no independent offsets can move the hit targets or balances into each other');
 const source=read('knopik-go.tsx');const stack=source.slice(source.indexOf('<div className="tap-center">'),source.indexOf('<div className="game-data">'));
 assert.ok(stack.includes('<div className="dog-stage">'));assert.ok(stack.includes('<TapBalances'));assert.ok(!stack.includes('<VaultSwipe'));
 const wallet=postcss.parse(read('tap-balances.css'));let inStack=false;wallet.walkRules(r=>{if(r.selector===':root .pixel-game.game-shell .tap-center>.tap-balances')inStack=true;});assert.ok(inStack);
});
