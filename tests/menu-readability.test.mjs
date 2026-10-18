import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import postcss from 'postcss';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {THEMES} from '../app/cosmetic-engine.ts';
import {GRAPHICS_QUALITIES} from '../app/graphics-quality.ts';
import {createDefaultSave} from '../app/game-logic.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {GamePlayHud}=await import('../app/game-play-hud.tsx');
const {GamePreferences}=await import('../app/game-preferences.tsx');
const {ActiveBalance}=await import('../app/active-balance.tsx');
const read=p=>readFileSync(new URL('../app/'+p,import.meta.url),'utf8');
const sheet=postcss.parse(read('menu-readability.css'));
const declarations=selector=>{const values={};sheet.walkRules(selector,r=>r.walkDecls(d=>values[d.prop]=d.value));return values;};
const rgb=s=>s.startsWith('#')?s.slice(1).match(/../g).map(n=>parseInt(n,16)):s.split(' ').map(Number);
const blend=(front,back,a)=>front.map((n,i)=>n*a+back[i]*(1-a));
const luminance=s=>{const [r,g,b]=s.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return r*.2126+g*.7152+b*.0722;};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('all eight settings palettes keep body, secondary, disabled, danger and selected text readable in every tier',()=>{
 const base=declarations('.pixel-game:is(.game-shell,.settings-backdrop)');
 for(const theme of Object.keys(THEMES))for(const quality of GRAPHICS_QUALITIES){
  const p={...base,...declarations('.pixel-game.theme-'+theme)},canvas=rgb(p['--menu-canvas']),inset=rgb(p['--menu-inset']);
  const card=blend(rgb(p['--menu-card-rgb']),canvas,['high','very-high','ultra'].includes(quality.id)?.9:1);
  for(const surface of [canvas,inset,card])for(const token of ['--menu-ink','--menu-muted','--menu-danger'])assert.ok(contrast(rgb(p[token]),surface)>=4.5,`${theme}/${quality.id}/${token}: ${contrast(rgb(p[token]),surface)}`);
  assert.ok(contrast(rgb(p['--menu-on-selected']),rgb(p['--menu-selected']))>=4.5,`${theme}: selected controls`);
 }
 const legacy=postcss.parse(read('skyline-update.css'));
 legacy.walkRules(r=>{if(r.selector.includes('data-knopik-graphics')&&/preferences-graphics|preferences-toggle|settings-fold/.test(r.selector))assert.ok(!r.nodes.some(d=>d.prop==='background'&&d.important),'global glass must not overwrite state-specific settings colors');});
});

test('every graphics mode retains an identifiable pressed option, all settings and a two-option FPS position group',()=>{
 for(const q of GRAPHICS_QUALITIES){const settings={...createDefaultSave().settings,graphicsQuality:q.id};
  const tree=parseAdventureSvg(render(h(GamePreferences,{settings,onChange(){}})));
  const quality=tree.querySelector('[aria-label="Качество графики · вся игра"]');assert.equal(quality.children.length,5);assert.equal(quality.children.filter(n=>n.getAttribute('aria-pressed')==='true').length,1);
  assert.equal(tree.querySelector('[aria-label="Ограничение FPS"]').children.length,4);
  assert.equal(tree.querySelector('[aria-label="Положение счётчика FPS"]').getAttribute('data-options'),'2');
 }
});

test('the HUD keeps lives, full accessible balance, map, task and pause together without a mission strip',()=>{
 const html=render(h(GamePlayHud,{hp:2,balance:777777777,place:'Лес',eyebrow:'Уровень',partner:{name:'Друг',hp:1},secondaryActions:[h('button',{key:'map','aria-label':'Карта'}),h('button',{key:'task','aria-label':'Текущее задание'})]},h('button',{'aria-label':'Пауза'})));
 const root=parseAdventureSvg(html),row=root.querySelector('[class="adventure-hud-primary"]');assert.equal(row.children.length,3);
 const actions=root.querySelector('[class="adventure-header-actions"]');assert.deepEqual(actions.children.map(n=>n.getAttribute('aria-label')),['Карта','Текущее задание','Пауза']);
 assert.ok(html.includes('Друг: 1 из 3'));assert.match(html,/Активный баланс: 777.777.777 KC/);assert.ok(!html.includes('adventure-mission-line'));
 const full=render(h(ActiveBalance,{amount:777777777}));assert.match(full,/777.777.777/);assert.ok(html.length>0);
});

test('panel removal preserves controller and camera geometry; blur is limited to individual high-tier controls',()=>{
 const root=postcss.parse(read('gameplay-controls.css'));
 const visual=new Set(['background','color','border','border-color','box-shadow','backdrop-filter','-webkit-backdrop-filter','text-shadow']);
 root.walkDecls(d=>assert.ok(d.prop.startsWith('--')||visual.has(d.prop),`visual controls file must not alter geometry: ${d.prop}`));
 const bare=declarations(':root .pixel-game.game-shell .app-header');assert.equal(bare.background,'none');assert.equal(bare['backdrop-filter'],'none');
 const balance=declarations(':root .pixel-game.game-shell .game-data>.tap-balances');assert.equal(balance.background,'none');assert.equal(balance.border,'0');
 root.walkRules(r=>{if(r.selector.includes('data-knopik-graphics')&&!r.parent.params?.includes('reduced-transparency')){assert.match(r.selector,/high/);assert.match(r.selector,/very-high/);assert.match(r.selector,/ultra/);assert.doesNotMatch(r.selector,/medium|low/);}});
});
