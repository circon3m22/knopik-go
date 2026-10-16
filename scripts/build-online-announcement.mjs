import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const {PixelLogo}=await import('../app/pixel-artwork.tsx');

const P={paper:'#171e38',ink:'#f4ecd9',red:'#8e473d',green:'#90d8d5',line:'#535a86',sand:'#2c345b',gold:'#b3a0e1',light:'#fff1d1'};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function serialize(n){return `<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${escape(v)}"`).join('')}>${escape(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;}
function character(equipment,angle,x,y,scale){
 const root=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik)));
 new KnopikAnimator(root).paint({player:{x:0,y:0,hp:3,angle},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,walkDistance:0,moving:false,dodgeTime:0,checkpoint:3,tutorialOpened:true,equipment},true);
 // Inactive directions, accessories and tools are discarded from the export.
 const prune=n=>{for(const c of [...n.children]){if(c.getAttribute('display')==='none')c.remove();else prune(c);}};prune(root);
 return `<g transform="translate(${x} ${y}) scale(${scale})">${serialize(root)}</g>`;
}
const glyphs={
 N:['10001','11001','10101','10011','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 ' ':Array(7).fill('000'),
 M:['10001','11011','10101','10101','10001','10001','10001'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 P:['11110','10001','10001','11110','10000','10000','10000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '6':['00110','01000','10000','11110','10001','10001','01110'],
 '.':['0','0','0','0','0','1','1'],
};
function pixelText(text,y,size,color,tracking=1){
 const widths=[...text].map(c=>glyphs[c][0].length),total=(widths.reduce((a,b)=>a+b,0)+tracking*(text.length-1))*size;
 let x=(1080-total)/2,path='';
 for(const c of text){for(let row=0;row<7;row++)for(let col=0;col<glyphs[c][row].length;col++)if(glyphs[c][row][col]==='1')path+=`M${x+col*size} ${y+row*size}h${size}v${size}h-${size}Z`;x+=(glyphs[c][0].length+tracking)*size;}
 return `<path aria-label="${text}" d="${path}" fill="${color}"/>`;
}
function star(x,y,s,color){return `<path d="M${x+s} ${y}h${s}v${s}h${s}v${s}h-${s}v${s}h-${s}v-${s}h-${s}v-${s}h${s}Z" fill="${color}"/>`;}
function corner(x,y,sx,sy){return `<path d="M${x+sx*48} ${y}H${x}V${y+sy*48}" fill="none" stroke="${P.line}" stroke-width="4"/>`;}
const logo=parseAdventureSvg(renderToStaticMarkup(React.createElement(PixelLogo)));
logo.setAttribute('x','330');logo.setAttribute('y','90');logo.setAttribute('width','420');logo.setAttribute('height','83');logo.setAttribute('color',P.ink);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2160" viewBox="0 0 1080 1080" shape-rendering="crispEdges" role="img" aria-label="KNOPIK GO · ONLINE UPDATE 0.2.0">
<title>KNOPIK GO — ONLINE UPDATE — 0.2.0</title>
<path d="M0 0h1080v1080H0Z" fill="${P.paper}"/>
<!-- Flat stepped light, the same construction as the game's SVG environments. -->
<path d="M0 346h96v-72h116v-66h656v66h116v72h96v454H0Z" fill="#20294a"/>
<path d="M170 354h54v-64h64v-48h504v48h64v64h54v420H170Z" fill="#2b2d57"/>
<path d="M246 388h44v-60h54v-36h392v36h54v60h44v374H246Z" fill="#342d60"/>
<path d="M344 352h40v-34h312v34h40v370H344Z" fill="#3b3268"/>
${corner(52,52,1,1)}${corner(1028,52,-1,1)}${corner(52,1028,1,-1)}${corner(1028,1028,-1,-1)}
${serialize(logo)}
<path d="M502 220h76v4h-76Z" fill="#90d8d5"/>
<!-- An arcade arch and sparse, hand placed pixel stars. -->
<path d="M150 714V390h24v-44h30v-36h36v-30h48v-22h504v22h48v30h36v36h30v44h24v324" fill="none" stroke="#535782" stroke-width="4"/>
<path d="M204 710V420h20v-44h34v-34h42v-24h480v24h42v34h34v44h20v290" fill="none" stroke="#71649b" stroke-width="2"/>
${star(109,444,5,'#8cbaca')}${star(936,374,5,'#b7a3df')}${star(836,249,3,'#777da8')}${star(200,593,3,'#b7a3df')}${star(932,627,3,'#8cbaca')}
<path d="M164 290h6v6h-6ZM890 493h7v7h-7ZM410 247h4v4h-4ZM692 227h5v5h-5Z" fill="#777da8"/>
<!-- Three display plinths frame the skin and clothing lineup. -->
<path d="M126 738h256v12h26v18H102v-18h24Z" fill="#58648d"/><path d="M126 738h256v5H126Z" fill="#a3c5d1"/><path d="M102 768h306v9H102Z" fill="#10182f"/>
<path d="M396 754h288v12h24v20H372v-20h24Z" fill="#71639c"/><path d="M396 754h288v5H396Z" fill="#d3b9ed"/><path d="M372 786h336v9H372Z" fill="#10182f"/>
<path d="M698 738h256v12h24v18H674v-18h24Z" fill="#58648d"/><path d="M698 738h256v5H698Z" fill="#a3c5d1"/><path d="M674 768h304v9H674Z" fill="#10182f"/>
${character({skin:'shiba-white',hat:true,mohawk:false,accessory:'bandana'},Math.PI/4,258,738,4.5)}
${character({skin:'classic',hat:false,mohawk:true,accessory:'goggles'},Math.PI/2,540,752,5)}
${character({skin:'shiba-black',hat:false,mohawk:false,accessory:'cape'},3*Math.PI/4,826,738,4.5)}
${pixelText('ONLINE UPDATE',854,10,P.ink)}
<path d="M360 990h46v4h-46ZM674 990h46v4h-46Z" fill="#777da8"/>
${pixelText('0.2.0',952,10,'#b9b1ed',2)}
</svg>`;
const target='outputs/announcement/knopik-go-online-update-0.2.0';
mkdirSync('outputs/announcement',{recursive:true});
writeFileSync(`${target}.svg`,svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(`${target}.png`).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
console.log(JSON.stringify({png:`${target}.png`,width:2160,height:2160,format:'png',source:`${target}.svg`}));
