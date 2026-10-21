import type {DungeonEffectKind} from './dungeon-runtime';
/** Fixed, seeded ballistic paths. Hot core, cooling sparks and grounded debris
 * use separate palette layers; no growing particle arrays or full-screen glow. */
export function ultraCombatPaths(kind:DungeonEffectKind,age:number,radius:number,seed:number,reduced=false){
 const t=reduced?Math.min(age,.12):age;let hot='',sparks='',smoke='',ground='';
 const box=(x:number,y:number,w:number,h:number)=>`M${Math.round(x)} ${Math.round(y)}h${w}v${h}h-${w}Z`;
 if(kind==='blast'||kind==='hit'||kind==='spark'){
  const life=kind==='blast'?1.05:.32,n=kind==='blast'?16:10,speed=kind==='blast'?radius*2:85;
  for(let i=0;i<n;i++){const a=i*2.399+seed*.71,travel=Math.min(t,.6),x=Math.cos(a)*speed*travel,y=Math.sin(a)*speed*travel*.65+travel*travel*110-18*Math.sin(travel*4),size=t<.12?3:i%3?2:4;
   if(t<life*.65)sparks+=box(x,y,size,Math.max(1,size-1));if(kind==='blast'&&t>.09){ground+=box(x,y+12,Math.max(2,4-i%3),2);smoke+=box(x*.35-5,y*.25-t*28,8+i%3*3,6+i%2*4);}
  }
  if(t<.13){const r=Math.max(4,radius*(.15+t*3));hot=`M-${Math.round(r)}-3h${Math.round(r*2)}v6h-${Math.round(r*2)}ZM-3-${Math.round(r*.7)}h6v${Math.round(r*1.4)}h-6Z`;}
  if(kind==='blast'&&t<.4){const ring=(r:number)=>{const c=Math.round(r*.34);return `M-${r-c}-${r}h${(r-c)*2}l${c} ${c}v${(r-c)*2}l-${c} ${c}h-${(r-c)*2}l-${c}-${c}v-${(r-c)*2}Z`;};const r=Math.round(8+radius*t*3);ground+=ring(r)+ring(Math.max(2,r-2));}
 }else if(kind==='dash'){for(let i=0;i<7;i++){const x=-24+i*7+Math.sin(seed+i)*t*24,y=i%2*4-t*12;smoke+=box(x,y,7+i%3*3,4+i%2*3);ground+=box(x-2,y+8,5,1);}}
 else if(kind==='heal'){for(let i=0;i<5;i++){const x=-19+i*9,y=-t*55+(i%2)*12;hot+=box(x-1,y-4,3,9)+box(x-4,y-1,9,3);}}
 else if(kind==='shell'){const x=12+t*30,y=t*t*56-Math.sin(t/.8*Math.PI)*24;sparks+=box(x,y,5,2);ground+=box(x,y+4,6,1);}
 return {hot,sparks,smoke,ground,opacity:Math.max(0,1-age/(kind==='blast'?1.05:kind==='shell'?.8:kind==='heal'?.65:.32))};
}
