import {readFile,writeFile} from 'node:fs/promises';
// Native corner paths share the master; straight edges use ordinary CSS borders.
// No image decoder, border-image or mask participates in the control outline.
const svg=await readFile(new URL('../public/ui/game-control-frame.svg',import.meta.url),'utf8');
const paths=[...svg.matchAll(/<path fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"/g)].map(([,fill,d])=>({fill,d}));
if(paths.length!==2||!svg.includes('width="48" height="48"'))throw Error('Expected the 48px two-tone control master');
await writeFile(new URL('../app/game-control-frame.ts',import.meta.url),'// Generated from public/ui/game-control-frame.svg.\nexport const CONTROL_FRAME='+JSON.stringify({size:48,corner:12,paths},null,2)+' as const;\n');
