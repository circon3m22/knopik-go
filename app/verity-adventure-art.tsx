/** A round 32×32 pixel sphere. Colors are quantized; every contour uses integer pixel runs. */
const PALETTE=['#594126','#8b6028','#bf8b2d','#e4b638','#f6d24b','#ffe36a','#fff09b'];
function sphere(){const runs=new Map<string,string>();for(let y=0;y<32;y++){let x=0;while(x<32){const color=(x:number,y:number)=>{const nx=(x+.5-16)/16,ny=(y+.5-16)/16,r=nx*nx+ny*ny;if(r>1)return '';if(r>.91)return PALETTE[0];if(r>.82)return PALETTE[1];const z=Math.sqrt(1-r),light=-nx*.45-ny*.6+z*.6;return PALETTE[Math.max(2,Math.min(6,Math.floor(light*3.6)+3))];};const c=color(x,y);if(!c){x++;continue;}let end=x+1;while(end<32&&color(end,y)===c)end++;runs.set(c,(runs.get(c)??'')+`M${x*2-32} ${y*2-78}h${(end-x)*2}v2h-${(end-x)*2}Z`);x=end;}}return [...runs].map(([fill,d])=>({fill,d}));}
const SPHERE=sphere();
export function AdventureVerity(){return <g data-verity="" shapeRendering="crispEdges">
 <path d="M-16-5h32v2h8v4h-8v2h-32V1h-8v-4h8Z" fill="#121b2c" opacity=".4"/>
 <g data-verity-roll="">
  <g data-verity-sphere="" data-pixel-diameter="64">{SPHERE.map(({fill,d})=><path key={fill} fill={fill} d={d}/>)}</g>
  <path d="M-18-68h20v2h-20Zm-6 4h10v2h-10Z" fill="#fff3ac"/>
  <g data-verity-face="">
   <g data-verity-eyes=""><path d="M-14-58h4v2h2v10h-2v2h-4v-2h-2v-10h2Zm24 0h4v2h2v10h-2v2h-4v-2H8v-10h2Z" fill="#292936"/></g>
   <path d="M-22-42h4v6h4v4h6v2H8v-2h6v-4h4v-6h4v8h-4v4h-6v4h-24v-4h-6v-4h-4Z" fill="#292936"/>
  </g>
 </g>
 <g data-verity-glitch="" display="none" fill="#88f6df"><path d="M-35-62h16v3h-16Zm43 18h30v3H8Zm-28 28h12v3h-12Z"/><path d="M17-70h21v3H17Zm-59 28h15v3h-15Z" fill="#fca3b8"/></g>
</g>;}
