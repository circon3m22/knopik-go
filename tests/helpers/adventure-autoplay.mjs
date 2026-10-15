import {OPENING_DURATION} from '../../app/adventure-opening.ts';
import {pilotDungeon} from './dungeon-autoplay.mjs';
import {AdventureEngine,ADVENTURE_STEP} from '../../app/adventure-engine.ts';
// The introduction is watched; the mission uses only real joystick, attack and dodge input.
export function playFirstChapter(){
 const checkpoints=[],sounds={};
 const e=new AdventureEngine(0,{change(){},checkpoint:n=>checkpoints.push(n),sound:n=>sounds[n]=(sounds[n]??0)+1,run(){},bar(){}});
 let frames=0;
 while(e.phase==='opening'&&frames<(OPENING_DURATION+1)*60){e.advance(ADVENTURE_STEP);frames++;}
 if(e.phase!=='playing'||e.area!=='sewer')throw new Error('Opening did not hand off to the mission');
 const run=pilotDungeon(e);frames+=run.frames;
 if(!e.finishLevel())throw new Error('First mission did not complete');
 const summary={checkpoints,frames,seconds:frames/60,heartsAtVictory:e.player.hp,minimumHearts:run.minHp,enemiesDefeated:e.enemies.filter(n=>n.hp===0).length,sounds};
 while(e.phase==='homecoming')e.advance(ADVENTURE_STEP);return{...summary,returnArea:e.area,phase:e.phase};
}
if(process.argv[1]?.endsWith('adventure-autoplay.mjs'))console.log(JSON.stringify(playFirstChapter(),null,2));
