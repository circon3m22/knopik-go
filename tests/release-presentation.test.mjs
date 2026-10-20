import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import postcss from 'postcss';
import {GAME_RELEASES,GAME_VERSION} from '../app/game-release.ts';
import {GAME_PRESENTATION,RELEASE_PRESENTATIONS,releasePresentation} from '../app/release-presentation.ts';
import {runGameRelease} from '../scripts/release-game.mjs';
const {GameLaunch}=await import('../app/game-launch.tsx');
const {GameLoadingScreen}=await import('../app/game-loading-screen.tsx');
const {ReleasePoster}=await import('../app/release-poster.tsx');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the installed release selects the Expedition artwork and all original assets stay valid',()=>{
 assert.equal(GAME_RELEASES[0].presentation,GAME_PRESENTATION.id);assert.equal(GAME_PRESENTATION.introducedIn.split('.').slice(0,2).join('.'),GAME_VERSION.split('.').slice(0,2).join('.'));assert.equal(GAME_PRESENTATION.id,'expedition-060');assert.equal(releasePresentation({presentation:GAME_PRESENTATION.id}),GAME_PRESENTATION);
 const hashes=new Set();for(const p of RELEASE_PRESENTATIONS){assert.match(p.artwork,/^\/release-artwork\/[a-z0-9-]+\.svg$/);const svg=read('public'+p.artwork);assert.ok(svg.includes(`data-release-art="${p.id}"`));assert.match(svg,/viewBox="0 0 1080 1080"/);assert.match(svg,/width="2160" height="2160"/);assert.ok(!/<image|<script|foreignObject|https?:\/\/(?!www\.w3\.org)/.test(svg));const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of svg.matchAll(/url\(#([^\)]+)\)|href="#([^"]+)"/g))assert.ok(ids.includes(m[1]??m[2]),'internal reference resolves');const hash=createHash('sha256').update(svg).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);}
});
test('loading and launch use the full portrait composition, landscape fallback and installed version',()=>{
 const loading=renderToStaticMarkup(createElement(GameLoadingScreen));
 const launch=renderToStaticMarkup(createElement(GameLaunch,{onPlay(){},onCoop(){}}));
 const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
 for(const html of [loading,launch]){assert.ok(html.includes(GAME_PRESENTATION.portraitArtwork));assert.ok(html.includes('<source media="(orientation: landscape)" srcSet="'+base+GAME_PRESENTATION.artwork+'"'));assert.ok(html.includes('data-presentation="'+GAME_PRESENTATION.id+'"'));assert.ok(html.includes('release-immersive'));assert.ok(html.includes(GAME_VERSION));assert.ok(html.includes('width="1080" height="1920"'));assert.ok(!html.includes('Липовый квартал'));}
 const square=renderToStaticMarkup(createElement(ReleasePoster));assert.ok(square.includes(GAME_PRESENTATION.artwork));assert.ok(square.includes('width="1080" height="1080"'));assert.ok(!square.includes('<picture>'));
 assert.ok(loading.includes('aria-busy="true"'));assert.ok(launch.includes('class="launch-play"'),'Play is available while the offline pack is checking');assert.ok(loading.includes('loading-quick-play'));assert.ok(launch.includes('launch-install'));assert.ok(launch.includes('launch-coop'));assert.ok(!/<progress[^>]*value="100"/.test(launch));
});
test('patches retain the current loading screen; updates still require new artwork',()=>{
 const before=read('app/game-releases.json'),pkg=read('package.json');
 const patch=['patch','--title','Проверка оформления','--change','Тест выпуска','--dry-run'];
 for(const args of [patch,[...patch,'--presentation',GAME_PRESENTATION.id]]){const draft=runGameRelease(args);assert.equal(draft.needsPresentation,false);assert.equal(draft.release.presentation,GAME_PRESENTATION.id);assert.equal(draft.dryRun,true);}
 const args=['update','--title','Проверка оформления','--change','Тест выпуска'];
 assert.throws(()=>runGameRelease(args),/новый анонс и экран загрузки/);
 assert.throws(()=>runGameRelease([...args,'--presentation',GAME_PRESENTATION.id]),/отдельное оформление/);
 for(const retired of RELEASE_PRESENTATIONS.filter(p=>p.retired))assert.throws(()=>runGameRelease([...args,'--presentation',retired.id]),/новый анонс и экран загрузки/);
 const draft=runGameRelease([...args,'--dry-run']);assert.equal(draft.needsPresentation,true);assert.equal(draft.dryRun,true);assert.equal(read('app/game-releases.json'),before);assert.equal(read('package.json'),pkg);
});

test('archived restored artwork keeps its fresh URL and matches original ARCADE UPDATE',()=>{
 const archived=RELEASE_PRESENTATIONS.find(p=>p.id==='quickbar-032');
 assert.equal(archived.artwork,'/release-artwork/arcade-restored-032.svg');
 const restored=read('public'+archived.artwork).replace('data-release-art="quickbar-032"','data-release-art="arcade-030"');
 assert.equal(restored,read('public/release-artwork/arcade-030.svg'));
});

test('the revised square and portrait covers contain integer pixel contours without soft or embedded artwork',()=>{
 for(const path of [GAME_PRESENTATION.artwork,GAME_PRESENTATION.portraitArtwork]){
  const svg=read('public'+path);assert.match(svg,/data-pixel-grid="360"/);assert.match(svg,/shape-rendering="crispEdges"/);
  assert.doesNotMatch(svg,/<(?:linearGradient|radialGradient|filter|image|circle|ellipse)\b/);
  const contours=[...svg.matchAll(/\bd="([^"]+)"/g)];assert.ok(contours.length>50);
  for(const [,d]of contours)assert.match(d,/^[MmHhVvZz\d\s,-]+$/,'every outline stays on the integer pixel grid');
  assert.match(svg,/21\.10\.26/);
 }
 assert.match(read('public'+GAME_PRESENTATION.portraitArtwork),/viewBox="0 0 360 640"/);
});

test('co-op button text has strong contrast and the portrait is not constrained to a poster card',()=>{
 const sheet=postcss.parse(read('app/release-pixel.css'));
 const declarations=selector=>{const values={};sheet.walkRules(selector,r=>{if(r.parent.type==='root')r.walkDecls(d=>values[d.prop]=d.value);});return values;};
 const button=declarations('.pixel-game.release-immersive .launch-actions>:is(.launch-coop,.launch-install,.launch-retry)');
 const label=declarations('.pixel-game.release-immersive .launch-coop-label');
 const luminance=hex=>{const v=hex.match(/[\da-f]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
 const paper=luminance(button.background),ink=luminance(label.color);assert.ok((Math.max(paper,ink)+.05)/(Math.min(paper,ink)+.05)>7);assert.equal(button.color,label.color);assert.equal(label.visibility,'visible');assert.equal(label.opacity,'1');
 const poster=declarations('.release-immersive .release-poster'),image=declarations('.release-immersive .release-poster img');
 assert.equal(poster.position,'absolute');assert.equal(poster.inset,'0');assert.equal(poster.width,'100%');assert.equal(poster.height,'100%');assert.equal(poster['max-width'],'none');assert.equal(image['object-fit'],'cover');
});
