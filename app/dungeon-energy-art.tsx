import { useId } from "react";
import type { AdventureEngine } from "./adventure-engine";
import { ADVENTURE_DEPTH, projectAdventureY } from "./adventure-projection";
import { ENERGY_WAVE } from "./knopik-combat-equipment";

const RING = "M-20-64h40v8h16v8h12v12h8v16h8v40h-8v16h-8v12H36v8H20v8h-40v-8h-16v-8h-12v-12h-8V20h-8v-40h8v-16h8v-12h12v-8h16Z";
export function DungeonEnergyArtwork() {
  const clip = `energy-${useId().replaceAll(":", "")}`;
  return <g data-energy-wave="" display="none" clipPath={`url(#${clip})`} aria-hidden="true">
    <defs><clipPath id={clip}><rect data-energy-clip=""/></clipPath></defs>
    <g data-energy-origin="">
      <path data-energy-flash="" d="M-5-33H5v17h11v11h17V5H16v11H5v17H-5V16h-11V5h-17V-5h17v-11h11Z" fill="#fff1d1"/>
      <g data-energy-ring="" fill="none" strokeLinejoin="miter"><path d={RING} fill="#5fb7cc" fillOpacity=".06" stroke="#223f68" strokeWidth="12"/><path d={RING} stroke="#4c9fbc" strokeWidth="8"/><path d={RING} stroke="#8ce4e1" strokeWidth="4"/><path d={RING} transform="scale(.94)" stroke="#fff1d1" strokeWidth="1.5"/></g>
      <g data-energy-echo="" fill="none" stroke="#75b3d3" strokeWidth="2" opacity=".4"><path d={RING}/></g>
      {Array.from({length:12},(_,i)=><g key={i} data-energy-spark={i}><path d="M-2-6h4v4h4v4H2v4h-4V2h-4v-4h4Z" fill={i%3?"#b7f3e0":"#fff1d1"}/><path d="M-1-1h2v2h-2Z" fill="#fff1d1"/></g>)}
    </g>
  </g>;
}

const set=(node:Element|null,key:string,value:string)=>{if(node&&node.getAttribute(key)!==value)node.setAttribute(key,value);};
export class DungeonEnergyRenderer {
  private root;private origin;private clip;private ring;private echo;private flash;private sparks;
  constructor(svg:Element,private reduced=false) {
    this.root=svg.querySelector("[data-energy-wave]");this.origin=this.root?.querySelector("[data-energy-origin]")??null;this.clip=this.root?.querySelector("[data-energy-clip]")??null;this.ring=this.root?.querySelector("[data-energy-ring]")??null;this.echo=this.root?.querySelector("[data-energy-echo]")??null;this.flash=this.root?.querySelector("[data-energy-flash]")??null;this.sparks=Array.from(this.root?.querySelectorAll("[data-energy-spark]")??[]);
  }
  paint(engine:AdventureEngine,wave=engine.energyWave) {
    set(this.root,"display",wave.active?"inline":"none");if(!wave.active)return;
    const t=wave.age/ENERGY_WAVE.duration,r=ENERGY_WAVE.radius*Math.min(1,t/.8),room=engine.area==="sewer"?engine.levelData.rooms[wave.room]:{x:28,y:108,w:424,h:440};
    set(this.clip,"x",String(room.x));set(this.clip,"y",String(projectAdventureY(room.y)));set(this.clip,"width",String(room.w));set(this.clip,"height",String(projectAdventureY(room.h)));
    set(this.origin,"transform",`translate(${wave.x} ${projectAdventureY(wave.y)}) scale(1 ${ADVENTURE_DEPTH})`);
    set(this.ring,"transform",`scale(${Math.max(.04,r/64).toFixed(3)})`);set(this.echo,"transform",`scale(${Math.max(.03,(r-18)/64).toFixed(3)})`);
    set(this.root,"opacity",String(Math.min(1,(1-t)*4)));set(this.flash,"opacity",this.reduced?"0":String(Math.max(0,1-t*5)));
    this.sparks.forEach((node,i)=>{const angle=i*Math.PI/6,travel=r*(.8+(i%3)*.1);set(node,"transform",`translate(${Math.round(Math.cos(angle)*travel/3)*3} ${Math.round(Math.sin(angle)*travel/3)*3})`);set(node,"opacity",this.reduced?".7":String(.5+.5*Math.abs(Math.sin(i+t*8))));});
  }
}
