import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const {PixelLogo}=await import('../app/pixel-artwork.tsx');
const {HunterRunnerSprites}=await import('../app/hunter-runner-art.tsx');
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
const glyphs={H:['10001','10001','10001','11111','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],'4':['00010','00110','01010','10010','11111','00010','00010'],'7':['11111','00001','00010','00100','01000','01000','01000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],G:['01111','10000','10000','10111','10001','10001','01111'],M:['10001','11011','10101','10101','10001','10001','10001'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['00110','01000','10000','11110','10001','10001','01110'],'.':['0','0','0','0','0','1','1'],' ':Array(7).fill('000')};
function text(value,y,size,fill,tracking=1,left){let path='',x=left??(1080-([...value].reduce((n,c)=>n+glyphs[c][0].length,0)+(value.length-1)*tracking)*size)/2;for(const c of value){glyphs[c].forEach((row,r)=>[...row].forEach((v,col)=>{if(v==='1')path+=`M${x+col*size} ${y+r*size}h${size}v${size}h-${size}Z`;}));x+=(glyphs[c][0].length+tracking)*size;}return `<path aria-label="${value}" fill="${fill}" d="${path}"/>`;}
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));for(const [k,v] of Object.entries({x:64,y:51,width:350,height:78,color:'#e5e9ce'}))logo.setAttribute(k,String(v));
const sprites=renderToStaticMarkup(h(HunterRunnerSprites,{prefix:'hunter-poster'}));
const pines=(items,color,opacity=1)=>`<g fill="${color}" opacity="${opacity}">${items.map(([x,y,k])=>`<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8-190H8V0H-8Z"/><path d="M-5-310H5v22h13v22h13v23h18v24h17v23h22v28H58v26h29v27H46v25h23v25H28v28H-28v-28h-41v-25h23v-25h-41v-27h29v-26h-30v-28h22v-23h17v-24h18v-23h13v-22h13Z"/></g>`).join('')}</g>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2160" viewBox="0 0 1080 1080" shape-rendering="crispEdges" role="img" aria-label="KNOPIK GO HUNTER UPDATE 0.4.0 · 17.10.26" data-release-art="hunter-040">
<title>KNOPIK GO — HUNTER UPDATE — 0.4.0 — 17.10.26</title><defs>${sprites}<linearGradient id="hunter-night" x2="0" y2="1"><stop stop-color="#122b2b"/><stop offset="1" stop-color="#416644"/></linearGradient><radialGradient id="hunter-moon-glow"><stop stop-color="#b0c18a" stop-opacity=".26"/><stop offset="1" stop-color="#9ebc88" stop-opacity="0"/></radialGradient></defs>
<rect width="1080" height="1080" fill="url(#hunter-night)"/>
<ellipse cx="765" cy="383" rx="302" ry="302" fill="url(#hunter-moon-glow)"/>
<path d="M680 267h142v14h28v28h18v118h-18v28h-28v14H680v-14h-28v-28h-18V309h18v-28h28Z" fill="#b8c59a"/><path d="M691 279h120v13h27v28h17v96h-17v28h-27v12H691v-12h-27v-28h-17v-96h17v-28h27Z" fill="#d6d9b1"/><path d="M702 302h31v9h-31Zm96 78h31v23h-31Zm-79 35h38v9h-38Z" fill="#b5c296" opacity=".6"/>
${pines([[35,680,1.25],[190,614,.8],[340,660,1.25],[501,623,.9],[655,696,1.1],[912,660,1.3],[1050,675,1.2]],'#264a3d')}
<path d="M0 702h180v-18h158v27h174v-18h161v-21h199v38h208v370H0Z" fill="#233f32"/><path d="M0 837h186v-24h199v20h177v-44h202v-19h198v-20h118v330H0Z" fill="#35543b"/>
<path d="M122 993h295l-61-127h42l76-93h-48l-69 75h-38Z" fill="#6a7950"/><path d="M199 993h115l-24-134h35l78-91h-21l-86 79h-40Z" fill="#8d9361"/>
<path d="M476 916h447v16H476Zm87 16h301v13H563Z" fill="#152f29"/>
${pines([[50,915,1.95],[1045,923,1.9]],'#142f2a')}
<g fill="#d3ddae" opacity=".6"><path d="M495 316h3v3h-3Zm-344 92h3v3h-3Zm342 124h4v4h-4Zm407-83h3v3h-3Zm-323 205h3v3h-3Z"/></g>
${serialize(logo)}
<path d="M842 59h176v64H842Z" fill="#294a3b" stroke="#7c9370" stroke-width="2"/>
${text('0.4.0',76,5,'#d4dabb',1,861)}
${text('HUNTER UPDATE',172,10,'#e1e6c4',1)}
<path d="M166 256h748v2H166Z M493 254h94v6h-94Z" fill="#7fa076"/>
<g opacity=".7"><use href="#hunter-poster-stone-arch" transform="translate(271 699) scale(1.5)"/></g>
${character({skin:'shiba-black',hat:false,mohawk:false,accessory:'ranger-hood'},Math.PI/2,277,755,2.8,'rifle')}
<ellipse cx="700" cy="894" rx="190" ry="37" fill="#0b2423" opacity=".7"/>
${character({skin:'hunter',hat:false,mohawk:false,accessory:'hunter-cloak'},Math.PI/3,700,894,6.4,'crossbow')}
<g transform="translate(420 957)"><path d="M-48 0h96v11h-96Z" fill="#172f28"/><path d="M-32-33h64v33h-64Z" fill="#635740"/><path d="M-26-28h52v5h-52Zm0 12h52v4h-52Z" fill="#8f8057"/><path d="M-10-41h20v9h-20Z" fill="#9bab8d"/><path d="M-6-39H6v6H-6Z" fill="#d2d9b7"/></g>
<path d="M0 1011h1080v69H0Z" fill="#142e29"/><path d="M38 1006h1004v2H38Z" fill="#6d8b62"/>
${text('17.10.26',1030,4,'#becba4',2)}
<g fill="#91a777" opacity=".6"><path d="M93 949h4v-18h3v18h5v-25h3v25h6v5H93Zm796 20h5v-17h4v17h6v-29h4v29h6v5h-25Z"/></g>
</svg>`;
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const target='outputs/announcement/knopik-go-hunter-update-0.4.0';
writeFileSync(`${target}.svg`,svg);writeFileSync('public/release-artwork/hunter-040.svg',svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(`${target}.png`).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
console.log(JSON.stringify({png:`${target}.png`,width:2160,height:2160,source:`${target}.svg`,loading:'public/release-artwork/hunter-040.svg'}));
