import {getVisualProfile} from './graphics-quality';
import {projectAdventureY} from './adventure-projection';
import {CITY_LIFE_ACTORS,cityLifePose} from './neighborhood-city-life';
import type {NeighborhoodEngine} from './neighborhood-engine';
const set=(n:Element|null,k:string,v:string)=>{if(n&&n.getAttribute(k)!==v)n.setAttribute(k,v);};
/** Uses the scene's existing simulation time. No RAF, timers, per-particle objects or DOM
 * allocation in flight; hidden actors receive neither pose nor wind writes. */
export class CityLifeRenderer{
 private actors;private trees;private windFrame=-1;private playerX=NaN;private playerY=NaN;
 constructor(svg:SVGSVGElement){
  const catalog=new Map(CITY_LIFE_ACTORS.map(a=>[a.id,a]));
  this.actors=Array.from(svg.querySelectorAll('[data-city-life]')).flatMap(node=>{const a=catalog.get(node.getAttribute('data-city-life')??'');return a?[{a,node,frame:-1,pose:cityLifePose(a,0,{x:-10000,y:-10000}),body:node.querySelector('[data-life-body]'),wing:node.querySelector('[data-life-wing]'),wake:node.querySelector('[data-life-wake]'),drops:node.querySelector('[data-life-drops]')}]:[];});
  this.trees=[...Array.from(svg.querySelectorAll('[data-world-object]')),...Array.from(svg.querySelectorAll('[data-city-backdrop]'))].flatMap((node,i)=>{const crown=node.querySelector('[data-tree-crown]');return crown?[{node,crown,seed:i}]:[];});
 }
 paint(engine:NeighborhoodEngine,reduced:boolean,camera:{x:number;y:number},width:number,height:number){
  const detail=getVisualProfile().detail,rate=detail<=1?12:detail===2?18:24,frame=reduced?0:Math.floor(engine.time*rate),time=frame/rate,playerChanged=engine.player.x!==this.playerX||engine.player.y!==this.playerY;
  for(const actor of this.actors){const{a,node}=actor,range=a.kind==='boat'?930:90,top=a.kind==='smoke'?540:a.kind==='pennant'?155:125,py=projectAdventureY(a.y);
   if(a.x+range<camera.x-30||a.x-range>camera.x+width+30||py+35<camera.y||py-projectAdventureY(top)>camera.y+height){set(node,'display','none');actor.frame=-1;continue;}
   const update=actor.frame!==frame||a.kind==='pigeon'&&playerChanged;if(update)actor.pose=cityLifePose(a,time,engine.player,reduced);const p=actor.pose;
   const sx=p.x,sy=projectAdventureY(p.y-p.lift),r=a.kind==='boat'?105:a.kind==='fountain'?95:a.kind==='pennant'?80:40,up=a.kind==='pennant'?170:a.kind==='fountain'?110:35;
   const visible=sx+r>camera.x&&sx-r<camera.x+width&&sy+20>camera.y&&sy-projectAdventureY(up)<camera.y+height;
   set(node,'display',visible?'inline':'none');if(!visible){actor.frame=-1;continue;}if(!update)continue;actor.frame=frame;
   set(node,'transform',`translate(${p.x.toFixed(1)} ${projectAdventureY(p.y).toFixed(1)})`);set(node,'data-depth',(p.y+.4).toFixed(2));
   set(actor.body,'transform',`translate(0 ${(-p.lift).toFixed(1)}) scale(${p.turn} 1) rotate(${p.tilt.toFixed(1)})`);
   if(a.kind==='smoke'||a.kind==='steam'||a.kind==='butterfly')set(actor.body,'opacity',p.alpha.toFixed(2));
   if(a.kind==='pigeon')set(actor.wing,'transform',`rotate(${p.wing.toFixed(1)} -5 -8)`);
   if(a.kind==='butterfly')set(actor.wing,'transform',`scale(${Math.max(.18,Math.abs(p.wing)).toFixed(2)} 1)`);
   if(actor.wake){set(actor.wake,'transform',`scale(${p.turn} 1) translate(${(p.phase*4).toFixed(1)} 0)`);set(actor.wake,'opacity',(.65-p.phase*.3).toFixed(2));}
   if(actor.drops){const drops:string[]=[];for(let i=0;i<(detail>=3?18:8);i++){const t=(p.phase+i/18)%1,x=Math.round((i%2?1:-1)*(8+t*32+(i%3)*5)),y=Math.round(-96+88*t*t-(i%3)*3);drops.push(`M${x} ${y}h2v3h-2Z`);}set(actor.drops,'d',drops.join(''));}
  }
  this.playerX=engine.player.x;this.playerY=engine.player.y;
  if(this.windFrame!==frame){this.windFrame=frame;for(const t of this.trees){if(t.node.getAttribute('display')==='none')continue;set(t.crown,'transform',reduced||detail<2?'':`translate(${Math.round(Math.sin(time*.9+t.seed*.61)*1.4)} 0)`);}}
 }
}
