"use client";
import {useEffect,useRef,useState} from 'react';
import {GameModal} from './game-modal';
import {CoinArtwork,AuraCoinArtwork} from './collectible-artwork';
import {PotionArtwork,ClothingArtwork} from './cosmetic-artwork';
import type {CaseKind,CaseReward} from './case-engine';
import {CaseCinematicArt,HunterCacheArtwork} from './case-cinematic-art';
export type CaseSequence={kind:CaseKind;rewards:CaseReward[];phase:'ready'|'charging'|'burst'|'reward';rewardIndex:number};
function RewardArt({reward}:{reward:CaseReward}){
 if(reward.type==='coins')return <CoinArtwork/>;
 if(reward.type==='aura')return <AuraCoinArtwork/>;
 if(reward.type==='buff')return <PotionArtwork kind={({food:'food',drink:'zhivchik',pitbull:'pitbull',cola:'cocoa',tea:'bergamot',shield:'pepsi'} as const)[reward.kind]}/>;
 return <ClothingArtwork kind={reward.kind}/>;
}
export function CaseOpening({sequence,onHold,onCancelHold,onAdvance,onClose}:{sequence:CaseSequence;onHold:()=>void;onCancelHold:()=>void;onAdvance:()=>void;onClose:()=>void}){
 const {kind,phase,rewardIndex,rewards}=sequence,reward=rewards[rewardIndex];
 const [summary,setSummary]=useState(false);
 const pointer=useRef<number|null>(null),cancel=useRef(onCancelHold);
 useEffect(()=>{cancel.current=onCancelHold;},[onCancelHold]);
 useEffect(()=>{
  const stop=()=>{pointer.current=null;cancel.current();};
  const hidden=()=>{if(document.hidden)stop();};
  window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);};
 },[]);
 return <GameModal className={`case-opening hunter-cache case-${kind} phase-${phase}`} label="Полевой тайник" onDismiss={phase==='ready'||phase==='reward'?onClose:undefined}>
  <CaseCinematicArt kind={kind} phase={phase} rewardIndex={rewardIndex}/>
  {(phase==='ready'||phase==='reward')&&<button className="hunter-cache-close" type="button" aria-label="Закрыть тайник" onClick={onClose}>×</button>}
  {phase==='reward'&&reward?<section className="hunter-cache-reveal" key={summary?'summary':rewardIndex}>
   <small>ТАЙНИК ОТКРЫТ · {summary?'ИТОГ':`${rewardIndex+1} / ${rewards.length}`}</small>
   {summary?<><h2>Твоя добыча</h2><ul className="hunter-cache-summary">{rewards.map((item,i)=><li key={i}><RewardArt reward={item}/><strong>{item.label}</strong></li>)}</ul><button type="button" onClick={onClose}>Готово</button></>:<>
    <div className="hunter-cache-loot" aria-hidden="true"><span/><RewardArt reward={reward}/></div>
    <small>{reward.type==='aura'?'AURA':reward.type==='coins'?'МОНЕТЫ':reward.type==='buff'?'ПРИПАСЫ':'ПРЕДМЕТ'}</small><h2>{reward.label}</h2>
    <div className="hunter-cache-progress" aria-label={`Награда ${rewardIndex+1} из ${rewards.length}`}>{rewards.map((_,i)=><i key={i} data-seen={i<=rewardIndex}/>)}</div>
    <button type="button" onClick={rewardIndex===rewards.length-1?()=>setSummary(true):onAdvance}>{rewardIndex===rewards.length-1?'Смотреть добычу':'Следующая награда →'}</button>
    <button type="button" className="hunter-cache-text" onClick={()=>setSummary(true)}>Показать итог сразу</button>
   </>}
  </section>:<section className="hunter-cache-console"><small>KNOPIK GO / FIELD CACHE</small><h2>{kind==='big'?'Большой тайник':'Полевой тайник'}</h2>
   <div className="hunter-cache-cradle"><span className="hunter-cache-light"/><button className="hunter-cache-crate" type="button" aria-label="Удерживай, чтобы открыть кейс" disabled={phase==='burst'} onPointerDown={e=>{if(e.button!==0||pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}onHold();}} onPointerUp={e=>{if(pointer.current===e.pointerId){pointer.current=null;onCancelHold();}}} onPointerCancel={e=>{if(pointer.current===e.pointerId){pointer.current=null;onCancelHold();}}} onLostPointerCapture={e=>{if(pointer.current===e.pointerId){pointer.current=null;onCancelHold();}}} onBlur={()=>{pointer.current=null;onCancelHold();}} onContextMenu={e=>e.preventDefault()} onKeyDown={e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onHold();}}} onKeyUp={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCancelHold();}}}><HunterCacheArtwork big={kind==='big'}/></button></div>
   <p aria-live="polite">{phase==='ready'?'Зажми замок — открой тайник':phase==='charging'?'Снимаем пломбы…':'ДОСТУП ОТКРЫТ'}</p><div className="hunter-cache-meter"><i/></div><span>{kind==='big'?'5':'3'} награды · уже выданные призы сохраняются</span>
  </section>}
 </GameModal>;
}
