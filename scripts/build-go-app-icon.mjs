import {writeFile,copyFile} from 'node:fs/promises';
import sharp from 'sharp';
// Two hand-drawn 5x7 glyphs: no font, rounded button, panel or outside frame.
const letters={G:['01111','10000','10000','10111','10001','10001','01110'],O:['01110','10001','10001','10001','10001','10001','01110']};
let path='';for(const[i,letter]of['G','O'].entries())for(const[y,row]of letters[letter].entries())for(const[x,on]of[...row].entries())if(on==='1')path+=`M${9+i*60+x*10} ${29+y*10}h10v10h-10Z`;
const mark=`<g data-app-icon-lettermark="GO"><path d="${path}" transform="translate(0 2)" fill="#63352f"/><path d="${path}" fill="#fff1d1"/></g>`;
const source=(maskable=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" shape-rendering="crispEdges"><title>KNOPIK GO</title><path fill="#8e473d" d="M0 0h128v128H0Z"/>${maskable?`<g transform="translate(15.36 15.36) scale(.76)">${mark}</g>`:mark}</svg>`;
await writeFile('public/go-icon.svg',source()+'\n');
const pixels=await sharp(Buffer.from(source())).png().toBuffer();
for(const[file,size]of[['go-cover.png',512],['go-512.png',512],['go-192.png',192],['go-apple-touch.png',180]])await sharp(pixels).resize(size,size,{kernel:'nearest'}).png({compressionLevel:9}).toFile('public/'+file);
const maskPixels=await sharp(Buffer.from(source(true))).png().toBuffer();
await sharp(maskPixels).resize(512,512,{kernel:'nearest'}).png({compressionLevel:9}).toFile('public/go-maskable-512.png');
// Fresh URLs avoid a preceding icon returned by an older installed worker.
for(const[from,to]of[['go-icon.svg','go-mark.svg'],['go-512.png','go-mark-512.png'],['go-192.png','go-mark-192.png'],['go-apple-touch.png','go-mark-apple-touch.png']])await copyFile('public/'+from,'public/'+to);
