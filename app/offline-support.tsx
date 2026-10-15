"use client";
import {useEffect,useSyncExternalStore} from "react";
import {startInstallSupport} from "./game-install";
const basePath=process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/,"")??"";
export type PackStatus={state:"checking"|"downloading"|"ready"|"error"|"unsupported";completed:number;total:number;bytes:number;totalBytes:number};
const initial:PackStatus={state:"checking",completed:0,total:0,bytes:0,totalBytes:0};
let current=initial,started=false;
let packWorker:ServiceWorker|null=null;
const listeners=new Set<()=>void>();
const updateListeners=new Set<()=>void>();
let updateAvailable=false;
function subscribeUpdates(listener:()=>void){updateListeners.add(listener);return()=>{updateListeners.delete(listener);};}
function publish(next:PackStatus){current=next;listeners.forEach(listener=>listener());}
function subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function useOfflinePack(){return useSyncExternalStore(subscribe,()=>current,()=>initial);}
async function registerPack(){
 try{
  const registration=await navigator.serviceWorker.register(`${basePath}/sw.js`,{updateViaCache:"none"});
  const ask=()=>{
   // An older controller must not mask a new pack that is still downloading.
   packWorker=registration.installing??registration.waiting??registration.active;
   packWorker?.postMessage({type:"KNOPIK_OFFLINE_STATUS"});
  };
  ask();registration.addEventListener("updatefound",ask,{once:true});
 }catch{if(current.state!=="ready")publish({...initial,state:"error"});}
}
export function retryOfflinePack(){
 if(!("serviceWorker" in navigator))return;
 publish(initial);void registerPack();
}
function start(){
 if(started)return;started=true;
 if(process.env.NODE_ENV!=="production"){publish({...initial,state:"unsupported"});return;}
 if(!("serviceWorker" in navigator)){publish({...initial,state:"unsupported"});return;}
 navigator.serviceWorker.addEventListener("message",event=>{if(event.data?.type==="KNOPIK_OFFLINE"&&(!packWorker||event.source===packWorker))publish(event.data);});
 const ask=()=>navigator.serviceWorker.controller?.postMessage({type:"KNOPIK_OFFLINE_STATUS"});
 let hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener("controllerchange",()=>{
   packWorker=navigator.serviceWorker.controller;
   ask();
   if(hadController){updateAvailable=true;updateListeners.forEach(listener=>listener());}
   hadController=true;
 });
 void registerPack();window.addEventListener("online",()=>{void registerPack();});
}
export function OfflineSupport(){useEffect(()=>{startInstallSupport();start();},[]);return null;}
export function OfflineDownloadStatus(){
 const status=useOfflinePack();
 const percentage=status.totalBytes?Math.min(100,Math.floor(status.bytes/status.totalBytes*100)):0;
 return <section className="offline-download" aria-live="polite"><strong>Игра без интернета</strong><span>{status.state==="ready"?"Всё скачано ✓ Можно играть без сети":status.state==="downloading"?`Скачивание ${percentage}% · ${(status.bytes/1048576).toFixed(1)} / ${(status.totalBytes/1048576).toFixed(1)} МБ`:status.state==="error"?"Нужен интернет, чтобы закончить скачивание":status.state==="unsupported"?"Этот браузер не поддерживает офлайн-приложения":"Подготовка игры для телефона…"}</span>{status.state==="downloading"&&<progress value={percentage} max={100}/>}<small>Первый вход — с интернетом. Прогресс хранится на этом устройстве и синхронизируется при подключении.</small></section>;
}

export function OfflineUpdateNotice(){
 const available=useSyncExternalStore(subscribeUpdates,()=>updateAvailable,()=>false);
 if(!available)return null;
 return <aside className="offline-update-notice" role="status"><span>Новая версия KNOPIK GO готова</span><button type="button" onClick={()=>window.location.reload()}>Обновить игру</button></aside>;
}
