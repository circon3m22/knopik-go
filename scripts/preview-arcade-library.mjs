import '../tests/helpers/tsx-loader.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import sharp from 'sharp';
import {ARCADE_CATALOG} from '../app/arcade-catalog.ts';
const {ArcadeGameCover}=await import('../app/arcade-game-cover.tsx');
const dir='outputs/arcade-library-v2';await mkdir(dir,{recursive:true});
if(existsSync('outputs/neighborhood-city/font-cache/tiny5.ttf'))process.env.FONTCONFIG_FILE=resolve('outputs/neighborhood-city/fonts.conf');
const cells=[];
for(const [i,g] of ARCADE_CATALOG.entries()){
 const art=render(React.createElement(ArcadeGameCover,{kind:g.id}));
 const svg=art.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" ');
 await writeFile(`${dir}/${g.id}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${dir}/${g.id}.png`);
 cells.push(`<g transform="translate(${12+i%3*268} ${12+Math.floor(i/3)*192})">${art.replace('<svg ','<svg width="256" height="160" ')}<text x="128" y="180" text-anchor="middle" fill="#374738" font-family="Tiny5,monospace" font-size="16">${g.title}</text></g>`);
}
const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1632" height="2328" viewBox="0 0 816 1164"><path d="M0 0h816v1164H0Z" fill="#e7dfca"/>${cells.join('')}</svg>`;
await writeFile(`${dir}/covers-sheet.svg`,sheet);await sharp(Buffer.from(sheet)).png().toFile(`${dir}/covers-sheet.png`);
console.log('Native SVG/PNG artwork previews: '+dir+'; not browser screenshots.');
