'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {registerControlBackdrop} from './game-control-backdrop';

/** The glass samples the world directly. The rim and meter never clip the button
 * or its hit target, and no ancestor of the glass creates a backdrop root. */
export function GameControlSurface({children}:{children?:ReactNode}){
 const glass=useRef<HTMLSpanElement>(null);
 useEffect(()=>registerControlBackdrop(glass.current),[]);
 return <span className="game-control-surface" aria-hidden="true">
  <span ref={glass} className="game-control-glass"/>
  {children&&<span className="game-control-meter">{children}</span>}
  <span className="game-control-rim"/>
 </span>;
}
