import type { AdventureLevel } from "./dungeon-campaign.ts";
export type DungeonEffectKind="blast"|"hit"|"spark"|"dash"|"heal"|"shell";
export type DungeonEffect={active:boolean;x:number;y:number;age:number;kind:DungeonEffectKind;seed:number;radius:number};
export type ArcLink={active:boolean;x:number;y:number;tx:number;ty:number;age:number};
export class DungeonEffects{
  serial=0;
  pool:DungeonEffect[]=Array.from({length:36},()=>({active:false,x:0,y:0,age:0,kind:"hit",seed:0,radius:30}));
  links:ArcLink[]=Array.from({length:12},()=>({active:false,x:0,y:0,tx:0,ty:0,age:0}));
  reset(){for(const e of this.pool)e.active=false;for(const l of this.links)l.active=false;}
  burst(kind:DungeonEffectKind,x:number,y:number,radius=40){const e=this.pool.find(e=>!e.active)??this.pool.reduce((a,b)=>a.age>b.age?a:b);Object.assign(e,{active:true,x,y,radius,kind,age:0,seed:++this.serial});}
  arc(x:number,y:number,tx:number,ty:number){const l=this.links.find(l=>!l.active)??this.links[0];Object.assign(l,{active:true,x,y,tx,ty,age:0});}
  step(dt:number){for(const e of this.pool)if(e.active){e.age+=dt;if(e.age>(e.kind==="blast"?1.05:e.kind==="shell"?.8:e.kind==="heal"?.65:.32))e.active=false;}for(const l of this.links)if(l.active){l.age+=dt;if(l.age>.23)l.active=false;}}
}
type Host={wave:(task:number,wave:number)=>void;blast:(x:number,y:number,radius:number,damage:number)=>void;effect:(kind:DungeonEffectKind,x:number,y:number,radius?:number)=>void;sound:()=>void;damage:(player?:{x:number;y:number})=>void;trapEnemies:(x:number,y:number,w:number,h:number)=>void;done:()=>boolean};
export class DungeonRuntime{
  geometryRevision=0;
  tasks:{done:boolean;active:boolean;progress:number;blastAt:number;wave:number}[];
  destroyed:boolean[];coverHp:number[];medkits:boolean[];visited:boolean[];
  mines:{armedAt:number;spent:boolean}[];lastTrapHit:number[];
  notice="";noticeUntil=0;
  level:AdventureLevel;private host:Host;
  constructor(level:AdventureLevel,host:Host){
    this.level=level;this.host=host;
    this.tasks=level.tasks.map(()=>({done:false,active:false,progress:0,blastAt:0,wave:0}));
    this.destroyed=level.solids.map(()=>false);this.coverHp=level.solids.map(s=>s.breakable?3:Infinity);
    this.medkits=level.medkits.map(()=>true);this.visited=level.rooms.map(()=>false);
    this.mines=level.hazards.map(()=>({armedAt:-1,spent:false}));this.lastTrapHit=level.hazards.map(()=>-10);
  }
  get completed(){return this.tasks.filter(t=>t.done).length;}
  get allDone(){return this.tasks.every(t=>t.done);}
  available(index:number){return !this.tasks[index].done&&!this.tasks[index].active&&(this.level.tasks[index].depends??[]).every(i=>this.tasks[i].done);}
  nearby(x:number,y:number){return this.level.tasks.findIndex((t,i)=>this.available(i)&&Math.hypot(x-t.x,y-t.y)<70);}
  announce(text:string,time:number){this.notice=text;this.noticeUntil=time+2.2;}
  activate(index:number,time:number){
    if(!this.available(index))return false;const task=this.level.tasks[index],state=this.tasks[index];
    if(task.kind==="charge"){state.active=true;state.blastAt=time+1.8;this.host.wave(index,1);this.announce("Заряд установлен · отойди от круга!",time);}
    else if(task.kind==="survey"||task.kind==="repair"){state.active=true;this.announce(task.kind==="survey"?"Карта получена · исследуй все залы":"Ремонт начат · оставайся рядом с узлом",time);}
    else if(task.kind==="hold"){state.active=true;state.wave=1;this.host.wave(index,1);this.announce("Механизм запущен · держись рядом",time);}
    else {state.done=true;this.host.effect(task.kind==="key"?"heal":"spark",task.x,task.y,35);this.announce(task.kind==="key"?"Предмет найден · цель на карте обновлена":task.kind==="valve"?"Клапан закрыт · участок стал безопаснее":"Контур переключён · путь открыт",time);}
    this.geometryRevision++;this.host.sound();return true;
  }
  goal(){const i=this.tasks.findIndex((t,i)=>!t.done&&!t.active&&this.available(i));const active=this.tasks.findIndex(t=>t.active);return i>=0?i:active;}
  objective(){const i=this.goal();if(i<0)return "Найди подъёмник и заверши уровень";const t=this.level.tasks[i],s=this.tasks[i];if(s.active&&t.kind==="survey")return `${t.goal} · ${this.visited.filter(Boolean).length}/${this.visited.length}`;if(s.active&&t.kind==="repair")return `${t.goal} · ${Math.max(0,Math.ceil((t.duration??4)-s.progress))} с`;return s.active?t.kind==="charge"?"Отойди от заряда · жди взрыва":s.progress>=(t.duration??12)?"Отбей оставшихся нападающих":`${t.goal} · ${Math.max(0,Math.ceil((t.duration??12)-s.progress))} с`:t.goal;}
  hazardPhase(index:number,time:number):"off"|"warning"|"active"{
    const h=this.level.hazards[index];if(!h||this.host.done()||h.disabledBy!==undefined&&this.tasks[h.disabledBy].done)return "off";
    if(h.kind==="mine"){const m=this.mines[index];return m.spent||m.armedAt<0?"off":time-m.armedAt<.8?"warning":"active";}
    const t=(time+h.offset)%h.period;return t>=h.period-1&&t<h.period-.2?"active":t>=h.period-1.9&&t<h.period-1?"warning":"off";
  }
  hitCover(index:number,damage:number,time:number){
    if(this.destroyed[index]||!this.level.solids[index]?.breakable)return false;
    this.coverHp[index]-=damage;const s=this.level.solids[index];this.host.effect("spark",s.x+s.w/2,s.y+s.h/2,20);
    if(this.coverHp[index]<=0){this.destroyed[index]=true;this.geometryRevision++;this.host.effect("blast",s.x+s.w/2,s.y+s.h/2,45);this.announce("Укрытие разбито",time);}return true;
  }
  damageCovers(x:number,y:number,radius:number,damage:number,time:number){this.level.solids.forEach((s,i)=>{if(Math.hypot(x-Math.max(s.x,Math.min(s.x+s.w,x)),y-Math.max(s.y,Math.min(s.y+s.h,y)))<radius)this.hitCover(i,damage,time);});}
  step(dt:number,time:number,player:{x:number;y:number},room:number,enemies:{room:number;hp:number;awake?:boolean;trigger?:number}[],participants?:{player:{x:number;y:number};room:number}[]){
    const players=participants??[{player,room}];
    for(const a of players)this.visited[a.room]=true;
    this.visited[room]=true;
    this.level.tasks.forEach((t,i)=>{const s=this.tasks[i];if(!s.active)return;
      if(t.kind==="charge"&&time>=s.blastAt){s.active=false;s.done=true;this.geometryRevision++;if(t.breaks!==undefined)this.destroyed[t.breaks]=true;this.host.blast(t.x,t.y,116,4);this.announce("Проход расчищен",time);}
      if(t.kind==="survey"||t.kind==="repair"){
        if(t.kind==="survey")s.progress=this.visited.filter(Boolean).length/this.visited.length*(t.duration??12);
        else if(players.some(a=>a.room===t.room&&Math.hypot(a.player.x-t.x,a.player.y-t.y)<90))s.progress=Math.min(t.duration??4,s.progress+dt);
        if(t.kind==="survey"?this.visited.every(Boolean):s.progress>=(t.duration??4)){s.active=false;s.done=true;this.host.effect("spark",t.x,t.y,50);this.announce(t.kind==="survey"?"Маршрут исследован · карта готова":"Полевой узел восстановлен",time);this.host.sound();}
      }
      if(t.kind==="hold"){
        if(players.some(a=>a.room===t.room&&Math.hypot(a.player.x-t.x,a.player.y-t.y)<190))s.progress=Math.min(t.duration??12,s.progress+dt);
        const defenders=enemies.some(e=>e.room===t.room&&e.trigger===i&&e.awake!==false&&e.hp>0);
        // With fists only, the first pump teaches two small, distinct waves.
        // Later levels retain their overlapping, more aggressive encounters.
        if(s.progress>=(t.duration??12)*.45&&s.wave<2&&(this.level.id!==1||!defenders)){s.wave=2;this.host.wave(i,2);return;}
        if(s.wave===2&&s.progress>=(t.duration??12)&&!defenders){s.active=false;s.done=true;this.host.effect("heal",t.x,t.y,55);this.announce("Механизм работает · путь открыт",time);this.host.sound();}
      }
    });
    this.level.hazards.forEach((h,i)=>{
      const m=this.mines[i];if(h.kind==="mine"&&!m.spent&&m.armedAt<0&&players.some(a=>a.room===h.room&&Math.hypot(a.player.x-h.x-h.w/2,a.player.y-h.y-h.h/2)<58)&&!(h.disabledBy!==undefined&&this.tasks[h.disabledBy].done))m.armedAt=time;
      const phase=this.hazardPhase(i,time);if(phase!=="active")return;
      if(h.kind==="mine"){m.spent=true;this.host.blast(h.x+h.w/2,h.y+h.h/2,94,3);return;}
      for(const {player:p} of players)if(p.x>h.x-10&&p.x<h.x+h.w+10&&p.y>h.y-10&&p.y<h.y+h.h+10)this.host.damage(p);
      if(time-this.lastTrapHit[i]>.8){this.lastTrapHit[i]=time;this.host.trapEnemies(h.x,h.y,h.w,h.h);if(h.kind==="crusher")this.host.effect("blast",h.x+h.w/2,h.y+h.h/2,40);}
    });
  }
}
