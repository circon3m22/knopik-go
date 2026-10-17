import { DRINK_GAMES, type BrainrotKind } from "./drink-game-engine.ts";
import { VerityField, type VeritySnapshot } from "./verity-engine.ts";

export type BrainrotPhase = "ready" | "playing" | "paused" | "result";
export type BrainrotSound = "beat" | "perfect" | "collect" | "hurt" | "jump" | "drop";
export type MemeObject = { id:number; type:"shoe"|"mine"|"jelly"|"note"|"sahur"|"guest"|"melon"|"spark"; x:number; y:number; age:number; lane?:number; at?:number; done?:boolean; vx?:number; vy?:number; hp?:number; armor?:boolean; fired?:boolean; accent?:boolean; hold?:number; holding?:boolean; perfect?:boolean; boss?:boolean; flash?:number };
export type MemeParticle = { id:number; x:number; y:number; vx:number; vy:number; life:number; color:string };
export type BrainrotSnapshot = { phase:BrainrotPhase; time:number; remaining:number; score:number; combo:number; lives:number; x:number; jump:number; invincible:number; cooldown:number; wind:number; heat:number; misses:number; message:string; feedback:number; pose:number; objects:MemeObject[]; particles:MemeParticle[]; hitLane:number; hitAge:number; hitLanes:number[]; verity:VeritySnapshot|null };
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const DURATIONS:Record<BrainrotKind,number>={tralalero:42,ballerina:32,bombardiro:36,verity:46};
export const RHYTHM_BEAT=.34, RHYTHM_NOTES=84, RHYTHM_WINDOW=.095;
export const memeReward=(kind:BrainrotKind,score:number)=>Math.floor(DRINK_GAMES[kind].maximumReward*clamp(Number.isFinite(score)?score:0,0,1000)/1000);
export const rhythmInterval=(beat:number)=>Math.max(.23,RHYTHM_BEAT-beat*.0014);

/** Fixed logical coordinates; inventory and the once-only money ledger belong to the parent. */
export class BrainrotEngine {
  readonly kind:BrainrotKind;
  readonly verity:VerityField|null;
  phase:BrainrotPhase="ready";
  time=0;score=0;combo=0;lives=3;x=160;targetX=160;
  jumpTime=0;invincible=0;cooldown=0;heat=0;misses=0;
  objects:MemeObject[]=[];particles:MemeParticle[]=[];
  message="";feedback=0;hitLane=-1;hitAge=0;
  private id=0;private spawnAt=2;private spawnIndex=0;private beat=-1;private seaLane=1;
  private rhythmPoints=0;private rhythmCount=0;private rhythmEnd=32;
  private rhythmBeats:number[]=[];private beatIndex=0;private actionAt=[-10,-10,-10];private laneHit=[0,0,0];
  private random:()=>number;
  private events:{sound:BrainrotSound;lane:number}[]=[];
  private held=[false,false,false];private bossSpawned=false;
  private result:{score:number;reward:number}|null=null;

  constructor(kind:BrainrotKind,random:()=>number=Math.random){this.kind=kind;this.random=random;this.verity=kind==="verity"?new VerityField(()=>this.roll()):null;}
  private roll(){const n=this.random();return clamp(Number.isFinite(n)?n:.5,0,.999999);}
  get wind(){return this.kind==="bombardiro"?Math.sin(this.time*.72)*64+Math.sin(this.time*1.83)*23:0;}
  get remaining(){return Math.max(0,(this.kind==="ballerina"?this.rhythmEnd:DURATIONS[this.kind])-this.time);}
  start(){
    if(this.phase!=="ready")return false;
    this.phase="playing";
    if(this.kind==="ballerina"){
      let previous=-1,at=2;
      for(let i=0;i<RHYTHM_NOTES;i++){
        const roll=Math.floor(this.roll()*(previous<0?3:2));
        const lane=previous<0 || roll<previous?roll:roll+1,interval=rhythmInterval(i);
        this.rhythmBeats.push(at);
        this.objects.push({id:++this.id,type:"note",lane,x:64+lane*96,y:-20,age:0,at,...(i%16===7?{hold:.36}:{})});
        if(i%8===5){
          const other=(lane+1+Math.floor(this.roll()*2))%3;
          this.objects.push({id:++this.id,type:"note",lane:other,x:64+other*96,y:-20,age:0,at:at+interval/2,accent:true});
        }
        if(i%12===11){
          const other=(lane+1+Math.floor(this.roll()*2))%3;
          this.objects.push({id:++this.id,type:"note",lane:other,x:64+other*96,y:-20,age:0,at,accent:true});
        }
        previous=lane;at+=interval;
      }
      this.objects.sort((a,b)=>(a.at??0)-(b.at??0));
      this.rhythmCount=this.objects.length;this.rhythmEnd=at+.9;
    }
    return true;
  }
  pause(){if(this.phase!=="playing")return false;this.phase="paused";this.held.fill(false);return true;}
  resume(){if(this.phase!=="paused")return false;this.phase="playing";return true;}
  steer(x:number){if(this.phase==="playing" && this.kind!=="ballerina" && Number.isFinite(x))this.targetX=clamp(x,this.kind==="verity"?48:28,this.kind==="verity"?272:292);}
  nudge(direction:number,dt:number){if(Number.isFinite(direction)&&Number.isFinite(dt))this.steer(this.targetX+direction*310*clamp(dt,0,.05));}
  action(lane=-1){
    if(this.phase!=="playing")return false;
    if(this.kind==="ballerina")return this.time<2-RHYTHM_WINDOW?false:this.hitNote(lane);
    if(this.time<2 || this.cooldown>0)return false;
    if(this.kind==="tralalero"){
      this.jumpTime=.54;this.cooldown=1.65;this.emit("jump");this.burst(this.x,355,"#a0e1db",14);
    }else if(this.kind==="verity"){
      this.verity?.activate();this.cooldown=4.4;this.message="ГЛИТЧ: ЛАЗЕРЫ НЕ СТРАШНЫ";this.feedback=.7;this.emit("jump");this.burst(this.verity?.ball.x??160,this.verity?.ball.y??280,"#a3ecdf",30);
    }else{
      this.cooldown=.24;this.heat=Math.min(1,this.heat+.19);
      this.objects.push({id:++this.id,type:"melon",x:this.x,y:102,age:0,vx:this.wind});
      this.emit("drop");
      if(this.heat>=.99){this.cooldown=1.15;this.message="ПЕРЕГРЕВ!";this.feedback=.8;this.emit("hurt");}
    }
    return true;
  }
  private hitNote(lane:number){
    if(!Number.isInteger(lane)||lane<0||lane>2||this.time-this.actionAt[lane]<.065)return false;
    if(this.objects.some(note=>note.type==='note'&&!note.done&&note.holding&&note.lane===lane&&this.time<=(note.at??0)+(note.hold??0))){this.held[lane]=true;return true;}
    this.actionAt[lane]=this.time;this.hitLane=lane;this.hitAge=.18;this.laneHit[lane]=.18;
    const note=this.objects.find(item=>item.type==="note"&&!item.done&&item.lane===lane&&Math.abs((item.at??0)-this.time)<=RHYTHM_WINDOW);
    if(!note){this.hurt("НЕ В РИТМ");return true;}
    const perfect=Math.abs((note.at??0)-this.time)<=.035;
    if(note.hold){this.held[lane]=true;note.holding=true;note.perfect=perfect;this.message="ДЕРЖИ НОТУ";this.feedback=.45;this.emit("collect",lane);return true;}
    note.done=true;
    this.rhythmPoints+=perfect?100:55;this.score=Math.floor(this.rhythmPoints/(this.rhythmCount*100)*1000);this.combo++;
    this.message=perfect?"ПЕРФЕКТ!":"В РИТМ!";this.feedback=.35;
    this.burst(note.x,335,perfect?"#ffe19b":"#f5afca",18);this.emit(perfect?"perfect":"collect",lane);
    return true;
  }
  release(lane:number){
    if(!Number.isInteger(lane)||lane<0||lane>2)return;
    this.held[lane]=false;
    if(this.phase!=="playing")return;
    const note=this.objects.find(n=>n.type==="note"&&n.lane===lane&&n.holding&&!n.done);
    if(note){note.done=true;this.hurt("НОТА ОТПУЩЕНА РАНО");}
  }
  private emit(sound:BrainrotSound,lane=0){if(this.events.length<16)this.events.push({sound,lane});}
  drainSounds(){const out=this.events;this.events=[];return out;}
  private burst(x:number,y:number,color:string,count=18){
    for(let i=0;i<count&&this.particles.length<112;i++){
      const angle=this.roll()*Math.PI*2,speed=35+this.roll()*155;
      this.particles.push({id:++this.id,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.35+this.roll()*.35,color});
    }
  }
  private hurt(message:string){
    this.lives=Math.max(0,this.lives-1);this.combo=0;this.message=message;this.feedback=.65;this.emit("hurt");
    if(this.lives===0)this.finish();
  }
  private spawnSea(){
    // The rewarding route moves only to an adjacent lane; all hazards leave that lane open.
    this.seaLane=clamp(this.seaLane+(this.roll()<.5?-1:1),0,3);
    this.objects.push({id:++this.id,type:"shoe",x:40+this.seaLane*80,y:-35,age:0,lane:this.seaLane});
    const blocked=[0,1,2,3].filter(lane=>lane!==this.seaLane),hazardCount=this.time>14?3:2;
    const offset=Math.floor(this.roll()*blocked.length);
    for(let j=0;j<hazardCount;j++){
      const lane=blocked[(j+offset)%blocked.length],jelly=(this.spawnIndex+j)%4===2;
      this.objects.push({id:++this.id,type:jelly?"jelly":"mine",x:40+lane*80,y:-35-(j%2)*14,age:0,lane,vx:jelly?(this.roll()-.5)*22:0});
    }
    this.spawnIndex++;this.spawnAt+=Math.max(.34,.5-this.time*.004);
  }
  private spawnPlaza(){
    const lane=Math.floor(this.roll()*3),armored=this.spawnIndex%3===1;
    this.objects.push({id:++this.id,type:"sahur",x:64+lane*96,y:195,age:0,vx:(this.roll()-.5)*75,hp:armored?2:1,armor:armored});
    if(this.spawnIndex%4===3)this.objects.push({id:++this.id,type:"sahur",x:64+((lane+2)%3)*96,y:170,age:0,vx:(this.roll()-.5)*60,hp:1});
    if(this.spawnIndex%2===1)this.objects.push({id:++this.id,type:"guest",x:64+((lane+1)%3)*96,y:235,age:0,vx:(this.roll()-.5)*65});
    this.spawnIndex++;this.spawnAt+=Math.max(.45,.65-this.time*.007);
  }
  update(delta:number){
    if(this.phase!=="playing"||!Number.isFinite(delta)||delta<=0)return;
    const dt=Math.min(delta,.05);
    this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.heat=Math.max(0,this.heat-dt*.49);
    this.jumpTime=Math.max(0,this.jumpTime-dt);this.invincible=Math.max(0,this.invincible-dt);
    this.feedback=Math.max(0,this.feedback-dt);this.hitAge=Math.max(0,this.hitAge-dt);
    this.laneHit=this.laneHit.map(t=>Math.max(0,t-dt));
    this.x+=clamp(this.targetX-this.x,-dt*720,dt*720);
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}
    this.particles=this.particles.filter(p=>p.life>0);
    if(this.kind==="ballerina")this.updateRhythm();
    else if(this.kind==="tralalero")this.updateSea(dt);
    else if(this.kind==="bombardiro")this.updatePlaza(dt);
    else{
      for(const event of this.verity!.update(dt,this.time,this.x)){
        this.burst(event.x,event.y,event.type==="hurt"?"#f48b97":"#ffe19b",event.type==="bounce"?8:24);
        if(event.type==="hurt")this.hurt(event.message);
        else if(event.type==="collect"){this.combo++;this.score=Math.min(1000,this.score+event.points+Math.min(10,this.combo));this.message=event.message;this.feedback=.4;this.emit("perfect");}
        else this.emit("collect");
        if(this.lives<=0)break;
      }
    }
    if(this.kind!=="ballerina"){
      const beat=Math.floor(this.time/(this.kind==="verity"?.4:.38));
      if(beat!==this.beat){this.beat=beat;this.emit("beat",beat%3);}
    }
    this.objects=this.objects.filter(item=>!item.done && (item.type==="note"?(item.at??0)+(item.hold??0)+.3>this.time:item.y<480));
    if(this.phase==="playing"&&this.remaining<=0)this.finish();
  }
  private updateRhythm(){
    while(this.beatIndex<this.rhythmBeats.length && this.time>=this.rhythmBeats[this.beatIndex]){this.emit("beat",this.beatIndex%3);this.beatIndex++;}
    for(const note of this.objects){
      if(note.type!=="note"||note.done)continue;
      note.y=335-((note.at??0)-this.time)*(255+Math.min(55,this.time*2));
      if(note.holding){
        if(this.time>=(note.at??0)+(note.hold??0)&&this.held[note.lane??0]){note.done=true;this.rhythmPoints+=note.perfect?100:55;this.score=Math.floor(this.rhythmPoints/(this.rhythmCount*100)*1000);this.combo++;this.message="ВЫДЕРЖАНО!";this.feedback=.4;this.emit("perfect",note.lane);this.burst(note.x,335,"#ffe19b",22);}continue;
      }
      if(this.time>(note.at??0)+RHYTHM_WINDOW){note.done=true;this.hurt("ПРОПУСК");if(this.phase==="result")break;}
    }
  }
  private updateSea(dt:number){
    if(this.time>=this.spawnAt && this.remaining>1.8)this.spawnSea();
    const speed=215+Math.min(160,this.time*4.2);
    for(const item of this.objects){
      item.age+=dt;item.y+=speed*dt;
      if(item.type==="jelly"){const min=24+(item.lane??0)*80,max=min+32;item.x=clamp(item.x+(item.vx??0)*dt,min,max);}
      if(item.type==="shoe"&&!item.done&&item.y>389){
        item.done=true;this.misses++;
        if(this.misses>=3){this.misses=0;this.hurt("ТРИ КРОССОВКА УПЛЫЛИ");if(this.phase==="result")break;}
        continue;
      }
      if(item.done||Math.abs(item.y-355)>23||Math.abs(item.x-this.x)>25)continue;
      if(item.type==="shoe"){
        item.done=true;this.combo++;this.score=Math.min(1000,this.score+12+Math.min(4,Math.floor(this.combo/4)));
        this.message=this.combo>=5?`КРОССОВКИ ×${this.combo}`:"ТРАЛАЛА!";this.feedback=.35;
        this.burst(item.x,item.y,"#ffd889",14);this.emit("collect");
      }else if((item.type==="jelly"||this.jumpTime<=.08)&&this.invincible<=0){
        item.done=true;this.invincible=.65;this.burst(item.x,item.y,"#f2a9a1",28);
        this.hurt(item.type==="jelly"?"МЕДУЗУ НЕ ПЕРЕПРЫГНУТЬ":"МИНА!");if(this.phase==="result")break;
      }
    }
  }
  private updatePlaza(dt:number){
    if(this.time>=this.spawnAt&&this.remaining>8)this.spawnPlaza();
    if(!this.bossSpawned&&this.remaining<=8){this.bossSpawned=true;this.objects.push({id:++this.id,type:"sahur",boss:true,x:160,y:210,age:0,vx:65,hp:6,armor:true});this.message="КОМАНДИР ВОЛНЫ · 6 ПОПАДАНИЙ";this.feedback=1.5;}

    const spawned:MemeObject[]=[];
    for(const item of this.objects){
      item.age+=dt;item.flash=Math.max(0,(item.flash??0)-dt);
      if(item.type==="melon"){item.y+=350*dt;item.x+=(item.vx??0)*dt;}
      else if(item.type==="spark"){item.y+=(item.vy??-210)*dt;item.x+=(item.vx??0)*dt;if(item.y<25)item.done=true;}
      else{
        item.y+=(item.boss?0:72+this.time*1.35)*dt;item.x+=((item.vx??0)+Math.sin(item.age*3+item.id)*18)*dt;
        if(item.x<30 || item.x>290){item.x=clamp(item.x,30,290);item.vx=-(item.vx??0);}
        if(item.boss&&item.age>1.15){item.fired=false;item.age=0;}
        if(item.type==="sahur"&&!item.fired&&item.age>.65&&(item.armor||item.id%4===0)){
          item.fired=true;
          const dx=this.x-item.x,dy=92-item.y,length=Math.hypot(dx,dy)||1;
          spawned.push({id:++this.id,type:"spark",x:item.x,y:item.y-25,age:0,vx:dx/length*205,vy:dy/length*205});
        }
      }
    }
    this.objects.push(...spawned);
    for(const melon of this.objects){
      if(melon.type!=="melon"||melon.done)continue;
      const target=this.objects.find(item=>!item.done&&(item.type==="sahur"||item.type==="guest")&&Math.abs(item.x-melon.x)<22&&Math.abs(item.y-melon.y)<23);
      if(!target)continue;
      melon.done=true;target.hp=(target.hp??1)-1;target.flash=.18;
      this.burst(target.x,target.y,"#ee7c85",24);this.burst(target.x,target.y,"#b3d676",10);
      if(target.type==="guest"){target.done=true;this.hurt("КАППУЧИНУ НЕ ТРОГАТЬ!");if(this.phase==="result")return;}
      else if(target.hp<=0){target.done=true;this.combo++;this.score=Math.min(1000,this.score+(target.boss?180:25)+Math.min(8,this.combo));this.message=target.boss?"КОМАНДИР ПОВЕРЖЕН!":this.combo>3?`АРБУЗНЫЙ КОМБО ×${this.combo}`:"ТУН-ТУН — БУМ!";this.feedback=.4;this.emit("perfect");}
      else{this.message="БРОНЯ ТРЕСНУЛА";this.feedback=.35;this.emit("collect");}
    }
    for(const target of this.objects){
      if(target.done)continue;
      if(target.type==="spark"&&Math.abs(target.y-92)<23&&Math.abs(target.x-this.x)<25&&this.invincible<=0){target.done=true;this.invincible=.7;this.burst(this.x,92,"#ffb473",28);this.hurt("САХУР ОТВЕТИЛ!");}
      else if(target.type==="sahur"&&target.y>422){target.done=true;this.hurt("САХУР УБЕЖАЛ");}
      if(this.phase==="result")break;
    }
  }
  finish(){
    if(this.result)return this.result;
    if(this.phase==="ready")this.score=0;
    this.phase="result";this.result={score:this.score,reward:memeReward(this.kind,this.score)};return this.result;
  }
  snapshot():BrainrotSnapshot{
    return {phase:this.phase,time:this.time,remaining:this.remaining,score:this.score,combo:this.combo,lives:this.lives,x:this.x,jump:this.jumpTime>0?Math.sin(this.jumpTime/.54*Math.PI):0,invincible:this.invincible,cooldown:this.cooldown,wind:this.wind,heat:this.heat,misses:this.misses,message:this.message,feedback:this.feedback,pose:Math.floor(this.time/RHYTHM_BEAT)%4,objects:this.objects.map(x=>({...x})),particles:this.particles.map(x=>({...x})),hitLane:this.hitLane,hitAge:this.hitAge,hitLanes:this.laneHit.map((t,i)=>t>0?i:-1).filter(i=>i>=0),verity:this.verity?.snapshot()??null};
  }
}
