import type {AdventureEngine} from './adventure-engine';
import {setSvgAttribute as set} from './svg-attribute.ts';
import {lightVisibility,lightPolygon} from './ultra-light-geometry.ts';
import {firearmMuzzle,isFirearm} from './dungeon-aim.ts';
import {HOME_ROOMS,HOME_SOLIDS} from './apartment-world.ts';
import {getVisualProfile} from './graphics-quality.ts';
type Slot={root:Element;body:Element|null;halo:Element|null;core:Element|null;clip:Element|null;key:string};
/** Rare light visibility bakes on emission; fading reuses six nodes and the game clock. */
export class UltraEventLightRenderer{
 private slots:Slot[];
 constructor(svg:Element){this.slots=Array.from(svg.querySelectorAll('[data-ultra-event-light]')).map(root=>({root,body:root.querySelector('[data-ultra-event-body]'),halo:root.querySelector('[data-ultra-event-halo]'),core:root.querySelector('[data-ultra-event-core]'),clip:root.querySelector('[data-ultra-event-clip]'),key:''}));}
 paint(engine:AdventureEngine,angle:number,reduced=false){
  if(!this.slots.length)return;
  if(getVisualProfile().detail!==4){for(const s of this.slots)set(s.root,'display','none');return;}
  let used=0;
  const emit=(x:number,y:number,radius:number,power:number,tint:'warm'|'cold'|'heal',identity:string)=>{
   if(used>=this.slots.length||power<=0)return;
   const rooms=engine.area==='apartment'?HOME_ROOMS:engine.levelData.floors,room=rooms.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(!room)return;
   const slot=this.slots[used++],key=`${engine.level}/${identity}/${Math.round(x/8)}/${Math.round(y/8)}/${engine.dungeon?.geometryRevision??0}/${engine.area}`;
   if(slot.key!==key){slot.key=key;const casters=engine.area==='apartment'?HOME_SOLIDS:engine.levelData.solids.filter((_,i)=>!engine.dungeon?.destroyed[i]);set(slot.clip,'d',lightPolygon(lightVisibility({x,y,radius,color:'#fff',strength:1},room,casters)));}
   set(slot.root,'display','inline');set(slot.root,'data-event-kind',identity.split('/')[0]);set(slot.root,'opacity',(Math.min(reduced?.12:.72,power)).toFixed(3));
   set(slot.body,'transform',`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(radius/96).toFixed(2)})`);set(slot.halo,'fill',slot.halo?.getAttribute(`data-light-${tint}`)??'#ffd79b');set(slot.core,'fill',tint==='cold'?'#c8f3fa':tint==='heal'?'#dbf5cb':'#fff0c5');
  };
  if(!reduced&&engine.area==='sewer'&&engine.weapon!=='crossbow'&&isFirearm(engine.weapon)&&engine.punchTime>.12){const m=firearmMuzzle(engine,angle);if(!m.blocked)emit(m.x,m.y,engine.weapon==='shotgun'?112:88,(engine.punchTime-.12)/.08,'warm',`muzzle/${engine.punchSerial}`);}
  for(const kind of ['blast','spark','heal'])for(const e of engine.effects.pool){if(!e.active||e.kind!==kind||e.age>(kind==='blast'?.38:.24)||reduced&&kind==='spark')continue;const duration=kind==='blast'?.38:.24;emit(e.x,e.y,Math.min(190,Math.max(58,e.radius*1.65)),(1-e.age/duration)*(kind==='blast'?.65:.3),kind==='heal'?'heal':'warm',`${kind}/${e.seed}`);}
  for(let i=0;i<engine.effects.links.length&&used<this.slots.length;i++){const a=engine.effects.links[i];if(a.active)emit((a.x+a.tx)/2,(a.y+a.ty)/2,92,(1-a.age/.23)*.34,'cold',`arc/${i}/${a.x}/${a.tx}`);}
  for(let i=used;i<this.slots.length;i++)set(this.slots[i].root,'display','none');
 }
}
