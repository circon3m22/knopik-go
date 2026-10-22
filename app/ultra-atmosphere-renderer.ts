import {setSvgAttribute as set} from './svg-attribute.ts';
import {projectAdventureY} from './adventure-projection.ts';
type Camera={x:number;y:number;w:number;h:number};
/** Runs inside the existing scene frame, at 12 Hz, with no timers or new nodes. */
export class UltraAtmosphereRenderer{
 private patches:{root:Element;body:Element|null;x:number;y:number;w:number;h:number;stamp:number}[];
 constructor(svg:Element){this.patches=Array.from(svg.querySelectorAll('[data-ultra-air-patch]')).map(root=>({root,body:root.querySelector('[data-ultra-air-drift]'),x:Number(root.getAttribute('data-air-x')),y:projectAdventureY(Number(root.getAttribute('data-air-y'))),w:Number(root.getAttribute('data-air-w')),h:projectAdventureY(Number(root.getAttribute('data-air-h'))),stamp:-1}));}
 get enabled(){return this.patches.length>0;}
 paint(time:number,camera:Camera,reduced=false){
  const stamp=reduced?0:Math.floor(time*12),clock=stamp/12;
  for(let i=0;i<this.patches.length;i++){
   const p=this.patches[i],visible=p.x+p.w>camera.x-80&&p.x<camera.x+camera.w+80&&p.y+p.h>camera.y-80&&p.y<camera.y+camera.h+80;
   set(p.root,'display',visible?'inline':'none');if(!visible||p.stamp===stamp)continue;p.stamp=stamp;
   set(p.body,'transform',`translate(${(Math.sin(clock*.47+i)*3).toFixed(1)} ${(Math.sin(clock*.31+i*2)*2).toFixed(1)})`);
   set(p.body,'opacity',reduced?'.45':(.38+Math.sin(clock*.61+i)*.12).toFixed(2));
  }
 }
}
