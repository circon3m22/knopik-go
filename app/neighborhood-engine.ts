import { LAB_SOURCES,LAB_MATERIALS,type LabSourceId } from "./laboratory-engine.ts";
import { EMPTY_EQUIPMENT, type KnopikEquipment } from "./knopik-equipment-state.ts";
import { KNOPIK_ROLL_DURATION } from "./knopik-roll.ts";
import { NEIGHBORHOOD_POINTS, NEIGHBORHOOD_SPAWN, neighborhoodZone, type NeighborhoodPointId } from "./neighborhood-map.ts";
import {neighborhoodCanStand} from './neighborhood-collision.ts';
import { beginNeighborhoodVisit, sanitizeNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress.ts";
import { NeighborhoodCrowd } from "./neighborhood-crowd.ts";
import { createNeighborhoodWork, createNeighborhoodFind, NEIGHBORHOOD_WORK, type NeighborhoodWork } from "./neighborhood-work.ts";
import type { KnopikAnimationState } from "./knopik-adventure-animation.ts";
import { NEIGHBORHOOD_MISSIONS, missionCards, missionMask, missionTarget, type NeighborhoodMissionId, type MissionCard } from "./neighborhood-missions.ts";
export type NeighborhoodView={harvestNotice:string;zone:string;interaction:string;point:NeighborhoodPointId|null;paused:boolean;dialogue:string;speaker:string;seated:boolean;objective:string;missions:MissionCard[];badgeQuest:number;photoSerial:number;goal:{x:number;y:number;label:string}|null;working:boolean;workProgress:number;workLabel:string;dodgeReady:boolean;dodging:boolean};
export type NeighborhoodEvents={canHarvest?:(id:LabSourceId)=>boolean;gather?:(id:LabSourceId)=>boolean;change:(view:NeighborhoodView)=>void;progress:(value:NeighborhoodProgress)=>void;home:()=>void;run:()=>void;sound:()=>void;dodgeSound?:()=>void};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class NeighborhoodEngine {
  player={...NEIGHBORHOOD_SPAWN,angle:Math.PI/2,hp:3};
  moving=false;walkDistance=0;time=0;paused=false;seated=false;
  photoSerial=0;
  harvestNotice="";private harvestNoticeUntil=0;
  canGather(id:LabSourceId){return this.events.canHarvest?.(id)??false;}
  equipment:KnopikEquipment=EMPTY_EQUIPMENT;
  setEvents(value:NeighborhoodEvents){this.events=value;}
  setEquipment(value:KnopikEquipment){this.equipment=value;}
  dodgeTime=0;dodgeCooldown=0;private dodgeX=0;private dodgeY=0;
  crowd=new NeighborhoodCrowd();
  action:NeighborhoodWork|null=null;
  private visitStarted=false;
  progress:NeighborhoodProgress;
  private events:NeighborhoodEvents;
  private input={x:0,y:0};private accumulator=0;private dialogue="";private speaker="";private lastView="";
  constructor(progress:NeighborhoodProgress,events:NeighborhoodEvents){this.events=events;this.progress=sanitizeNeighborhoodProgress(progress);}
  beginVisit(){if(this.visitStarted)return false;this.visitStarted=true;this.progress=beginNeighborhoodVisit(this.progress);this.save();this.notify();return true;}
  get talking(){return !!this.dialogue;}
  /** Reuse the existing rig without constructing a combat simulation. */
  get animationState():KnopikAnimationState {const a=this.action,p=a?a.elapsed/a.duration:0,climbing=a?.kind==="repair"&&(p<.23||p>.78);return {equipment:this.equipment,player:this.player,moving:this.moving||climbing,walkDistance:climbing?a!.elapsed*40:this.walkDistance,area:"apartment",weapon:"fist",punchTime:0,punchSerial:0,dodgeTime:this.dodgeTime,checkpoint:3,tutorialOpened:true,seated:this.seated,carrying:!a&&this.progress.tracked==="delivery"&&this.progress.missions.delivery.status===1&&this.progress.missions.delivery.steps===0,working:a?{kind:a.kind,elapsed:a.elapsed,progress:p}:undefined};}
  canStand(x:number,y:number,r=13):boolean{
    return neighborhoodCanStand(x,y,r);
  }
  setInput(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y)){this.clearInput();return;}if((x||y)&&this.action)this.cancelWork();const n=Math.max(1,Math.hypot(x,y));this.input={x:x/n,y:y/n};if(x||y)this.seated=false;}
  dodge(){
    if(this.paused||this.dialogue||this.dodgeCooldown>0)return false;
    const input={...this.input},n=Math.hypot(input.x,input.y);
    if(this.action)this.cancelWork();this.seated=false;
    this.dodgeX=n>.1?input.x/n:Math.cos(this.player.angle);this.dodgeY=n>.1?input.y/n:Math.sin(this.player.angle);
    this.player.angle=Math.atan2(this.dodgeY,this.dodgeX);
    this.dodgeTime=KNOPIK_ROLL_DURATION;this.dodgeCooldown=.66;this.events.dodgeSound?.();this.notify();return true;
  }
  clearInput(){this.input={x:0,y:0};this.moving=false;}
  private pointAvailable(id:NeighborhoodPointId){
    if(LAB_SOURCES.some(s=>s.id===id))return this.canGather(id as LabSourceId);
    if(id==="badge")return this.progress.quest===1;if(id==="pebble")return !this.progress.pebble;if(id==="secret")return !this.progress.secret;
    if(!/^(bed-|repair-|litter-|photo-)/.test(id))return true;
    return NEIGHBORHOOD_MISSIONS.some(m=>{const i=m.actions.findIndex(a=>a===id),s=this.progress.missions[m.id];return i>=0&&s.status===1&&(s.steps&(1<<i))===0;});
  }
  nearestPoint(){
    if(this.dialogue||this.paused||this.action||this.dodgeTime>0)return null;
    let nearest:typeof NEIGHBORHOOD_POINTS[number]|null=null,distance=85*85;
    for(const p of NEIGHBORHOOD_POINTS){const dx=this.player.x-p.x,dy=this.player.y-p.y,d=dx*dx+dy*dy;if(d<distance&&this.pointAvailable(p.id)){nearest=p;distance=d;}}
    return nearest;
  }
  goal(){
    if(this.progress.tracked==="badge")return this.progress.quest<3?NEIGHBORHOOD_POINTS.find(p=>p.id===(this.progress.quest===1?"badge":"neighbor"))??null:null;
    if(this.progress.tracked){const id=this.progress.tracked,p=this.progress.missions[id];if(p.status!==2){const target=missionTarget(id,p);return NEIGHBORHOOD_POINTS.find(p=>p.id===target)??null;}}
    if(this.progress.quest===1||this.progress.quest===2)return NEIGHBORHOOD_POINTS.find(p=>p.id===(this.progress.quest===1?"badge":"neighbor"))??null;
    return null;
  }
  trackMission(id:NeighborhoodMissionId){if(!NEIGHBORHOOD_MISSIONS.some(m=>m.id===id)||this.progress.missions[id].status===2||this.progress.missions[id].status===0&&this.progress.offer!==id)return false;if(this.action&&this.action.mission!==id)this.cancelWork();this.progress.tracked=id;this.save();this.notify();return true;}
  trackBadge(){if(this.progress.quest===3)return false;this.cancelWork();this.progress.tracked="badge";this.save();this.notify();return true;}
  view():NeighborhoodView{
    const cards=missionCards(this.progress),tracked=cards.find(m=>m.tracked);
    const point=this.nearestPoint();return {harvestNotice:this.time<this.harvestNoticeUntil?this.harvestNotice:"",zone:neighborhoodZone(this.player.x,this.player.y),point:point?.id??null,interaction:(point?.id==="bench"||point?.id==="east-bench")&&this.seated?"Встать с лавочки":point?.label??"",paused:this.paused,dialogue:this.dialogue,speaker:this.speaker,seated:this.seated,
      objective:tracked?.objective??(this.progress.quest===1?"Найди значок соседа в парке":this.progress.quest===2?"Верни значок соседу во дворе":this.progress.tracked==="badge"&&this.progress.quest===0?"Поговори с Фомой перед домом":"Гуляй, исследуй и возвращайся домой"),missions:cards,badgeQuest:this.progress.quest,photoSerial:this.photoSerial,goal:this.goal(),working:!!this.action,workProgress:this.action?Math.floor(this.action.elapsed/this.action.duration*50)*2:0,workLabel:this.action?NEIGHBORHOOD_WORK[this.action.kind].label:"",dodgeReady:this.dodgeCooldown<=0,dodging:this.dodgeTime>0};
  }
  private notify(){const view=this.view(),key=JSON.stringify(view);if(key!==this.lastView){this.lastView=key;this.events.change(view);}}
  pause(){this.clearInput();this.paused=true;this.notify();}
  resume(){this.clearInput();this.accumulator=0;this.paused=false;this.notify();}
  closeDialogue(){this.dialogue="";this.clearInput();this.notify();}
  private say(speaker:string,line:string){this.speaker=speaker;this.dialogue=line;this.clearInput();}
  private save(){this.events.progress(sanitizeNeighborhoodProgress(this.progress));}
  cancelWork(){if(!this.action)return false;this.action=null;this.clearInput();this.notify();return true;}
  private finishWork(){
    const a=this.action;if(!a)return;this.action=null;
    const source=LAB_SOURCES.find(s=>s.id===a.point);
    if(source){if(this.events.gather?.(source.id)){this.harvestNotice=`${LAB_MATERIALS[source.material].name} +${source.amount} · в лабораторию`;this.harvestNoticeUntil=this.time+3.5;this.events.sound();}return;}
    if(!a.mission){
      if(a.point==="badge"){this.progress.quest=2;this.say("Кнопик","В траве блестит медный значок с липовым листом. Это тот самый! Надо вернуть его Фоме.");}
      else if(a.point==="pebble"){this.progress.pebble=true;this.say("Кнопик","Гладкий бирюзовый камешек, будто в нём остался кусочек реки. Возьму домой и положу рядом с чашкой.");}
      else {this.progress.secret=true;this.say("Кнопик","Под корнями — маленький бумажный фонарик и записка: «Пусть у тебя всегда будет уютный свет». Дома найдётся место для него.");}
      this.save();this.events.sound();return;
    }
    const state=this.progress.missions[a.mission];
    if(state.status!==1||state.steps&(1<<a.step))return;
    state.steps|=1<<a.step;this.progress.tracked=a.mission;this.save();this.events.sound();
    if(a.kind==="handoff")this.say("Сосед Фома","Спасибо за посылку! Чай для соседского вечера как раз закончился. Передай Альберту, что всё дошло.");
    else if(a.kind==="food")this.say("Альберт","Вот корм для Плюша. Поставь миску рядом с ним в соседнем дворе — он сам подойдёт.");
  }
  private handleMission(point:NeighborhoodPointId){
    const ordered=[...NEIGHBORHOOD_MISSIONS].sort((a,b)=>Number(b.id===this.progress.tracked)-Number(a.id===this.progress.tracked));
    for(const m of ordered){const s=this.progress.missions[m.id],i=m.actions.findIndex(a=>a===point);
      if(s.status===1&&i>=0&&(s.steps&(1<<i))===0&&(m.id!=="cat"||i===0||!!(s.steps&1))){
        this.progress.tracked=m.id;this.action=createNeighborhoodWork(m.id,i,point);this.player.angle=Math.atan2(this.action.y-this.player.y-(m.id==="garden"?40:0),this.action.x-this.player.x-(m.id==="lights"?40:0));this.clearInput();return true;
      }
    }
    for(const m of ordered){if(m.giver!==point)continue;const s=this.progress.missions[m.id];
      if(s.status===0){if(this.progress.offer!==m.id)continue;s.status=1;this.progress.offer=null;this.progress.tracked=m.id;this.save();this.say(m.person,m.intro);}
      else if(s.status===1&&s.steps===missionMask(m.id)){s.status=2;this.progress.tracked=NEIGHBORHOOD_MISSIONS.find(n=>this.progress.missions[n.id].status===1)?.id??null;this.save();this.say(m.person,`${m.done} Получено: ${m.reward}.`);}
      else if(s.status===1){this.progress.tracked=m.id;this.save();this.say(m.person,missionCards(this.progress).find(c=>c.id===m.id)!.objective+". Я подожду здесь.");}
      else this.say(m.person,`Спасибо за помощь! «${m.title}» уже завершено. ${m.reward} ждёт тебя дома.`);
      return true;
    }return false;
  }
  interact(){
    const point=this.nearestPoint();if(!point)return false;this.clearInput();this.events.sound();
    const source=LAB_SOURCES.find(s=>s.id===point.id);if(source){this.action=createNeighborhoodFind(source.id);this.player.angle=Math.atan2(source.y-this.player.y,source.x-this.player.x);this.notify();return true;}
    if(this.handleMission(point.id)){this.notify();return true;}
    switch(point.id){
      case "home":this.events.home();return true;
      case "run":this.paused=true;this.events.run();break;
      case "neighbor":
        if(this.progress.quest===0){this.progress.quest=1;this.save();this.say("Сосед Фома","Привет, Кнопик! Гулял в парке и потерял значок с липовым листом. Кажется, возле старой лавочки. Если найдёшь — принеси, пожалуйста.");}
        else if(this.progress.quest===1)this.say("Сосед Фома","У старой лавочки в парке трава высокая. Значок медный, с маленьким листом. А к реке можно пройти и через парк, и между нашими домами.");
        else if(this.progress.quest===2){this.progress.quest=3;if(this.progress.tracked==="badge")this.progress.tracked=null;this.save();this.say("Сосед Фома","Вот он! Спасибо, Кнопик. Держи открытку с нашей набережной. Поставь дома на полку — будет напоминать о первой прогулке.");}
        else this.say("Сосед Фома","Открытка уже ждёт тебя дома. Люблю наш квартал: дома невысокие, все друг друга знают. Вечером у реки особенно красиво.");break;
      case "badge":case "pebble":case "secret":this.action=createNeighborhoodFind(point.id);break;
      case "east-bench":case "bench":this.seated=!this.seated;if(this.seated){this.player.angle=Math.PI/2;this.say("Кнопик","Листья шуршат, где-то звенит велосипед. Можно немного посидеть. Чтобы встать, просто начни двигаться.");}break;
      case "east-river":case "river":this.say("Кнопик","Вода тихо стучит о настил. На другом берегу тоже светятся окна. Город большой, а этот маленький уголок — мой.");break;
      case "kiosk":this.say("Киоскёр Альберт","Привет! Сегодня просто гуляешь? Парк прямо за переходом, река — дальше по аллее. А на большой улице снова слышно «тун-тун-тун»… Лучше приготовься к погоне.");break;
      case "gardener":this.say("Садовник Фёкл","Эти липы посадили ещё до моего рождения. Видишь, у каждого дерева своя крона. Сядь на лавочку — птицы вернутся, когда станет тихо.");break;
      case "caretaker":this.say("Дэнис","Проверяю свет в нашем квартале. Сегодня инструменты отдыхают — можно погулять до реки.");break;
      case "fisher":this.say("Норман","Сегодня вода тихая. Посиди у реки: иногда утки подплывают к самому настилу.");break;
      case "photographer":this.say("Боб","Свет каждый день меняет наш квартал. Скоро найдём новые кадры, а сейчас я просто любуюсь липами.");break;
      case "girl":this.say("Оскар","Хорошо, что можно гулять рядом с домом. Плюш где-то в палисадниках — здесь он чувствует себя хозяином.");break;
      case "cat":this.say("Кнопик","Кис-кис! Кот посмотрел, махнул хвостом и снова улёгся на тёплые камни. Кажется, он здесь главный.");break;
      case "notice":this.say("Объявления квартала",this.progress.offer?`Сегодня ${NEIGHBORHOOD_MISSIONS.find(m=>m.id===this.progress.offer)!.person} хочет поговорить с тобой. Просьба отмечена в журнале. Новые истории появляются в другие прогулки.`:"Сегодня свежих просьб на доске нет. Можно закончить начатые дела или просто погулять. В следующий раз загляни снова.");break;
      case "bookseller":this.say("Букинист Мирон","У каждого окна здесь своя история. Я собираю их по крупицам: кому книга, кому открытка. Загляни в сад за часовой башней — там чудесно пахнет лимонами.");break;
      case "florist":this.say("Цветочница Тася","В оранжерее растут цитрусы, а под навесом — глициния. Посмотри на стекло: в каждом переплёте отражается наш сад.");break;
      case "baker":this.say("Пекарь Семён","Хлеб уже на полке, чайник ещё тёплый. Через площадь можно пройти к новому настилу над рекой — там слышно, как вода стучит о сваи.");break;
      case "greenhouse":this.say("Кнопик","За стеклом — лимонные деревца, аккуратные горшки и деревянные полки. На стёклах поблёскивает свет, а под крышей совсем тепло.");break;
      case "square-clock":this.say("Кнопик","На чугунных часах ещё видны следы старой краски. Когда-то здесь встречались мастера со всей улицы. И сейчас площадь не пустует.");break;
      case "fountain":this.say("Кнопик","Вода звенит в каменной чаше. Здесь соседи встречаются после прогулок, а птицы прилетают попить.");break;
    }
    this.notify();return true;
  }
  advance(seconds:number){
    if(!Number.isFinite(seconds)||seconds<=0)return;
    if(this.paused){this.moving=false;return;}
    this.accumulator+=clamp(seconds,0,.1);
    while(this.accumulator>=1/60){this.accumulator-=1/60;this.time+=1/60;
      this.crowd.step(1/60,this.player,(x,y,r)=>this.canStand(x,y,r));
      if(this.dialogue){this.moving=false;continue;}
      this.dodgeCooldown=Math.max(0,this.dodgeCooldown-1/60);
      if(this.action){this.moving=false;this.action.elapsed+=1/60;if(this.action.kind==="photo"&&!this.action.shuttered&&this.action.elapsed>this.action.duration*.57){this.action.shuttered=true;this.photoSerial++;this.events.sound();}if(this.action.elapsed+1e-8>=this.action.duration)this.finishWork();if(this.dialogue){this.accumulator=0;break;}continue;}
      const dodging=this.dodgeTime>0,stepTime=dodging?Math.min(this.dodgeTime,1/60):1/60;
      const dx=(dodging?this.dodgeX*440:this.input.x*145)*stepTime,dy=(dodging?this.dodgeY*440:this.input.y*145)*stepTime,ox=this.player.x,oy=this.player.y;
      if(dodging)this.dodgeTime=Math.max(0,this.dodgeTime-1/60);
      if(dx||dy)this.player.angle=Math.atan2(dy,dx);
      const slices=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
      for(let i=0;i<slices;i++){if(this.canStand(this.player.x+dx/slices,this.player.y))this.player.x+=dx/slices;if(this.canStand(this.player.x,this.player.y+dy/slices))this.player.y+=dy/slices;}
      const step=Math.hypot(this.player.x-ox,this.player.y-oy);this.moving=step>.01;this.walkDistance+=step;
    }this.notify();
  }
}
