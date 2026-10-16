"use client";
import {useEffect,useRef,type PointerEvent} from "react";
import {GameMovementStick} from "./game-movement-stick";
import {AdventureDodgeButton} from "./adventure-dodge-button";
import {AdventureWeaponArt} from "./adventure-level-art";
import {observeJoystickRelease} from "./joystick-release";
import {WEAPON_ORDER,type AdventureWeapon} from "./adventure-levels";
import type {CoopControls} from "./coop-protocol";

export function CoopGameControls({controls,disabled,dodgeReady,onPause,weapon,interaction,cape,energyReady}:{interaction:string;cape:boolean;energyReady:boolean;controls:{set:(patch:Partial<CoopControls>)=>void;dodge:()=>void;energy:()=>void};disabled:boolean;dodgeReady:boolean;onPause:()=>void;weapon:AdventureWeapon}){
 const stick=useRef<HTMLButtonElement>(null),nub=useRef<SVGSVGElement>(null);
 const pointer=useRef<number|null>(null),attack=useRef<number|null>(null),held=useRef(new Set<string>()),lastMove=useRef(0);
 const disabledRef=useRef(disabled);useEffect(()=>{disabledRef.current=disabled;},[disabled]);
 const pauseRef=useRef(onPause);useEffect(()=>{pauseRef.current=onPause;},[onPause]);
 const releaseStick=()=>{const id=pointer.current;pointer.current=null;controls.set({x:0,y:0});if(nub.current)nub.current.style.transform="translate(0,0)";if(id!==null&&stick.current?.hasPointerCapture(id))stick.current.releasePointerCapture(id);};
 const clear=()=>{releaseStick();attack.current=null;held.current.clear();controls.set({attack:false,interact:false});};
 useEffect(()=>{if(disabled)clear();},[disabled]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{
  const stop=observeJoystickRelease(window,()=>pointer.current,releaseStick);
  const update=()=>{const k=held.current;controls.set({x:Number(k.has("KeyD")||k.has("ArrowRight"))-Number(k.has("KeyA")||k.has("ArrowLeft")),y:Number(k.has("KeyS")||k.has("ArrowDown"))-Number(k.has("KeyW")||k.has("ArrowUp")),attack:k.has("Space")||k.has("KeyJ"),interact:k.has("KeyE")});};
  const keys=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyJ","KeyE"]);
  const down=(e:KeyboardEvent)=>{
   if(e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.closest("input,textarea,select"))return;
   if(e.code==="Escape"){e.preventDefault();clear();pauseRef.current();return;}
   if(disabledRef.current)return;
   if(e.code==="Space"&&(e.target as HTMLElement)?.closest("button"))return;
   if(keys.has(e.code)){e.preventDefault();held.current.add(e.code);update();}
   if(!e.repeat&&["ShiftLeft","ShiftRight","KeyK"].includes(e.code)){e.preventDefault();controls.dodge();}
   if(!e.repeat&&e.code==="KeyQ"){e.preventDefault();controls.energy();}
   if(!e.repeat&&["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6"].includes(e.code)){e.preventDefault();controls.set({weapon:WEAPON_ORDER[Number(e.code.slice(5))-1]});}
  };
  const up=(e:KeyboardEvent)=>{if(held.current.delete(e.code)){e.preventDefault();update();}};
  const blur=()=>{clear();controls.set({paused:true});pauseRef.current();};
  const hidden=()=>{if(document.hidden)blur();};
  const release=(e:globalThis.PointerEvent)=>{if(e.pointerId===attack.current){attack.current=null;controls.set({attack:false});}};
  const timer=setInterval(()=>{if(pointer.current!==null&&Date.now()-lastMove.current>12000)releaseStick();},500);
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);document.addEventListener("visibilitychange",hidden);
  return()=>{stop();clearInterval(timer);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);document.removeEventListener("visibilitychange",hidden);clear();};
 },[]); // eslint-disable-line react-hooks/exhaustive-deps
 const move=(e:PointerEvent<HTMLButtonElement>)=>{
  if(pointer.current!==e.pointerId||disabledRef.current)return;
  if(e.pointerType==="mouse"&&e.type==="pointermove"&&e.buttons===0){releaseStick();return;}
  lastMove.current=Date.now();const r=e.currentTarget.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,radius=Math.max(10,Math.min(r.width*.3,(r.width-46)/2-4)),n=Math.max(1,Math.hypot(dx,dy)/radius);
  controls.set({x:Math.hypot(dx,dy)<5?0:dx/n/radius,y:Math.hypot(dx,dy)<5?0:dy/n/radius});
  if(nub.current)nub.current.style.transform=`translate(${dx/n}px,${dy/n}px)`;
 };
 return <footer className="adventure-controls has-combat coop-controls" aria-label="Управление в совместной игре"><div className="adventure-controller-row">
  <GameMovementStick stickRef={stick} nubRef={nub} disabled={disabled} onDown={e=>{if(e.button!==0)return;e.preventDefault();releaseStick();pointer.current=e.pointerId;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}move(e);}} onMove={move} onRelease={e=>{if(e.pointerId===pointer.current)releaseStick();}}/>
  <div className="adventure-actions"><div className={`coop-utility-actions${cape?" has-cape":""}`}><button type="button" className="adventure-interact" disabled={disabled} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.set({interact:true});}} onPointerUp={()=>{controls.set({interact:false});}} onPointerCancel={()=>{controls.set({interact:false});}} onLostPointerCapture={()=>{controls.set({interact:false});}} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();controls.set({interact:true});}}} onKeyUp={()=>{controls.set({interact:false});}} onBlur={()=>{controls.set({interact:false});}}>{interaction}</button>{cape&&<button className="coop-energy" type="button" disabled={disabled||!energyReady} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();controls.energy();}} onClick={e=>{if(e.detail===0)controls.energy();}}>Волна грозы · Q{energyReady?"":" · зарядка"}</button>}</div>
   <div className="adventure-combat-buttons"><AdventureDodgeButton disabled={disabled||!dodgeReady} ready={dodgeReady} onDodge={()=>{controls.dodge();}}/><button className="adventure-attack" type="button" disabled={disabled} aria-label="Атаковать · J или Пробел" onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();attack.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);controls.set({attack:true});}} onPointerUp={()=>{attack.current=null;controls.set({attack:false});}} onPointerCancel={()=>{attack.current=null;controls.set({attack:false});}} onLostPointerCapture={()=>{attack.current=null;controls.set({attack:false});}} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();controls.set({attack:true});}}} onKeyUp={()=>{controls.set({attack:false});}} onBlur={()=>{controls.set({attack:false});}}><AdventureWeaponArt weapon={weapon} icon/><small>{weapon==="fist"?"Удар":weapon==="sabre"?"Взмах":"Выстрел"}</small></button></div>
  </div>
 </div></footer>;
}
