import { NEIGHBORHOOD_POINTS, NEIGHBORHOOD_SOLIDS, NEIGHBORHOOD_SPAWN, NEIGHBORHOOD_BOARDWALK, neighborhoodZone, type NeighborhoodPointId } from "./neighborhood-map.ts";
import { sanitizeNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress.ts";
import type { KnopikAnimationState } from "./knopik-adventure-animation.ts";
import { NEIGHBORHOOD_MISSIONS, missionCards, missionMask, missionTarget, type NeighborhoodMissionId, type MissionCard } from "./neighborhood-missions.ts";
export type NeighborhoodView={zone:string;interaction:string;point:NeighborhoodPointId|null;paused:boolean;dialogue:string;speaker:string;seated:boolean;objective:string;missions:MissionCard[];badgeQuest:number;photoSerial:number;goal:{x:number;y:number;label:string}|null};
export type NeighborhoodEvents={change:(view:NeighborhoodView)=>void;progress:(value:NeighborhoodProgress)=>void;home:()=>void;run:()=>void;sound:()=>void};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class NeighborhoodEngine {
  player={...NEIGHBORHOOD_SPAWN,angle:Math.PI/2,hp:3};
  moving=false;walkDistance=0;time=0;paused=false;seated=false;
  photoSerial=0;
  progress:NeighborhoodProgress;
  private events:NeighborhoodEvents;
  private input={x:0,y:0};private accumulator=0;private dialogue="";private speaker="";private lastView="";
  constructor(progress:NeighborhoodProgress,events:NeighborhoodEvents){this.events=events;this.progress=sanitizeNeighborhoodProgress(progress);}
  /** Reuse the existing rig without constructing a combat simulation. */
  get animationState():KnopikAnimationState {return {player:this.player,moving:this.moving,walkDistance:this.walkDistance,area:"apartment",weapon:"fist",punchTime:0,punchSerial:0,dodgeTime:0,checkpoint:3,tutorialOpened:true,seated:this.seated,carrying:this.progress.tracked==="delivery"&&this.progress.missions.delivery.status===1&&this.progress.missions.delivery.steps===0};}
  canStand(x:number,y:number,r=13):boolean{
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r)||r<0)return false;
    if(x<25+r||x>2375-r||y<175+r)return false;
    const deck=NEIGHBORHOOD_BOARDWALK;
    if(y>1697-r&&!(x>deck.x+r&&x<deck.x+deck.w-r&&y<deck.y+deck.h-r))return false;
    return !NEIGHBORHOOD_SOLIDS.some(s=>Math.hypot(x-clamp(x,s.x,s.x+s.w),y-clamp(y,s.y,s.y+s.h))<r-.00001);
  }
  setInput(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y)){this.clearInput();return;}const n=Math.max(1,Math.hypot(x,y));this.input={x:x/n,y:y/n};if(x||y)this.seated=false;}
  clearInput(){this.input={x:0,y:0};this.moving=false;}
  private pointAvailable(id:NeighborhoodPointId){
    if(id==="badge")return this.progress.quest===1;if(id==="pebble")return !this.progress.pebble;if(id==="secret")return !this.progress.secret;
    if(!/^(bed-|repair-|litter-|photo-)/.test(id))return true;
    return NEIGHBORHOOD_MISSIONS.some(m=>{const i=m.actions.findIndex(a=>a===id),s=this.progress.missions[m.id];return i>=0&&s.status===1&&(s.steps&(1<<i))===0;});
  }
  nearestPoint(){
    if(this.dialogue||this.paused)return null;
    return [...NEIGHBORHOOD_POINTS].filter(p=>this.pointAvailable(p.id))
      .map(p=>({p,d:Math.hypot(this.player.x-p.x,this.player.y-p.y)})).filter(v=>v.d<85).sort((a,b)=>a.d-b.d)[0]?.p??null;
  }
  goal(){
    if(this.progress.tracked==="badge")return this.progress.quest<3?NEIGHBORHOOD_POINTS.find(p=>p.id===(this.progress.quest===1?"badge":"neighbor"))??null:null;
    if(this.progress.tracked){const id=this.progress.tracked,p=this.progress.missions[id];if(p.status!==2){const target=missionTarget(id,p);return NEIGHBORHOOD_POINTS.find(p=>p.id===target)??null;}}
    if(this.progress.quest===1||this.progress.quest===2)return NEIGHBORHOOD_POINTS.find(p=>p.id===(this.progress.quest===1?"badge":"neighbor"))??null;
    return null;
  }
  trackMission(id:NeighborhoodMissionId){if(!NEIGHBORHOOD_MISSIONS.some(m=>m.id===id)||this.progress.missions[id].status===2)return false;this.progress.tracked=id;this.save();this.notify();return true;}
  trackBadge(){if(this.progress.quest===3)return false;this.progress.tracked="badge";this.save();this.notify();return true;}
  view():NeighborhoodView{
    const cards=missionCards(this.progress),tracked=cards.find(m=>m.tracked);
    const point=this.nearestPoint();return {zone:neighborhoodZone(this.player.x,this.player.y),point:point?.id??null,interaction:point?.id==="bench"&&this.seated?"Встать с лавочки":point?.label??"",paused:this.paused,dialogue:this.dialogue,speaker:this.speaker,seated:this.seated,
      objective:tracked?.objective??(this.progress.quest===1?"Найди значок соседа в парке":this.progress.quest===2?"Верни значок соседу во дворе":this.progress.tracked==="badge"&&this.progress.quest===0?"Поговори с Мишей перед домом":"Гуляй, исследуй и возвращайся домой"),missions:cards,badgeQuest:this.progress.quest,photoSerial:this.photoSerial,goal:this.goal()};
  }
  private notify(){const view=this.view(),key=JSON.stringify(view);if(key!==this.lastView){this.lastView=key;this.events.change(view);}}
  pause(){this.clearInput();this.paused=true;this.notify();}
  resume(){this.clearInput();this.accumulator=0;this.paused=false;this.notify();}
  closeDialogue(){this.dialogue="";this.clearInput();this.notify();}
  private say(speaker:string,line:string){this.speaker=speaker;this.dialogue=line;this.clearInput();}
  private save(){this.events.progress(sanitizeNeighborhoodProgress(this.progress));}
  private handleMission(point:NeighborhoodPointId){
    const ordered=[...NEIGHBORHOOD_MISSIONS].sort((a,b)=>Number(b.id===this.progress.tracked)-Number(a.id===this.progress.tracked));
    for(const m of ordered){const s=this.progress.missions[m.id],i=m.actions.findIndex(a=>a===point);
      if(s.status===1&&i>=0&&(s.steps&(1<<i))===0&&(m.id!=="cat"||i===0||!!(s.steps&1))){
        s.steps|=1<<i;this.progress.tracked=m.id;
        if(m.id==="photos")this.photoSerial++;
        const text=m.id==="garden"?"Вода впиталась в землю. Ростки расправляют листья, а цветы становятся ярче.":m.id==="lights"?"Новая лампа на месте. Крышка закрыта, фонарь снова готов освещать улицу.":m.id==="shore"?"Мусор убран в мешок. Это место на набережной теперь чистое.":m.id==="photos"?"Щёлк! Снимок сохранён для альбома.":m.id==="delivery"?"Спасибо за посылку! Чай для соседского вечера как раз закончился. Передай Рите, что всё дошло.":point==="kiosk"?"Вот корм для Плюша. Найдёшь его у палисадников в соседнем дворе. Поставь миску рядом — кот сам подойдёт.":"Плюш подошёл к миске и замурлыкал. Теперь можно рассказать Даше, где он прятался.";
        this.save();this.say(m.id==="delivery"?"Сосед Миша":m.id==="cat"&&point==="kiosk"?"Рита":"Кнопик",text);return true;
      }
    }
    for(const m of ordered){if(m.giver!==point)continue;const s=this.progress.missions[m.id];
      if(s.status===0){s.status=1;this.progress.tracked=m.id;this.save();this.say(m.person,m.intro);}
      else if(s.status===1&&s.steps===missionMask(m.id)){s.status=2;this.progress.tracked=NEIGHBORHOOD_MISSIONS.find(n=>this.progress.missions[n.id].status===1)?.id??null;this.save();this.say(m.person,`${m.done} Получено: ${m.reward}.`);}
      else if(s.status===1){this.progress.tracked=m.id;this.save();this.say(m.person,missionCards(this.progress).find(c=>c.id===m.id)!.objective+". Я подожду здесь.");}
      else this.say(m.person,`Спасибо за помощь! «${m.title}» уже завершено. ${m.reward} ждёт тебя дома.`);
      return true;
    }return false;
  }
  interact(){
    const point=this.nearestPoint();if(!point)return false;this.clearInput();this.events.sound();
    if(this.handleMission(point.id)){this.notify();return true;}
    switch(point.id){
      case "home":this.events.home();return true;
      case "run":this.paused=true;this.events.run();break;
      case "neighbor":
        if(this.progress.quest===0){this.progress.quest=1;this.save();this.say("Сосед Миша","Привет, Кнопик! Гулял в парке и потерял значок с липовым листом. Кажется, возле старой лавочки. Если найдёшь — принеси, пожалуйста.");}
        else if(this.progress.quest===1)this.say("Сосед Миша","У старой лавочки в парке трава высокая. Значок медный, с маленьким листом. А к реке можно пройти и через парк, и между нашими домами.");
        else if(this.progress.quest===2){this.progress.quest=3;if(this.progress.tracked==="badge")this.progress.tracked=null;this.save();this.say("Сосед Миша","Вот он! Спасибо, Кнопик. Держи открытку с нашей набережной. Поставь дома на полку — будет напоминать о первой прогулке.");}
        else this.say("Сосед Миша","Открытка уже ждёт тебя дома. Люблю наш квартал: дома невысокие, все друг друга знают. Вечером у реки особенно красиво.");break;
      case "badge":this.progress.quest=2;this.save();this.say("Кнопик","В траве блестит медный значок с липовым листом. Это тот самый! Надо вернуть его Мише.");break;
      case "pebble":this.progress.pebble=true;this.save();this.say("Кнопик","Гладкий бирюзовый камешек, будто в нём остался кусочек реки. Возьму домой и положу рядом с чашкой.");break;
      case "secret":this.progress.secret=true;this.save();this.say("Кнопик","Под корнями — маленький бумажный фонарик и записка: «Пусть у тебя всегда будет уютный свет». Дома найдётся место для него.");break;
      case "bench":this.seated=!this.seated;if(this.seated){this.player.angle=Math.PI/2;this.say("Кнопик","Листья шуршат, где-то звенит велосипед. Можно немного посидеть. Чтобы встать, просто начни двигаться.");}break;
      case "river":this.say("Кнопик","Вода тихо стучит о настил. На другом берегу тоже светятся окна. Город большой, а этот маленький уголок — мой.");break;
      case "kiosk":this.say("Продавец Рита","Привет! Сегодня просто гуляешь? Парк прямо за переходом, река — дальше по аллее. А на большой улице снова слышно «тун-тун-тун»… Лучше приготовься к погоне.");break;
      case "gardener":this.say("Садовница Нина","Эти липы посадили ещё до моего рождения. Видишь, у каждого дерева своя крона. Сядь на лавочку — птицы вернутся, когда станет тихо.");break;
      case "cat":this.say("Кнопик","Кис-кис! Кот посмотрел, махнул хвостом и снова улёгся на тёплые камни. Кажется, он здесь главный.");break;
      case "notice":this.say("Объявления квартала","Нине нужна помощь с палисадником, Рита ждёт курьера, Костя чинит фонари. Борис убирает берег, Лена собирает альбом, а Даша ищет Плюша. Открой «Задания» и выбери историю — место появится на карте.");break;
      case "fountain":this.say("Кнопик","Вода звенит в каменной чаше. Здесь соседи встречаются после прогулок, а птицы прилетают попить.");break;
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
