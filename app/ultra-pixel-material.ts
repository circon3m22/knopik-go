/** Small seamless height/albedo tiles, lit once and row-batched into a fixed
 * palette. Normal gradients, cavity AO and roughness affect paint, not physics. */
export type PixelMaterial='stone'|'brick'|'wood'|'metal'|'porcelain'|'crystal'|'moss'|'asphalt'|'plaster';
export type MaterialPalette={base:string;dark:string;light:string;accent:string};
type Layer={fill:string;d:string};
const SIZE=64,CACHE_LIMIT=48,cache=new Map<string,readonly Layer[]>();
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const rgb=(hex:string)=>{const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
const color=(a:number[],b:number[],t:number)=>'#'+a.map((v,i)=>Math.round(clamp(v+(b[i]-v)*t,0,255)).toString(16).padStart(2,'0')).join('');
const noise=(x:number,y:number,seed:number)=>{let n=Math.imul(x+seed*101,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
export const ultraMaterialCacheSize=()=>cache.size;
export function pixelMaterialLayers(kind:PixelMaterial,p:MaterialPalette,seed=0):readonly Layer[]{
 const key=[kind,p.base,p.dark,p.light,p.accent,seed].join('/'),existing=cache.get(key);if(existing)return existing;
 const heights=new Float32Array(SIZE*SIZE),tone=new Uint8Array(SIZE*SIZE),wet=new Uint8Array(SIZE*SIZE);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const i=y*SIZE+x,row=Math.floor(y/16),xx=(x+(row%2)*16)%32,yy=y%16,hash=noise(Math.floor((x+row%2*16)/32)%2,row,seed),grain=noise(x,y,seed),edge=Math.min(xx,31-xx,yy,15-yy);
  let h=0,t=hash%3;
  if(kind==='plaster'){h=2+(grain%5)*.025;t=grain%61===0?1:0;}
  else if(kind==='wood'){const u=y%16;h=u<1?0:3+Math.sin(x*.16+row*2)*.22;const line=Math.round(4+Math.sin(x*.13+row)*2);if(u===line||u===line+6)h-=.7;t=(hash%2)+(u===line?1:0);}
  else if(kind==='metal'){const seam=x%32===0||y%32===0,ridge=(x+y*2)%16<3;h=seam?0:ridge?4:2.5;t=seam?2:0;wet[i]=1;}
  else if(kind==='asphalt'){h=1+(grain%7)*.15;t=grain%19===0?2:grain%5===0?1:0;if((x*3+y*5)%101<2)h=0;}
  else if(kind==='porcelain'||kind==='crystal'){const e=Math.min(x%32,31-x%32,y%32,31-y%32);h=e<1?0:Math.min(3,e)*.8;t=kind==='crystal'?Math.floor((x+y)/16)%3:hash%2;wet[i]=1;}
  else{h=edge<1?0:Math.min(3,edge)+((hash>>>3)%5)*.17;if(edge>2&&grain%37===0)h-=.8;t=hash%3;if(kind==='brick'){h=Math.min(2.6,h);t=(hash%3);}
   // Low-frequency growth follows joints; avoid an identical circular stamp
   // in every repeated tile. Stone chips remain sparse, rather than puddles.
   if(kind==='moss'&&noise(Math.floor(x/5),Math.floor(y/5),seed)%11<4&&(edge<5||grain%5===0)){t=3;h+=.6;}
   if(kind==='stone'&&edge>3&&grain%101===0){h-=.65;t=1;}
  }
  heights[i]=h;tone[i]=t;
 }
 const base=rgb(p.base),dark=rgb(p.dark),light=rgb(p.light),accent=rgb(p.accent),ramps=Array.from({length:4},(_,t)=>Array.from({length:9},(_,l)=>{const foundation=t===3?rgb('#527663'):t===2?base.map(v=>v*.88):t===1?base.map((v,i)=>v*.88+accent[i]*.12):base;return l<4?color(dark,foundation,.38+l*.155):color(foundation,light,(l-4)*.13);}));
 const batches=new Map<string,string>();
 const height=(x:number,y:number)=>heights[((y+SIZE)%SIZE)*SIZE+(x+SIZE)%SIZE];
 for(let y=0;y<SIZE;y++){
  let start=0,previous='';
  for(let x=0;x<=SIZE;x++){
   let fill='';if(x<SIZE){const i=y*SIZE+x,dx=(height(x-1,y)-height(x+1,y))*.42,dy=(height(x,y-1)-height(x,y+1))*.42,norm=Math.hypot(dx,dy,1),diffuse=Math.max(0,(-dx*.5-dy*.65+.7)/norm),cavity=Math.max(0,(height(x-1,y)+height(x+1,y)+height(x,y-1)+height(x,y+1))/4-heights[i])*.12;
    const spec=wet[i]?Math.pow(clamp((-.25*dx-.38*dy+.89)/norm),kind==='metal'?18:9)*.23:0;
    const value=clamp(.19+diffuse*.7+spec-cavity),dither=(bayer[(x%4)+(y%4)*4]/16-.5)*.045,level=Math.round(clamp(value+dither)*8);fill=ramps[tone[i]][level];
   }
   if(x&&fill!==previous){const span=x-start;batches.set(previous,(batches.get(previous)??'')+`M${start} ${y}h${span}v1h-${span}Z`);start=x;}previous=fill;
  }
 }
 const layers=Object.freeze([...batches].map(([fill,d])=>Object.freeze({fill,d})));if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value!);cache.set(key,layers);return layers;
}
