export type NavigationPoint={x:number;y:number};
type Bounds=NavigationPoint&{w:number;h:number};
type Plan={points:NavigationPoint[];index:number;nextAt:number;blocked:number};
const CELL=28,MAX_CELLS=4096;
const NEIGHBOURS=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]] as const;
/** One bounded grid for the active room. Searches are staggered, never run for sleeping rooms. */
export class SahurNavigation {
  private bounds:Bounds={x:0,y:0,w:1,h:1};
  private key="";
  private plans=new Map<number,Plan>();
  private planned=0;
  private ready=false;
  private cols=0;
  private rows=0;
  private walkable=new Uint8Array(0);
  private costs=new Float64Array(0);
  private parents=new Int32Array(0);
  private closed=new Uint8Array(0);
  searches=0;
  builds=0;
  private canStand:(x:number,y:number)=>boolean;
  constructor(canStand:(x:number,y:number)=>boolean){this.canStand=canStand;}
  reset(){this.key="";this.plans.clear();this.ready=false;}
  beginStep(bounds:Bounds,key:string){
    this.planned=0;
    if(key!==this.key){this.key=key;this.bounds=bounds;this.ready=false;this.plans.clear();}
  }
  private x(i:number){return this.bounds.x+18+i%this.cols*CELL;}
  private y(i:number){return this.bounds.y+18+Math.floor(i/this.cols)*CELL;}
  private point(i:number):NavigationPoint{return {x:this.x(i),y:this.y(i)};}
  private clear(x:number,y:number){return this.canStand(x,y)&&this.canStand(x-2,y)&&this.canStand(x+2,y)&&this.canStand(x,y-2)&&this.canStand(x,y+2);}
  private line(a:NavigationPoint,b:NavigationPoint){
    const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6);
    for(let i=1;i<=n;i++)if(!this.clear(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
    return true;
  }
  private build(){
    this.cols=Math.max(1,Math.floor((this.bounds.w-36)/CELL)+1);
    this.rows=Math.max(1,Math.floor((this.bounds.h-36)/CELL)+1);
    const n=this.cols*this.rows;if(n>MAX_CELLS)return false;
    if(this.walkable.length!==n){this.walkable=new Uint8Array(n);this.costs=new Float64Array(n);this.parents=new Int32Array(n);this.closed=new Uint8Array(n);}
    for(let i=0;i<n;i++)this.walkable[i]=this.clear(this.x(i),this.y(i))?1:0;
    this.ready=true;this.builds++;return true;
  }
  private nearest(p:NavigationPoint,join:boolean){
    const cx=Math.max(0,Math.min(this.cols-1,Math.round((p.x-this.bounds.x-18)/CELL))),cy=Math.max(0,Math.min(this.rows-1,Math.round((p.y-this.bounds.y-18)/CELL)));
    let best=-1,score=Infinity;
    for(let radius=0;radius<=4;radius++){
      for(let y=Math.max(0,cy-radius);y<=Math.min(this.rows-1,cy+radius);y++)for(let x=Math.max(0,cx-radius);x<=Math.min(this.cols-1,cx+radius);x++){
        const i=y*this.cols+x;if(!this.walkable[i])continue;
        const d=(p.x-this.x(i))**2+(p.y-this.y(i))**2;
        if(d<score&&(!join||this.line(p,this.point(i)))){best=i;score=d;}
      }
      if(best>=0)return best;
    }
    return best;
  }
  private path(id:number,from:NavigationPoint,goal:NavigationPoint,crowd:readonly NavigationPoint[]){
    if(!this.ready&&!this.build())return [];
    const start=this.nearest(from,true),end=this.nearest(goal,false);if(start<0||end<0)return [];
    this.searches++;this.costs.fill(Infinity);this.parents.fill(-1);this.closed.fill(0);this.costs[start]=0;
    const heap:number[]=[],priorities:number[]=[];
    const push=(node:number,priority:number)=>{let i=heap.length;heap.push(node);priorities.push(priority);while(i>0){const parent=(i-1)>>1;if(priorities[parent]<=priority)break;heap[i]=heap[parent];priorities[i]=priorities[parent];i=parent;}heap[i]=node;priorities[i]=priority;};
    const pop=()=>{const first=heap[0],node=heap.pop()!,priority=priorities.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&priorities[child+1]<priorities[child])child++;if(priority<=priorities[child])break;heap[i]=heap[child];priorities[i]=priorities[child];i=child;}heap[i]=node;priorities[i]=priority;}return first;};
    push(start,0);let found=false,visits=0;
    while(heap.length&&visits++<MAX_CELLS*2){
      const i=pop();if(this.closed[i])continue;if(i===end){found=true;break;}this.closed[i]=1;
      const cx=i%this.cols,cy=Math.floor(i/this.cols);
      for(let order=0;order<8;order++){
        const [dx,dy]=NEIGHBOURS[(order+(id%2?2:0))%8],x=cx+dx,y=cy+dy;
        if(x<0||y<0||x>=this.cols||y>=this.rows)continue;
        const next=y*this.cols+x;if(!this.walkable[next]||this.closed[next])continue;
        if(dx&&dy&&(!this.walkable[cy*this.cols+x]||!this.walkable[y*this.cols+cx]||!this.clear((this.x(i)+this.x(next))/2,(this.y(i)+this.y(next))/2)))continue;
        let traffic=0;for(const other of crowd){const d=Math.hypot(other.x-this.x(next),other.y-this.y(next));if(d<56)traffic+=(1-d/56)*.45;}
        const cost=this.costs[i]+(dx&&dy?Math.SQRT2:1)+traffic;
        if(cost>=this.costs[next])continue;this.costs[next]=cost;this.parents[next]=i;
        push(next,cost+Math.hypot(x-end%this.cols,y-Math.floor(end/this.cols)));
      }
    }
    if(!found)return [];
    const chain:number[]=[];for(let at=end;at>=0;at=this.parents[at]){chain.push(at);if(at===start)break;}chain.reverse();
    const points:NavigationPoint[]=[];let anchor=from,index=0;
    while(index<chain.length){let far=index;for(let look=index+1;look<Math.min(chain.length,index+9);look++){if(!this.line(anchor,this.point(chain[look])))break;far=look;}const point=this.point(chain[far]);points.push(point);anchor=point;index=far+1;}
    if(this.canStand(goal.x,goal.y)&&this.line(anchor,goal))points.push({...goal});return points;
  }
  waypoint(id:number,from:NavigationPoint,goal:NavigationPoint,time:number,crowd:readonly NavigationPoint[]):NavigationPoint {
    let plan=this.plans.get(id);
    if((!plan||time>=plan.nextAt)&&this.planned<2){
      this.planned++;
      const points=this.canStand(goal.x,goal.y)&&this.line(from,goal)?[{...goal}]:this.path(id,from,goal,crowd);
      plan={points,index:0,nextAt:time+.46+(id%5)*.055,blocked:0};this.plans.set(id,plan);
    }
    if(!plan||!plan.points.length)return from;
    while(plan.index<plan.points.length-1&&Math.hypot(from.x-plan.points[plan.index].x,from.y-plan.points[plan.index].y)<2.5)plan.index++;
    return plan.points[plan.index];
  }
  moved(id:number,distance:number,dt:number){const plan=this.plans.get(id);if(!plan)return;plan.blocked=distance<.15?plan.blocked+dt:0;if(plan.blocked>.22)plan.nextAt=0;}
}
