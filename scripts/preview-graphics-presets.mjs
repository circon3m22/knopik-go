import '../tests/helpers/tsx-loader.mjs';
import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {existsSync} from 'node:fs';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {GRAPHICS_QUALITIES} from '../app/graphics-quality.ts';
const {GraphicsQualityPreview}=await import('../app/graphics-quality-preview.tsx');
const out=process.argv[2]??'outputs/graphics-presets';await mkdir(out,{recursive:true});
if(existsSync('outputs/neighborhood-city/fonts.conf'))process.env.FONTCONFIG_FILE=resolve('outputs/neighborhood-city/fonts.conf');
const scenes=[];
for(const quality of GRAPHICS_QUALITIES){
 const svg=render(h(GraphicsQualityPreview,{quality:quality.id})).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="352" height="224" ');
 await writeFile(`${out}/${quality.id}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${out}/${quality.id}.png`);
 scenes.push(`<g transform="translate(${16+scenes.length*368} 16)">${svg}<text x="0" y="255" font-size="28">${quality.title}</text><text x="0" y="282" font-size="18">${quality.tag}</text></g>`);
}
const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="326"><rect width="1120" height="326" fill="#e8e0ca"/><g fill="#34362f" font-family="Tiny5,monospace">${scenes.join('')}</g></svg>`;
await sharp(Buffer.from(sheet)).png().toFile(`${out}/comparison.png`);
console.log(`Native SVG/PNG examples in ${out}; illustrations, not browser screenshots or a phone performance measurement.`);
