'use client';
import {useEffect,useRef} from 'react';

/** Wall-clock tasks catch up on return, without polling a hidden document. */
export function startVisibleClock(update:()=>void,delay:number,doc:Pick<Document,'hidden'|'addEventListener'|'removeEventListener'>=document){
 let timer:ReturnType<typeof setInterval>|null=null;
 const refresh=()=>{
  if(timer!==null){clearInterval(timer);timer=null;}
  if(doc.hidden)return;
  update();timer=setInterval(update,delay);
 };
 doc.addEventListener('visibilitychange',refresh);refresh();
 return()=>{if(timer!==null)clearInterval(timer);doc.removeEventListener('visibilitychange',refresh);};
}
export function useVisibleClock(update:()=>void,delay:number,enabled=true){
 const latest=useRef(update);useEffect(()=>{latest.current=update;});
 useEffect(()=>{if(enabled)return startVisibleClock(()=>latest.current(),delay);},[delay,enabled]);
}
