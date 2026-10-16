"use client";
import {useState} from "react";
import {forceLatestGame} from "./game-update-engine";
const basePath=process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/,"")??"";
export function GameUpdateButton(){
 const [phase,setPhase]=useState<"idle"|"checking"|"applying"|"error">("idle");
 const [message,setMessage]=useState("");
 const run=async()=>{
   if(phase==="checking"||phase==="applying")return;
   setPhase("checking");setMessage("Проверяем обновление…");
   try{
     if(!navigator.onLine)throw new Error("Для обновления нужен интернет.");
     setPhase("applying");setMessage("Загружаем обновление… Игра перезапустится.");
     await forceLatestGame({
       basePath,fetcher:fetch,
       serviceWorker:"serviceWorker" in navigator?navigator.serviceWorker:undefined,
       cacheStorage:"caches" in window?window.caches:undefined,
       navigate:url=>window.location.replace(url),now:()=>Date.now()
     });
   }catch(error){
     setPhase("error");setMessage(error instanceof Error?error.message:"Не удалось обновить игру. Проверьте соединение.");
   }
 };
 return <section className="game-manual-update" aria-label="Обновление KNOPIK GO">
  <div className="game-manual-update-heading"><span aria-hidden="true">↻</span><div><strong>Версия игры</strong><small>Загрузка последней версии</small></div></div>
  <button type="button" disabled={phase==="checking"||phase==="applying"} onClick={()=>{void run();}}>
   {phase==="checking"?"Проверка…":phase==="applying"?"Обновляем…":"Обновить игру"}
  </button>
  <p role="status" aria-live="polite">{message||"Прогресс и аккаунт останутся на месте. Текущая игровая сессия перезапустится."}</p>
 </section>;
}
