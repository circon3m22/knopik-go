import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {RELEASE_PRESENTATIONS} from '../app/release-presentation.ts';
import {nextGameVersion} from '../app/game-release.ts';
export function runGameRelease(input){
 const args=[...input],kind=args.shift(),changes=[];let presentation='',title='',date=new Date().toISOString().slice(0,10),dryRun=false;
 if(!['version','update','patch'].includes(kind))throw new Error('Тип: version, update или patch.');
 while(args.length){const key=args.shift();if(key==='--dry-run'){dryRun=true;continue;}const value=args.shift();if(!value||value.startsWith('--'))throw new Error(`Нет значения для ${key}`);if(key==='--presentation')presentation=value.trim();else if(key==='--title')title=value.trim();else if(key==='--change')changes.push(value.trim());else if(key==='--date')date=value;else throw new Error(`Неизвестный параметр: ${key}`);}
 if(!title||!changes.length||changes.some(change=>!change))throw new Error('Укажи --title и хотя бы один --change с описанием для игроков.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Дата: YYYY-MM-DD.');
 const historyUrl=new URL('../app/game-releases.json',import.meta.url),packageUrl=new URL('../package.json',import.meta.url),lockUrl=new URL('../package-lock.json',import.meta.url);
 const history=JSON.parse(readFileSync(historyUrl,'utf8')),pkg=JSON.parse(readFileSync(packageUrl,'utf8')),lock=JSON.parse(readFileSync(lockUrl,'utf8'));
 if(pkg.version!==history[0].version||lock.version!==pkg.version||lock.packages[''].version!==pkg.version)throw new Error('Версии истории, package.json и lockfile должны совпадать.');
 const version=nextGameVersion(pkg.version,kind);
 const visual=RELEASE_PRESENTATIONS.find(p=>!p.retired&&(presentation?p.id===presentation:p.introducedIn===version));
 if(visual&&visual.introducedIn!==version)throw new Error('Для нового выпуска нужно отдельное оформление загрузки: introducedIn должен совпадать с '+version+'.');
 if(!visual&&!dryRun)throw new Error('Перед выпуском '+version+' создай новый анонс и экран загрузки: добавь SVG в public/release-artwork и запись в app/release-presentations.json.');
 if(visual){
  if(!/^\/release-artwork\/[a-z0-9-]+\.svg$/.test(visual.artwork))throw new Error('Оформление должно ссылаться на SVG из public/release-artwork.');
  const source=readFileSync(new URL('../public'+visual.artwork,import.meta.url),'utf8');
  if(!source.includes('<svg')||!source.includes('data-release-art="'+visual.id+'"'))throw new Error('SVG не соответствует оформлению '+visual.id+'.');
  const hash=value=>createHash('sha256').update(value).digest('hex');
  for(const prior of RELEASE_PRESENTATIONS.filter(p=>p.id!==visual.id))if(hash(readFileSync(new URL('../public'+prior.artwork,import.meta.url)))===hash(source))throw new Error('Каждому новому выпуску нужен новый арт загрузки.');
 }
 const release={version,title,date,changes,...(visual?{presentation:visual.id}:{})};
 if(!dryRun){pkg.version=version;lock.version=version;lock.packages[''].version=version;for(const [url,data] of [[historyUrl,[release,...history]],[packageUrl,pkg],[lockUrl,lock]])writeFileSync(url,JSON.stringify(data,null,2)+'\n');}
 return {dryRun,needsPresentation:!visual,previous:history[0].version,release};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{console.log(JSON.stringify(runGameRelease(process.argv.slice(2)),null,2));}
 catch(error){console.error(error.message);console.error('npm run release -- patch --title "Название" --change "Что изменилось" [--dry-run]');process.exitCode=1;}
}
