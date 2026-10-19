import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
// A fixed-size pixel tile avoids WebKit's vector border-image/backdrop compositing.
const svg=await readFile(new URL('../public/ui/game-control-frame.svg',import.meta.url));
const tile=await sharp(svg).png().toBuffer();
const file=new URL('../app/gameplay-control-art.css',import.meta.url),css=await readFile(file,'utf8');
await writeFile(file,css.replace(/--control-edge-image:url\("[^"]+"\)/,`--control-edge-image:url("data:image/png;base64,${tile.toString('base64')}")`));
