"use client";
import {useEffect,useRef,useSyncExternalStore} from "react";
import {subscribeFrameRate} from "./frame-rate";
import {FRAME_RATE_VISIBILITY_EVENT} from "./frame-rate-visibility";

function subscribeVisibility(change:()=>void){
 window.addEventListener(FRAME_RATE_VISIBILITY_EVENT,change);
 return ()=>window.removeEventListener(FRAME_RATE_VISIBILITY_EVENT,change);
}
const readVisibility=()=>document.documentElement.dataset.knopikShowFps!=="off";
const serverVisibility=()=>true;

/** Hiding the meter also unsubscribes the RAF sampler to reduce background work. */
export function FrameRateMeter(){
 const ref=useRef<HTMLOutputElement>(null);
 const visible=useSyncExternalStore(subscribeVisibility,readVisibility,serverVisibility);
 useEffect(()=>{
   if(!visible)return;
   return subscribeFrameRate(sample=>{
     if(!ref.current)return;
     ref.current.textContent=`${sample.fps} FPS`;
     ref.current.title=sample.runner?`Отрисованные кадры · JS ${sample.meanMs.toFixed(1)} мс · максимальный интервал ${Math.round(sample.maxGapMs)} мс`:"Частота кадров интерфейса";
   });
 },[visible]);
 return visible?<output ref={ref} className="game-frame-rate" aria-label="Частота кадров" aria-live="off">— FPS</output>:null;
}
