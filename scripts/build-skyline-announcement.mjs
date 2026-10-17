import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const {PixelLogo}=await import('../app/pixel-artwork.tsx');
const h=React.createElement;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const serialize=n=>`<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${escape(v)}"`).join('')}>${escape(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
function character(equipment,angle,x,y,scale,weapon="fist"){
 const root=parseAdventureSvg(renderToStaticMarkup(h("svg",null,h(AnimatedAdventureKnopik)))).children[0];
 new KnopikAnimator(root).paint({player:{x:0,y:0,hp:3,angle},area:weapon==='fist'?'apartment':'sewer',weapon,punchTime:0,punchSerial:0,walkDistance:0,moving:false,dodgeTime:0,checkpoint:3,tutorialOpened:true,equipment},true);
 const prune=n=>{for(const c of [...n.children]){if(c.getAttribute('display')==='none')c.remove();else prune(c);}};prune(root);
 let source=serialize(root);const ids=[...source.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const id of ids)source=source.replaceAll(id,`release-${x}-${id}`);
 return `<g transform="translate(${x} ${y}) scale(${scale})">${source}</g>`;
}
const glyphs={Y:['10001','10001','01010','00100','00100','00100','00100'],L:['10000','10000','10000','10000','10000','10000','11111'],I:['11111','00100','00100','00100','00100','00100','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],H:['10001','10001','10001','11111','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],'4':['00010','00110','01010','10010','11111','00010','00010'],'8':['01110','10001','10001','01110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],G:['01111','10000','10000','10111','10001','10001','01111'],M:['10001','11011','10101','10101','10001','10001','10001'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['00110','01000','10000','11110','10001','10001','01110'],'.':['0','0','0','0','0','1','1'],' ':Array(7).fill('000')};
function text(value,y,size,fill,tracking=1,left){let path='',x=left??(1080-([...value].reduce((n,c)=>n+glyphs[c][0].length,0)+(value.length-1)*tracking)*size)/2;for(const c of value){glyphs[c].forEach((row,r)=>[...row].forEach((v,col)=>{if(v==='1')path+=`M${x+col*size} ${y+r*size}h${size}v${size}h-${size}Z`;}));x+=(glyphs[c][0].length+tracking)*size;}return `<path aria-label="${value}" fill="${fill}" d="${path}"/>`;}
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));for(const [k,v]of Object.entries({x:66,y:55,width:340,height:68,color:'#244b73'}))logo.setAttribute(k,String(v));
const blocks=(count,y,color)=>`<g fill="${color}">${Array.from({length:count},(_,i)=>{const x=i*108-42,h=65+(i*97)%210;return `<path d="M${x} ${y}v-${h}h62v-${i%3*13}h24v${h+i%3*13}Z"/>${Array.from({length:Math.floor(h/22)},(_,n)=>`<path d="M${x+9} ${y-h+11+n*22}h8v5h-8Zm21 0h8v5h-8Z" fill="#e9fcff" opacity=".38"/>`).join('')}`;}).join('')}</g>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2160" viewBox="0 0 1080 1080" shape-rendering="crispEdges" role="img" aria-label="KNOPIK GO SKYLINE UPDATE 0.5.0 · 18.10.26" data-release-art="skyline-050">
<title>KNOPIK GO — SKYLINE UPDATE — 0.5.0 — 18.10.26</title><defs><linearGradient id="skyline-sky" x2="0" y2="1"><stop stop-color="#81c9f0"/><stop offset=".68" stop-color="#d5f1fa"/><stop offset="1" stop-color="#719ebc"/></linearGradient><radialGradient id="skyline-sun"><stop stop-color="#f1ffff" stop-opacity=".9"/><stop offset="1" stop-color="#dff8ff" stop-opacity="0"/></radialGradient><linearGradient id="skyline-glass"><stop stop-color="#e3fcff" stop-opacity=".68"/><stop offset="1" stop-color="#77b7d6" stop-opacity=".4"/></linearGradient></defs>
<rect width="1080" height="1080" fill="url(#skyline-sky)"/><circle cx="849" cy="258" r="285" fill="url(#skyline-sun)"/>
<path d="M800 159h88v12h17v17h12v66h-12v17h-17v12h-88v-12h-17v-17h-12v-66h12v-17h17Z" fill="#edffff"/>
<g fill="#effbff" opacity=".65"><path d="M0 349h89v-14h48v14h44v14h54v12H0Zm744 9h78v-10h42v10h42v13h70v11H744Z"/><path d="M516 109h49v-9h27v9h32v10h35v9H516Z"/></g>
${blocks(12,697,'#86b6d3')}${blocks(11,817,'#6595b5')}
<path d="M0 905 1080 700v380H0Z" fill="#325d82"/>
<path d="M0 701 363 625l115 57-353 86Z" fill="#d6eff2"/><path d="m125 768 353-86v27l-353 90Z" fill="#5f8da9"/><path d="M0 701 125 768v31L0 730Z" fill="#45718f"/>
<path d="m451 852 439-111 190 78-437 125Z" fill="#d9eff0"/><path d="m643 944 437-125v39L643 987Z" fill="#70a6c0"/><path d="m451 852 192 92v43l-192-94Z" fill="#446e91"/>
<path d="m467 854 174 80 420-119-4 7-416 120-174-81Z" fill="#f0ffff"/>
<path d="M414 485 1001 363v213L414 712Z" fill="url(#skyline-glass)" stroke="#c7effa" stroke-width="4"/><path d="m440 490 121-25-57 214-64 15Zm170-35 20-4-57 214-20 5Z" fill="#f6ffff" opacity=".3"/><path d="m415 701 584-135v11L415 713Z" fill="#5689ab"/><path d="M1001 363v213" stroke="#f0ffff" stroke-width="6"/>
<ellipse cx="720" cy="849" rx="133" ry="24" fill="#2d6083" opacity=".23"/>
${character({skin:'shiba-black',hat:false,mohawk:false,accessory:'ranger-hood'},Math.PI/3,258,702,2.75)}
${character({skin:'glacier',hat:false,mohawk:false,accessory:'sky-boots'},Math.PI/3,729,858,5.65)}
<g fill="#b8f4ff"><path d="m563 818 42 18-34 9-42-18Z"/><path d="m528 833 27 13-23 5-28-12Z"/></g>
<path d="M65 838h198v4H65Zm0 11h135v2H65Z" fill="#efffff" opacity=".7"/>
${serialize(logo)}
<path d="M834 57h180v64H834Z" fill="#d4f0f9" stroke="#4d85ad" stroke-width="2"/>${text('0.5.0',76,5,'#315a7f',1,851)}
${text('SKYLINE',173,14,'#244d76',1,65)}${text('UPDATE',294,9,'#3c739d',2,67)}
<path d="M67 379h196v3H67Zm0 9h101v1H67Z" fill="#5d9dc6"/>
<path d="M0 1001h1080v79H0Z" fill="#244d76"/><path d="M38 997h1004v3H38Z" fill="#c0e7f6"/>
${text('18.10.26',1026,5,'#d2f5ff',2)}
<g fill="#c9f9ff"><path d="M941 643h4v16h-4Zm-6 6h16v4h-16ZM391 795h3v12h-3Zm-5 5h13v3h-13Z"/></g></svg>`;
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const target='outputs/announcement/knopik-go-skyline-update-0.5.0';writeFileSync(`${target}.svg`,svg);writeFileSync('public/release-artwork/skyline-050.svg',svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`${target}.png`);await sharp(`${target}.png`).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
console.log(JSON.stringify({png:`${target}.png`,width:2160,height:2160,loading:'public/release-artwork/skyline-050.svg'}));
