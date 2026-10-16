import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {nextGameVersion} from '../app/game-release.ts';
export function runGameRelease(input){
 const args=[...input],kind=args.shift(),changes=[];let title='',date=new Date().toISOString().slice(0,10),dryRun=false;
 if(!['version','update','patch'].includes(kind))throw new Error('Тип: version, update или patch.');
 while(args.length){const key=args.shift();if(key==='--dry-run'){dryRun=true;continue;}const value=args.shift();if(!value||value.startsWith('--'))throw new Error(`Нет значения для ${key}`);if(key==='--title')title=value.trim();else if(key==='--change')changes.push(value.trim());else if(key==='--date')date=value;else throw new Error(`Неизвестный параметр: ${key}`);}
 if(!title||!changes.length||changes.some(change=>!change))throw new Error('Укажи --title и хотя бы один --change с описанием для игроков.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Дата: YYYY-MM-DD.');
 const historyUrl=new URL('../app/game-releases.json',import.meta.url),packageUrl=new URL('../package.json',import.meta.url),lockUrl=new URL('../package-lock.json',import.meta.url);
 const history=JSON.parse(readFileSync(historyUrl,'utf8')),pkg=JSON.parse(readFileSync(packageUrl,'utf8')),lock=JSON.parse(readFileSync(lockUrl,'utf8'));
 if(pkg.version!==history[0].version||lock.version!==pkg.version||lock.packages[''].version!==pkg.version)throw new Error('Версии истории, package.json и lockfile должны совпадать.');
 const version=nextGameVersion(pkg.version,kind),release={version,title,date,changes};
 if(!dryRun){pkg.version=version;lock.version=version;lock.packages[''].version=version;for(const [url,data] of [[historyUrl,[release,...history]],[packageUrl,pkg],[lockUrl,lock]])writeFileSync(url,JSON.stringify(data,null,2)+'\n');}
 return {dryRun,previous:history[0].version,release};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{console.log(JSON.stringify(runGameRelease(process.argv.slice(2)),null,2));}
 catch(error){console.error(error.message);console.error('npm run release -- patch --title "Название" --change "Что изменилось" [--dry-run]');process.exitCode=1;}
}
