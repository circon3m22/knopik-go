"use client";
import {getGraphicsQuality} from "./graphics-quality";
import {useEffect,useMemo,useRef,useState} from "react";
import {AdventureRenderer,AdventureScene,AdventureHeart} from "./adventure-artwork";
import {AdventureWeaponArt} from "./adventure-level-art";
import {DungeonMap} from "./dungeon-menu";
import {GameModal} from "./game-modal";
import {GameUiIcon} from "./game-ui-icon";
import {CoopGameControls} from "./coop-controls";
import {CoopEngine,readCoopSnapshot,type CoopSnapshot} from "./coop-engine";
import {CoopInputInbox,COOP_INPUT_MS,COOP_STATE_MS,COOP_STALE_MS,idleCoopControls,type CoopRoom} from "./coop-protocol";
import {packCoopSnapshot,unpackCoopSnapshot} from "./coop-wire";
import {CoopAutoAdvance,nextCoopRoute} from "./coop-progression";
import {CoopHostMotion,CoopLocalMotion,CoopSnapshotBuffer,CoopRemotePose} from "./coop-motion";
import {coopWorldKey,type CoopSession} from "./coop-session";
import type {ThemeId} from "./cosmetic-engine";
import {ADVENTURE_WEAPONS,type AdventureWeapon} from "./adventure-levels";
import type {AdventureSound} from "./adventure-engine";
import {runnerFramePainted,runnerFrameRateActive} from "./frame-rate";
import {FramePaintLimiter,type FpsLimit,type WorldGraphicsMode} from "./render-preferences";

type Hud={hp:number;otherHp:number;room:number;otherRoom:number;cleared:number;phase:string;dodgeReady:boolean;revive:number;down:boolean;waiting:boolean;weapon:AdventureWeapon;objective:string;interaction:string;energyReady:boolean;cape:boolean;notice:string};
export function CoopGame({session,room,theme,fpsLimit,worldGraphics,onLeave,onSound,busyLeaving=false}:{busyLeaving?:boolean;session:CoopSession;room:CoopRoom;theme:ThemeId;fpsLimit:FpsLimit;worldGraphics:WorldGraphicsMode;onLeave:()=>void;onSound:(sound:AdventureSound)=>void}){
 const slot=session.slot,other=slot===0?1:0,round=room.round,worldKey=coopWorldKey(room);
 const controls=useRef(idleCoopControls()),remote=useRef(new CoopInputInbox());
 const soundRef=useRef(onSound);useEffect(()=>{soundRef.current=onSound;},[onSound]);
 const sceneCoop=useMemo(()=>({slot,self:slot===0?room.host_name:room.guest_name??"Напарник",partner:slot===0?room.guest_name??"Напарник":room.host_name}),[slot,room.host_name,room.guest_name]);
 const [engine]=useState(()=>{
  const e=new CoopEngine(room.seed,room.round,onSound,room);
  if(slot===0){try{const saved=JSON.parse(sessionStorage.getItem(coopWorldKey(room))??"null"),state=readCoopSnapshot(saved,e);if(state)e.applySnapshot(state);}catch{}}
  return e;
 });
 const svg=useRef<SVGSVGElement>(null);
 const [paused,setPaused]=useState(false),[map,setMap]=useState(false),[leaving,setLeaving]=useState(false);
 const localPaused=useRef(false),mapRef=useRef(false),leavingRef=useRef(false),latestSnapshot=useRef(-Infinity);
 const fpsRef=useRef(fpsLimit);useEffect(()=>{fpsRef.current=fpsLimit;},[fpsLimit]);
 const inputApi=useMemo(()=>({set:(patch:Partial<ReturnType<typeof idleCoopControls>>)=>{if(patch.interact===true&&!controls.current.interact)controls.current.action++;Object.assign(controls.current,patch);},dodge:()=>{controls.current.dodge++;},energy:()=>{controls.current.energy++;}}),[]);
 const [hud,setHud]=useState<Hud>({hp:3,otherHp:3,room:0,otherRoom:0,cleared:0,phase:"paused",dodgeReady:true,revive:0,down:false,waiting:true,weapon:engine.weapon,objective:engine.coopObjective,interaction:"Действие / помощь · E",energyReady:true,cape:false,notice:""});
 const pause=()=>{if(engine.phase==="won"||engine.phase==="dead")return;controls.current.paused=true;localPaused.current=true;setPaused(true);};
 const resume=()=>{controls.current.paused=false;localPaused.current=false;setPaused(false);setMap(false);mapRef.current=false;};
 useEffect(()=>{
  controls.current.weapon=engine.actors[slot].weapon;controls.current.energy=engine.actors[slot].energySerial;controls.current.action=engine.actors[slot].actionSerial;
  let sequence=0,stateAt=0,inputAt=0,hudAt=0,saveAt=0,previous=0,frame=0,lastSeq=0;
  let current:CoopSnapshot|null=null;
  const progression=new CoopAutoAdvance();
  const localMotion=new CoopLocalMotion(),buffer=new CoopSnapshotBuffer(),remotePose=new CoopRemotePose();
  let hostMotion=new CoopHostMotion();
  let correction={x:0,y:0},peerEpoch="";
  const clientId=crypto.randomUUID();
  const receive=session.onPacket(packet=>{
   if(packet.round!==round)return;
   if(slot===0&&packet.type==="input"&&typeof packet.clientId==="string"){const freshClient=peerEpoch!==packet.clientId;if(freshClient){peerEpoch=packet.clientId;remote.current=new CoopInputInbox();hostMotion=new CoopHostMotion();engine.guestOwnsMovement=false;}if(remote.current.accept(packet.seq,packet.controls,performance.now())){if(freshClient){remote.current.lastDodge=remote.current.controls.dodge;engine.actors[1].energySerial=remote.current.controls.energy;engine.actors[1].actionSerial=remote.current.controls.action;}if(!localPaused.current&&!remote.current.controls.paused&&engine.actors[1].player.hp>0&&!["dead","won"].includes(engine.phase))hostMotion.accept(engine,packet.motion,performance.now());}}
   if(slot===1&&packet.type==="state"){
    const state=unpackCoopSnapshot(packet.world,engine);if(!state||state.seq<=lastSeq)return;
    lastSeq=state.seq;const before={...engine.actors[1].player},first=current===null;
    current=state;latestSnapshot.current=performance.now();buffer.push(state,latestSnapshot.current);
    const revision=packet.motionVersion===1?(packet.motionClientId===clientId&&Number.isSafeInteger(packet.motionRevision)&&Number(packet.motionRevision)>=0?Number(packet.motionRevision):0):null;
    localMotion.reconcile(engine,state,revision);
    if(Array.isArray(packet.sounds))for(const sound of packet.sounds.slice(0,8))if(["knock","punch","hit","dodge","shot","defeat","door","win","coin","heal","revive","blast","arc","shotgun"].includes(sound))soundRef.current(sound);
    const authoritative=engine.actors[1].player;
    const age=Math.min(.15,session.snapshot().latency/2000);
    const n=Math.max(1,Math.hypot(controls.current.x,controls.current.y)),actor=state.actors[1],vx=actor.dodgeTime>0?actor.dodgeX*440:controls.current.x/n*154,vy=actor.dodgeTime>0?actor.dodgeY*440:controls.current.y/n*154;
    const target={x:authoritative.x+vx*age,y:authoritative.y+vy*age};
    if(revision!==null)correction={x:0,y:0};
    else if(!first&&state.phase==="playing"&&authoritative.hp>0&&Math.hypot(before.x-target.x,before.y-target.y)<100&&engine.canStand(before.x,before.y)){
      correction={x:target.x-before.x,y:target.y-before.y};authoritative.x=before.x;authoritative.y=before.y;
    }else correction={x:0,y:0};
   }
  });
  const element=svg.current;if(!element)return receive;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderQuality=element.getAttribute("data-render-quality")??getGraphicsQuality();
  let renderer=new AdventureRenderer(element,motion.matches||renderQuality==="low");
  const limiter=new FramePaintLimiter();
  const resize=()=>{const r=element.getBoundingClientRect();renderer.resize(r.width,r.height);};
  const changeMotion=()=>{renderer=new AdventureRenderer(element,motion.matches||renderQuality==='low');resize();};
  motion.addEventListener('change',changeMotion);
    const frameRateOwner=Symbol('coop');
  const observer=new ResizeObserver(resize);observer.observe(element);resize();runnerFrameRateActive(true,frameRateOwner);
  const tick=(now:number)=>{
   const visibleQuality=element.getAttribute("data-render-quality");
   if(visibleQuality&&visibleQuality!==renderQuality){renderQuality=visibleQuality;renderer=new AdventureRenderer(element,motion.matches||renderQuality==="low");resize();}
   const before=performance.now(),dt=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
   const connection=session.snapshot();
   const linked=connection.connected&&connection.peerOnline&&connection.peerVisible&&connection.error==="";
   const c=controls.current;c.paused=localPaused.current||document.hidden||leavingRef.current;
   if(now-inputAt>=COOP_INPUT_MS){
    inputAt=now;
    if(slot===1)session.send({type:"input",seq:++sequence,controls:{...c},clientId,...(current?{motion:localMotion.packet(engine.actors[1])}:{})});
   }
   let waiting=!linked;
   if(slot===0){
    // Guest input has its own deadline, independent of the socket heartbeat.
    const peer=remote.current;
    waiting=waiting||!peer.fresh(now);
    if(waiting||c.paused||peer.controls.paused){engine.pause();engine.clearControls();}
    else if(!["dead","won"].includes(engine.phase)){
      engine.resume();engine.setControls(0,c,c.dodge>hostDodge);hostDodge=c.dodge;
      engine.setControls(1,peer.controls,peer.takeDodge());engine.advance(dt);
    }
    hostMotion.syncLife(engine);
    if(now-stateAt>=COOP_STATE_MS){stateAt=now;const world=engine.snapshot();session.send({type:"state",world:packCoopSnapshot(world),sounds:engine.drainSounds(),motionVersion:1,...(hostMotion.active?{motionClientId:peerEpoch,motionRevision:hostMotion.revision}:{})});
      if(now-saveAt>1000){saveAt=now;try{sessionStorage.setItem(worldKey,JSON.stringify(world));}catch{}}
    }
   }else{
    waiting=waiting||now-latestSnapshot.current>COOP_STALE_MS;
    if(!waiting&&!c.paused&&engine.phase==="playing"){
      engine.predict(1,c,dt);localMotion.record(engine.actors[1],now);
      const a=engine.actors[1].player,factor=Math.min(1,dt*12),dx=correction.x*factor,dy=correction.y*factor;
      if(engine.canStand(a.x+dx,a.y+dy)){a.x+=dx;a.y+=dy;}correction.x-=dx;correction.y-=dy;
      engine.time+=dt;engine.effects.step(dt);
    }
    const interpolation=buffer.sample(now);
    if(interpolation){
      const {t,prev,next}=interpolation;
      const a=engine.actors[0],b=prev.actors[0],d=next.actors[0];a.player.x=b.player.x+(d.player.x-b.player.x)*t;a.player.y=b.player.y+(d.player.y-b.player.y)*t;a.walkDistance=b.walkDistance+(d.walkDistance-b.walkDistance)*t;a.player.angle=b.player.angle+Math.atan2(Math.sin(d.player.angle-b.player.angle),Math.cos(d.player.angle-b.player.angle))*t;
      engine.enemies.forEach((e,i)=>{const b=prev.enemies[i],d=next.enemies[i];e.x=b.x+(d.x-b.x)*t;e.y=b.y+(d.y-b.y)*t;e.walkDistance=b.walkDistance+(d.walkDistance-b.walkDistance)*t;e.angle=b.angle+Math.atan2(Math.sin(d.angle-b.angle),Math.cos(d.angle-b.angle))*t;});
      engine.bullets.forEach((b,i)=>{const p=prev.bullets[i],n=next.bullets[i];if(p.active&&n.active&&p.life>=n.life){b.x=p.x+(n.x-p.x)*t;b.y=p.y+(n.y-p.y)*t;}});
    }
   }
   if(!document.hidden&&limiter.due(now,fpsRef.current)){
    const companion=engine.companion(other);
    if(slot===0)companion.player=remotePose.sample(companion.player,dt);
    engine.forPlayer(slot,()=>renderer.paint(engine,false,companion));
    runnerFramePainted(now,performance.now()-before);
   }
   if(engine.phase==="won"&&(localPaused.current||mapRef.current)){
    localPaused.current=false;mapRef.current=false;c.paused=document.hidden||leavingRef.current;setPaused(false);setMap(false);
   }
   if(progression.due(now,slot===0&&engine.phase==="won"&&nextCoopRoute(room.mode,room.level_id)!==null&&linked&&!c.paused&&!remote.current.controls.paused&&!leavingRef.current&&!connection.busy)){
    void session.advance(round).then(success=>progression.settle(success,performance.now()));
   }
   if(now-hudAt>=100){hudAt=now;const a=engine.actors[slot],b=engine.actors[other];
    setHud({hp:a.player.hp,otherHp:b.player.hp,room:a.room,otherRoom:b.room,cleared:engine.cleared.filter(Boolean).length,phase:engine.phase,dodgeReady:a.dodgeCooldown<=0,revive:Math.max(a.reviveProgress,b.reviveProgress),down:a.player.hp<=0,waiting,weapon:a.weapon,objective:engine.coopObjective,interaction:engine.forPlayer(slot,()=>engine.coopInteraction),energyReady:a.energyCooldown<=0,cape:a.equipment.accessory==="cape",notice:(engine.dungeon?.noticeUntil??0)>engine.time?engine.dungeon!.notice:""});
   }
   frame=requestAnimationFrame(tick);
  };
  let hostDodge=0;
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener('change',changeMotion);receive();controls.current=idleCoopControls();engine.clearControls();runnerFrameRateActive(false,frameRateOwner);};
 },[engine,session,worldKey,round,slot,other,room.mode,room.level_id]);
 // Local view changes never advance the host simulation.
 const view=engine.forPlayer(slot,()=>engine.view());
 const terminal=hud.phase==="dead"||hud.phase==="won",blocked=hud.waiting||paused||map||hud.phase==="paused"||terminal||hud.down;
 const connection=session.snapshot();
 const names=[room.host_name,room.guest_name??"Напарник"];
 const status=connection.error||(!connection.connected?"Восстанавливаем соединение…":!connection.peerOnline?"Ждём подключения напарника…":!connection.peerVisible?"Напарник свернул игру. Ждём возвращения…":hud.waiting?"Синхронизируем игру…":!paused&&hud.phase==="paused"?"Напарник поставил игру на паузу":"");
 const nextRoute=nextCoopRoute(room.mode,room.level_id);
 const quit=()=>{leavingRef.current=true;setLeaving(true);pause();};
 return <GameModal className={`adventure-game coop-game pixel-game theme-${theme}`} label="Кооператив на двоих" onDismiss={pause}>
  <div className="adventure-layout coop-layout" data-world-graphics={worldGraphics}>
   <header className="coop-hud"><div className="coop-player-chips">{names.map((name,i)=><div key={i} className={`coop-player-chip coop-player-${i}`}><strong>{name}{i===slot?" · ты":""}</strong><span aria-label={`${i===slot?hud.hp:hud.otherHp} из 3 сердец`}>{[0,1,2].map(n=><AdventureHeart key={n} filled={n<(i===slot?hud.hp:hud.otherHp)}/>)}</span></div>)}</div><div className="coop-hud-actions"><small>{room.code} · {hud.cleared}/{engine.levelData.rooms.length} залов{connection.latency>0?` · ${connection.latency} мс`:""}</small><button type="button" className="adventure-pause" aria-label="Карта вылазки" disabled={terminal} onClick={()=>{pause();setMap(true);mapRef.current=true;}}><GameUiIcon kind="map"/></button><button type="button" className="adventure-pause" aria-label="Пауза" disabled={terminal} onClick={pause}><GameUiIcon kind="pause"/></button></div></header>
   <div className="adventure-viewport">
    <AdventureScene ref={svg} layout={engine.levelData} area="sewer" theme={theme} level={engine.level} coop={sceneCoop}/>
    {!blocked&&<div className="coop-objective">{hud.notice||hud.objective}{hud.otherRoom!==hud.room?` · Напарник в зале ${hud.otherRoom+1}`:""}</div>}
    {hud.revive>0&&!terminal&&<div className="coop-revive" role="status">Поднимаем напарника… <progress value={hud.revive} max={2}/></div>}
    {hud.down&&!terminal&&!paused&&!hud.waiting&&<div className="coop-down" role="status">Ты ранен. Напарник может подойти и удерживать «Помочь» 2 секунды.</div>}
    {status&&!paused&&!terminal&&<div className="adventure-overlay coop-connection-overlay"><section className="adventure-card"><h2>Игра на паузе</h2><p role="status">{status}</p><p>Бой продолжится после восстановления связи.</p><button type="button" className="adventure-primary" disabled={connection.busy} onClick={()=>void session.enter("join",room.code)}>Переподключиться</button><button type="button" className="adventure-secondary" onClick={quit}>Выйти из комнаты</button></section></div>}
    {map&&<div className="adventure-overlay dungeon-map-overlay"><DungeonMap layout={engine.levelData} view={view} player={engine.actors[slot].player} partner={{...engine.actors[other].player,name:names[other]}} cleared={engine.cleared} gates={engine.levelData.gates.map((_,i)=>engine.gateOpen(i))} onClose={resume}/></div>}
    {paused&&!map&&!leaving&&!terminal&&<div className="adventure-overlay"><section className="adventure-card"><small>ВЫЛАЗКА ВДВОЁМ</small><h2>Пауза</h2><p>Оба игрока в безопасности.</p><button className="adventure-primary" type="button" onClick={resume}>Продолжить</button><button className="adventure-secondary" type="button" disabled={connection.busy} onClick={quit}>Выйти из комнаты</button></section></div>}
    {terminal&&!leaving&&<div className="adventure-overlay"><section className="adventure-card"><small>КОМАНДА · {names.join(" + ")}</small><h2>{hud.phase==="won"?"Вы выбрались вместе!":"Оба Кнопика ранены"}</h2><p>Зачищено {hud.cleared} из {engine.levelData.rooms.length} залов.</p>{hud.phase==="won"&&nextRoute&&<p role="status">{connection.error||(!connection.connected||!connection.peerOnline||!connection.peerVisible?"Ждём подключения напарника для общего перехода…":`Следующий ${nextRoute.mode==="abyss"?"этаж":"уровень"} ${nextRoute.level} загрузится автоматически…`)}</p>}{slot===0?<>{hud.phase==="won"&&nextRoute&&(connection.error||paused)&&<button className="adventure-primary" type="button" disabled={connection.busy} onClick={()=>void session.advance(round)}>Повторить переход</button>}<button className="adventure-secondary" type="button" disabled={connection.busy} onClick={()=>void session.act("lobby")}>{hud.phase==="won"?"Выбрать маршрут":"Повторить вылазку"}</button></>:<p>{hud.phase==="won"&&nextRoute?"Продолжаете вместе в той же комнате.":"Ведущий может открыть новую вылазку."}</p>}<button className="adventure-secondary" type="button" disabled={connection.busy} onClick={quit}>Выйти из комнаты</button></section></div>}
    {leaving&&<div className="adventure-overlay"><section className="adventure-card"><h2>Выйти из вылазки?</h2><p>Комната закроется для обоих игроков.</p><button type="button" className="adventure-primary" disabled={busyLeaving} onClick={onLeave}>{busyLeaving?"Выходим…":"Выйти"}</button><button type="button" className="adventure-secondary" disabled={busyLeaving} onClick={()=>{leavingRef.current=false;setLeaving(false);}}>{terminal?"Остаться в вылазке":"Остаться на паузе"}</button></section></div>}
    {!blocked&&<div className="coop-weapons" aria-label="Оружие">{engine.availableWeapons.map((weapon,i)=><button key={weapon} type="button" aria-label={`${ADVENTURE_WEAPONS[weapon].name} · ${i+1}`} aria-pressed={hud.weapon===weapon} onClick={()=>{controls.current.weapon=weapon;}}><AdventureWeaponArt weapon={weapon} icon/></button>)}</div>}
   </div>
   <CoopGameControls controls={inputApi} interaction={hud.interaction} cape={hud.cape} energyReady={hud.energyReady} weapon={hud.weapon} disabled={blocked} dodgeReady={hud.dodgeReady} onPause={pause}/>
  </div>
 </GameModal>;
}
