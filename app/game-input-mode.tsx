"use client";
import {useEffect} from 'react';

/** Keep native dialog focus and restoration, but distinguish touch from keyboard navigation. */
export function trackGameInputMode(target:Pick<Window,'addEventListener'|'removeEventListener'>,root:Pick<HTMLElement,'dataset'>){
 const options={capture:true};
 const pointer=()=>{root.dataset.gameInput='pointer';};
 const keyboard=(event:KeyboardEvent)=>{
  if(['Tab','Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))root.dataset.gameInput='keyboard';
 };
 pointer();
 target.addEventListener('pointerdown',pointer,options);
 target.addEventListener('keydown',keyboard as EventListener,options);
 return ()=>{target.removeEventListener('pointerdown',pointer,options);target.removeEventListener('keydown',keyboard as EventListener,options);delete root.dataset.gameInput;};
}
export function GameInputMode(){
 useEffect(()=>trackGameInputMode(window,document.documentElement),[]);
 return null;
}
