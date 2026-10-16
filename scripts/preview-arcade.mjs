import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup as markup} from 'react-dom/server';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
mkdirSync('outputs/arcade-030',{recursive:true});
const {TableDetails,ArcadeDealer,PlayingCard,RouletteWheel,PixelDice,PlinkoBoard}=await import('../app/casino-artwork.tsx');
const {DetailedPotion}=await import('../app/drink-bottle-art.tsx');
const {BrainrotScene}=await import('../app/brainrot-artwork.tsx');
const {BrainrotEngine}=await import('../app/brainrot-engine.ts');
const svg=(Component,props,x,y,width,height)=>markup(React.createElement(Component,props)).replace('<svg ',`<svg x="${x}" y="${y}" width="${width}" height="${height}" `);
const bg=(content,w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"><style>@font-face{font-family:Knopik;src:url(data:font/woff2;base64,${readFileSync('public/fonts/tiny5.woff2').toString('base64')})}text{font-family:Knopik,monospace}</style><rect width="100%" height="100%" fill="#27364d"/>${content}</svg>`;
let panels='';
const titles=['ЭСПРЕССО / 21','ВИНОГРАД / РУЛЕТКА','БЕЛЫЙ ЧАЙ / БАККАРА','ИМБИРЬ / ТРИ КОСТИ','ПЕРСИК / ПЛИНКО','СМОРОДИНА / РАЗГОН'];
for(let i=0;i<6;i++){const x=20+i%3*340,y=20+Math.floor(i/3)*310;let content=svg(TableDetails,{},x,y+32,320,240);if(i===0||i===2){content+=svg(ArcadeDealer,{skin:i===0?'shiba-white':'shiba-black'},x+104,y+36,96,116);[4,11,8].forEach((rank,j)=>content+=svg(PlayingCard,{card:{rank,suit:j}},x+85+j*44,y+165,44,68));}if(i===1)content+=svg(RouletteWheel,{number:17,spinning:false},x+44,y+34,232,232);if(i===3)[5,3,2].forEach((value,j)=>content+=svg(PixelDice,{value},x+50+j*76,y+125,62,68));if(i===4)content+=svg(PlinkoBoard,{path:[1,0,1,1,0,0,1,1],progress:5.4,risk:'medium'},x,y+32,320,240);if(i===5)content+=`<rect x="${x+22}" y="${y+52}" width="276" height="200" fill="#273a55"/><text x="${x+50}" y="${y+118}" fill="#e4c9f0" font-size="42">×2.74</text><path d="M${x+35} ${y+225}l54-16 45-32 35-43 32-54" stroke="#d9baed" fill="none" stroke-width="4"/><path d="M${x+200} ${y+79}h12v18h-12Z" fill="#ead3aa"/>`;panels+=content+`<text x="${x}" y="${y+20}" fill="#ead6b4" font-size="21">${titles[i]}</text>`;}
const out=bg(panels,1040,630);writeFileSync('outputs/arcade-030/casino-tables.svg',out);await sharp(Buffer.from(out)).png().toFile('outputs/arcade-030/casino-tables.png');
let scenes='';for(const [i,kind] of ['tralalero','ballerina','bombardiro','verity'].entries()){const g=new BrainrotEngine(kind,()=>.5);g.start();g.time=kind==='tralalero'?19:kind==='bombardiro'?28:3;g.update(.01);const x=i*330;scenes+=svg(BrainrotScene,{kind,state:g.snapshot(),reduced:false},x,30,320,440)+`<text x="${x+8}" y="20" fill="#ead6b4" font-size="20">${kind.toUpperCase()}</text>`;}
const old=bg(scenes,1320,480);writeFileSync('outputs/arcade-030/arcade-scenes.svg',old);await sharp(Buffer.from(old)).png().toFile('outputs/arcade-030/arcade-scenes.png');
const kinds=['pitbull','cocoa','bergamot','lime','matcha','tralalero','ballerina','bombardiro','verity','espresso','grape','whiteTea','ginger','peach','currant','zhivchik','pepsi','heal'];let bottles='';for(const [i,kind] of kinds.entries())bottles+=svg(DetailedPotion,{kind},20+i%9*84,20+Math.floor(i/9)*130,64,96);await sharp(Buffer.from(bg(bottles,780,280))).png().toFile('outputs/arcade-030/drinks.png');
console.log('Native SVG previews exported');
