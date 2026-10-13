import { NEIGHBORHOOD_POINTS, NEIGHBORHOOD_SOLIDS, NEIGHBORHOOD_SPAWN, NEIGHBORHOOD_BOARDWALK, neighborhoodZone, type NeighborhoodPointId } from "./neighborhood-map.ts";
import { sanitizeNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress.ts";
import type { KnopikAnimationState } from "./knopik-adventure-animation.ts";
export type NeighborhoodView={zone:string;interaction:string;point:NeighborhoodPointId|null;paused:boolean;dialogue:string;speaker:string;seated:boolean;objective:string};
export type NeighborhoodEvents={change:(view:NeighborhoodView)=>void;progress:(value:NeighborhoodProgress)=>void;home:()=>void;run:()=>void;sound:()=>void};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class NeighborhoodEngine {
  player={...NEIGHBORHOOD_SPAWN,angle:Math.PI/2,hp:3};
  moving=false;walkDistance=0;time=0;paused=false;seated=false;
  progress:NeighborhoodProgress;
  private events:NeighborhoodEvents;
  private input={x:0,y:0};private accumulator=0;private dialogue="";private speaker="";private lastView="";
  constructor(progress:NeighborhoodProgress,events:NeighborhoodEvents){this.events=events;this.progress=sanitizeNeighborhoodProgress(progress);}
  /** Reuse the existing rig without constructing a combat simulation. */
  get animationState():KnopikAnimationState {return {player:this.player,moving:this.moving,walkDistance:this.walkDistance,area:"apartment",weapon:"fist",punchTime:0,punchSerial:0,dodgeTime:0,checkpoint:3,tutorialOpened:true,seated:this.seated};}
  canStand(x:number,y:number,r=13):boolean{
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r)||r<0)return false;
    if(x<25+r||x>2375-r||y<175+r)return false;
    const deck=NEIGHBORHOOD_BOARDWALK;
    if(y>1697-r&&!(x>deck.x+r&&x<deck.x+deck.w-r&&y<deck.y+deck.h-r))return false;
    return !NEIGHBORHOOD_SOLIDS.some(s=>Math.hypot(x-clamp(x,s.x,s.x+s.w),y-clamp(y,s.y,s.y+s.h))<r-.00001);
  }
  setInput(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y)){this.clearInput();return;}const n=Math.max(1,Math.hypot(x,y));this.input={x:x/n,y:y/n};if(x||y)this.seated=false;}
  clearInput(){this.input={x:0,y:0};this.moving=false;}
  nearestPoint(){
    if(this.dialogue||this.paused)return null;
    return [...NEIGHBORHOOD_POINTS].filter(p=>!(p.id==="badge"&&this.progress.quest!==1)&&!(p.id==="pebble"&&this.progress.pebble)&&!(p.id==="secret"&&this.progress.secret))
      .map(p=>({p,d:Math.hypot(this.player.x-p.x,this.player.y-p.y)})).filter(v=>v.d<85).sort((a,b)=>a.d-b.d)[0]?.p??null;
  }
  view():NeighborhoodView{
    const point=this.nearestPoint();return {zone:neighborhoodZone(this.player.x,this.player.y),point:point?.id??null,interaction:point?.id==="bench"&&this.seated?"Встать с лавочки":point?.label??"",paused:this.paused,dialogue:this.dialogue,speaker:this.speaker,seated:this.seated,
      objective:this.progress.quest===1?"Найди значок соседа в парке":this.progress.quest===2?"Верни значок соседу во дворе":"Гуляй, исследуй и возвращайся домой"};
  }
  private notify(){const view=this.view(),key=JSON.stringify(view);if(key!==this.lastView){this.lastView=key;this.events.change(view);}}
  pause(){this.clearInput();this.paused=true;this.notify();}
  resume(){this.clearInput();this.accumulator=0;this.paused=false;this.notify();}
  closeDialogue(){this.dialogue="";this.clearInput();this.notify();}
  private say(speaker:string,line:string){this.speaker=speaker;this.dialogue=line;this.clearInput();}
  private save(){this.events.progress({...this.progress});}
  interact(){
    const point=this.nearestPoint();if(!point)return false;this.clearInput();this.events.sound();
    switch(point.id){
      case "home":this.events.home();return true;
      case "run":this.paused=true;this.events.run();break;
      case "neighbor":
        if(this.progress.quest===0){this.progress.quest=1;this.save();this.say("Сосед Миша","Привет, Кнопик! Гулял в парке и потерял значок с липовым листом. Кажется, возле старой лавочки. Если найдёшь — принеси, пожалуйста.");}
        else if(this.progress.quest===1)this.say("Сосед Миша","У старой лавочки в парке трава высокая. Значок медный, с маленьким листом. А к реке можно пройти и через парк, и между нашими домами.");
        else if(this.progress.quest===2){this.progress.quest=3;this.save();this.say("Сосед Миша","Вот он! Спасибо, Кнопик. Держи открытку с нашей набережной. Поставь дома на полку — будет напоминать о первой прогулке.");}
        else this.say("Сосед Миша","Открытка уже ждёт тебя дома. Люблю наш квартал: дома невысокие, все друг друга знают. Вечером у реки особенно красиво.");break;
      case "badge":this.progress.quest=2;this.save();this.say("Кнопик","В траве блестит медный значок с липовым листом. Это тот самый! Надо вернуть его Мише.");break;
      case "pebble":this.progress.pebble=true;this.save();this.say("Кнопик","Гладкий бирюзовый камешек, будто в нём остался кусочек реки. Возьму домой и положу рядом с чашкой.");break;
      case "secret":this.progress.secret=true;this.save();this.say("Кнопик","Под корнями — маленький бумажный фонарик и записка: «Пусть у тебя всегда будет уютный свет». Дома найдётся место для него.");break;
      case "bench":this.seated=!this.seated;if(this.seated){this.player.angle=Math.PI/2;this.say("Кнопик","Листья шуршат, где-то звенит велосипед. Можно немного посидеть. Чтобы встать, просто начни двигаться.");}break;
      case "river":this.say("Кнопик","Вода тихо стучит о настил. На другом берегу тоже светятся окна. Город большой, а этот маленький уголок — мой.");break;
      case "kiosk":this.say("Продавец Рита","Привет! Сегодня просто гуляешь? Парк прямо за переходом, река — дальше по аллее. А на большой улице снова слышно «тун-тун-тун»… Лучше приготовься к погоне.");break;
      case "gardener":this.say("Садовница Нина","Эти липы посадили ещё до моего рождения. Видишь, у каждого дерева своя крона. Сядь на лавочку — птицы вернутся, когда станет тихо.");break;
      case "cat":this.say("Кнопик","Кис-кис! Кот посмотрел, махнул хвостом и снова улёгся на тёплые камни. Кажется, он здесь главный.");break;
    }
    this.notify();return true;
  }
  advance(seconds:number){
    if(!Number.isFinite(seconds)||seconds<=0)return;
    if(this.paused||this.dialogue){this.moving=false;return;}
    this.accumulator+=clamp(seconds,0,.1);
    while(this.accumulator>=1/60){this.accumulator-=1/60;this.time+=1/60;
      const dx=this.input.x*145/60,dy=this.input.y*145/60,ox=this.player.x,oy=this.player.y;
      if(dx||dy)this.player.angle=Math.atan2(this.input.y,this.input.x);
      if(this.canStand(ox+dx,oy))this.player.x+=dx;if(this.canStand(this.player.x,oy+dy))this.player.y+=dy;
      const step=Math.hypot(this.player.x-ox,this.player.y-oy);this.moving=step>.01;this.walkDistance+=step;
    }this.notify();
  }
}
