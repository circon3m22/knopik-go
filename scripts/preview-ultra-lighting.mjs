import '../tests/helpers/tsx-loader.mjs';
import {mkdir,writeFile} from 'node:fs/promises';import {existsSync} from 'node:fs';import {resolve} from 'node:path';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';import {dungeonGame} from '../tests/helpers/dungeon-fixtures.mjs';
import {RunnerEngine} from '../app/runner-engine.ts';
const base=process.argv[2]??'../app/',out=process.argv[3]??'outputs/ultra-lighting';
const load=name=>import(new URL(base+name,import.meta.url));
const {setGraphicsQuality}=await load('graphics-quality.ts');const {AdventureScene,AdventureRenderer}=await load('adventure-artwork.tsx');const {RunnerScene}=await load('runner-artwork.tsx');const {RunnerRenderer}=await load('runner-renderer.ts');
await mkdir(out,{recursive:true});setGraphicsQuality('ultra');if(existsSync('outputs/neighborhood-city/fonts.conf'))process.env.FONTCONFIG_FILE=resolve('outputs/neighborhood-city/fonts.conf');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const serialize=n=>`<${n.tag}${[...n.attrs].filter(([k])=>!k.startsWith('style:')).map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${esc(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
async function save(name,svg,width=720,height=800){svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',width);svg.setAttribute('height',height);let source=serialize(svg).replace('>','><style>text{font-family:Tiny5,monospace;font-weight:400}.adventure-map-label{fill:#343041;font-size:17px}.adventure-map-light{fill:#fff1d1}</style>');const vars=new Map([...svg.attrs].filter(([k])=>k.startsWith('style:')).map(([k,v])=>[k.slice(6),v]));source=source.replace(/var\((--[\w-]+),\s*([^)]*)\)/g,(_,key,fallback)=>vars.get(key)??fallback);await writeFile(`${out}/${name}.svg`,source);await sharp(Buffer.from(source)).png().toFile(`${out}/${name}.png`);}
for(const level of [2,7,12,17,22,27,32]){
 const e=dungeonGame(level,{immortal:true}),room=e.levelData.rooms[0];e.time=3.1;Object.assign(e.player,{x:room.x+room.w*.44,y:room.y+190});
 const svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level,layout:e.levelData,theme:'classic'}))),r=new AdventureRenderer(svg,true);r.resize(720,800);r.paint(e,true);await save(`zone-${e.levelData.zone}`,svg);
}
for(const theme of ['classic','night','emerald','skyline','observatory']){
 const {AdventureEngine}=await load('adventure-engine.ts'),e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}});e.time=3.1;Object.assign(e.player,{x:690,y:340});const svg=parseAdventureSvg(render(h(AdventureScene,{area:'apartment',theme}))),r=new AdventureRenderer(svg,true);r.resize(720,800);r.paint(e,true);await save(`living-${theme}`,svg);
}
for(const kind of ['muzzle','blast']){
 const e=dungeonGame(12,{immortal:true}),room=e.levelData.rooms[0];Object.assign(e.player,{x:room.x+room.w*.44,y:room.y+190});e.weapon='shotgun';e.punchTime=kind==='muzzle'?.2:0;if(kind==='blast')e.effects.burst('blast',e.player.x+80,e.player.y+20,100);
 const svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:12,layout:e.levelData}))),r=new AdventureRenderer(svg,true);r.resize(720,800);r.paint(e,true);if(kind==='muzzle'&&existsSync(new URL(base+'ultra-event-light-renderer.ts',import.meta.url))){const {UltraEventLightRenderer}=await load('ultra-event-light-renderer.ts');new UltraEventLightRenderer(svg).paint(e,0,false);}await save(`combat-${kind}`,svg);
}
for(const area of ['basement','apartment']){
 const {AdventureEngine}=await load('adventure-engine.ts'),e=new AdventureEngine(0,{change(){},checkpoint(){},sound(){},run(){},bar(){}});e.area=area;Object.assign(e.player,{x:245,y:350});const svg=parseAdventureSvg(render(h(AdventureScene,{area,legacyHome:true,theme:'night'}))),r=new AdventureRenderer(svg,true);r.resize(720,800);r.paint(e,true);await save(area==='apartment'?'opening-flat':'basement',svg);
}
const {NeighborhoodScene,NeighborhoodRenderer}=await load('neighborhood-artwork.tsx'),{NeighborhoodEngine}=await load('neighborhood-engine.ts'),{defaultNeighborhoodProgress}=await load('neighborhood-progress.ts');
for(const [name,night,x,y]of [['street-day',false,650,700],['street-night',true,650,700],['river-night',true,2800,1770]]){
 const progress=defaultNeighborhoodProgress();progress.missions.lights.steps=7;const e=new NeighborhoodEngine(progress,{change(){},progress(){},home(){},run(){},sound(){}});Object.assign(e.player,{x,y});const svg=parseAdventureSvg(render(h(NeighborhoodScene,{night,prefix:'immersive-preview'}))),r=new NeighborhoodRenderer(svg,night,true);r.resize(720,800);r.paint(e,true);await save(name,svg);
}
for(const night of [false,true]){
 const e=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}},{immortal:true,night});e.start();for(let i=0;i<500;i++)e.update(1/60);
 const svg=parseAdventureSvg(render(h(RunnerScene,{sceneRef:{current:null},prefix:'ultra-preview'}))),r=new RunnerRenderer(svg,'ultra-preview',true);r.render(e);await save(`run-${night?'night':'day'}`,svg,720,1560);
}
console.log('Native SVG/PNG illustration previews in '+out+'; not browser screenshots or an FPS measurement.');
