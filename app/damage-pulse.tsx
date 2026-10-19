'use client';
import {useCallback,useEffect,useRef,type RefObject} from 'react';
import {playDamagePulse} from './damage-pulse-state';
export function useDamagePulse(){
 const ref=useRef<HTMLDivElement>(null);
 const pulse=useCallback(()=>playDamagePulse(ref.current),[]);
 return {ref,pulse};
}
export function DamagePulse({surfaceRef,concealed=false}:{surfaceRef:RefObject<HTMLDivElement|null>;concealed?:boolean}){
 useEffect(()=>{if(concealed)surfaceRef.current?.removeAttribute('data-damage-pulse');},[concealed,surfaceRef]);
 return <div ref={surfaceRef} className="world-damage-pulse" aria-hidden="true" hidden={concealed} onAnimationEnd={event=>{if(event.target===event.currentTarget)event.currentTarget.removeAttribute('data-damage-pulse');}}/>;
}
