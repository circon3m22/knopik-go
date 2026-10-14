import {AdventureEngine,ADVENTURE_STEP} from '../../app/adventure-engine.ts';
export const quietEvents={change(){},checkpoint(){},sound(){},run(){},bar(){}};
export function dungeonGame(id,options={},events={}){
 const e=new AdventureEngine(id===1?2:3,{...quietEvents,...events},{completedLevel:Math.max(0,id-1),random:()=>.5,...options});
 if(id!==1&&!e.selectLevel(id))throw new Error('Cannot start level '+id);
 while(e.phase==='dialogue')e.nextDialogue();return e;
}
export function tickDungeon(e,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)e.advance(ADVENTURE_STEP);}
// Completion-state fixture only. The input pilot separately verifies actual combat and tasks.
export function prepareDungeonFinish(e){
 e.enemies.forEach(n=>n.hp=0);e.cleared.fill(true);e.dungeon.tasks.forEach(t=>{t.done=true;t.active=false;});
 e.player.x=e.levelData.exit.x;e.player.y=e.levelData.exit.y+40;
 e.setInput(0,0,false);e.advance(ADVENTURE_STEP);
}
