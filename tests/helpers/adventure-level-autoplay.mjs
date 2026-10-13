import { AdventureEngine, ADVENTURE_STEP } from '../../app/adventure-engine.ts';
import { purchaseShelfBuff } from '../../app/buff-shelf-engine.ts';
// A bounded computer player using the same movement, attacks and dodge controls.
// No immortality, position changes, grants, enemy deletion or altered cooldowns.
export function playLevel(id, { budget=0, healItems=0, shieldItems=0 } = {}) {
  const unlocked=[],completed=[];
  let wallet=budget,heals=0,shields=0,healed=0,revived=0;
  for(let n=0;n<healItems;n++){const p=purchaseShelfBuff('heal',heals,wallet,0);if(!p)throw new Error('Cannot afford test heal');heals=p.count;wallet=p.walletCoins;}
  for(let n=0;n<shieldItems;n++){const p=purchaseShelfBuff('pepsi',shields,wallet,0);if(!p)throw new Error('Cannot afford test shield');shields=p.count;wallet=p.walletCoins;}
  const e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){},unlockWeapon:n=>unlocked.push(n),levelComplete:n=>completed.push(n),consumeHeal(){if(!heals)return false;heals--;healed++;return true;},activateShield(){if(!shields)return false;shields--;return true;},shieldUsed(){revived++;}},{completedLevel:id-1});
  if(!e.selectLevel(id)) throw new Error('Cannot start level '+id);while(e.phase==='dialogue')e.nextDialogue();
  if(shields)e.activateShield();
  let frames=0,minHp=3,path=[],pathFrames=0;
  const advance=()=>{e.advance(ADVENTURE_STEP);frames++;minHp=Math.min(minHp,e.player.hp);if(e.phase==='dead')throw new Error(`Died level ${id}, room ${e.room+1}, frame ${frames}, x${e.player.x.toFixed(1)},y${e.player.y.toFixed(1)}`);};
  const hazardous=(x,y)=>e.levelData.jets.some((jet,i)=>e.jetPhase(i)!=='off'&&x>jet.x-8&&x<jet.x+jet.w+8&&y>jet.y-12&&y<jet.y+jet.h+12);
  function plan(goal,radius=25) {
    const w=Math.ceil(e.levelData.bounds.w/16),h=Math.ceil(e.levelData.height/16)+2,xy=id=>({x:e.levelData.bounds.x+8+id%w*16,y:8+Math.floor(id/w)*16});
    const valid=id=>id>=0&&id<w*h&&e.canStand(xy(id).x,xy(id).y)&&!hazardous(xy(id).x,xy(id).y);
    let start=-1,nearest=Infinity;
    for(let i=0;i<w*h;i++){const p=xy(i),d=Math.hypot(p.x-e.player.x,p.y-e.player.y);if(d<nearest&&valid(i)){start=i;nearest=d;}}
    if(start<0)return [];
    const parents=new Int32Array(w*h).fill(-2),queue=[start];parents[start]=-1;let found=-1;
    for(let q=0;q<queue.length;q++){
      const id=queue[q],p=xy(id);if(Math.hypot(p.x-goal.x,p.y-goal.y)<radius){found=id;break;}
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const x=id%w+dx,y=Math.floor(id/w)+dy,n=y*w+x;if(x<0||x>=w||y<0||y>=h||parents[n]!==-2||!valid(n)||!e.canStand(p.x+dx*8,p.y+dy*8))continue;
        parents[n]=id;queue.push(n);
      }
    }
    if(found<0)return [];
    const result=[];for(let i=found;i>=0;i=parents[i])result.unshift(xy(i));return result;
  }
  function steer(goal,attack=false,radius=25) {
    if(!path.length||pathFrames--<=0){path=plan(goal,radius);pathFrames=16;}
    while(path.length&&Math.hypot(path[0].x-e.player.x,path[0].y-e.player.y)<6)path.shift();
    const p=path[0]??goal,dx=p.x-e.player.x,dy=p.y-e.player.y,d=Math.hypot(dx,dy);e.setInput(d>3?dx/d:0,d>3?dy/d:0,attack);
  }
  function navigate(goal){path=[];const stop=frames+4000;while(Math.hypot(goal.x-e.player.x,goal.y-e.player.y)>20&&frames<stop){steer(goal,false,15);advance();}if(frames>=stop)throw new Error(`Navigation stalled ${id}/${e.room}`);e.setInput(0,0,false);}
  for(let room=0;room<e.levelData.rooms.length;room++){
    path=[];const stop=frames+12000;
    while(e.phase==='playing'&&e.enemies.some(n=>n.hp>0&&n.room===room)&&frames<stop){
      if(e.player.hp<=1&&heals)e.heal();
      const live=e.enemies.filter(n=>n.hp>0&&n.room===room).sort((a,b)=>Math.hypot(a.x-e.player.x,a.y-e.player.y)-Math.hypot(b.x-e.player.x,b.y-e.player.y)),target=live[0],d=Math.hypot(target.x-e.player.x,target.y-e.player.y),r=e.levelData.rooms[room];
      const ranged=e.weapon==='pistol',clearShot=Array.from({length:Math.ceil(d/6)},(_,i)=>e.canStand(e.player.x+(target.x-e.player.x)*(i+1)/Math.ceil(d/6),e.player.y+(target.y-e.player.y)*(i+1)/Math.ceil(d/6),4)).every(Boolean),retreat=ranged?d<125&&clearShot:d<90&&e.punchCooldown>.45;
      if(retreat){const angle=Math.atan2(e.player.y-target.y,e.player.x-target.x);const goal={x:Math.max(r.x+35,Math.min(r.x+r.w-35,e.player.x+Math.cos(angle)*65)),y:Math.max(r.y+30,Math.min(r.y+r.h-35,e.player.y+Math.sin(angle)*65))};steer(goal,true,15);}
      else if(d>(ranged?240:77)||ranged&&!clearShot)steer(target,true,ranged&&clearShot?180:40);else e.setInput(0,0,true);
      const danger=live.find(n=>n.mode==='windup'&&n.timer<.2&&Math.hypot(n.x-e.player.x,n.y-e.player.y)<(n.boss?125:85));
      const bullet=e.bullets.find(b=>b.active&&b.owner!=='player'&&Math.hypot(b.x-e.player.x,b.y-e.player.y)<65);
      if((danger||bullet||hazardous(e.player.x,e.player.y))&&e.dodgeCooldown<=0){
        const away=danger?.boss?Math.atan2(e.player.y-danger.y,e.player.x-danger.x):danger?danger.attackAngle+Math.PI/2:bullet?Math.atan2(bullet.vy,bullet.vx)+Math.PI/2:Math.PI/2;
        const directions=Array.from({length:8},(_,i)=>away+i*Math.PI/4).filter(a=>[20,50,80].every(d=>e.canStand(e.player.x+Math.cos(a)*d,e.player.y+Math.sin(a)*d)&&!hazardous(e.player.x+Math.cos(a)*d,e.player.y+Math.sin(a)*d)));
        const angle=directions.sort((a,b)=>Math.cos(b-away)-Math.cos(a-away))[0]??away;e.setInput(Math.cos(angle),Math.sin(angle),true);e.dodge();path=[];
      }
      advance();
    }
    if(frames>=stop)throw new Error(`Combat stalled ${id}/${room+1}: ${JSON.stringify({player:e.player,enemies:e.enemies.filter(n=>n.hp>0&&n.room===room)})}`);
    if(room<e.levelData.rooms.length-1)navigate({x:240,y:e.levelData.rooms[room+1].y+e.levelData.rooms[room+1].h-45});
  }
  e.setInput(0,0,false);for(let i=0;i<100&&e.phase==='playing';i++)advance();
  if(!e.finishLevel())throw new Error('Finish button was not available '+id);
  if(e.phase!=='levels'||e.area!=='sewer')throw new Error('No victory menu '+id);
  const result={id,frames,seconds:frames/60,hearts:e.player.hp,minHp,rooms:e.cleared.length,defeated:e.enemies.filter(n=>n.hp===0).length,coins:e.collectedCoins,unlocked,completed,purchased:{heals:healItems,shields:shieldItems,spent:budget-wallet},healed,revived};
  e.returnHome();while(e.phase==='dialogue')e.nextDialogue();return {...result,returnArea:e.area};
}
