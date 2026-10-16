import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GAME_RELEASES,GAME_VERSION} from '../app/game-release.ts';
import {GAME_PRESENTATION,RELEASE_PRESENTATIONS,releasePresentation} from '../app/release-presentation.ts';
import {runGameRelease} from '../scripts/release-game.mjs';
const {GameLaunch}=await import('../app/game-launch.tsx');
const {GameLoadingScreen}=await import('../app/game-loading-screen.tsx');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the installed release selects its own original square SVG and duplicate visual assets cannot silently replace new artwork',()=>{
 assert.equal(GAME_RELEASES[0].presentation,GAME_PRESENTATION.id);assert.equal(GAME_PRESENTATION.introducedIn,GAME_VERSION);assert.equal(releasePresentation({presentation:GAME_PRESENTATION.id}),GAME_PRESENTATION);
 const hashes=new Set();for(const p of RELEASE_PRESENTATIONS){assert.match(p.artwork,/^\/release-artwork\/[a-z0-9-]+\.svg$/);const svg=read('public'+p.artwork);assert.ok(svg.includes(`data-release-art="${p.id}"`));assert.match(svg,/viewBox="0 0 1080 1080"/);assert.match(svg,/width="2160" height="2160"/);assert.ok(!/<image|<script|foreignObject|https?:\/\/(?!www\.w3\.org)/.test(svg));const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of svg.matchAll(/url\(#([^\)]+)\)|href="#([^"]+)"/g))assert.ok(ids.includes(m[1]??m[2]),'internal reference resolves');const hash=createHash('sha256').update(svg).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);}
});
test('account loading and launch menu display exactly the same artwork and the actual installed patch version',()=>{
 const loading=renderToStaticMarkup(createElement(GameLoadingScreen));
 const launch=renderToStaticMarkup(createElement(GameLaunch,{onPlay(){},onCoop(){}}));
 for(const html of [loading,launch]){assert.ok(html.includes(GAME_PRESENTATION.artwork));assert.ok(html.includes('data-presentation="'+GAME_PRESENTATION.id+'"'));assert.ok(html.includes(GAME_VERSION));assert.ok(html.includes('width="1080" height="1080"'));assert.ok(!html.includes('Липовый квартал'));}
 assert.ok(loading.includes('aria-busy="true"'));assert.ok(!launch.includes('class="launch-play"'),'checking is not ready: no fake Play button');assert.ok(launch.includes('launch-install'));assert.ok(launch.includes('launch-coop'));assert.ok(!/<progress[^>]*value="100"/.test(launch));
});
test('future release preparation stays read-only and publishing refuses to reuse the old loading screen',()=>{
 const before=read('app/game-releases.json'),pkg=read('package.json');
 const args=['patch','--title','Проверка оформления','--change','Тест выпуска'];
 assert.throws(()=>runGameRelease(args),/новый анонс и экран загрузки/);
 assert.throws(()=>runGameRelease([...args,'--presentation',GAME_PRESENTATION.id]),/отдельное оформление/);
 const draft=runGameRelease([...args,'--dry-run']);assert.equal(draft.needsPresentation,true);assert.equal(draft.dryRun,true);assert.equal(read('app/game-releases.json'),before);assert.equal(read('package.json'),pkg);
});

test('restored 0.3.2 launch artwork uses a fresh URL and matches original ARCADE UPDATE without rebuilding the visual',()=>{
 if(GAME_VERSION!=='0.3.2')return;
 assert.equal(GAME_PRESENTATION.artwork,'/release-artwork/arcade-restored-032.svg');
 const restored=read('public'+GAME_PRESENTATION.artwork).replace('data-release-art="quickbar-032"','data-release-art="arcade-030"');
 assert.equal(restored,read('public/release-artwork/arcade-030.svg'));
});
