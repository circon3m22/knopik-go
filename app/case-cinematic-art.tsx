"use client";
import type {CSSProperties} from "react";
import {CoinArtwork} from "./collectible-artwork";
import {PixelMark} from "./pixel-effects";
import type {CaseKind} from "./case-engine";

const RAYS=28,SPARKS=50,DEBRIS=64;
/** Static DOM: CSS steps + composited rotations, no per-frame React updates. */
export function CaseCinematicArt({kind,phase,rewardIndex}:{kind:CaseKind;phase:"ready"|"charging"|"burst"|"reward";rewardIndex:number}){
 const active=phase==="burst"||phase==="reward";
 return <div className="case-film-backdrop" aria-hidden="true">
  <div className="case-film-grid"/>
  <div className="case-film-ray-wheel">{Array.from({length:RAYS},(_,i)=><i key={i} className={i%4===0?"is-bright":""} style={{"--ray-turn":`${i*360/RAYS}deg`,"--ray-width":`${3+i%3*1.3}vmax`} as CSSProperties}/>)}</div>
  <div className="case-film-spokes">{Array.from({length:16},(_,i)=><i key={i} style={{"--ray-turn":`${i*22.5}deg`} as CSSProperties}/>)}</div>
  <div className="case-film-orb"/>
  <div className="case-film-corners"><i/><i/><i/><i/></div>
  <div className="case-film-dust">{Array.from({length:SPARKS},(_,i)=><i key={i} style={{left:`${(i*41+11)%98}%`,top:`${(i*67+29)%94}%`,"--twinkle":`${-(i%9)*.25}s`,"--dust-size":`${2+i%4*2}px`} as CSSProperties}/>)}</div>
  {active&&<div key={`${phase}-${rewardIndex}`} className="case-film-debris">{Array.from({length:DEBRIS},(_,i)=>{
    const radians=((i*137.508+rewardIndex*37)%360)*Math.PI/180,travel=145+(i*79)%540;
    return <i key={i} className={`debris-${i%7}`} style={{"--debris-x":`${Math.round(Math.cos(radians)*travel)}px`,"--debris-y":`${Math.round(Math.sin(radians)*travel)}px`,"--debris-turn":`${i*47}deg`,"--debris-delay":`${(i%10)*25}ms`,"--debris-size":`${7+(i%5)*4}px`} as CSSProperties}>
      {i%13===0?<CoinArtwork/>:i%11===0?<PixelMark kind="spark"/>:null}
    </i>;
  })}</div>}
 </div>;
}
