import { projectAdventureY } from "./adventure-projection";
import {getVisualProfile} from "./graphics-quality";
import type {ResidentState} from "./neighborhood-crowd";
import type { NeighborhoodEngine } from "./neighborhood-engine";
const set=(n:Element|null,k:string,v:string)=>{if(n&&n.getAttribute(k)!==v)n.setAttribute(k,v);};
export class NeighborhoodCrowdRenderer{
  private actors;private crowd:NeighborhoodEngine["crowd"]|null=null;private states=new Map<string,ResidentState>();
  constructor(svg:SVGSVGElement){this.actors=Array.from(svg.querySelectorAll('[data-resident]')).map(node=>({node,id:node.getAttribute('data-resident')??'',poseFrame:-1,viewStamp:'',head:node.querySelector('[data-resident-head]'),torso:node.querySelector('[data-resident-torso]'),views:Array.from(node.querySelectorAll('[data-resident-view]')),eyes:Array.from(node.querySelectorAll('[data-resident-eyes]')),buttons:node.querySelector('[data-resident-buttons]'),arms:Array.from(node.querySelectorAll('[data-resident-arm]')),legs:Array.from(node.querySelectorAll('[data-resident-leg]'))}));}
  paint(engine:NeighborhoodEngine,reduced:boolean,camera:{x:number;y:number},width:number,height:number){
    if(this.crowd!==engine.crowd){this.crowd=engine.crowd;this.states=new Map(engine.crowd.residents.map(r=>[r.id,r]));}
    const poseFrame=Math.floor(engine.time*(getVisualProfile().detail<=1?18:30));
    for(const actor of this.actors){const r=this.states.get(actor.id);if(!r)continue;
      const py=projectAdventureY(r.y),visible=r.x+35>camera.x&&r.x-35<camera.x+width&&py+10>camera.y&&py-88<camera.y+height;
      set(actor.node,'display',visible?'inline':'none');if(!visible){actor.poseFrame=-1;continue;}set(actor.node,'transform',`translate(${r.x.toFixed(2)} ${py.toFixed(2)})`);set(actor.node,'data-depth',String(r.y));
      const side=Math.abs(Math.cos(r.angle))>.72,back=!side&&Math.sin(r.angle)<0,view=side?'side':back?'back':'front',mirror=Math.cos(r.angle)<0;
      const viewStamp=view+mirror+reduced;
      if(actor.poseFrame===poseFrame&&actor.viewStamp===viewStamp)continue;actor.poseFrame=poseFrame;actor.viewStamp=viewStamp;
      for(const n of actor.views){set(n,'display',n.getAttribute('data-resident-view')===view?'inline':'none');if(n.getAttribute('data-resident-view')==='side')set(n,'transform',mirror?'scale(-1 1)':'');}
      set(actor.buttons,'opacity',back?'.2':'1');for(const eyes of actor.eyes)set(eyes,'opacity',!reduced&&(engine.time+r.variant*.7)%4.7>.13?'1':reduced?'1':'.15');
      const phase=r.walkDistance/34*Math.PI*2,gait=!reduced&&r.moving?1:0,bob=gait*Math.abs(Math.sin(phase))*.8+(!reduced&&!r.moving?Math.sin(engine.time*1.6+r.variant)*.4:0);
      set(actor.head,'transform',`translate(0 ${(-bob).toFixed(2)})`);set(actor.torso,'transform',`translate(0 ${(-bob*.5).toFixed(2)})`);
      const greeting=!reduced&&!!r.host&&engine.talking&&Math.hypot(r.x-engine.player.x,r.y-engine.player.y)<120;
      actor.arms.forEach((arm,i)=>{const swing=gait*Math.sin(phase+(i?Math.PI:0))*(side?25:17)+(greeting&&i===1?-47+Math.sin(engine.time*5)*10:0);set(arm,'transform',`translate(${i?15:-15} ${(-36-bob*.5).toFixed(2)}) rotate(${swing.toFixed(2)})`);});
      actor.legs.forEach((leg,i)=>{const wave=Math.sin(phase+(i?Math.PI:0))*gait,lift=Math.max(0,Math.cos(phase+(i?Math.PI:0)))*gait*3;set(leg,'transform',`translate(${((i?7:-7)+(side?wave*5:wave*1.5)).toFixed(2)} ${(-13+wave*(back?-2:2)-lift).toFixed(2)}) rotate(${(side?wave*8:wave*2).toFixed(2)})`);});
    }
  }
}
