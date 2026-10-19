import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {earlyPlayRequested,earlyPlayServerSnapshot,requestEarlyPlay,clearEarlyPlay,subscribeEarlyPlay} from '../app/game-start-intent.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {GameLaunch}=await import('../app/game-launch.tsx');const {GameLoadingScreen}=await import('../app/game-loading-screen.tsx');

test('Play is visible and enabled before the offline pack is ready without claiming a completed download',()=>{
 const launch=render(h(GameLaunch,{onPlay(){}})),tree=parseAdventureSvg(launch),button=tree.querySelector('[class="launch-play"]');
 assert.ok(button);assert.equal(button.getAttribute('disabled'),null);assert.ok(launch.includes('готовим офлайн-пакет в фоне'));assert.ok(!/<progress[^>]*value="100"/.test(launch));
 const loading=parseAdventureSvg(render(h(GameLoadingScreen)));assert.equal(loading.querySelector('[class="loading-quick-play"]').getAttribute('disabled'),null);
 const starting=parseAdventureSvg(render(h(GameLoadingScreen,{starting:true})));assert.equal(starting.querySelector('[class="loading-quick-play"]').getAttribute('disabled'),'');
});

test('an early Play click survives bootstrap and clears only when the initialized game consumes it',()=>{
 clearEarlyPlay();const changes=[],stop=subscribeEarlyPlay(()=>changes.push(earlyPlayRequested()));
 try{assert.equal(earlyPlayRequested(),false);requestEarlyPlay();assert.equal(earlyPlayRequested(),true);assert.equal(earlyPlayRequested(),true,'repeated initializer reads must not consume intent');assert.equal(earlyPlayServerSnapshot(),false);clearEarlyPlay();assert.deepEqual(changes,[true,false]);}
 finally{stop();clearEarlyPlay();}
 requestEarlyPlay();assert.deepEqual(changes,[true,false],'unmounted loading screen is unsubscribed');clearEarlyPlay();
});
