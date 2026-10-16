"use client";
import {useEffect,useRef,useState} from "react";
import {claimGameRelease,GAME_VERSION,GAME_RELEASE_TITLE} from "./game-release";
/** A single short message per installed release; it never pauses or reloads the game. */
export function GameReleaseNotice(){
 const [visible,setVisible]=useState(false),claimed=useRef<boolean|null>(null),element=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(claimed.current===null){try{claimed.current=claimGameRelease(window.localStorage);}catch{claimed.current=false;}}
  if(!claimed.current)return;
  setVisible(true);
  const timer=setTimeout(()=>setVisible(false),8000);return()=>clearTimeout(timer);
 },[]);
 useEffect(()=>{
  if(!visible||!element.current)return;const node=element.current;
  try{node.showPopover?.();}catch{}
  const dismiss=(event:PointerEvent)=>{if(event.target instanceof Node&&!node.contains(event.target))setVisible(false);};
  window.addEventListener("pointerdown",dismiss,{passive:true});
  return()=>{window.removeEventListener("pointerdown",dismiss);try{node.hidePopover?.();}catch{}};
 },[visible]);
 if(!visible)return null;
 return <aside ref={element} popover="manual" className="game-release-notice" role="status" aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M9 2h6v4h4v4h3v6h-3v4h-4v2H9v-2H5v-4H2v-6h3V6h4Z" fill="#7768a5"/><path d="M6 12h3v3h3v-3h3V9h3v6h-3v3H9v-3H6Z" fill="#fff1d1"/></svg><div><strong>Игра обновлена до версии {GAME_VERSION}</strong><small>{GAME_RELEASE_TITLE} · Что нового — в настройках</small></div><button type="button" onClick={()=>setVisible(false)} aria-label="Закрыть сообщение об обновлении">×</button></aside>;
}
