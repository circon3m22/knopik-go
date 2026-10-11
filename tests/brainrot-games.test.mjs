import assert from 'node:assert/strict';
import test from 'node:test';
import { BrainrotEngine, memeReward, rhythmInterval, RHYTHM_NOTES, RHYTHM_WINDOW } from '../app/brainrot-engine.ts';
import { BRAINROT_KINDS, DRINK_GAMES, createBrainrotInventory, createBrainrotStats, commitDrinkRound, settleDrinkRound } from '../app/drink-game-engine.ts';
import { createDefaultSave, sanitizeSave, SAVE_VERSION } from '../app/game-logic.ts';
import { spendBalance } from '../app/cosmetic-engine.ts';

function advance(game, until) {
  while (game.time + 1e-9 < until && game.phase === 'playing') game.update(Math.min(1/60, until-game.time));
}
function playing(kind) { const g=new BrainrotEngine(kind,()=>.5);g.start();advance(g,2.01);g.objects=[];return g; }

test('all four premium bottles use active coins, start once and settle within their cap', () => {
  for (const kind of BRAINROT_KINDS) {
    const price=DRINK_GAMES[kind].price;
    assert.ok(price>=1500);
    assert.equal(spendBalance(price-1,100_000,price,'active'),null);
    assert.deepEqual(spendBalance(price,333,price,'active'),{walletCoins:0,vaultCoins:333});
    const ledger={kind,phase:'ready'};
    assert.equal(settleDrinkRound(ledger,kind,999_999),null);
    assert.equal(commitDrinkRound(ledger,0),false);
    assert.equal(commitDrinkRound(ledger,1),true);
    assert.equal(commitDrinkRound(ledger,1),false);
    assert.equal(settleDrinkRound(ledger,kind,999_999),DRINK_GAMES[kind].maximumReward);
    assert.equal(settleDrinkRound(ledger,kind,999_999),null);
    assert.equal(memeReward(kind,1000),DRINK_GAMES[kind].maximumReward);
    assert.equal(memeReward(kind,Infinity),0);
  }
  assert.equal(DRINK_GAMES.verity.price,6000);
});

test('old saves retain progress; Verity defaults to empty and survives the next JSON reload', () => {
  const legacy=sanitizeSave({...createDefaultSave(),version:19,walletCoins:1234,limeCount:3,matchaBest:6,runnerBest:789,brainrotInventory:{tralalero:25}});
  assert.equal(legacy.version,SAVE_VERSION);assert.equal(legacy.walletCoins,1234);assert.equal(legacy.limeCount,3);assert.equal(legacy.matchaBest,6);assert.equal(legacy.runnerBest,789);
  assert.deepEqual(legacy.brainrotInventory,createBrainrotInventory());
  const old20=sanitizeSave({...legacy,brainrotInventory:{tralalero:2,ballerina:4,bombardiro:1},brainrotStats:{ballerina:{plays:6,best:990}}});
  assert.equal(old20.brainrotInventory.verity,0);assert.equal(old20.brainrotInventory.ballerina,4);assert.equal(old20.brainrotStats.ballerina.best,990);
  const saved={...old20,brainrotInventory:{...old20.brainrotInventory,verity:2},brainrotStats:{...old20.brainrotStats,verity:{plays:7,best:681}}};
  assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(saved))),saved);
  const hostile=sanitizeSave({...saved,brainrotInventory:{tralalero:100,ballerina:Infinity,bombardiro:-5,verity:999},brainrotStats:{tralalero:{best:99999,plays:NaN},ballerina:null}});
  assert.deepEqual(hostile.brainrotInventory,{tralalero:25,ballerina:0,bombardiro:0,verity:25});
  assert.deepEqual(hostile.brainrotStats.tralalero,{plays:0,best:1000});
  const a=createBrainrotStats(),b=createBrainrotStats();a.verity.best=500;assert.equal(b.verity.best,0);
});

test('preparation cannot use an action; pause freezes every game including ball, lasers and cooldowns', () => {
  for(const kind of BRAINROT_KINDS){
    const ready=new BrainrotEngine(kind);assert.deepEqual(ready.finish(),{score:0,reward:0});assert.equal(ready.start(),false);
    const game=new BrainrotEngine(kind,()=>.5);assert.equal(game.start(),true);assert.equal(game.start(),false);
    advance(game,1);assert.equal(game.action(1),false);
    advance(game,2.01);game.pause();const before=game.snapshot();
    for(let i=0;i<1200;i++)game.update(1/60);
    assert.deepEqual(game.snapshot(),before);assert.equal(game.action(1),false);assert.equal(game.resume(),true);
    game.update(1/60);assert.ok(game.time>before.time);
    const result=game.finish();assert.deepEqual(game.finish(),result);assert.equal(game.resume(),false);assert.equal(game.action(1),false);
  }
});

test('Tralalero jumps over mines but not jellyfish; overlapping hits consume one life during grace', () => {
  const game=playing('tralalero');
  game.objects=[{id:100,type:'shoe',x:160,y:353,age:0}];game.update(1/60);
  assert.equal(game.score,12);assert.equal(game.combo,1);assert.equal(game.action(),true);assert.equal(game.action(),false);
  game.objects=[{id:101,type:'mine',x:160,y:353,age:0}];game.update(1/60);assert.equal(game.lives,3);
  advance(game,2.7);
  game.objects=[{id:102,type:'mine',x:160,y:353,age:0},{id:103,type:'mine',x:160,y:353,age:0}];game.update(1/60);
  assert.equal(game.lives,2);assert.equal(game.combo,0);
  game.invincible=0;game.jumpTime=.4;game.objects=[{id:104,type:'jelly',x:160,y:353,age:0,lane:1}];game.update(1/60);
  assert.equal(game.lives,1);
});

test('three missed shoes cost a life, and dense sea waves retain an adjacent rewarding opening', () => {
  const game=playing('tralalero');
  game.objects=Array.from({length:3},(_,i)=>({id:100+i,type:'shoe',x:40,y:390,age:0}));
  game.update(1/60);assert.equal(game.lives,2);assert.equal(game.misses,0);
  const waves=new BrainrotEngine('tralalero',()=>.3);waves.start();
  advance(waves,2.02);
  const shoe=waves.objects.find(o=>o.type==='shoe'),hazards=waves.objects.filter(o=>o.type==='mine'||o.type==='jelly');
  assert.equal(hazards.length,2);assert.ok(hazards.every(o=>o.lane!==shoe.lane));
  advance(waves,2.53);const next=waves.objects.filter(o=>o.type==='shoe').at(-1);assert.ok(Math.abs(next.lane-shoe.lane)<=1);
  assert.ok(waves.objects.some(o=>o.type==='jelly'));
  const empty=new BrainrotEngine('tralalero');empty.start();advance(empty,8);assert.equal(empty.phase,'result');assert.equal(empty.lives,0);
});

test('Ballerina accelerated chart includes syncopation and simultaneous chords, with a tighter window', () => {
  const game=new BrainrotEngine('ballerina',()=>.5);game.start();
  const notes=game.objects.map(n=>({...n}));
  assert.equal(notes.length,101);assert.ok(notes.length>RHYTHM_NOTES);
  assert.ok(rhythmInterval(83)<rhythmInterval(0)*.7);assert.ok(RHYTHM_WINDOW<.1);
  assert.ok(notes.some((n,i)=>i>0 && n.at===notes[i-1].at && n.lane!==notes[i-1].lane));
  assert.ok(notes.some((n,i)=>i>0 && n.at-notes[i-1].at>0 && n.at-notes[i-1].at<.18));
  for(const note of notes){advance(game,note.at);assert.equal(game.action(note.lane),true);assert.equal(game.action(note.lane),false);}
  advance(game,game.time+game.remaining+.01);
  assert.equal(game.phase,'result');assert.equal(game.score,1000);assert.equal(game.lives,3);assert.equal(game.finish().reward,7500);
});

test('Ballerina punishes skipped notes and excessive early presses rather than allowing spam', () => {
  const skipped=new BrainrotEngine('ballerina',()=>.3);skipped.start();advance(skipped,4);
  assert.equal(skipped.phase,'result');assert.equal(skipped.lives,0);assert.equal(skipped.score,0);
  const wrong=new BrainrotEngine('ballerina',()=>0);wrong.start();
  const first=wrong.objects.slice(0,3).map(x=>({...x}));
  for(const note of first){advance(wrong,note.at);wrong.action(2);}
  assert.equal(wrong.phase,'result');assert.equal(wrong.score,0);
});

test('Bombardiro armor needs two hits; a guest is never a rewarded target', () => {
  const game=playing('bombardiro');assert.equal(game.action(),true);assert.equal(game.action(),false);
  const armor={id:101,type:'sahur',x:160,y:250,age:0,vx:0,hp:2,armor:true};
  game.objects=[{id:100,type:'melon',x:160,y:248,age:0,vx:0},armor];game.update(1/60);
  assert.equal(armor.hp,1);assert.equal(game.score,0);assert.equal(armor.done,undefined);
  game.objects.push({id:102,type:'melon',x:armor.x,y:armor.y,age:0,vx:0});game.update(1/60);
  assert.equal(game.score,26);assert.equal(game.combo,1);assert.equal(armor.done,true);
  game.objects=[{id:103,type:'melon',x:160,y:248,age:0,vx:0},{id:104,type:'guest',x:160,y:250,age:0,vx:0}];game.update(1/60);
  assert.equal(game.score,26);assert.equal(game.combo,0);assert.equal(game.lives,2);
  game.objects=[{id:105,type:'sahur',x:20,y:422,age:0,vx:0}];game.update(1/60);assert.equal(game.lives,1);
});

test('Bombardiro counterfire is aimed at the plane, hits have grace, and repeated fire overheats', () => {
  const game=playing('bombardiro');
  game.objects=[{id:100,type:'sahur',x:90,y:210,age:.7,armor:true,hp:2}];game.update(1/60);
  const shot=game.objects.find(x=>x.type==='spark');assert.ok(shot);assert.ok(shot.vy<0);assert.ok(shot.vx>0);
  game.objects=[{id:101,type:'spark',x:160,y:94,age:0,vy:-200},{id:102,type:'spark',x:160,y:94,age:0,vy:-200}];game.update(1/60);assert.equal(game.lives,2);
  const hot=playing('bombardiro');
  let jam=false;
  for(let i=0;i<20;i++){assert.equal(hot.action(),true);if(hot.cooldown>1){jam=true;break;}hot.objects=[];advance(hot,hot.time+.25);}
  assert.equal(jam,true);assert.equal(hot.action(),false);assert.ok(hot.heat>.98);
  hot.objects=[];advance(hot,hot.time+1.2);assert.equal(hot.cooldown,0);assert.equal(hot.action(),true);
});

test('invalid deltas cannot move clocks, and particles and objects stay bounded in the dense games', () => {
  for(const kind of BRAINROT_KINDS){
    const game=new BrainrotEngine(kind,()=>.5);game.start();
    const before=game.snapshot();game.update(NaN);game.update(-1);game.update(Infinity);assert.deepEqual(game.snapshot(),before);
    if(kind==='ballerina')continue;
    game.lives=1000;advance(game,game.remaining+.1);assert.ok(game.objects.length<40);assert.ok(game.particles.length<=112);
    assert.equal(game.phase,'result');assert.ok(Number.isFinite(game.score));
  }
});
