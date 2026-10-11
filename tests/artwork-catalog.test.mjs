import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { BUFF_CATALOG } from '../app/buff-shelf-engine.ts';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const cache=new Map();
async function compile(file){
  if(cache.has(file))return cache.get(file);
  let code=ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  for(const specifier of new Set([...code.matchAll(/from ["']([^"']+)["']/g)].map(m=>m[1]))){
    let url;
    if(specifier.startsWith('.')) {
      const candidate=path.resolve(path.dirname(file),specifier);
      let target=candidate;
      if(!/\.tsx?$/.test(candidate)) {
        try { await readFile(candidate+'.tsx'); target=candidate+'.tsx'; }
        catch { target=candidate+'.ts'; }
      }
      url=await compile(target);
    }else url=pathToFileURL(require.resolve(specifier)).href;
    code=code.replaceAll(JSON.stringify(specifier),JSON.stringify(url));
  }
  const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(file,url);return url;
}
const artwork=await import(await compile(path.resolve('app/pixel-artwork.tsx')));
test('all twelve stocked buffs and clothing render valid SVG with matching palettes',()=>{
  assert.equal(Object.keys(BUFF_CATALOG).length,12);
  for(const kind of Object.keys(BUFF_CATALOG)){
    const svg=renderToStaticMarkup(React.createElement(artwork.PixelPotion,{kind}));
    assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|undefined|<image/);
  }
  for(const kind of ['bandana','charm','hat','mohawk'])assert.doesNotMatch(renderToStaticMarkup(React.createElement(artwork.PixelClothing,{kind})),/NaN|undefined|<image/);
});
test('runner artwork defines every referenced sprite and all animated character parts',async()=>{
  const runner=await import(await compile(path.resolve('app/runner-artwork.tsx')));
  const svg=renderToStaticMarkup(React.createElement(runner.RunnerScene,{sceneRef:{current:null},prefix:'check'}));
  const ids=new Set([...svg.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
  for(const href of svg.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(href[1]),href[1]);
  for(const kind of ['fence','magnet-pickup','firework-pickup','boost-pickup','slow-pickup','sahur-back-jump'])assert.ok(ids.has('check-'+kind));
  for(const part of ['firework','flames','flyby','pose','head','turn','chaser','collar','leg-left','leg-right','arm-left','arm-right','tail','roll'])assert.match(svg,new RegExp(`data-runner-${part}`));
  assert.doesNotMatch(svg,/NaN|undefined|<image/);
});
