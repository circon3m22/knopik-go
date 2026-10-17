import {getVisualProfile} from "./graphics-quality";
import { isFirearm, FIREARMS, firearmTrajectory, firearmAim } from "./dungeon-aim";
import type { AdventureEngine } from "./adventure-engine";
import { projectAdventureY } from "./adventure-projection";
import { dungeonExitTarget, exitPointerPose, type CameraRect } from "./dungeon-navigation";
import { DungeonEnergyRenderer } from "./dungeon-energy-art";
const set=(n:Element|null,key:string,value:string)=>{if(n&&n.getAttribute(key)!==value)n.setAttribute(key,value);};
const show=(n:Element|null,value:boolean)=>set(n,"display",value?"inline":"none");
const all=(n:Element,s:string)=>Array.from(n.querySelectorAll(s));
export class DungeonRenderer{
  private roomDetails:{node:Element;room:number}[]=[];
  private detailRoom=-1;
  private energy: DungeonEnergyRenderer;
  private aim:Element|null=null;private aimRays:Element[]=[];private aimImpact:Element|null=null;private aimBlast:Element|null=null;
  private firstWater:Element[]=[];private firstPower:Element[]=[];private firstWarning:Element[]=[];private firstBlades:Element[]=[];
  private tasks;private hazards;private covers;private kits;private currents;private fx;private arcs;private goals;private exitReady;private warnings;private pickups;private ingredients:Element[]=[];private exitPointer;private exitPointerShape;
  constructor(private svg:SVGSVGElement,private reduced=false){
    this.roomDetails=all(svg,"[data-room-detail]").map(node=>({node,room:Number(node.getAttribute("data-room-detail"))}));
    this.energy=new DungeonEnergyRenderer(svg,reduced);
    this.aim=svg.querySelector("[data-firearm-aim]");this.aimRays=all(svg,"[data-aim-ray]");this.aimImpact=svg.querySelector("[data-aim-impact]");this.aimBlast=svg.querySelector("[data-aim-blast]");
    this.firstWater=all(svg,"[data-first-water]");this.firstPower=all(svg,"[data-first-power]");this.firstWarning=all(svg,"[data-first-warning]");this.firstBlades=all(svg,"[data-first-pump-blade]");
    this.tasks=all(svg,"[data-dungeon-task]").map(node=>({node,ready:node.querySelector("[data-task-ready]"),done:node.querySelector("[data-task-done]"),running:node.querySelector("[data-task-running]"),progress:node.querySelector("[data-task-progress]"),danger:node.querySelector("[data-charge-danger]")}));
    this.hazards=all(svg,"[data-dungeon-hazard]").map(node=>({node,body:node.querySelector("[data-hazard-body]"),warning:node.querySelector("[data-hazard-warning]"),active:node.querySelector("[data-hazard-active]")}));
    this.covers=all(svg,"[data-dungeon-cover]");this.kits=all(svg,"[data-dungeon-medkit]");this.currents=all(svg,"[data-current-bed]");
    this.fx=all(svg,"[data-dungeon-effect]").map(node=>({node,fire:node.querySelector("[data-fx-fire]"),smoke:node.querySelector("[data-fx-smoke]"),ring:node.querySelector("[data-fx-ring]"),debris:node.querySelector("[data-fx-debris]"),fragments:all(node,"[data-fx-fragment]"),hit:node.querySelector("[data-fx-hit]"),dust:node.querySelector("[data-fx-dust]"),heal:node.querySelector("[data-fx-heal]"),shell:node.querySelector("[data-fx-shell]")}));
    this.arcs=all(svg,"[data-dungeon-arc]").map(node=>({node,outer:node.querySelector("[data-arc-outer]"),inner:node.querySelector("[data-arc-inner]")}));
    this.warnings=all(svg,"[data-grenade-warning]");this.goals=svg.querySelector("[data-dungeon-goal]");this.exitReady=svg.querySelector("[data-exit-ready]");
    this.pickups=all(svg,"[data-chest-pickup]").map(node=>({node,coins:node.querySelector("[data-loot-coins]"),auraToken:node.querySelector("[data-loot-aura-token]"),items:all(node,"[data-loot-item]"),sparkles:node.querySelector("[data-loot-sparkles]"),aura:node.querySelector("[data-loot-aura]")}));
    this.ingredients=all(svg,"[data-dungeon-ingredient]");
    this.exitPointer=svg.querySelector("[data-exit-pointer]");this.exitPointerShape=svg.querySelector("[data-exit-pointer-shape]");
  }
  paint(engine:AdventureEngine,camera:CameraRect,sharedAim?:number){
    if(engine.area==="sewer"&&this.detailRoom!==engine.room){this.detailRoom=engine.room;const visible=new Set([engine.room]);for(const gate of engine.levelData.gates){if(gate.from===engine.room)visible.add(gate.to);if(gate.to===engine.room)visible.add(gate.from);}for(const detail of this.roomDetails)show(detail.node,visible.has(detail.room));}
    const minimal=getVisualProfile().detail<=1;
    this.energy.paint(engine);
    set(this.svg,"data-game-phase",engine.phase);
    const runtime=engine.dungeon;
    const aimVisible=engine.area==="sewer"&&engine.phase==="playing"&&isFirearm(engine.weapon);show(this.aim,aimVisible);
    if(aimVisible&&isFirearm(engine.weapon)){
      const aimAngle=sharedAim??firearmAim(engine).angle;const spread=FIREARMS[engine.weapon].spread;
      let central:ReturnType<typeof firearmTrajectory>|undefined;
      this.aimRays.forEach((node,i)=>{show(node,i<spread.length);if(i>=spread.length)return;const ray=firearmTrajectory(engine,spread[i],aimAngle);if(spread[i]===0)central=ray;set(node,"d",`M${ray.startX.toFixed(1)} ${projectAdventureY(ray.startY).toFixed(1)}L${ray.x.toFixed(1)} ${projectAdventureY(ray.y).toFixed(1)}`);});
      const ray=central??firearmTrajectory(engine,0,aimAngle);const end=`translate(${ray.x.toFixed(1)} ${projectAdventureY(ray.y).toFixed(1)})`;set(this.aimImpact,"transform",end);set(this.aimBlast,"transform",end);show(this.aimBlast,engine.weapon==="launcher");set(this.aim,"opacity",engine.punchCooldown>0?".4":".85");
    }
    if(runtime){
      if(engine.level===1){const dry=!!runtime.tasks[1]?.done,powered=!!runtime.tasks[2]?.done,running=powered||!!runtime.tasks[2]?.active;
        this.firstWater.forEach(n=>set(n,"opacity",dry?".12":".8"));this.firstPower.forEach(n=>show(n,powered));this.firstWarning.forEach(n=>show(n,!powered));
        this.firstBlades.forEach(n=>set(n,"transform",running&&!this.reduced?`rotate(${(engine.time*220%360).toFixed(1)})`:""));
      }
      this.tasks.forEach((n,i)=>{const state=runtime.tasks[i],task=engine.levelData.tasks[i];if(!state)return;show(n.node,!((task.kind==="key"||task.kind==="charge")&&state.done));show(n.ready,runtime.available(i));show(n.done,state.done);show(n.running,state.active&&task.kind==="hold");show(n.danger,state.active&&task.kind==="charge");set(n.progress,"stroke-dasharray",`${Math.min(214,214*state.progress/(task.duration??12)).toFixed(1)} 214`);});
      this.hazards.forEach((n,i)=>{const state=runtime.hazardPhase(i,engine.time),h=engine.levelData.hazards[i];show(n.warning,state==="warning");show(n.active,state==="active");show(n.body,!(h.kind==="mine"&&(runtime.mines[i].spent||h.disabledBy!==undefined&&runtime.tasks[h.disabledBy].done)));});
      this.covers.forEach((n,i)=>show(n,!runtime.destroyed[i]));this.kits.forEach((n,i)=>show(n,runtime.medkits[i]));this.currents.forEach((n,i)=>{const c=engine.levelData.currents[i];show(n,c.disabledBy===undefined||!runtime.tasks[c.disabledBy].done);});
      show(this.exitReady,engine.levelGoalsDone);show(this.goals,engine.area==="sewer");const goal=engine.dungeonGoal;set(this.goals,"transform",`translate(${goal.x} ${projectAdventureY(goal.y)})`);
    }else show(this.goals,false);
    show(this.exitPointer,engine.levelGoalsDone&&engine.phase==="playing");
    if(engine.levelGoalsDone){const pose=exitPointerPose(camera,engine.player,dungeonExitTarget(engine));set(this.exitPointer,"transform",`translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)})`);set(this.exitPointerShape,"transform",`rotate(${pose.angle.toFixed(2)})`);set(this.exitPointer?.querySelector("[data-exit-pointer-label]")??null,"y",pose.y>camera.y+camera.h-150?"-39":"42");}
    this.ingredients.forEach((n,i)=>show(n,!!engine.ingredientPickups[i]&&!engine.ingredientPickups[i].collected));
    this.pickups.forEach((n,i)=>{const chest=engine.chests[i],d=chest?.drop;show(n.node,!!d?.active);if(!d?.active)return;set(n.node,"transform",`translate(${d.x.toFixed(2)} ${(projectAdventureY(d.y)-d.z).toFixed(2)})`);show(n.coins,chest.loot.kind==="coins");show(n.auraToken,chest.loot.kind==="aura");for(const item of n.items)show(item,chest.loot.kind==="buff"&&item.getAttribute("data-loot-item")===chest.loot.buff);set(n.sparkles,"transform",this.reduced?"":"rotate("+(Math.sin(d.age*4)*15).toFixed(1)+")");set(n.aura,"opacity",this.reduced?".2":String(.13+Math.abs(Math.sin(d.age*4))*.15));});
    this.fx.forEach((n,i)=>{
      const e=engine.effects.pool[i];show(n.node,e.active);if(!e.active)return;
      const age=e.age,r=e.radius/68;set(n.node,"transform",`translate(${e.x} ${projectAdventureY(e.y)})`);
      if(minimal){
        show(n.fire,e.kind==="blast");show(n.hit,e.kind==="hit"||e.kind==="spark");show(n.heal,e.kind==="heal");
        for(const optional of [n.smoke,n.ring,n.debris,n.dust,n.shell])show(optional,false);
        set(n.fire,"transform",`scale(${r})`);set(n.fire,"opacity",String(Math.max(0,1-age/.6)));
        set(n.hit,"transform","scale(1)");set(n.hit,"opacity","1");set(n.heal,"transform","translate(0 -10)");set(n.heal,"opacity","1");return;
      }

      show(n.fire,e.kind==="blast"&&age<.45);show(n.smoke,e.kind==="blast"&&age>.09);show(n.ring,e.kind==="blast"&&age<.43);show(n.debris,e.kind==="blast"&&age<.7&&!this.reduced);show(n.hit,e.kind==="hit"||e.kind==="spark");show(n.dust,e.kind==="dash");show(n.heal,e.kind==="heal");show(n.shell,e.kind==="shell");
      set(n.fire,"transform",`scale(${(r*(this.reduced?1:.35+Math.min(.26,age)*4.8)).toFixed(3)})`);set(n.fire,"opacity",String(Math.max(0,1-age/.45)));
      set(n.ring,"transform",`scale(${(r*(.3+age*3.7)).toFixed(3)})`);set(n.ring,"opacity",String(Math.max(0,1-age/.43)));
      set(n.smoke,"transform",`translate(${Math.sin(e.seed)*age*20} ${-age*55}) scale(${r*(.65+age*.9)})`);set(n.smoke,"opacity",String(Math.max(0,.6-age*.54)));
      n.fragments.forEach((f,j)=>{const angle=j*Math.PI/4+e.seed*.7,travel=Math.min(.6,age);set(f,"transform",`translate(${Math.cos(angle)*travel*e.radius*1.65} ${Math.sin(angle)*travel*e.radius- Math.sin(travel/.7*Math.PI)*38}) rotate(${j*33+age*440})`);set(f,"opacity",String(Math.max(0,1-age/.7)));});
      set(n.hit,"transform",`scale(${.35+age*2.1}) rotate(${e.seed*17})`);set(n.hit,"opacity",String(Math.max(0,1-age/.3)));
      set(n.dust,"transform",`scale(${.7+age*1.8})`);set(n.dust,"opacity",String(Math.max(0,1-age/.32)));
      set(n.heal,"transform",`translate(0 ${-age*55})`);set(n.heal,"opacity",String(Math.max(0,1-age/.65)));
      set(n.shell,"transform",`translate(${14+age*23} ${age*20-Math.sin(Math.min(1,age/.8)*Math.PI)*18}) rotate(${age*400+e.seed*17})`);set(n.shell,"opacity",String(Math.max(0,1-age/.8)));
    });
    this.arcs.forEach((n,i)=>{const l=engine.effects.links[i];show(n.node,l.active);if(!l.active)return;const dx=l.tx-l.x,dy=projectAdventureY(l.ty-l.y),normal=Math.max(1,Math.hypot(dx,dy));let path=`M${l.x} ${projectAdventureY(l.y)}`;for(let j=1;j<7;j++){const offset=j===6?0:this.reduced?j%2?5:-5:Math.sin(j*2+engine.time*40)*9;path+=`L${l.x+dx*j/6-dy/normal*offset} ${projectAdventureY(l.y)+dy*j/6+dx/normal*offset}`;}set(n.outer,"d",path);set(n.inner,"d",path);set(n.node,"opacity",String(Math.max(0,1-l.age/.23)));});
    this.warnings.forEach((n,i)=>{const b=engine.bullets[i];show(n,!!b&&b.active&&b.kind==="grenade"&&b.owner==="enemy");if(b?.active&&b.kind==="grenade"){set(n,"transform",`translate(${b.x+b.vx*b.life} ${projectAdventureY(b.y+b.vy*b.life)})`);set(n,"rx",String(b.splash??78));set(n,"ry",String((b.splash??78)*.82));}});
  }
}
