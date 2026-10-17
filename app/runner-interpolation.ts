import type {RunnerEngine} from './runner-engine';
const FIELDS=['distance','elapsed','lanePosition','height','platformHeight'] as const;
/** Presentation-only interpolation between completed 60 Hz states. Collision,
 * rewards, seeds and the authoritative engine are never modified by rendering. */
export class RunnerInterpolation{
 private previous=Object.fromEntries(FIELDS.map(k=>[k,0])) as Record<typeof FIELDS[number],number>;
 private ready=false;
 capture(engine:RunnerEngine){for(const key of FIELDS)this.previous[key]=engine[key];this.ready=true;}
 private source:RunnerEngine|null=null;
 private presentation:RunnerEngine|null=null;
 reset(){this.ready=false;}
 view(engine:RunnerEngine,fraction:number):RunnerEngine{
  if(!this.ready)return engine;
  if(this.source!==engine){
   this.source=engine;this.presentation=Object.create(engine) as RunnerEngine;
   for(const key of FIELDS)Object.defineProperty(this.presentation,key,{value:0,writable:true});
   Object.defineProperty(this.presentation,"pause",{value:()=>engine.pause()});
  }
  const view=this.presentation!,t=Math.max(0,Math.min(1,fraction));
  for(const key of FIELDS)view[key]=this.previous[key]+(engine[key]-this.previous[key])*t;
  return view;
 }
}
