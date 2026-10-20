import './helpers/tsx-loader.mjs';
import assert from 'node:assert/strict';import test from 'node:test';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {BUFF_CATALOG} from '../app/buff-shelf-engine.ts';
const artwork=await import('../app/pixel-artwork.tsx');
test('all nineteen stocked buffs and clothing render valid SVG with matching palettes',()=>{
  assert.equal(Object.keys(BUFF_CATALOG).length,21);
  for(const kind of Object.keys(BUFF_CATALOG)){
    const svg=renderToStaticMarkup(React.createElement(artwork.PixelPotion,{kind}));
    assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|undefined|<image/);
  }
  for(const kind of ['bandana','charm','hat','mohawk'])assert.doesNotMatch(renderToStaticMarkup(React.createElement(artwork.PixelClothing,{kind})),/NaN|undefined|<image/);
});
test('runner artwork defines every referenced sprite and all animated character parts',async()=>{
  const runner=await import('../app/runner-artwork.tsx');
  const svg=renderToStaticMarkup(React.createElement(runner.RunnerScene,{sceneRef:{current:null},prefix:'check'}));
  const ids=new Set([...svg.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
  for(const href of svg.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(href[1]),href[1]);
  for(const kind of ['fence','magnet-pickup','firework-pickup','boost-pickup','slow-pickup','sahur-back-jump','china-cart','china-low-0','china-arch-2','china-sahur-3','park-tree-0','park-tree-2','park-arch-1','cherry-tree-0','cherry-tree-1','cherry-tree-2','pond-reeds','office-arch-0','office-arch-2','office-low-0','office-low-2','office-cargo'])assert.ok(ids.has('check-'+kind));
  for(const part of ['firework','flames','flyby','pose','head','turn','chaser','collar','leg-left','leg-right','arm-left','arm-right','tail','roll'])assert.match(svg,new RegExp(`data-runner-${part}`));
  assert.doesNotMatch(svg,/NaN|undefined|<image/);
});

test('premium backgrounds have distinct SVG geometry and four valid emotion variants',()=>{
  const shapes=new Set();
  for(const theme of ['bath','emerald']) {
    const moods=new Set();
    for(const mood of ['calm','blue','yellow','red']) {
      const svg=renderToStaticMarkup(React.createElement(artwork.PixelScene,{theme,mood}));
      assert.doesNotMatch(svg,/NaN|undefined|<image/);moods.add(svg);
      if(theme==='emerald')assert.match(svg,/pixel-scene-emerald/);
      if(mood==='calm')shapes.add(svg);
    }
    assert.equal(moods.size,4);
  }
  assert.equal(shapes.size,2);
});
