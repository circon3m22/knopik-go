import type {AdventureEngine} from './adventure-engine';
import {lightVisibilityPath} from './ultra-light-geometry';
import {ultraAtmospherePaths} from './ultra-room-art';
const set=(n:Element|null,k:string,v:string)=>{if(n&&n.getAttribute(k)!==v)n.setAttribute(k,v);};
export class UltraSceneRenderer{
 private atmospheres;private clips;private shadows;private revision=-1;private level:AdventureEngine['levelData']|null=null;
 constructor(private svg:SVGSVGElement){
  this.atmospheres=Array.from(svg.querySelectorAll('[data-ultra-atmosphere]')).map(node=>({node,zone:+node.getAttribute('data-ultra-atmosphere')!,r:{x:+node.getAttribute('data-x')!,y:+node.getAttribute('data-y')!,w:+node.getAttribute('data-w')!,h:+node.getAttribute('data-h')!},frame:-1,motes:node.querySelector('[data-ultra-motes]'),drift:node.querySelector('[data-ultra-drift]')}));
  this.clips=Array.from(svg.querySelectorAll('[data-ultra-light-clip]')).map(node=>({node,room:+node.getAttribute('data-ultra-light-clip')!,x:+node.getAttribute('data-light-x')!,y:+node.getAttribute('data-light-y')!,radius:+node.getAttribute('data-light-radius')!}));
  this.shadows=Array.from(svg.querySelectorAll('[data-ultra-caster]')).map(node=>({node,index:+node.getAttribute('data-ultra-caster')!}));
 }
 paint(engine:AdventureEngine,reduced:boolean){
  if(!this.atmospheres.length&&!this.clips.length)return;
  if(engine.area==='sewer'&&engine.dungeon&&(this.revision!==engine.dungeon.geometryRevision||this.level!==engine.levelData)){
   this.level=engine.levelData;this.revision=engine.dungeon.geometryRevision;const casters=engine.levelData.solids.filter((_,i)=>!engine.dungeon!.destroyed[i]);
   for(const c of this.clips){const room=engine.levelData.rooms[c.room];if(room)set(c.node,'d',lightVisibilityPath(c,room,casters));}for(const s of this.shadows)set(s.node,'display',engine.dungeon.destroyed[s.index]?'none':'inline');
  }
  const frame=reduced?0:Math.floor(engine.time*24),time=frame/24,[cx,cy,cw,ch]=(this.svg.getAttribute('viewBox')??'0 0 480 520').split(' ').map(Number);
  for(const a of this.atmospheres){const visible=a.node.getAttribute('display')!=='none'&&a.r.x+a.r.w>cx&&a.r.x<cx+cw&&(a.r.y+a.r.h)*.82>cy&&a.r.y*.82<cy+ch;if(!visible){a.frame=-1;continue;}if(a.frame===frame)continue;a.frame=frame;const paths=ultraAtmospherePaths(a.zone,a.r,time);set(a.motes,'d',paths.motes);set(a.drift,'d',paths.drift);}
 }
}
