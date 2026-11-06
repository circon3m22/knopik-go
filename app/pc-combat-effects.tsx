import type {AdventureEngine} from './adventure-engine';
import {projectAdventureY} from './adventure-projection';
import {setSvgAttribute as set} from './svg-attribute';

/** Extra PC geometry shares the existing effect pool and simulation clock. */
export function PcCombatEffects(){return <g data-pc-action="" pointerEvents="none" aria-hidden="true">
 {Array.from({length:36},(_,i)=><g key={i} data-pc-effect={i} display="none">
  <ellipse data-pc-shock="" rx="30" ry="15" fill="none" stroke="#ffd89b" strokeWidth="1.5"/>
  <g data-pc-embers="">{Array.from({length:8},(_,j)=><path key={j} data-pc-ember={j} d="M-2-1h8v2h-8Z" fill={j%3===0?'#fff5ce':j%2?'#ffb870':'#b7dfd5'}/>)}</g>
 </g>)}
 <g data-pc-slash="" display="none"><path d="M15-84 51-72 82-45 97-10 97 13 81 45 49 68 14 78 42 56 65 30 73 1 65-26 43-58Z" fill="#fff4c8" opacity=".8"/><path d="M32-75 68-51 89-17 90 17 69 50 36 70" fill="none" stroke="#f4cf79" strokeWidth="2"/></g>
</g>;}
export class PcCombatRenderer{
 private slots:Element[];private rings:(Element|null)[];private embers:Element[][];private slash:Element|null;
 constructor(svg:SVGSVGElement){this.slots=Array.from(svg.querySelectorAll('[data-pc-effect]'));this.rings=this.slots.map(n=>n.querySelector('[data-pc-shock]'));this.embers=this.slots.map(n=>Array.from(n.querySelectorAll('[data-pc-ember]')));this.slash=svg.querySelector('[data-pc-slash]');}
 paint(engine:AdventureEngine,reduced:boolean){
  if(!this.slots.length)return;
  this.slots.forEach((node,i)=>{
   const fx=engine.effects.pool[i],live=fx.active&&!reduced&&fx.kind!=='shell';set(node,'display',live?'inline':'none');if(!live)return;
   const p=Math.min(1,fx.age/(fx.kind==='blast'?.8:.32)),r=fx.radius;
   set(node,'transform',`translate(${fx.x} ${projectAdventureY(fx.y)-12})`);set(node,'opacity',String((1-p)*.75));
   set(this.rings[i],'display',fx.kind==='blast'||fx.kind==='dash'?'inline':'none');set(this.rings[i],'transform',`scale(${r/50*(.4+p*2.5)})`);
   this.embers[i].forEach((part,j)=>{const a=fx.seed*.71+j*Math.PI/4,d=p*(fx.kind==='blast'?r*1.5:36);set(part,'transform',`translate(${Math.cos(a)*d} ${Math.sin(a)*d*.65-Math.sin(p*Math.PI)*28}) rotate(${a*180/Math.PI}) scale(${1-p*.5})`);});
  });
  const slash=!reduced&&engine.weapon==='sabre'&&engine.punchTime>0&&engine.phase==='playing';set(this.slash,'display',slash?'inline':'none');
  if(slash){set(this.slash,'transform',`translate(${engine.player.x} ${projectAdventureY(engine.player.y)-24}) scale(1 .82) rotate(${engine.player.angle*180/Math.PI})`);set(this.slash,'opacity',String(Math.min(1,engine.punchTime/.2)));}
 }
}
