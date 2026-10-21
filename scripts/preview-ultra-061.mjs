import '../tests/helpers/tsx-loader.mjs';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import React from 'react';import{renderToStaticMarkup as render}from'react-dom/server';import{mkdir,writeFile}from'node:fs/promises';import sharp from'sharp';
import{parseAdventureSvg}from'../tests/helpers/adventure-svg-dom.mjs';import{dungeonGame}from'../tests/helpers/dungeon-fixtures.mjs';import{setGraphicsQuality}from'../app/graphics-quality.ts';import{ARCADE_CATALOG}from'../app/arcade-catalog.ts';
const{AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');const{AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');const{KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');const{ArcadeGameCover}=await import('../app/arcade-game-cover.tsx');
const dir='outputs/ultra-061';await mkdir(dir,{recursive:true});const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');const serialize=n=>`<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${esc(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
if(existsSync('outputs/neighborhood-city/font-cache/tiny5.ttf'))process.env.FONTCONFIG_FILE=resolve('outputs/neighborhood-city/fonts.conf');
async function save(name,svg){svg=svg.replace('>','><style>text{font-family:Tiny5,monospace;font-weight:400}</style>');await writeFile(`${dir}/${name}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${dir}/${name}.png`);}
for(const quality of['high','ultra'])for(const id of[2,7,12,17,22,27,32]){
 setGraphicsQuality(quality);const e=dungeonGame(id,{immortal:true});e.time=3.1;e.player.angle=Math.PI/4;e.weapon='rifle';const svg=parseAdventureSvg(render(React.createElement(AdventureScene,{area:'sewer',level:id,layout:e.levelData,theme:'classic'}))),r=new AdventureRenderer(svg,false);r.resize(720,800);r.paint(e,true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','720');svg.setAttribute('height','800');await save(`zone-${e.levelData.zone}-${quality}`,serialize(svg));
}
for(const theme of['classic','night','emerald','skyline','observatory']){
 const e=new (await import('../app/adventure-engine.ts')).AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}});e.time=3.1;Object.assign(e.player,{x:850,y:740});
 const svg=parseAdventureSvg(render(React.createElement(AdventureScene,{area:'apartment',theme}))),r=new AdventureRenderer(svg,false);r.resize(720,800);r.paint(e,true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','720');svg.setAttribute('height','800');await save(`apartment-${theme}`,serialize(svg));
}
setGraphicsQuality('ultra');const kinds=['idle','step-left','aim','step-right'],angles=[Math.PI/4,Math.PI*3/4,-Math.PI/4,-Math.PI*3/4],cells=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
 const svg=parseAdventureSvg(render(React.createElement('svg',{},React.createElement(AnimatedAdventureKnopik)))),animator=new KnopikAnimator(svg);animator.paint({player:{angle:angles[col],x:0,y:0,hp:3},area:'sewer',weapon:row===2?'rifle':'fist',punchTime:row===2?.08:0,punchSerial:1,walkDistance:row===1?14:row===3?26:0,moving:row===1||row===3,dodgeTime:0,checkpoint:3,tutorialOpened:true},false);cells.push(`<g transform="translate(${85+col*160} ${112+row*140}) scale(1.3)">${serialize(svg.children[0])}</g><text x="${85+col*160}" y="${135+row*140}" text-anchor="middle" fill="#d5ddc7" font-size="12">${kinds[row]} ${col}</text>`);
}
await save('quarter-poses',`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1120" viewBox="0 0 640 560" shape-rendering="crispEdges"><path d="M0 0h640v560H0Z" fill="#33434b"/>${cells.join('')}</svg>`);
const covers=ARCADE_CATALOG.map((g,i)=>`<g transform="translate(${i%4*172+4} ${Math.floor(i/4)*132+4})">${render(React.createElement(ArcadeGameCover,{kind:g.id})).replace('<svg ','<svg width="160" height="100" ')}<text x="80" y="115" text-anchor="middle" fill="#e9e0c5" font-size="11">${g.title}</text></g>`);
await save('game-covers',`<svg xmlns="http://www.w3.org/2000/svg" width="1376" height="1320" viewBox="0 0 688 660"><path d="M0 0h688v660H0Z" fill="#283944"/>${covers.join('')}</svg>`);console.log('Native SVG/PNG previews in '+dir+'; not browser screenshots.');
