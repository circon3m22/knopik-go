import type {CoopMode} from "./coop-protocol.ts";

export function nextCoopRoute(mode:CoopMode,level:number):{mode:CoopMode;level:number}|null{
 if(mode==="campaign"&&level===35)return {mode:"abyss",level:1};
 return level<(mode==="campaign"?35:9999)?{mode,level:level+1}:null;
}

/** A victory has one transition in flight, even across hundreds of render frames. */
export class CoopAutoAdvance {
 private at:number|null=null;
 private pending=false;
 private completed=false;
 due(now:number,enabled:boolean){
  if(!enabled){this.at=null;return false;}
  if(this.pending||this.completed)return false;
  this.at??=now+2000;
  if(now<this.at)return false;
  this.pending=true;return true;
 }
 settle(success:boolean,now:number){this.pending=false;this.completed=success;this.at=now+4000;}
}
