/** Seeded connected room graph with branches and optional loops. All edges
 * stay cardinal; the exit is a farthest room, never an isolated cell. */
export function dungeonRandom(seed:number){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function generateRoomGraph(seed:number,count=8){
 const random=dungeonRandom(seed),grid:[number,number][]=[[0,0]],links:[number,number][]=[],occupied=new Set(['0,0']);
 const directions=[[1,0],[0,1],[-1,0],[0,-1]];
 for(let i=1;i<Math.max(3,Math.min(16,Math.floor(count)));i++){
  const choices=grid.flatMap(([x,y],from)=>directions.filter(([dx,dy])=>!occupied.has(`${x+dx},${y+dy}`)).map(([dx,dy])=>({from,x:x+dx,y:y+dy})));
  const pick=choices[Math.floor(random()*choices.length)];grid.push([pick.x,pick.y]);occupied.add(`${pick.x},${pick.y}`);links.push([pick.from,i]);
 }
 for(let a=0;a<grid.length;a++)for(let b=a+1;b<grid.length;b++)if(Math.abs(grid[a][0]-grid[b][0])+Math.abs(grid[a][1]-grid[b][1])===1&&!links.some(([x,y])=>x===a&&y===b)&&random()<.42)links.push([a,b]);
 const distances=grid.map(()=>Infinity);distances[0]=0;const queue=[0];
 for(let i=0;i<queue.length;i++)for(const [a,b]of links){const next=a===queue[i]?b:b===queue[i]?a:-1;if(next>=0&&distances[next]===Infinity){distances[next]=distances[queue[i]]+1;queue.push(next);}}
 const exit=distances.indexOf(Math.max(...distances));return {grid,links,exit};
}
