"use client";
import { useEffect, useRef, useState, useId } from "react";
import { GameModal } from "./game-modal";
import { AdventureEngine, type AdventureEnemy, type AdventureSound } from "./adventure-engine";
import { AdventureRenderer } from "./adventure-artwork";
import { LevelChambers } from "./adventure-level-art";
import { adventureLevel } from "./adventure-levels";
import { AnimatedAdventureKnopik } from "./knopik-adventure-art";
import { StandardSahurSprite, SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import { projectAdventureY } from "./adventure-projection";
import "./action-scene.css";

const ROOM=adventureLevel(3).rooms[0],Y=ROOM.y+ROOM.h*.5;
const DEATHS=Array.from({length:30},(_,i)=>.85+i*.289);
const BLASTS=[1.3,1.72,2.25,2.85,3.12,3.5,4.35,4.62,5.6,6.25,6.7,7.15,7.8,8.15,8.4,8.7,9.1];
const PATH=[[0,240,180],[.6,200,100],[1.2,320,30],[1.85,300,-65],[2.5,200,-5],[3.1,145,60],[3.7,230,-105],[4.35,350,-75],[5,285,35],[5.65,180,100],[6.2,135,-30],[6.9,250,-50],[7.6,340,65],[8.3,245,125],[9,190,20],[9.65,240,15],[10,240,15]];
function hero(t:number){for(let i=1;i<PATH.length;i++){const a=PATH[i-1],b=PATH[i];if(t<=b[0]){const p=Math.max(0,(t-a[0])/(b[0]-a[0])),s=p*p*(3-2*p);return {x:a[1]+(b[1]-a[1])*s,y:Y+a[2]+(b[2]-a[2])*s};}}return {x:240,y:Y+15};}
function enemy(i:number,t:number){const time=Math.min(t,DEATHS[i]),p=hero(Math.max(0,time-.65-i%5*.13)),a=i*2.3999,r=40+i%6*17;return {x:p.x+Math.cos(a)*r,y:p.y+45+Math.sin(a)*r*.65};}
function blast(i:number){const a=i*2.17;return {x:240+Math.cos(a)*(85+i%4*25),y:Y+Math.sin(a)*(90+i%3*23)};}
const set=(n:Element|undefined|null,k:string,v:string)=>{if(n&&n.getAttribute(k)!==v)n.setAttribute(k,v);};
const move=(n:Element|undefined|null,x:number,y:number,extra="")=>set(n,"transform",`translate(${x.toFixed(1)} ${projectAdventureY(y).toFixed(1)}) ${extra}`);

export function ActionScene({onClose,onSound}:{onClose:()=>void;onSound:(sound:AdventureSound)=>void}){
  const svgRef=useRef<SVGSVGElement>(null),barRef=useRef<HTMLDivElement>(null),soundRef=useRef(onSound);
  const [session,setSession]=useState(0),[done,setDone]=useState(false);
  const prefix=`action-${useId().replaceAll(":","")}`;
  useEffect(()=>{soundRef.current=onSound;},[onSound]);
  useEffect(()=>{
    const svg=svgRef.current;if(!svg)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A private drawing model: no input, simulation, wallet, save or level events.
    const e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}},{completedLevel:5});e.selectLevel(3);e.phase="playing";e.chests=[];e.barrels=[];e.cleared.fill(true);
    e.enemies=DEATHS.map((_,i):AdventureEnemy=>({id:i,kind:i%3===0?"bat":"gun",room:0,x:0,y:0,angle:0,hp:3,maxHp:3,mode:"chase",timer:0,flash:0,attackAngle:0,moving:true,walkDistance:0,windupDuration:.24,recoveryDuration:.4,attackRecovery:false}));
    const renderer=new AdventureRenderer(svg,reduced),all=(s:string)=>Array.from(svg.querySelectorAll(s));
    const actors=all("[data-enemy]"),blood=all("[data-action-blood]"),spray=all("[data-action-spray]"),bullets=all("[data-action-tracer]"),shells=all("[data-action-shell]"),explosions=all("[data-action-blast]"),smoke=all("[data-action-smoke]"),debris=all("[data-action-debris]");
    const body=svg.querySelector("[data-player-body]"),roll=svg.querySelector("[data-action-roll]"),dust=svg.querySelector("[data-action-dust]");
    let frame=0,last=0,t=0,lastShot=-1,lastBlast=-1;
    const paint=()=>{
      const p=hero(t),target=e.enemies.findIndex((_,i)=>DEATHS[i]>t),aim=enemy(Math.max(0,target),t);
      Object.assign(e.player,{...p,angle:t>9.6?Math.PI/2:Math.atan2(aim.y-p.y,aim.x-p.x)});e.time=t;e.walkDistance=t*185;e.moving=t<9.6;e.weapon=t>5.75&&t<6.35?"sabre":"pistol";
      const shot=t%.15;e.punchTime=e.weapon==="sabre"?.32*(1-(t-5.75)/.6):shot<.105?.17*(1-shot/.105):0;e.punchSerial=Math.floor(t*7)+1;
      const rolling=[1.9,2.9,4.8,6.75,8.3].find(s=>t>=s&&t<s+.36),r=rolling===undefined?0:(t-rolling)/.36;e.dodgeTime=rolling===undefined?0:.2;
      e.enemies.forEach((n,i)=>{const q=enemy(i,Math.min(t,DEATHS[i])),angle=Math.atan2(p.y-q.y,p.x-q.x),cycle=(t+i*.11)%.64;Object.assign(n,{...q,angle,attackAngle:angle,hp:t>=DEATHS[i]?0:3,mode:cycle<.13?"windup":cycle<.27?"recover":"chase",timer:cycle<.13?.13-cycle:.4-(cycle-.13),windupDuration:.13,attackRecovery:cycle>=.13&&cycle<.27,moving:cycle>=.27,walkDistance:t*90,flash:0});});
      renderer.paint(e,true);
      const ratio=svg.clientHeight/Math.max(1,svg.clientWidth),width=470+(t<.6?(1-t/.6)*80:0),height=Math.min(640,Math.max(330,width*ratio));
      const recent=BLASTS.filter(s=>t>=s&&t<s+.28),shake=reduced||!recent.length?0:recent.length*3*(1-(t-recent.at(-1)!)/.28);
      set(svg,"viewBox",`${240-width/2+Math.sin(t*61)*shake} ${projectAdventureY(Y)-height/2-24+(projectAdventureY(p.y)-projectAdventureY(Y))*.2+Math.cos(t*53)*shake} ${width} ${height}`);
      set(body,"display",rolling===undefined?"inline":"none");set(roll,"display",rolling===undefined?"none":"inline");set(roll,"transform",`translate(0 -7) rotate(${reduced?0:r*360} 0 -20) scale(.85)`);
      set(dust,"display",t<9.6?"inline":"none");set(dust,"transform",`translate(${-Math.cos(e.player.angle)*22} ${-Math.sin(e.player.angle)*16+3}) scale(${1+(t%.25)*2})`);
      actors.forEach((n,i)=>set(n,"display",t<.03+i*.015?"none":"inline"));
      blood.forEach((n,i)=>{const q=enemy(i,DEATHS[i]),age=t-DEATHS[i];move(n,q.x,q.y,`scale(${Math.min(1.5,Math.max(0,age)*6)})`);set(n,"display",age>=0?"inline":"none");});
      spray.forEach((n,i)=>{const id=Math.floor(i/12),age=t-DEATHS[id],a=i*2.41,q=enemy(id,DEATHS[id]),speed=50+i%7*19;set(n,"display",age>=0&&age<.65?"inline":"none");if(age>=0&&age<.65){move(n,q.x+Math.cos(a)*speed*age,q.y+Math.sin(a)*speed*age-12-Math.sin(age/.65*Math.PI)*30);set(n,"opacity",String(1-age*.8));}});
      bullets.forEach((n,i)=>{const friendly=i<18,id=i%18,stamp=friendly?Math.floor(t/.15)*.15-id*.15:Math.floor((t-id*.04)/.6)*.6+id*.04,age=t-stamp;set(n,"display",age>=0&&age<.42&&stamp>.25&&t<9.6?"inline":"none");if(age<0||age>=.42)return;const a=friendly?hero(stamp):enemy(id%30,stamp),j=DEATHS.findIndex(s=>s>stamp),b=friendly?enemy(Math.max(0,j),stamp):hero(stamp),ang=Math.atan2(projectAdventureY(b.y-a.y),b.x-a.x),d=age*650;set(n,"transform",`translate(${a.x+Math.cos(ang)*(d+22)} ${projectAdventureY(a.y)-27+Math.sin(ang)*(d+22)}) rotate(${ang*180/Math.PI})`);});
      shells.forEach((n,i)=>{const stamp=i*.14,age=t-stamp,q=hero(Math.min(stamp,10)),a=i*2.4;set(n,"display",age>=0?"inline":"none");if(age>=0){const f=Math.min(.6,age);move(n,q.x+Math.cos(a)*f*65,q.y+Math.sin(a)*f*40-Math.max(0,Math.sin(f/.6*Math.PI))*28,`rotate(${i*47+Math.min(.6,age)*650})`);}});
      explosions.forEach((n,i)=>{const age=t-BLASTS[i],q=blast(i);set(n,"display",age>=0&&age<.65?"inline":"none");move(n,q.x,q.y,`scale(${reduced?1:.2+Math.min(.35,Math.max(0,age))*5})`);set(n,"opacity",String(Math.max(0,1-age/.65)));});
      smoke.forEach((n,i)=>{const age=t-BLASTS[i],q=blast(i);set(n,"display",age>=.1&&age<2.5?"inline":"none");move(n,q.x+Math.sin(i)*Math.max(0,age)*20,q.y-Math.max(0,age)*38,`scale(${1+Math.max(0,age)*.6})`);set(n,"opacity",String(Math.max(0,.42-age*.15)));});
      debris.forEach((n,i)=>{const id=Math.floor(i/8),age=t-BLASTS[id],q=blast(id),a=i*2.31;set(n,"display",age>=0&&age<1.2?"inline":"none");if(age>=0)move(n,q.x+Math.cos(a)*age*140,q.y+Math.sin(a)*age*100-Math.sin(Math.min(1,age/1.2)*Math.PI)*60,`rotate(${age*400+i*25})`);});
      if(barRef.current)barRef.current.style.width=`${t*10}%`;
      const s=Math.floor(t*6);if(s!==lastShot&&t>.3&&t<9.5){lastShot=s;soundRef.current("shot");}
      const b=BLASTS.findLastIndex(s=>s<=t);if(b!==lastBlast&&b>=0){lastBlast=b;soundRef.current("defeat");}
    };
    const tick=(now:number)=>{if(!document.hidden){t=Math.min(10,t+(last?Math.max(0,(now-last)/1000):0));paint();}last=now;if(t<10)frame=requestAnimationFrame(tick);else setDone(true);};
    const visibility=()=>{last=0;};document.addEventListener("visibilitychange",visibility);paint();frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",visibility);};
  },[session]);
  return <GameModal className="action-cinema pixel-game" label="Экшен — анимационная сцена" onDismiss={onClose}>
    <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/><link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
    <div className="action-cinema-layout"><header className="action-cinema-header"><div><small>KNOPIK GO · КИНО</small><h1>Экшен</h1></div><button type="button" aria-label="Закрыть сцену" onClick={onClose}>×</button></header>
      <div className="action-cinema-screen"><svg ref={svgRef} viewBox={`0 ${projectAdventureY(Y)-300} 480 600`} className="action-cinema-svg" shapeRendering="crispEdges" role="img" aria-label="Кнопик уворачивается от пуль Сахуров в канализации: перестрелка, перекаты и цепные взрывы">
        <g transform="scale(1 .82)"><LevelChambers id={3} prefix={prefix}/></g>
        <g>{DEATHS.map((_,i)=><g key={i} data-action-blood={i} display="none"><path d="M-12-15h19v-7h9v12h13v8h13v8H24v11H10v6H-10v-8h-17V4h-13V-8h18v-9h10Z" fill="#63333a"/><path d="M-10-10h19v5h14v9H12v8H-8V7h-13V-3h11Z" fill="#a3474c"/><path d="M-30-18h5v4h-5Zm51-10h6v5h-6Zm13 45h8v5h-8Zm-57 7h6v4h-6Z" fill="#b76253"/></g>)}{Array.from({length:96},(_,i)=><g key={i} data-action-shell={i} display="none"><path d="M-3-1h7v3h-7Z" fill="#e4cc89"/><path d="M-3-1h2v3h-2Z" fill="#775442"/></g>)}</g>
        <g data-actors="">{DEATHS.map((_,i)=><g key={i} data-enemy={i} display="none"><g data-enemy-body=""><g {...{[i%3===0?"data-bat":"data-gun"]:""}}><StandardSahurSprite gun={i%3!==0}/></g></g></g>)}<g data-player=""><g data-action-dust=""><path d="M-19-3h12v3h-12Zm-8 8h8v3h-8Zm34-4h10v3H7Z" fill="#c7a37f" opacity=".55"/></g><g data-player-body=""><AnimatedAdventureKnopik/></g><g data-action-roll="" display="none"><path d="M-12-48h24v4h10v7h5v23h-5v8H12v5h-24v-5h-10v-8h-5v-23h5v-7h10Z" fill="#89552f"/><path d="M-10-45h20v4h9v8h5v17h-5v7h-9v5h-20v-5h-9v-7h-5v-17h5v-8h9Z" fill="#d69a5b"/><path d="M-14-38h9v-4H9v5h8v10h-6v-8H-2v5h-9v13h9v6h17v4H-6v-5h-8v-8h-5v-11h5Z" fill="#f3e2c0"/><path d="M-3-29h13v5h-4v8H-6v-6h3Z" fill="#89552f"/></g></g></g>
        <g>{Array.from({length:36},(_,i)=><g key={i} data-action-tracer={i} display="none"><path d="M-22-1H7v2h-29Z" fill={i<18?"#fff1d1":"#d97b70"}/><path d="M-7-2H7v4H-7Z" fill="#f4d889"/></g>)}{Array.from({length:360},(_,i)=><rect key={i} data-action-spray={i} display="none" width={i%3+2} height={i%4+2} fill={i%3===0?"#d97b70":"#a3474c"}/>)}</g>
        <g>{BLASTS.map((_,i)=><g key={i} data-action-smoke={i} display="none"><path d="M-28-62h24v-16h26v15h23v21h17v28H43V8H15v9H-14V4h-24v-19h-18v-27h28Z" fill="#343041"/><path d="M-18-56H8v-8h13v16h18v25H20v13H-4v-8h-23v-20h9Z" fill="#746875"/></g>)}{BLASTS.map((_,i)=><g key={i} data-action-blast={i} display="none"><path d="M-14-70h26v22h21v-12h11v28h23v23H51v29H29v24H8v13H-16V33h-26V15h-22V-8h14v-28h25v-13h11Z" fill="#d97b70" opacity=".55"/><path d="M-10-48h21v16h19v16h17V7H25v19H6v15H-13V21h-19V3h-17v-19h21v-18h18Z" fill="#dfad64"/><path d="M-8-29H9v13h19V3H12v17H-8V9h-20V-9h20Z" fill="#fff1d1"/></g>)}{Array.from({length:136},(_,i)=><g key={i} data-action-debris={i} display="none"><path d="M-3-3h7v5H1v3h-4Z" fill={i%3===0?"#e4cc89":i%3===1?"#775442":"#98ab91"}/></g>)}</g>
      </svg><div className="action-cinema-vignette" aria-hidden="true"/><span className="action-cinema-caption">{done?"КНОПИК. БЕЗ ШАНСОВ.":"ПОД ДОМОМ · БЕЗ ПРАВИЛ"}</span></div>
      <footer className="action-cinema-footer"><div className="action-cinema-progress" aria-hidden="true"><div ref={barRef}/></div><p role="status">{done?"10 секунд. Ни одного шанса Сахурам.":"10 секунд · анимационная сцена"}</p><div>{done&&<button type="button" onClick={()=>{setDone(false);setSession(s=>s+1);}}>Повторить ▶</button>}<button type="button" onClick={onClose}>В настройки</button></div></footer>
    </div>
  </GameModal>;
}
