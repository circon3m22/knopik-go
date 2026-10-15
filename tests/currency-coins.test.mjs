import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {CoinArtwork,AuraCoinArtwork}=await import('../app/collectible-artwork.tsx');
const {ShopBalances}=await import('../app/shop-balances.tsx');
test('both currencies have matching detailed pixel rims, distinct stamped letters and no gradients',()=>{
 const kc=parseAdventureSvg(renderToStaticMarkup(React.createElement(CoinArtwork))),aura=parseAdventureSvg(renderToStaticMarkup(React.createElement(AuraCoinArtwork)));
 for(const coin of [kc,aura]){assert.equal(coin.getAttribute('viewBox'),'0 0 32 32');assert.equal(coin.getAttribute('shape-rendering'),'crispEdges');assert.ok(coin.querySelectorAll('path').length>=10);assert.equal(coin.querySelectorAll('linearGradient').length,0);}
 assert.notEqual(kc.querySelector('[data-coin-letter="kc"]').getAttribute('d'),aura.querySelector('[data-coin-letter="aura"]').getAttribute('d'));
 assert.equal(kc.getAttribute('aria-label'),'Кнопик Коин');assert.equal(aura.getAttribute('aria-label'),'AURA');
});
test('the shop keeps two distinct labelled balances, including full large amounts and zero',()=>{
 const html=renderToStaticMarkup(React.createElement(ShopBalances,{vault:Number.MAX_SAFE_INTEGER,aura:0}));
 assert.ok(html.includes(Number.MAX_SAFE_INTEGER.toLocaleString('ru-RU')));assert.ok(html.includes('Сейф · Кнопик Коин'));assert.ok(html.includes('shop-balance-aura'));assert.ok(html.includes('>0</strong>'));assert.ok(!html.includes('shop-wallet'));
});
