type Rect={x:number;y:number;w:number;h:number};
type Cell={floors:Rect[];solids:{rect:Rect;index:number}[]};
const SIZE=192,PADDING=64;
/** Broad phase only. The original eight-point floor and circle/rectangle checks remain exact. */
export class WorldCollisionIndex{
 private cells=new Map<string,Cell>();
 private lastX=NaN;private lastY=NaN;private lastCell:Cell|undefined;
 constructor(floors:readonly Rect[],solids:readonly Rect[]){
  const put=(r:Rect,index:number,floor:boolean)=>{
   for(let y=Math.floor((r.y-PADDING)/SIZE);y<=Math.floor((r.y+r.h+PADDING)/SIZE);y++)for(let x=Math.floor((r.x-PADDING)/SIZE);x<=Math.floor((r.x+r.w+PADDING)/SIZE);x++){
    const key=`${x}:${y}`;let cell=this.cells.get(key);if(!cell){cell={floors:[],solids:[]};this.cells.set(key,cell);}
    if(floor)cell.floors.push(r);else cell.solids.push({rect:r,index});
   }
  };floors.forEach((r,i)=>put(r,i,true));solids.forEach((r,i)=>put(r,i,false));
 }
 at(x:number,y:number){
  const cx=Math.floor(x/SIZE),cy=Math.floor(y/SIZE);
  if(cx===this.lastX&&cy===this.lastY)return this.lastCell;
  this.lastX=cx;this.lastY=cy;this.lastCell=this.cells.get(`${cx}:${cy}`);return this.lastCell;
 }
}
