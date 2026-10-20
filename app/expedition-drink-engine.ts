import {unit} from './casino-engine.ts';
export function ruinSequence(random:()=>number=Math.random){const sequence:number[]=[];for(let i=0;i<4;i++){const prev=sequence[i-1],pick=Math.floor(unit(random)*(i?8:9));sequence.push(i&&pick>=prev?pick+1:pick);}return sequence;}
export function relicTraps(random:()=>number=Math.random){return Array.from({length:3},()=>Math.floor(unit(random)*3));}
export function relicMultiplier(completed:number){return [0,1.25,1.8,2.5][Math.max(0,Math.min(3,Math.floor(completed)))];}
/** Pure round state: hidden choices are fixed before the first input. */
export class ExpeditionDrinkRound{
 phase:'ready'|'showing'|'playing'|'settled'='ready';sequence:number[]=[];traps:number[]=[];step=0;factor=0;
 readonly kind:'hibiscus'|'tonic';private random:()=>number;
 constructor(kind:'hibiscus'|'tonic',random:()=>number=Math.random){this.kind=kind;this.random=random;}
 start(){if(this.phase!=='ready')return false;this.sequence=ruinSequence(this.random);this.traps=relicTraps(this.random);this.phase=this.kind==='hibiscus'?'showing':'playing';return true;}
 revealDone(){if(this.phase==='showing')this.phase='playing';}
 pick(index:number){if(this.phase!=='playing'||!Number.isInteger(index)||index<0||index>=(this.kind==='hibiscus'?9:3))return false;
  if(index===(this.kind==='hibiscus'?this.sequence[this.step]:this.traps[this.step])){if(this.kind==='tonic'){this.phase='settled';this.factor=0;return true;}}
  else if(this.kind==='hibiscus'){this.phase='settled';this.factor=0;return true;}
  this.step++;if(this.step===(this.kind==='hibiscus'?4:3)){this.phase='settled';this.factor=this.kind==='hibiscus'?1.9:2.5;}return true;
 }
 cashout(){if(this.kind!=='tonic'||this.phase!=='playing'||this.step===0)return false;this.factor=relicMultiplier(this.step);this.phase='settled';return true;}
 abandon(){if(this.phase==='settled'||this.phase==='ready')return false;this.factor=0;this.phase='settled';return true;}
}
