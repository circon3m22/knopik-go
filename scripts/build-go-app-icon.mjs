import {writeFile,copyFile} from 'node:fs/promises';
import sharp from 'sharp';
// A hand-drawn stepped key, flat red enamel and large 5x7 GO glyphs.
const letters={G:['01111','10000','10000','10111','10001','10001','01110'],O:['01110','10001','10001','10001','10001','10001','01110']};
let path='';for(const[i,letter]of['G','O'].entries())for(const[y,row]of letters[letter].entries())for(const[x,on]of[...row].entries())if(on==='1')path+=`M${20+i*48+x*8} ${32+y*8}h8v8h-8Z`;
function key(x,y,w,h){return `M${x+8} ${y}H${x+w-8}v4h4v4h4v${h-16}h-4v4h-4v4H${x+8}v-4h-4v-4H${x}V${y+8}h4v-4h4Z`;}
const mark=`<g data-app-icon-button="pixel-red"><path d="${key(10,16,108,100)}" fill="#65372f"/><path d="${key(10,10,108,100)}" fill="#512f2b"/><path d="${key(14,14,100,92)}" fill="#b76253"/><path d="M22 14h84v4H22ZM18 18h4v4h-4ZM14 22h4v68h-4Z" fill="#d88e71"/><path d="M110 26h4v72h-4v4h-4v4H22v-4h84v-4h4Z" fill="#93483d"/><g data-app-icon-lettermark="GO"><path d="${path}" transform="translate(0 3)" fill="#8e473d"/><path d="${path}" fill="#fff1d1"/></g></g>`;
const source=(maskable=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" shape-rendering="crispEdges"><title>KNOPIK GO</title><path fill="#8e473d" d="M0 0h128v128H0Z"/>${maskable?`<g transform="translate(20 20) scale(.6875)">${mark}</g>`:mark}</svg>`;
await writeFile('public/go-icon.svg',source()+'\n');
const pixels=await sharp(Buffer.from(source())).png().toBuffer();
for(const[file,size]of[['go-cover.png',512],['go-512.png',512],['go-192.png',192],['go-apple-touch.png',180]])await sharp(pixels).resize(size,size,{kernel:'nearest'}).png({compressionLevel:9}).toFile('public/'+file);
const maskPixels=await sharp(Buffer.from(source(true))).png().toBuffer();
await sharp(maskPixels).resize(512,512,{kernel:'nearest'}).png({compressionLevel:9}).toFile('public/go-maskable-512.png');
// Fresh URLs avoid a preceding icon returned by an older installed worker.
for(const[from,to]of[['go-icon.svg','go-mark.svg'],['go-512.png','go-mark-512.png'],['go-192.png','go-mark-192.png'],['go-apple-touch.png','go-mark-apple-touch.png'],['go-icon.svg','go-button.svg'],['go-512.png','go-button-512.png'],['go-192.png','go-button-192.png'],['go-apple-touch.png','go-button-apple-touch.png'],['go-maskable-512.png','go-button-maskable-512.png']])await copyFile('public/'+from,'public/'+to);
