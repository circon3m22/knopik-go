"use client";
import {useEffect,type RefObject} from "react";
import type {AdventureEngine} from "./adventure-engine";
import {TRAINING_CARDS,TRAINING_LENGTH} from "./adventure-training";
export function AdventureTrainingOverlay({clock,step,onStep}:{clock:RefObject<AdventureEngine|null>;step:number;onStep:(step:number)=>void}) {
  useEffect(()=>{let frame=0,done=false;const engine=clock.current,start=engine?.walkDistance??0,began=performance.now();const tick=()=>{const e=clock.current;if(!e||done)return;const reached=e.phase==="playing"&&(step===0?e.walkDistance-start>22:step===1?e.punchSerial>0:step===2?e.dodged:step===3?e.player.hp===3:step===4?e.shieldReady:e.surgeTime>0);if(reached&&performance.now()-began>600){done=true;onStep(step+1);}else frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[clock,step,onStep]);
  const card=TRAINING_CARDS[step];if(!card)return null;
  return <section className="adventure-training-card" aria-label="Обучение бою"><div><small>ПЕРВЫЕ ШАГИ · {step+1}/{TRAINING_LENGTH}</small><button type="button" onClick={()=>onStep(TRAINING_LENGTH)}>Пропустить</button></div><strong>{card.title}</strong><p>{card.copy}</p><button className="training-next" type="button" onClick={()=>onStep(step+1)}>Уже знаю →</button></section>;
}
