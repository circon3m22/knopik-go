import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export async function buildOfflinePack(directory, basePath='') {
  const assets=[];
  async function walk(folder) {
    for(const entry of await readdir(folder,{withFileTypes:true})) {
      const file=path.join(folder,entry.name);
      if(entry.isDirectory()){await walk(file);continue;}
      const relative=path.relative(directory,file).split(path.sep).join('/');
      if(relative==='sw.js'||relative==='offline-pack.json'||relative.startsWith('.')||relative.endsWith('.map'))continue;
      const bytes=await readFile(file);
      const route=relative==='index.html'?'':relative.endsWith('/index.html')?relative.slice(0,-10):relative;
      assets.push({url:`${basePath}/${route}`,bytes:(await stat(file)).size,sha256:createHash('sha256').update(bytes).digest('hex')});
    }
  }
  await walk(directory);assets.sort((a,b)=>a.url.localeCompare(b.url));
  if(!assets.some(a=>a.url===basePath+'/')||!assets.some(a=>a.url===basePath+'/run/'))throw new Error('Both game routes must exist before building the offline pack');
  const version=createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,20);
  const pack={version,bytes:assets.reduce((n,a)=>n+a.bytes,0),assets};
  await writeFile(path.join(directory,'offline-pack.json'),JSON.stringify(pack));
  // Bake the content-addressed pack version into the exported worker so each deployment
  // installs its own complete cache. An unchanged worker would serve the old game forever.
  const swPath=path.join(directory,'sw.js');
  const workerSource=await readFile(swPath,'utf8');
  const cacheDeclaration=/const CACHE_NAME = `\$\{CACHE_PREFIX\}(?:__KNOPIK_OFFLINE_PACK_VERSION__|[a-f0-9]{20})`;/;
  if(!cacheDeclaration.test(workerSource))throw new Error('Offline worker cache version marker is missing');
  await writeFile(swPath,workerSource.replace(cacheDeclaration,'const CACHE_NAME = `${CACHE_PREFIX}'+version+'`;'));
  return pack;
}
if(process.argv[1]===import.meta.filename){const pack=await buildOfflinePack(process.argv[2]??process.env.KNOPIK_EXPORT_DIR??(process.env.KNOPIK_BUILD_DIR&&process.env.GITHUB_PAGES==='true'?process.env.KNOPIK_BUILD_DIR:'out'),process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/,'')??'');process.stdout.write(`Offline pack: ${pack.assets.length} files, ${(pack.bytes/1048576).toFixed(1)} MiB, ${pack.version}\n`);}
