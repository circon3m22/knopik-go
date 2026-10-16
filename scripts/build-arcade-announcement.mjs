import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const {PixelLogo}=await import('../app/pixel-artwork.tsx');
const {DetailedPotion}=await import('../app/drink-bottle-art.tsx');
const {CocoaMachine}=await import('../app/cocoa-machine.tsx');
const {PlinkoBoard,PlayingCard,PixelDice}=await import('../app/casino-artwork.tsx');
const h=React.createElement;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const serialize=n=>`<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${escape(v)}"`).join('')}>${escape(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
function character(equipment,angle,x,y,scale){
 const root=parseAdventureSvg(renderToStaticMarkup(h("svg",null,h(AnimatedAdventureKnopik)))).children[0];
 new KnopikAnimator(root).paint({player:{x:0,y:0,hp:3,angle},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,walkDistance:0,moving:false,dodgeTime:0,checkpoint:3,tutorialOpened:true,equipment},true);
 const prune=n=>{for(const c of [...n.children]){if(c.getAttribute('display')==='none')c.remove();else prune(c);}};prune(root);
 let source=serialize(root);const ids=[...source.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const id of ids)source=source.replaceAll(id,`release-${x}-${id}`);
 return `<g transform="translate(${x} ${y}) scale(${scale})">${source}</g>`;
}
const glyphs={
 A:['01110','10001','10001','11111','10001','10001','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],G:['01111','10000','10000','10111','10001','10001','01111'],M:['10001','11011','10101','10101','10001','10001','10001'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['00110','01000','10000','11110','10001','10001','01110'],'.':['0','0','0','0','0','1','1'],' ':Array(7).fill('000')};
function text(value,y,size,fill,tracking=1){let path='',x=(1080-([...value].reduce((n,c)=>n+glyphs[c][0].length,0)+(value.length-1)*tracking)*size)/2;for(const c of value){glyphs[c].forEach((row,r)=>[...row].forEach((v,col)=>{if(v==='1')path+=`M${x+col*size} ${y+r*size}h${size}v${size}h-${size}Z`;}));x+=(glyphs[c][0].length+tracking)*size;}return `<path aria-label="${value}" fill="${fill}" d="${path}"/>`;}
function svgArt(Component,props,x,y,width,height){const rendered=renderToStaticMarkup(h(Component,props));return rendered.slice(rendered.indexOf('<svg'),rendered.lastIndexOf('</svg>')+6).replace('<svg ',`<svg x="${x}" y="${y}" width="${width}" height="${height}" `);}
const star=(x,y,s,fill)=>`<path d="M${x+s} ${y}h${s}v${s}h${s}v${s}h-${s}v${s}h-${s}v-${s}h-${s}v-${s}h${s}Z" fill="${fill}"/>`;
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));for(const [k,v] of Object.entries({x:300,y:76,width:480,height:95,color:'#f5e9d0'}))logo.setAttribute(k,String(v));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2160" viewBox="0 0 1080 1080" shape-rendering="crispEdges" role="img" aria-label="KNOPIK GO · ARCADE UPDATE · 0.3.0" data-release-art="arcade-030">
<title>KNOPIK GO — ARCADE UPDATE — 0.3.0</title>
<desc>Три Кнопика в разных скинах и одежде, аркадные автоматы, карты, кости и шесть новых напитков на сине-фиолетовом фоне. 16.10.26.</desc>
<style>.cocoa-marquee{fill:#f4ddb2;font-family:monospace;font-size:23px;font-weight:700}.release-spark{animation:release-glimmer 4s steps(4,end) infinite}.release-spark:nth-of-type(even){animation-delay:-2s}@keyframes release-glimmer{0%,100%{opacity:.45}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.release-spark{animation:none}}</style>
<path d="M0 0h1080v1080H0Z" fill="#17203b"/>
<path d="M0 350h72v-82h132v-60h672v60h132v82h72v470H0Z" fill="#202c4b"/>
<path d="M146 392h52v-70h64v-66h556v66h64v70h52v388H146Z" fill="#302d59"/>
<path d="M266 350h44v-42h460v42h44v406H266Z" fill="#3b3266"/>
<path d="M396 330h288v430H396Z" fill="#46386e"/>
<path d="M98 700V392h22v-52h36v-42h48v-36h56v-24h560v24h56v36h48v42h36v52h22v308" fill="none" stroke="#667294" stroke-width="4"/>
<path d="M160 697V408h24v-50h38v-34h44v-28h548v28h44v34h38v50h24v289" fill="none" stroke="#8975ad" stroke-width="2"/>
<path d="M52 100V52h48m880 0h48v48M52 980v48h48m880 0h48v-48" fill="none" stroke="#526083" stroke-width="4"/>
${serialize(logo)}
${text('15 GAMES',214,4,'#a6c5ce',2)}
<path d="M468 265h144v3H468Z" fill="#c4a7dc"/>
<!-- Original game cabinets sit behind the character lineup. -->
${svgArt(CocoaMachine,{phase:'ready',stopped:0,outcome:null,spinOutcome:null,reels:['cherry','lemon','seven'],bet:100},70,396,252,286)}
<path d="M778 404h212v248H778Z" fill="#161f36"/><path d="M782 408h204v240H782Z" fill="#78869d"/><path d="M788 414h192v229H788Z" fill="#354b65"/>
${svgArt(PlinkoBoard,{path:[],progress:0,risk:'medium'},789,455,190,146)}
<path d="M797 426h174v12H797Zm-9 213h192v12H788Zm0 12h192v13H788Z" fill="#ac98c4"/>
<path d="M788 664h192v13H788Z" fill="#101a30"/>
<!-- Floor squares and a shared display plinth. -->
<path d="M0 742h1080v82H0Z" fill="#1b2441"/>
<path d="M148 757h784v9h26v22H122v-22h26Z" fill="#606589"/><path d="M148 757h784v5H148Z" fill="#b8bfd9"/><path d="M122 788h836v10H122Z" fill="#10182e"/>
<path d="M442 744h196v7h14v13H428v-13h14Z" fill="#7b6a9d"/><path d="M442 744h196v4H442Z" fill="#d0bde6"/>
${character({skin:'shiba-white',hat:true,mohawk:false,accessory:'cape'},Math.PI/4,308,754,3.85)}
${character({skin:'classic',hat:false,mohawk:true,accessory:'goggles'},Math.PI/2,540,736,4.7)}
${character({skin:'shiba-black',hat:false,mohawk:false,accessory:'bandana'},3*Math.PI/4,774,754,3.85)}
<!-- The six new drink labels are real game SVGs, not generated illustrations. -->
${['espresso','grape','whiteTea','ginger','peach','currant'].map((kind,i)=>svgArt(DetailedPotion,{kind},357+i*62,779,56,84)).join('')}
${svgArt(PlayingCard,{card:{rank:1,suit:1}},157,748,48,70)}${svgArt(PlayingCard,{card:{rank:13,suit:0}},198,756,48,70)}
${svgArt(PixelDice,{value:5},847,770,46,50)}${svgArt(PixelDice,{value:3},896,779,40,44)}
<g class="release-spark">${star(86,313,5,'#a2cddd')}${star(962,303,5,'#c9addc')}${star(254,202,3,'#8b8eb7')}</g>
<g class="release-spark">${star(918,714,3,'#d7c197')}${star(148,718,3,'#a2cddd')}${star(825,194,3,'#c9addc')}</g>
${text('ARCADE UPDATE',890,10,'#f5e9d0')}
${text('0.3.0',980,7,'#c6b5e4',2)}
<path d="M334 1003h88v3h-88Zm324 0h88v3h-88Z" fill="#687397"/>
${text('16.10.26',1040,3,'#a7acc8',2)}
</svg>`;
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const target='outputs/announcement/knopik-go-arcade-update-0.3.0';
writeFileSync(`${target}.svg`,svg);writeFileSync('public/release-artwork/arcade-030.svg',svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(`${target}.png`).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
console.log(JSON.stringify({png:`${target}.png`,width:2160,height:2160,source:`${target}.svg`,loading:'public/release-artwork/arcade-030.svg'}));
