import {KnopikSkinPainter} from "./knopik-skins.ts";
import { EMPTY_EQUIPMENT, type KnopikEquipment } from "./knopik-equipment-state.ts";
import { firearmAim } from "./dungeon-aim";
import { knopikRollPose } from "./knopik-roll";
import type { AdventureEngine } from "./adventure-engine.ts";
import { ADVENTURE_DEPTH, type AdventureFacing } from "./adventure-projection.ts";
import { stableSahurFacing as stableActorFacing } from "./sahur-animation.ts";
import type { KnopikRigDirection } from "./knopik-adventure-art";

type Point = { x:number; y:number };
const point=(x:number,y:number):Point=>({x:Math.round(x),y:Math.round(y)});
const set=(node:Element|null,name:string,value:string)=>{if(node && node.getAttribute(name)!==value)node.setAttribute(name,value);};
const translate=(p:Point)=>`translate(${p.x} ${p.y})`;
const RIGS:Record<KnopikRigDirection,{shoulders:Point[];hands:Point[];hips:number[];tail:Point}>={
  front:{shoulders:[point(-24,-62),point(24,-62)],hands:[point(-29,-35),point(29,-35)],hips:[-13,13],tail:point(-30,-45)},
  back:{shoulders:[point(-24,-62),point(24,-62)],hands:[point(-30,-36),point(34,-38)],hips:[-13,13],tail:point(0,-42)},
  side:{shoulders:[point(-12,-62),point(20,-61)],hands:[point(2,-38),point(31,-35)],hips:[-8,12],tail:point(-31,-46)},
  "front-diagonal":{shoulders:[point(-22,-61),point(25,-60)],hands:[point(-28,-36),point(32,-35)],hips:[-12,15],tail:point(-29,-43)},
  "back-diagonal":{shoulders:[point(-20,-62),point(25,-61)],hands:[point(-25,-36),point(35,-39)],hips:[-12,15],tail:point(-15,-39)},
};
export function knopikRigDirection(facing:AdventureFacing):KnopikRigDirection {
  return facing==="left"||facing==="right"?"side":facing.startsWith("front-")?"front-diagonal":facing.startsWith("back-")?"back-diagonal":facing==="back"?"back":"front";
}
/** A single pixel path joins the same shoulder/elbow/wrist in every frame. */
export function pixelBonePath(points:Point[],width:number) {
  const half=width/2,x0=Math.floor((Math.min(...points.map(p=>p.x))-half)/2)*2,x1=Math.ceil((Math.max(...points.map(p=>p.x))+half)/2)*2;
  const y0=Math.floor((Math.min(...points.map(p=>p.y))-half)/2)*2,y1=Math.ceil((Math.max(...points.map(p=>p.y))+half)/2)*2;
  const segments=points.slice(1).map((b,i)=>{const a=points[i],dx=b.x-a.x,dy=b.y-a.y;return {a,dx,dy,denominator:Math.max(1,dx*dx+dy*dy)};});
  const contains=(x:number,y:number)=>{
    for(const {a,dx,dy,denominator} of segments){
      const px=x+1-a.x,py=y+1-a.y,t=Math.max(0,Math.min(1,(px*dx+py*dy)/denominator));
      if((px-dx*t)**2+(py-dy*t)**2<=half*half)return true;
    }return false;
  };
  let path="";
  // The output is one filled span per row. Interior pixels cannot change either edge.
  for(let y=y0;y<y1;y+=2){let left=x0,right=x1-2;
    while(left<x1&&!contains(left,y))left+=2;
    if(left>=x1)continue;
    while(right>left&&!contains(right,y))right-=2;
    const span=right+2-left;path+=`M${left} ${y}h${span}v2h-${span}Z`;
  }
  return path;
}
export type KnopikAnimationState=Pick<AdventureEngine,"player"|"area"|"weapon"|"punchTime"|"punchSerial"|"walkDistance"|"moving"|"dodgeTime"|"checkpoint"|"tutorialOpened">&{aimAngle?:number;equipment?:KnopikEquipment;surgeTime?:number;time?:number;seated?:boolean;carrying?:boolean;working?:{kind:string;elapsed:number;progress:number}};
export function knopikMotion(engine:KnopikAnimationState,facing:AdventureFacing,reduced=false,aimAngle=engine.aimAngle??engine.player.angle) {
  const rig=knopikRigDirection(facing),base=RIGS[rig],back=facing.startsWith("back"),side=rig==="side",mirror=facing==="left"||facing.endsWith("-left")?-1:1;
  const weapon=engine.area==="sewer"?engine.weapon:"fist",armed=weapon!=="fist",attacking=engine.punchTime>0;
  const cycle=engine.walkDistance/54*Math.PI*2,run=!reduced&&engine.moving?1:0,dash=!reduced&&engine.dodgeTime>0;
  const bob=run*Math.abs(Math.sin(cycle))*-2,lean=dash?5:run*Math.sin(cycle)*1.3;
  const work=engine.working,weight=work?Math.max(0,Math.min(1,work.progress/.16,(1-work.progress)/.16)):0;
  const bend=!reduced&&work&&(work.kind==="collect"||work.kind==="feed"||work.kind==="search")?weight*7:0;
  const lift=point(side?lean:lean*.45,bob+(dash?5:0)+bend);
  const aim=Math.atan2(Math.sin(aimAngle)*ADVENTURE_DEPTH,Math.cos(aimAngle)*mirror),vx=Math.cos(aim),vy=Math.sin(aim);
  const attackSide=weapon==="fist"&&engine.punchSerial%2===0?0:1;
  const progress=weapon==="sabre"?Math.max(0,Math.min(1,1-engine.punchTime/.32)):Math.max(0,Math.min(1,1-engine.punchTime/(weapon==="fist"?.24:.17)));
  const strike=attacking && weapon==="fist" ? reduced?1:progress<.18?1:((1-progress)/.82)**2:0;
  const recoil=attacking && armed&&weapon!=="sabre" ? reduced?0:(1-progress)**2*(weapon==="shotgun"?10:weapon==="launcher"?8:6):0;
  const arms=base.shoulders.map((shoulder,i)=>{
    const s=point(shoulder.x+lift.x,shoulder.y+lift.y),rest=base.hands[i],swing=run*Math.sin(cycle+(i?0:Math.PI))*(side?8:4);
    let h=point(rest.x+lift.x+swing,rest.y+lift.y+run*Math.cos(cycle+(i?0:Math.PI))*3);
    if(armed && i===1){
      h=point((back?45:side?37:34)+lift.x-vx*recoil,(back?-62:-43)+lift.y-vy*recoil);
      if(weapon==="sabre" && attacking){h=point(h.x+vx*(Math.sin(progress*Math.PI)*12-6),h.y+vy*(Math.sin(progress*Math.PI)*12-6));}
    } else if(weapon==="fist" && attacking){
      // The endpoint is measured from the shoulder, not added to the hanging
      // wrist: a compact 16-world-unit reach cannot stretch into a long arm.
      const target=point(s.x+vx*32+(back?(i?12:-12):0),s.y+vy*24);
      h=i===attackSide?point(rest.x+lift.x+(target.x-rest.x-lift.x)*strike,rest.y+lift.y+(target.y-rest.y-lift.y)*strike):point(rest.x+lift.x-vx*4,rest.y+lift.y-10);
    } else if(armed&&weapon!=="sabre"&&weapon!=="pistol"&&i===0){
      h=point((side?14:back?15:8)+lift.x,-43+lift.y);
    } else if(engine.carrying){
      h=point((side?(i?40:-10):(i?38:-38))+lift.x,-42+lift.y);
    }
    if(work&&!(work.kind==="repair"&&engine.moving)){
      const wave=reduced?0:Math.sin(work.elapsed*(work.kind==="repair"?10:work.kind==="water"?3.5:4));
      const target=work.kind==="photo"?point(i?27:-17,-72):work.kind==="repair"?point(s.x+vx*(i?31:12),s.y+vy*22+wave*3):work.kind==="collect"||work.kind==="feed"||work.kind==="search"?point(i?31:-24,-23+wave*3):point(i?37:-21,-48+wave*2);
      h=point(h.x+(target.x-h.x)*weight,h.y+(target.y-h.y)*weight);
    }
    const e=point(s.x+(h.x-s.x)*.38+(i?5:-5),s.y+(h.y-s.y)*.52+6);
    return {shoulder:s,elbow:e,hand:h,toolAngle:Math.round((weapon==="sabre" ? attacking?aim+(-75+progress*150)*Math.PI/180:-70*Math.PI/180 : aim)*180/Math.PI),armed:armed&&i===1};
  });
  const legs=base.hips.map((x,i)=>{
    const wave=Math.sin(cycle+(i?Math.PI:0))*run,air=Math.max(0,Math.cos(cycle+(i?Math.PI:0)))*run;
    const foot=point(x+wave*(side?15:4),wave*(side?2:back?-8:8)-air*10),hip=point(x+lift.x*.35,-29+lift.y*.35);
    const knee=point((hip.x+foot.x)/2+wave*(side?4:2),-17-air*4);
    return {hip,knee,foot};
  });
  return {rig,lift,arms,legs,weapon,tail:point(base.tail.x+lift.x+run*Math.sin(cycle)*2,base.tail.y+lift.y),muzzle:armed&&weapon!=="sabre"&&attacking&&progress<.4,seated:engine.seated===true||engine.area==="apartment"&&engine.checkpoint===0&&!engine.tutorialOpened&&engine.player.y<400};
}
type LimbNodes={root:Element;edge:Element|null;fur:Element|null;light?:Element|null;end:Element|null;paw:Element|null;key:string};
type RigNodes={root:Element;direction:Element;head:Element|null;torso:Element|null;tail:Element|null;arms:LimbNodes[];legs:LimbNodes[];tools:(Element|null)[];muzzles:Element[][];choices:Element[][]};
export class KnopikAnimator {
  impact:Point=point(0,0);
  private skinPainter:KnopikSkinPainter;
  private skin:Element|null;private aura:Element|null;private headwear:Element|null;private neckwear:Element|null;private worn:Element[];private capes:Element[];private capeClasp:Element|null;private clothingPoses:Element[];
  private clothingPose="";
  private roll:Element|null;private spin:Element|null;private dust:Element|null;
  private facing:AdventureFacing="front";
  private motionKey='';
  private motion:ReturnType<typeof knopikMotion>|null=null;
  private rigs=new Map<KnopikRigDirection,RigNodes>();
  constructor(body:Element|null){
    this.skin=body?.querySelector("[data-knopik-skin]")??null;this.aura=body?.querySelector("[data-knopik-aura]")??null;this.headwear=body?.querySelector("[data-knopik-headwear]")??null;this.neckwear=body?.querySelector("[data-knopik-neckwear]")??null;this.worn=Array.from(body?.querySelectorAll("[data-worn]")??[]);this.capes=Array.from(body?.querySelectorAll("[data-knopik-cape]")??[]);this.capeClasp=body?.querySelector("[data-knopik-cape-clasp]")??null;this.clothingPoses=Array.from(body?.querySelectorAll("[data-clothing-pose]")??[]);
    this.skinPainter=new KnopikSkinPainter(this.skin);
    this.roll=body?.querySelector("[data-knopik-roll]")??null;this.spin=this.roll?.querySelector("[data-roll-spin]")??null;this.dust=this.roll?.querySelector("[data-roll-dust]")??null;
    for(const root of Array.from(body?.querySelectorAll("[data-knopik-rig]")??[])){
      const direction=body?.querySelector(`[data-direction="${root.getAttribute("data-knopik-rig")}"]`);
      if(!direction)continue;
      const limbs=(kind:"arm"|"leg"):LimbNodes[]=>Array.from(root.querySelectorAll(`[data-knopik-${kind}]`)).map(node=>({root:node,edge:node.querySelector(`[data-${kind}-edge]`),fur:node.querySelector(`[data-${kind}-fur]`),light:kind==="arm"?node.querySelector("[data-arm-light]"):null,end:node.querySelector(kind==="arm"?"[data-knopik-hand]":"[data-knopik-foot]"),paw:node.querySelector("[data-knopik-paw]"),key:""}));
      const arms=limbs("arm");
      this.rigs.set(root.getAttribute("data-knopik-rig") as KnopikRigDirection,{root,direction,head:root.querySelector("[data-knopik-head]"),torso:root.querySelector("[data-knopik-torso]"),tail:root.querySelector("[data-knopik-tail]"),arms,legs:limbs("leg"),tools:arms.map(n=>n.root.querySelector("[data-knopik-tool]")),muzzles:arms.map(n=>Array.from(n.root.querySelectorAll("[data-knopik-muzzle]"))),choices:arms.map(n=>Array.from(n.root.querySelectorAll("[data-held]")))});
    }
  }
  paint(engine:KnopikAnimationState,reduced=false,aimOverride?:number){
    this.facing=stableActorFacing(engine.player.angle,this.facing);
    const gear=engine.equipment??EMPTY_EQUIPMENT,boosted=(engine.surgeTime??0)>0,back=this.facing.startsWith("back");
    this.skinPainter.paint(gear.skin);
    set(this.skin,"filter",boosted?`url(#${this.skin?.getAttribute("data-surge-filter")})`:"none");set(this.aura,"display",boosted?"inline":"none");
    if(boosted)set(this.aura,"opacity",reduced?".85":String(.65+Math.round(Math.abs(Math.sin((engine.time??0)*9))*4)/10));
    const rolling=engine.dodgeTime>0;set(this.neckwear,"display",!rolling&&(gear.accessory==="bandana"||gear.accessory==="charm")?"inline":"none");set(this.headwear,"display",rolling?"none":"inline");
    const clothingPose=knopikRigDirection(this.facing);
    for(const n of this.worn){const kind=n.getAttribute("data-worn");set(n,"display",kind==="hat"?gear.hat?"inline":"none":kind==="mohawk"?gear.mohawk?"inline":"none":kind===gear.accessory&&!rolling?"inline":"none");}
    if(this.clothingPose!==clothingPose){this.clothingPose=clothingPose;for(const pose of this.clothingPoses)set(pose,"display",pose.getAttribute("data-clothing-pose")===clothingPose?"inline":"none");}
    for(const n of this.capes){const foreground=n.getAttribute("data-knopik-cape")==="front";set(n,"display",gear.accessory===(n.getAttribute("data-cloak-kind")??"cape")&&!rolling&&foreground===back?"inline":"none");}
    set(this.capeClasp,"display",gear.accessory==="cape"&&!back&&!rolling?"inline":"none");
    const roll=knopikRollPose(engine.dodgeTime,engine.player.angle,reduced);
    set(this.roll,"display",roll.active?"inline":"none");
    if(roll.active){
      set(this.roll,"transform",`translate(0 ${-24-roll.lift}) scale(${roll.mirror} ${roll.squash})`);
      set(this.spin,"transform",`rotate(${roll.turns*roll.mirror})`);
      set(this.dust,"display",reduced?"none":"inline");set(this.dust,"transform",`translate(${-Math.round(roll.progress*12)} ${24+roll.lift})`);set(this.dust,"opacity",String(Math.round((1-roll.progress)*8)/8));
      for(const nodes of this.rigs.values())set(nodes.direction,"display","none");
      this.impact=point(0,0);return this.facing;
    }
    const aimAngle=aimOverride??(engine.area==="sewer"&&"enemies" in engine?firearmAim(engine as AdventureEngine).angle:engine.player.angle);
    const work=engine.working,key=`${this.facing}/${reduced}/${engine.area}/${engine.weapon}/${engine.punchTime}/${engine.punchSerial}/${engine.walkDistance}/${engine.moving}/${engine.dodgeTime}/${engine.checkpoint}/${engine.tutorialOpened}/${engine.player.y<400}/${engine.seated}/${engine.carrying}/${work?.kind}/${work?.elapsed}/${work?.progress}/${aimAngle}`;
    if(!this.motion||key!==this.motionKey){this.motion=knopikMotion(engine,this.facing,reduced,aimAngle);this.motionKey=key;}
    const pose=this.motion,mirror=this.facing==="left"||this.facing.endsWith("-left");
    for(const [name,nodes]of this.rigs){set(nodes.direction,"display",name===pose.rig?"inline":"none");if(name===pose.rig)set(nodes.direction,"transform",mirror?"scale(-1 1)":"scale(1 1)");}
    set(this.headwear,"transform",`translate(${Math.round(pose.lift.x*.5)} ${Math.round(pose.lift.y*.5)}) scale(${mirror?-1:1} 1)`);set(this.neckwear,"transform",`translate(${Math.round(pose.lift.x*.5)} ${Math.round(pose.lift.y*.5)}) scale(${mirror?-1:1} 1)`);
    if(gear.accessory==="cape")for(const n of this.capes)set(n,"transform",`translate(${Math.round(pose.lift.x*.5)} ${Math.round(pose.lift.y*.5)}) scale(${mirror?-1:1} 1) rotate(${!reduced&&engine.moving?Math.round(Math.sin(engine.walkDistance/18)*3):0} 0 -30)`);
    set(this.capeClasp,"transform",`translate(${Math.round(pose.lift.x*.5)} ${Math.round(pose.lift.y*.5)}) scale(${mirror?-1:1} 1)`);
    const nodes=this.rigs.get(pose.rig);if(!nodes)return this.facing;
    const fist=pose.arms[engine.punchSerial%2===0?0:1].hand;this.impact={x:fist.x*(mirror?-.5:.5),y:fist.y*.5};
    set(nodes.head,"transform",translate(pose.lift));set(nodes.torso,"transform",translate(pose.lift));set(nodes.tail,"transform",translate(pose.tail));
    for(let i=0;i<2;i++){
      const arm=pose.arms[i],a=nodes.arms[i],key=`${arm.shoulder.x}/${arm.shoulder.y}/${arm.elbow.x}/${arm.elbow.y}/${arm.hand.x}/${arm.hand.y}`;
      if(a.key!==key){a.key=key;const chain=[arm.shoulder,arm.elbow,arm.hand];set(a.edge,"d",pixelBonePath(chain,13));set(a.fur,"d",pixelBonePath(chain,9));set(a.light??null,"d",pixelBonePath([arm.shoulder,arm.elbow],3));}
      set(a.end,"transform",translate(arm.hand));set(nodes.tools[i],"display",arm.armed?"inline":"none");
      // The grip and fingers share one rotation and one wrist. No independent overlay.
      set(a.paw,"transform",arm.armed?`rotate(${arm.toolAngle}) scale(.75)`:"scale(1)");set(nodes.tools[i],"transform",`rotate(${arm.toolAngle})`);
      for(const choice of nodes.choices[i])set(choice,"display",choice.getAttribute("data-held")===pose.weapon?"inline":"none");for(const muzzle of nodes.muzzles[i])set(muzzle,"display",pose.muzzle?"inline":"none");
      const leg=pose.legs[i],l=nodes.legs[i],legKey=`${leg.hip.x}/${leg.hip.y}/${leg.knee.x}/${leg.knee.y}/${leg.foot.x}/${leg.foot.y}`;
      set(l.root,"display",pose.seated?"none":"inline");if(l.key!==legKey){l.key=legKey;const chain=[leg.hip,leg.knee,leg.foot];set(l.edge,"d",pixelBonePath(chain,15));set(l.fur,"d",pixelBonePath(chain,10));}set(l.end,"transform",translate(leg.foot));
    }
    return this.facing;
  }
}
