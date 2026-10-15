"use client";
import {useEffect,useRef,type RefObject} from "react";
import type {AdventureEngine} from "./adventure-engine";
import {homecomingFrame} from "./adventure-homecoming";
import {PixelTapLogo} from "./pixel-tap-logo";
export function AdventureHomecomingCinema({clock}:{clock:RefObject<AdventureEngine|null>}){
 const black=useRef<HTMLDivElement>(null),logo=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let frame=0;
  const tick=()=>{
   const pose=homecomingFrame(clock.current?.homecomingTime??0);
   if(black.current)black.current.style.opacity=String(pose.black);
   if(logo.current)logo.current.style.opacity=String(pose.logo);
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[clock]);
 return <div className="homecoming-cinema" role="status" aria-label="Кнопик TAP — возвращение домой"><div ref={black} className="homecoming-blackout"/><div ref={logo} className="homecoming-logo"><PixelTapLogo/></div></div>;
}
