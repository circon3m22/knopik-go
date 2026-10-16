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
const {PlayingCard,PixelDice,RouletteWheel}=await import('../app/casino-artwork.tsx');
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
function text(value,y,size,fill,tracking=1,left){let path='',x=left??(1080-([...value].reduce((n,c)=>n+glyphs[c][0].length,0)+(value.length-1)*tracking)*size)/2;for(const c of value){glyphs[c].forEach((row,r)=>[...row].forEach((v,col)=>{if(v==='1')path+=`M${x+col*size} ${y+r*size}h${size}v${size}h-${size}Z`;}));x+=(glyphs[c][0].length+tracking)*size;}return `<path aria-label="${value}" fill="${fill}" d="${path}"/>`;}
function svgArt(Component,props,x,y,width,height){const rendered=renderToStaticMarkup(h(Component,props));return rendered.slice(rendered.indexOf('<svg'),rendered.lastIndexOf('</svg>')+6).replace('<svg ',`<svg x="${x}" y="${y}" width="${width}" height="${height}" `);}
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));for(const [k,v] of Object.entries({x:64,y:62,width:404,height:80,color:'#4b3025'}))logo.setAttribute(k,String(v));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2160" viewBox="0 0 1080 1080" shape-rendering="crispEdges" role="img" aria-label="KNOPIK GO · ARCADE UPDATE · 0.3.0" data-release-art="orange-arcade-030">
<title>KNOPIK GO — ARCADE UPDATE — 0.3.0</title>
<desc>Оранжевая аркадная: крупный заголовок слева, игровой автомат справа, Кнопик у пульта, белый бармен с напитками и чёрный Кнопик у рулетки. 16.10.26.</desc>
<style>.cocoa-marquee{fill:#f8dcaa;font-family:monospace;font-size:23px;font-weight:700}.arcade-bubble{animation:orange-bubble 3s steps(5,end) infinite}@keyframes orange-bubble{0%,100%{opacity:.35}50%{opacity:.85}}@media(prefers-reduced-motion:reduce){.arcade-bubble{animation:none}}</style>
<path d="M0 0h1080v1080H0Z" fill="#f0a452"/>
<!-- Asymmetric print blocks and an oversized headline: no arch or podium lineup. -->
<path d="M738 0h342v524H948v-78H842v-98H738Z" fill="#f6bd73"/>
<path d="M930 0h150v332h-52v-94h-48v-94h-50Z" fill="#f9ce8c"/>
<path d="M0 560h78v-42h90v-32h176v26H194v35h-92v42H0Z" fill="#df8a43"/>
<path d="M0 813h59v-44h66v-38h84v-37h101v-32h117v22H320v35h-92v36h-80v40H80v41H0Z" fill="#e89145"/>
${serialize(logo)}
${text('15 GAMES',171,4,'#78432c',2,68)}
<path d="M68 207h510v3H68Z" fill="#b46c36"/>
${text('ARCADE',238,17,'#4b3025',1,64)}
${text('UPDATE',374,17,'#fff1d4',1,64)}
<!-- A perforated admission ticket carries the edition, away from the headline. -->
<path d="M794 65h222v24h-10v14h10v59H794v-59h10V89h-10Z" fill="#fff0ce"/><path d="M810 146h190v2H810Z" fill="#d5a66e"/>
${text('0.3.0',88,7,'#794b33',2,817)}
<path d="M875 184h10v24h24v10h-24v24h-10v-24h-24v-10h24Z" fill="#b96135"/>
<!-- Oblique tiled floor: the characters inhabit a room instead of posing in a row. -->
<path d="M129 736 691 537 1050 713 491 1001Z" fill="#a35c38"/>
<path d="M129 719 691 520 1050 696 491 984Z" fill="#f9d39a"/>
<path d="M129 719v17l362 265v-17Z" fill="#c17944"/><path d="M491 984v17l559-288v-17Z" fill="#77442f"/>
<path d="M240 679 798 820 705 868 214 743Z" fill="#efbd7d"/>
<path d="M439 610 948 748 866 790 350 649Z" fill="#efbd7d"/>
<path d="M625 544 1037 703 973 735 553 570Z" fill="#efbd7d"/>
<path d="M306 658 675 891 616 922 234 684Z" fill="#e6ae6d"/>
<path d="M505 586 866 793 804 825 431 613Z" fill="#e6ae6d"/>
<path d="M704 527 1045 697 988 726 635 552Z" fill="#e6ae6d"/>
<!-- The cabinet anchors the upper-right corner. -->
<path d="M806 609h215v27H806Z" fill="#cb8950"/>
${svgArt(CocoaMachine,{phase:'ready',stopped:0,outcome:null,spinOutcome:null,reels:['cherry','lemon','seven'],bet:100},784,330,260,295)}
<!-- White Knopik tends the drink counter, partly hidden by its front. -->
${character({skin:'shiba-white',hat:false,mohawk:true,accessory:'goggles'},Math.PI/2,648,697,2.8)}
<path d="M470 645h346v82H470Z" fill="#8e4c32"/><path d="M474 650h338v9H474Z" fill="#6a392a"/>
<path d="M481 665h88v49h-88Zm105 0h100v49H586Zm117 0h98v49h-98Z" fill="#b67543"/>
<path d="M486 669h78v2h-78Zm106 0h88v2h-88Zm117 0h86v2h-86Z" fill="#dfad6e"/>
<path d="M455 625h376v20H455Z" fill="#55372c"/><path d="M458 625h370v6H458Z" fill="#f9e0b2"/>
${['espresso','grape','whiteTea','ginger','peach','currant'].map((kind,i)=>svgArt(DetailedPotion,{kind},479+i*56,548,47,75)).join('')}
<!-- A tiny control desk turns the foreground Knopik toward the arcade. -->
<path d="M378 790h151v27H378Zm12 27h18v77h-18Zm113 0h18v77h-18Z" fill="#79452f"/>
<path d="M375 777h158v16H375Z" fill="#f7dbab"/><path d="M383 781h145v7H383Z" fill="#c99b68"/>
<path d="M489 758h7v25h-7Z" fill="#4f3d30"/><path d="M485 752h15v12h-15Z" fill="#ad4732"/>
<path d="M508 779h10v5h-10Zm14 0h7v5h-7Z" fill="#658e80"/>
${character({skin:'classic',hat:true,mohawk:false,accessory:'bandana'},Math.PI/4,328,900,3.45)}
<!-- Black Knopik plays at a low roulette table on the other side of the room. -->
${character({skin:'shiba-black',hat:false,mohawk:true,accessory:'cape'},3*Math.PI/4,856,928,3.0)}
<path d="M628 865h158v17H628Zm30 17h16v77h-16Zm89 0h16v65h-16Z" fill="#6b3c2d"/>
<path d="M604 820h27v-14h130v14h32v54H604Z" fill="#9a5334"/><path d="M608 815h28v-13h120v13h32v40H608Z" fill="#f5cd92"/>
${svgArt(RouletteWheel,{number:null,spinning:false},638,755,125,125)}
${svgArt(PlayingCard,{card:{rank:1,suit:1}},593,842,34,49)}${svgArt(PixelDice,{value:5},776,843,35,38)}
<path d="M92 968h168v3H92Zm716 0h180v3H808Z" fill="#b96c3a"/>
<!-- Bottom imprint is deliberately separate from the large upper-left headline. -->
<path d="M0 1007h1080v73H0Z" fill="#603b2b"/>
${text('16.10.26',1031,4,'#f3cb94',2,66)}
${text('ARCADE',1031,4,'#d6a66f',2,854)}
<g class="arcade-bubble" fill="#fff1cf"><path d="M723 300h5v5h-5Zm21-19h3v3h-3ZM450 544h4v4h-4Zm-20 14h3v3h-3Z"/></g>
</svg>`;
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const target='outputs/announcement/knopik-go-arcade-update-0.3.0-orange';
writeFileSync(`${target}.svg`,svg);writeFileSync('public/release-artwork/orange-arcade-030.svg',svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(`${target}.png`).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
console.log(JSON.stringify({png:`${target}.png`,width:2160,height:2160,source:`${target}.svg`,loading:'public/release-artwork/orange-arcade-030.svg'}));
