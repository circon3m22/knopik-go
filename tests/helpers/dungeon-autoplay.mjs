import {isFirearm} from "../../app/dungeon-aim.ts";
import {AdventureEngine,ADVENTURE_STEP} from '../../app/adventure-engine.ts';
import {ADVENTURE_WEAPONS,dungeonZone} from '../../app/adventure-levels.ts';
import {purchaseShelfBuff} from '../../app/buff-shelf-engine.ts';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
class Heap{
 list=[];
 push(item){this.list.push(item);let i=this.list.length-1;while(i){const p=(i-1)>>1;if(this.list[p].score<=item.score)break;this.list[i]=this.list[p];i=p;}this.list[i]=item;}
 pop(){const first=this.list[0],end=this.list.pop();if(this.list.length){let i=0;while(i*2+1<this.list.length){let c=i*2+1;if(c+1<this.list.length&&this.list[c+1].score<this.list[c].score)c++;if(this.list[c].score>=end.score)break;this.list[i]=this.list[c];i=c;}this.list[i]=end;}return first;}
}
/** Read-only path planning; actual travel uses the game's ordinary 60 Hz input. */
export function dungeonPath(e,goal,radius=37,los=false,step=24){
 const origin=e.levelData.bounds.x+12,w=Math.ceil(e.levelData.bounds.w/step),h=Math.ceil(e.levelData.height/step),point=i=>({x:origin+i%w*step,y:12+Math.floor(i/w)*step});
 const sx=Math.round((e.player.x-origin)/step),sy=Math.round((e.player.y-12)/step);let start=-1,nearest=Infinity;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=sx+dx,y=sy+dy,i=y*w+x;if(x<0||x>=w||y<0||y>=h)continue;const p=point(i),d=dist(p,e.player);if(d<nearest&&e.canStand(p.x,p.y)){start=i;nearest=d;}}
 if(start<0)return [];
 const danger=p=>e.levelData.hazards.some(h=>p.x>h.x-15&&p.x<h.x+h.w+15&&p.y>h.y-15&&p.y<h.y+h.h+15);
 const costs=new Float64Array(w*h).fill(Infinity),parents=new Int32Array(w*h).fill(-2),queue=new Heap();costs[start]=0;parents[start]=-1;queue.push({id:start,score:dist(point(start),goal)});let finish=-1,best=start,close=Infinity,visited=0;
 while(queue.list.length&&visited++<w*h*2){const {id}=queue.pop(),p=point(id),d=dist(p,goal);if(d<close){close=d;best=id;}if(d<radius&&!danger(p)&&(!los||e.lineClear(p,goal))){finish=id;break;}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=id%w+dx,y=Math.floor(id/w)+dy,n=y*w+x;if(x<0||x>=w||y<0||y>=h)continue;const q=point(n),cost=costs[id]+Math.hypot(dx,dy)*step+(danger(q)?60:0);if(cost>=costs[n]||!e.canStand(q.x,q.y)||!e.canStand((p.x+q.x)/2,(p.y+q.y)/2))continue;costs[n]=cost;parents[n]=id;queue.push({id:n,score:cost+dist(q,goal)*1.05});}
 }
 if(finish<0)finish=best;const result=[];for(let i=finish;i>=0;i=parents[i])result.unshift(point(i));return result;
}
export function pilotDungeon(e,{maxFrames=50000,onFrame=()=>{}}={}){
 let frames=0,path=[],pathAge=0,signature='',minHp=e.player.hp;const history=[];
 const advance=()=>{e.advance(ADVENTURE_STEP);frames++;minHp=Math.min(minHp,e.player.hp);onFrame(e,frames);if(frames%600===0){history.push({frame:frames,room:e.room,hp:e.player.hp,x:Math.round(e.player.x),y:Math.round(e.player.y),tasks:e.dungeon.tasks.map(t=>[t.done,t.active,Math.round(t.progress)])});if(history.length>8)history.shift();}};
 const desired=e.level<=2?'fist':dungeonZone(e.level).weapon;
 while(e.phase==='playing'&&!e.canFinishLevel&&frames<maxFrames){
  if(e.player.hp<=1)e.heal();
  const enemies=e.enemies.filter(n=>n.awake!==false&&n.hp>0&&n.room===e.room).sort((a,b)=>dist(a,e.player)-dist(b,e.player));
  const near=enemies[0];const weapon=desired==='launcher'&&near&&dist(near,e.player)<120?'sabre':desired;e.selectWeapon(weapon);
  const threat=enemies.find(n=>n.mode==='windup'&&n.timer<.19&&e.lineClear(e.player,n)&&dist(n,e.player)<(n.boss?190:n.role==='charger'?230:n.kind==='bat'?95:390));
  const bullet=e.bullets.find(b=>b.active&&b.owner==='enemy'&&b.kind!=='grenade'&&dist({x:b.x+b.vx*.11,y:b.y+b.vy*.11},e.player)<34);
  const grenade=e.bullets.find(b=>b.active&&b.kind==='grenade'&&b.life<.3&&dist({x:b.x+b.vx*b.life,y:b.y+b.vy*b.life},e.player)<(b.splash??80)+15);
  const charge=e.levelData.tasks.find((t,i)=>t.kind==='charge'&&e.dungeon.tasks[i].active&&e.dungeon.tasks[i].blastAt-e.time<.8&&dist(t,e.player)<136);
  const hazard=e.levelData.hazards.find((h,i)=>e.dungeon.hazardPhase(i,e.time)!=='off'&&e.player.x>h.x-12&&e.player.x<h.x+h.w+12&&e.player.y>h.y-15&&e.player.y<h.y+h.h+15);
  let flee=null;
  if(charge)flee={x:e.player.x-charge.x,y:e.player.y-charge.y};
  else if(grenade)flee={x:e.player.x-grenade.x-grenade.vx*grenade.life,y:e.player.y-grenade.y-grenade.vy*grenade.life};
  else if(bullet)flee={x:-bullet.vy,y:bullet.vx};
  else if(hazard)flee=hazard.w>hazard.h?{x:0,y:e.player.y<hazard.y+hazard.h/2?-1:1}:{x:e.player.x<hazard.x+hazard.w/2?-1:1,y:0};
  else if(threat)flee=threat.boss?{x:e.player.x-threat.x,y:e.player.y-threat.y}:{x:-Math.sin(threat.attackAngle),y:Math.cos(threat.attackAngle)};
  if(flee&&e.dodgeCooldown<=0){let n=Math.hypot(flee.x,flee.y);if(n<.1){flee={x:1,y:0};n=1;}if(!e.canStand(e.player.x+flee.x/n*32,e.player.y+flee.y/n*32))flee={x:-flee.x,y:-flee.y};e.setInput(flee.x,flee.y,false);e.dodge();path=[];signature='';advance();continue;}
  if(e.dodgeTime>0){e.setInput(0,0,false);advance();continue;}
  const taskIndex=e.dungeon.goal(),task=taskIndex>=0?e.levelData.tasks[taskIndex]:null,state=taskIndex>=0?e.dungeon.tasks[taskIndex]:null;
  if(task&&e.dungeon.available(taskIndex)&&dist(e.player,task)<64){e.setInput(0,0,false);e.interact();signature='';path=[];advance();continue;}
  const med=e.player.hp<3?e.levelData.medkits.find((k,i)=>e.dungeon.medkits[i]&&k.room===e.room):null;
  let goal=task&&(!state.active||task.kind==='hold')?task:e.levelData.exit,range=41,los=false,key=task?`task${taskIndex}`:'exit';
  const target=enemies.find(n=>e.lineClear(e.player,n))??near;
  if(med&&(!target||e.player.hp===1)){goal=med;range=21;key='med';}
  else if(target){
    const d=dist(e.player,target),r=ADVENTURE_WEAPONS[weapon].range;
    if(d<r-12&&e.lineClear(e.player,target)){
      let dx=0,dy=0;
      if(weapon!=='sabre'&&weapon!=='fist'&&d<110){const a=Math.atan2(e.player.y-target.y,e.player.x-target.x);dx=Math.cos(a);dy=Math.sin(a);}
      if(task?.kind==='hold'&&state?.active&&dist(e.player,task)>175){dx=task.x-e.player.x;dy=task.y-e.player.y;}
      if(isFirearm(weapon)&&e.punchCooldown<=0)e.setInput(target.x-e.player.x,target.y-e.player.y,true);
      else e.setInput(dx,dy,!isFirearm(weapon));advance();continue;
    }
    goal=target;range=weapon==='sabre'?82:weapon==='shotgun'?220:280;range=Math.min(range,r-18);los=true;key=`enemy${target.id}`;
  }
  else if(task?.kind==='hold'&&state?.active&&dist(e.player,task)<155){e.setInput(0,0,false);advance();continue;}
  if(signature!==key||pathAge++>35||!path.length){path=dungeonPath(e,goal,range,los);pathAge=0;signature=key;}
  while(path.length&&dist(e.player,path[0])<(path.length===1&&los&&!e.lineClear(e.player,goal)?.3:7))path.shift();
  if(path.length){const p=path[0],precise=path.length===1&&los&&!e.lineClear(e.player,goal)&&dist(e.player,p)<10;e.setInput((p.x-e.player.x)/(precise?8:1),(p.y-e.player.y)/(precise?8:1),!!near&&!isFirearm(weapon)&&(weapon!=="arc"||dist(e.player,near)<ADVENTURE_WEAPONS.arc.range&&e.lineClear(e.player,near)));}else e.setInput(0,0,!!near&&!isFirearm(weapon)&&(weapon!=="arc"||dist(e.player,near)<ADVENTURE_WEAPONS.arc.range&&e.lineClear(e.player,near)));
  advance();
 }
 e.setInput(0,0,false);
 if(e.phase==='dead'||!e.canFinishLevel)throw new Error(`Pilot failed level ${e.level}: phase ${e.phase}, ${JSON.stringify({frames,hp:e.player.hp,room:e.room,x:e.player.x,y:e.player.y,tasks:e.dungeon.tasks,history})}`);
 return {frames,minHp,visited:e.dungeon.visited.filter(Boolean).length,hearts:e.player.hp};
}
export function playDungeonLevel(id,{budget=24000,healItems=3,shieldItems=1,maxFrames=50000}={}){
 let wallet=budget,heals=0,shields=0,healed=0,revived=0,collected=0;const completed=[],unlocked=[];
 for(let i=0;i<healItems;i++){const p=purchaseShelfBuff('heal',heals,wallet,0);if(!p)throw new Error('Test cannot afford heals');wallet=p.walletCoins;heals=p.count;}
 for(let i=0;i<shieldItems;i++){const p=purchaseShelfBuff('pepsi',shields,wallet,0);if(!p)throw new Error('Test cannot afford shield');wallet=p.walletCoins;shields=p.count;}
 const e=new AdventureEngine(id===1?2:3,{change(){},checkpoint(){},sound(){},run(){},bar(){},collect:n=>collected+=n,levelComplete:n=>completed.push(n),unlockWeapon:n=>unlocked.push(n),consumeHeal(){if(!heals)return false;heals--;healed++;return true;},activateShield(){if(!shields)return false;shields--;return true;},shieldUsed(){revived++;}},{completedLevel:Math.max(0,id-1),random:()=>.5});
 if(id!==1&&!e.selectLevel(id))throw new Error('Cannot select '+id);while(e.phase==='dialogue')e.nextDialogue();if(shields)e.activateShield();
 const result=pilotDungeon(e,{maxFrames});e.finishLevel();return {...result,e,completed,unlocked,healed,revived,collected,weaponTier:e.weaponTier};
}
