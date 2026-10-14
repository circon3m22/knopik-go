import type { NeighborhoodEngine } from "./neighborhood-engine";
import { knopikMotion } from "./knopik-adventure-animation";
import { projectAdventureY, type AdventureFacing } from "./adventure-projection";
import { neighborhoodWorkLift } from "./neighborhood-work";
const set=(n:Element|null,k:string,v:string)=>{if(n&&n.getAttribute(k)!==v)n.setAttribute(k,v);};
const show=(n:Element|null,on:boolean)=>set(n,"display",on?"inline":"none");
const move=(n:Element|null,x:number,y:number,extra="")=>set(n,"transform",`translate(${x.toFixed(2)} ${y.toFixed(2)}) ${extra}`);
export class NeighborhoodWorkRenderer{
  private tools;private held;private world;private toolKinds;private clock;private ladder;private stream;private drops;private splash;private transfer;private picked;private litterKinds;private food;private bits;private bulb;private photo;private success;private groundLitter;private watered;private bowl;private cat;private catHead;private shadow;private found;private foundKinds;
  constructor(svg:SVGSVGElement){
    const q=(s:string)=>svg.querySelector(s),all=(s:string)=>Array.from(svg.querySelectorAll(s));
    this.tools=q("[data-work-tools]");this.held=q("[data-work-held]");this.world=q("[data-work-world]");this.toolKinds=all("[data-work-tool]");this.clock=q("[data-work-clock]");this.ladder=q("[data-work-ladder-position]");this.stream=q("[data-work-water]");this.drops=all("[data-work-drop]");this.splash=q("[data-work-soil-splash]");this.transfer=q("[data-work-transfer]");this.picked=q("[data-work-picked-litter]");this.litterKinds=all("[data-picked-litter]");this.food=q("[data-work-food-bits]");this.bits=all("[data-food-bit]");this.bulb=q("[data-work-new-bulb]");this.photo=q("[data-work-photo]");this.success=q("[data-work-success]");this.groundLitter=all("[data-shore-litter]");this.watered=all("[data-watered-bed]");this.bowl=q("[data-cat-bowl]");this.cat=q("[data-cat]");this.catHead=q("[data-cat-head]");this.shadow=q("[data-knopik-shadow]");this.found=q("[data-work-found]");this.foundKinds=all("[data-found-kind]");
  }
  paint(engine:NeighborhoodEngine,facing:AdventureFacing,reduced:boolean){
    const a=engine.action;show(this.tools,!!a);show(this.world,!!a);show(this.ladder,a?.kind==="repair");set(this.shadow,"transform",`translate(0 ${neighborhoodWorkLift(a).toFixed(2)})`);
    for(const node of this.toolKinds)show(node,node.getAttribute("data-work-tool")===a?.kind);
    for(const node of [this.stream,this.splash,this.transfer,this.picked,this.food,this.bulb,this.photo,this.success,this.found])show(node,false);
    this.drops.forEach(n=>show(n,false));set(this.catHead,"transform","");move(this.cat,1665,projectAdventureY(1290));set(this.cat,"data-depth","1290");
    this.watered.forEach((n,i)=>{const done=!!(engine.progress.missions.garden.steps&(1<<i));show(n,done||a?.kind==="water"&&a.step===i&&a.elapsed/a.duration>.4);set(n,"opacity",done?"1":String(a?Math.min(1,Math.max(0,(a.elapsed/a.duration-.4)/.6)):1));});
    this.groundLitter.forEach((n,i)=>show(n,!(engine.progress.missions.shore.steps&(1<<i))&&!(a?.kind==="collect"&&a.step===i&&a.elapsed/a.duration>.32)));
    show(this.bowl,!!(engine.progress.missions.cat.steps&2)||a?.kind==="feed"&&a.elapsed/a.duration>.28);
    if(!a)return;
    const p=Math.min(1,a.elapsed/a.duration),pose=knopikMotion(engine.animationState,facing,reduced),mirror=facing==="left"||facing.endsWith("-left")?-1:1,hand=pose.arms[1].hand;
    const lift=neighborhoodWorkLift(a),hx=hand.x*.5*mirror,hy=hand.y*.5,px=engine.player.x,py=projectAdventureY(engine.player.y)-lift;
    move(this.held,hx,hy,`scale(${mirror} 1)`);set(this.clock,"stroke-dasharray",`${(107*p).toFixed(2)} 107`);
    move(this.ladder,px,projectAdventureY(engine.player.y));set(this.ladder,"data-depth",String(engine.player.y-.5));
    const active=p>.15&&p<.9;
    if(a.kind==="water"){
      const angle=-22+(reduced?0:Math.sin(a.elapsed*3)*7);set(this.toolKinds.find(n=>n.getAttribute("data-work-tool")==="water")??null,"transform",`rotate(${angle})`);
      const sx=px+hx+mirror*22,sy=py+hy-8,tx=a.x,ty=projectAdventureY(1165+a.step*80+33);
      show(this.stream,active);set(this.stream,"d",`M${sx} ${sy}Q${(sx+tx)/2} ${Math.min(sy,ty)+18} ${tx} ${ty}`);set(this.stream,"stroke-dashoffset",String(reduced?0:-a.elapsed*35));
      this.drops.forEach((n,i)=>{show(n,active&&!reduced);const t=(a.elapsed*1.8+i/9)%1;move(n,sx+(tx-sx)*t,sy+(ty-sy)*t+Math.sin(t*Math.PI)*8);});show(this.splash,active);move(this.splash,tx,ty,`scale(${reduced?1:.8+Math.sin(a.elapsed*8)*.2})`);
    }else if(a.kind==="repair"){
      const wrench=this.toolKinds.find(n=>n.getAttribute("data-work-tool")==="repair")??null;set(wrench,"transform",`rotate(${reduced?0:Math.sin(a.elapsed*10)*19})`);show(wrench,p>.23&&p<.8);
      show(this.bulb,p>.54&&p<.79);move(this.bulb,px-34,projectAdventureY(engine.player.y)-106);
    }else if(a.kind==="collect"){
      const t=Math.min(1,Math.max(0,(p-.32)/.4));show(this.picked,p>.32&&p<.78);this.litterKinds.forEach(n=>show(n,Number(n.getAttribute("data-picked-litter"))===a.step));move(this.picked,a.x+(px+hx-a.x)*t,projectAdventureY(a.y)+(py+hy-projectAdventureY(a.y))*t-Math.sin(t*Math.PI)*18,`rotate(${reduced?0:t*22})`);
    }else if(a.kind==="search"){
      const t=Math.min(1,Math.max(0,(p-.3)/.5));show(this.found,p>.3&&p<.96);for(const n of this.foundKinds)show(n,n.getAttribute("data-found-kind")===a.point);move(this.found,a.x+(px+hx-a.x)*t,projectAdventureY(a.y)+(py+hy-projectAdventureY(a.y))*t-Math.sin(t*Math.PI)*23);
    }else if(a.kind==="handoff"||a.kind==="food"){
      const t=Math.min(1,Math.max(0,(p-.12)/.7)),source=a.kind==="handoff"?{x:px+hx,y:py+hy}:{x:a.x,y:projectAdventureY(a.y)-39},target=a.kind==="handoff"?{x:a.x,y:projectAdventureY(a.y)-34}:{x:px+hx,y:py+hy};
      show(this.transfer,a.kind==="handoff"&&p<.86);move(this.transfer,source.x+(target.x-source.x)*t,source.y+(target.y-source.y)*t-Math.sin(t*Math.PI)*15);
      if(a.kind==="food")set(this.held,"opacity",String(Math.max(.1,t)));else set(this.held,"opacity","1");
    }else if(a.kind==="photo"){
      show(this.photo,p>.63);const t=(p-.63)/.37;move(this.photo,px+hx+22,py+hy+10-t*22,`rotate(${reduced?0:-8+t*12})`);set(this.photo,"opacity",String(Math.min(1,t*5)));
    }else if(a.kind==="feed"){
      const t=Math.min(1,Math.max(0,(p-.27)/.32)),tx=1680,ty=projectAdventureY(1300);show(this.food,active&&!reduced);this.bits.forEach((n,i)=>{const part=(a.elapsed*1.2+i/6)%1;move(n,px+hx+(tx-px-hx)*part,py+hy+(ty-py-hy)*part+Math.sin(part*Math.PI)*11);});move(this.cat,1665+12*t,projectAdventureY(1290+7*t));set(this.catHead,"transform",`translate(0 ${2+t*5}) rotate(${t*13} 20 -11)`);const bag=this.toolKinds.find(n=>n.getAttribute("data-work-tool")==="feed")??null;set(bag,"transform",`rotate(${reduced?-25:-25+Math.sin(a.elapsed*4)*8})`);
    }
    if(a.kind!=="food")set(this.held,"opacity","1");
    show(this.success,p>.92);move(this.success,px,py-69-(reduced?0:(p-.92)*120));
  }
}
