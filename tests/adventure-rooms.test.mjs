import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureEngine } from '../app/adventure-engine.ts';
import { ADVENTURE_LEVELS } from '../app/adventure-levels.ts';
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};

test('expanded rooms keep human-sized cover and connected battle pockets for the full player collision radius',()=>{
  for(const level of ADVENTURE_LEVELS){
    const e=new AdventureEngine(3,events,{completedLevel:5});e.selectLevel(level.id);while(e.phase==='dialogue')e.nextDialogue();e.cleared.fill(true);
    for(const [index,r] of level.rooms.entries()){
      assert.ok(r.w>=720 && r.h>=560);
      const covers=level.solids.filter(s=>s.y>=r.y&&s.y+s.h<=r.y+r.h);
      assert.ok(covers.length>=6);assert.ok(new Set(covers.map(s=>s.kind)).size>=3);
      for(const s of covers){assert.equal(e.canStand(s.x+s.w/2,s.y+s.h/2),false);assert.ok(s.w<150&&s.h<150,'cover does not grow with the floor');}
      const step=16,w=Math.ceil(r.w/step),h=Math.ceil(r.h/step),point=id=>({x:r.x+8+id%w*step,y:r.y+8+Math.floor(id/w)*step});
      const open=new Uint8Array(w*h);for(let i=0;i<open.length;i++){const p=point(i);open[i]=Number(e.canStand(p.x,p.y));}
      const entry={x:240,y:r.y+r.h-40};let start=-1,nearest=Infinity;
      for(let i=0;i<open.length;i++){const p=point(i),d=Math.hypot(p.x-entry.x,p.y-entry.y);if(open[i]&&d<nearest){start=i;nearest=d;}}
      const reached=new Uint8Array(w*h),queue=[start];reached[start]=1;
      for(let q=0;q<queue.length;q++){const i=queue[q],p=point(i);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i%w+dx,y=Math.floor(i/w)+dy,n=y*w+x;if(x<0||x>=w||y<0||y>=h||!open[n]||reached[n]||!e.canStand(p.x+dx*8,p.y+dy*8))continue;reached[n]=1;queue.push(n);}}
      const reachable=p=>queue.some(i=>Math.hypot(point(i).x-p.x,point(i).y-p.y)<24);
      assert.ok(reachable({x:240,y:r.y+40}),`exit ${level.id}/${index}`);
      for(const enemy of level.enemies.filter(n=>n.room===index))assert.ok(reachable(enemy),`enemy ${level.id}/${index}/${enemy.kind}`);
      const chest=e.chests[index];assert.ok(reachable({x:chest.x,y:chest.y+32}),`chest front ${level.id}/${index}`);assert.ok(reachable({x:chest.x-42,y:chest.y}),`chest side ${level.id}/${index}`);assert.equal(e.canStand(chest.x,chest.y),false);
      // Both outer flanks must be accessible, rather than decorative dead wings.
      for(const x of [r.x+45,r.x+r.w-45]){
        const flank=[.2,.5,.8].map(t=>({x,y:r.y+r.h*t})).filter(p=>e.canStand(p.x,p.y));
        assert.ok(flank.length>0&&flank.every(reachable),`flank ${level.id}/${index}`);
      }
      assert.ok(queue.length/open.reduce((sum,n)=>sum+n,0)>.97,`walkable area ${level.id}/${index}`);
    }
  }
});

test('all new corridors provide at least 160 units of floor and gate collision matches the actual passage',()=>{
  for(const level of ADVENTURE_LEVELS){
    const e=new AdventureEngine(3,events,{completedLevel:5});e.selectLevel(level.id);
    for(const [i,gate] of level.gates.entries()){
      assert.ok(gate.w>=160);for(const x of [gate.x+16,240,gate.x+gate.w-16]){assert.equal(e.canStand(x,gate.y+6),false);e.cleared[i]=true;assert.equal(e.canStand(x,gate.y+6),true);e.cleared[i]=false;}
    }
  }
});
