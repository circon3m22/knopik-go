import type {AdventureEngine} from './adventure-engine';
import {APARTMENT_SOLIDS,BASEMENT_SOLIDS} from './adventure-engine';
import type {NeighborhoodEngine} from './neighborhood-engine';
import type {LevelRect} from './adventure-levels';
import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS,HOME_SOLIDS} from './apartment-world';
import {NEIGHBORHOOD_LAMPS,NEIGHBORHOOD_SOLIDS,neighborhoodLampOn} from './neighborhood-map';
import {ultraHomeSources,ultraRoomSources,ultraSmallSources} from './ultra-light-sources';
import {actorRadiance,type ActorEmitter} from './ultra-actor-light';
import {setSvgAttribute as set} from './svg-attribute';
import {firearmMuzzle,isFirearm} from './dungeon-aim';
type Actor={x:number;y:number;hp:number};
type Slot={matrix:Element|null;rim:Element|null;offset:Element|null;frame:number;key:string;x:number;y:number;dead:boolean};
type LightRoom={room:LevelRect;lights:ActorEmitter[]};
/** Uses the existing scene frame. Samples at 12 Hz; static/paused actors write nothing. */
export class UltraActorLightRenderer{
 private slots:Slot[];private night=false;private theme:ThemeId='classic';private expanded=false;
 private rooms:LightRoom[]=[];private casters:readonly LevelRect[]=[];private floors?:readonly LevelRect[];private context='';private layout:unknown;private revision=-1;private flash:ActorEmitter[]=[];
 constructor(svg:Element){
  const roots=Array.from(svg.querySelectorAll('[data-ultra-actor-shader]'));
  this.night=roots[0]?.getAttribute('data-actor-night')==='1';this.theme=(roots[0]?.getAttribute('data-actor-theme')??'classic') as ThemeId;this.expanded=svg.getAttribute('data-home-layout')==='expanded';
  this.slots=roots.map(root=>({matrix:root.querySelector('[data-ultra-actor-matrix]'),rim:root.querySelector('[data-ultra-actor-rim]'),offset:root.querySelector('[data-ultra-actor-offset]'),frame:-1,key:'',x:NaN,y:NaN,dead:false}));
 }
 get enabled(){return this.slots.length>0;}
 private render(slot:Slot,actor:Actor,time:number,rooms:LightRoom[],casters:readonly LevelRect[],flash:ActorEmitter[],revision:string,sun=false){
  const frame=Math.floor(time*12),area=rooms.find(r=>actor.x>=r.room.x&&actor.x<=r.room.x+r.room.w&&actor.y>=r.room.y&&actor.y<=r.room.y+r.room.h),key=`${Math.round(actor.x/3)}/${Math.round(actor.y/3)}/${actor.hp<=0}/${revision}`;
  if(slot.key===key||slot.frame===frame&&slot.key.endsWith('/'+revision)&&slot.dead===(actor.hp<=0)&&Math.hypot(actor.x-slot.x,actor.y-slot.y)<30)return;
  slot.frame=frame;slot.key=key;slot.x=actor.x;slot.y=actor.y;slot.dead=actor.hp<=0;
  const sample=actorRadiance(actor,flash.length?[...(area?.lights??[]),...flash]:area?.lights??[],casters,this.night,sun,actor.hp<=0,this.floors);
  set(slot.matrix,'values',sample.matrix);set(slot.rim,'flood-color',sample.color);set(slot.rim,'flood-opacity',sample.opacity);set(slot.offset,'dx',sample.dx);set(slot.offset,'dy',sample.dy);
 }
 paintAdventure(e:AdventureEngine,angle:number,reduced=false,partner?:{player:Actor}){
  if(!this.enabled)return;
  const context=e.area+'/'+e.level,revision=e.dungeon?.geometryRevision??0;
  if(this.context!==context||this.layout!==e.levelData||this.revision!==revision){
   this.context=context;this.layout=e.levelData;this.revision=revision;
   this.floors=undefined;
   if(e.area==='sewer'){
    this.floors=e.levelData.floors;this.rooms=[{room:{x:e.levelData.bounds.x,y:0,w:e.levelData.bounds.w,h:e.levelData.height},lights:e.levelData.rooms.flatMap(room=>ultraRoomSources(room,e.levelData.palette.accent))}];this.casters=e.levelData.solids.filter((_,i)=>!e.dungeon?.destroyed[i]);
   }else if(e.area==='apartment'&&this.expanded){
    const lights:ActorEmitter[]=ultraHomeSources(this.theme).map((l,i)=>({...l,height:i<7?[142,142,142,142,92,142,60][i]:55}));
    for(const x of [548,754])lights.push({x,y:168,height:70,radius:350,color:this.night?'#9fc6e7':'#fff0c6',strength:this.night?.18:.3});
    this.rooms=HOME_ROOMS.map(room=>({room,lights:lights.filter(l=>l.x>=room.x&&l.x<=room.x+room.w&&l.y>=room.y&&l.y<=room.y+room.h)}));this.casters=HOME_SOLIDS;
   }else{
    const basement=e.area==='basement',room=basement?{x:36,y:102,w:408,h:352}:{x:28,y:108,w:424,h:440};this.rooms=[{room,lights:ultraSmallSources(basement,this.night)}];this.casters=basement?BASEMENT_SOLIDS:APARTMENT_SOLIDS;
   }
  }
  this.flash.length=0;let flashKey='';
  if(!reduced){
   if(e.area==='sewer'&&isFirearm(e.weapon)&&e.weapon!=='crossbow'&&e.punchTime>.12){const m=firearmMuzzle(e,angle);if(!m.blocked){const power=Math.round((e.punchTime-.12)/.08*5)/5;this.flash.push({x:m.x,y:m.y,height:45,radius:155,color:'#ffd09a',strength:power*.65});flashKey='m'+e.punchSerial+'/'+power;}}
   for(const fx of e.effects.pool){if(this.flash.length>=4)break;if(!fx.active||fx.age>.26||!['blast','heal'].includes(fx.kind))continue;const power=Math.round((1-fx.age/.26)*5)/5;this.flash.push({x:fx.x,y:fx.y,height:30,radius:Math.max(100,fx.radius*1.8),color:fx.kind==='heal'?'#bde7af':'#ffc58b',strength:power*.6});flashKey+=fx.seed+'/'+power;}
  }
  const key=context+'/'+revision+'/'+flashKey;
  this.render(this.slots[0],e.player,e.time,this.rooms,this.casters,this.flash,key);
  if(this.slots[1]&&partner)this.render(this.slots[1],partner.player,e.time,this.rooms,this.casters,this.flash,key);
 }
 paintStreet(e:NeighborhoodEngine){
  if(!this.enabled)return;
  this.floors=undefined;
  const key='street/'+e.progress.missions.lights.steps;
  if(this.context!==key){this.context=key;const lights:ActorEmitter[]=this.night?NEIGHBORHOOD_LAMPS.filter(l=>neighborhoodLampOn(l.id,e.progress)).map(l=>({...l,height:l.variant===2?46:147,radius:l.variant===2?155:260,color:'#ffda9a',strength:.68})):[];this.rooms=[{room:{x:-100,y:0,w:5000,h:2100},lights}];this.casters=NEIGHBORHOOD_SOLIDS;}
  this.render(this.slots[0],e.player,e.time,this.rooms,this.casters,[],key,!this.night);
 }
}
