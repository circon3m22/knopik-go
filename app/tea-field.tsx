'use client';
import {useRef,useState} from 'react';
import {GameModal} from './game-modal';
import {RoundExitConfirm} from './round-exit-confirm';
import {WagerSlider,wagerRange} from './wager-slider';
import {ArcadeRules} from './arcade-rules';
import {PotionArtwork} from './cosmetic-artwork';
import {TeaGardenArtwork,TeaTileArtwork,type TeaTileState} from './tea-field-artwork';
import {mineBoard,boardMultiplier,payout} from './casino-engine';
import type {MiniGameStats} from './mini-game-panel';
type Props={onReplay?:()=>void;balance:number;canChooseBet:boolean;stats:MiniGameStats;onCommitBet:(kind:'mines',bet:number)=>boolean;onResolve:(kind:'mines',payout:number,won:boolean)=>void;onClose:()=>void;onTick:()=>void};
export function TeaField(p:Props){
 const [bet,setBet]=useState(p.balance),[mines,setMines]=useState(3),[phase,setPhase]=useState<'ready'|'playing'|'lost'|'cashed'>('ready'),phaseRef=useRef(phase),[opened,setOpened]=useState<number[]>([]),openedRef=useRef<number[]>([]),board=useRef<number[]>([]),stake=useRef(0),[displayStake,setDisplayStake]=useState(0),[displayBoard,setDisplayBoard]=useState<number[]>([]),[amount,setAmount]=useState(0),[askExit,setAskExit]=useState(false);
 const selected=wagerRange(p.balance,p.canChooseBet?bet:p.balance).value;
 const finish=(lost:boolean)=>{if(phaseRef.current!=='playing')return;phaseRef.current=lost?'lost':'cashed';setPhase(phaseRef.current);const n=lost?0:payout(stake.current,boardMultiplier(mines,openedRef.current.length));setAmount(n);p.onResolve('mines',n,!lost);};
 const start=()=>{if(phaseRef.current!=='ready'||selected<1||!p.onCommitBet('mines',selected))return;stake.current=selected;setDisplayStake(selected);board.current=mineBoard(mines);setDisplayBoard(board.current);phaseRef.current='playing';setPhase('playing');};
 const pick=(i:number)=>{if(phaseRef.current!=='playing'||openedRef.current.includes(i))return;p.onTick();openedRef.current=[...openedRef.current,i];setOpened(openedRef.current);if(board.current.includes(i))finish(true);else if(openedRef.current.length===25-mines)finish(false);};
 const close=()=>{if(phaseRef.current==='playing')setAskExit(true);else p.onClose();},done=phase==='lost'||phase==='cashed';
 const leaves=opened.filter(i=>!displayBoard.includes(i)).length,mult=boardMultiplier(mines,leaves),next=boardMultiplier(mines,leaves+1);
 return <GameModal className={`casino-game tea-field phase-${phase}`} label="Бергамот — чайное поле" onDismiss={close}><div className="casino-cabinet">
  <header className="casino-heading"><PotionArtwork kind="bergamot"/><div><small>БЕРГАМОТ / KNOPIK ARCADE</small><h2>Чайное поле</h2></div><button type="button" aria-label="К напиткам" onClick={close}>×</button></header>
  <div className="casino-readout"><span>СТАВКА<b>{(phase==='ready'?selected:displayStake).toLocaleString('ru-RU')} KC</b></span><span>{phase==='ready'?'БЕЗОПАСНЫХ КЛЕТОК':'СОБРАНО ЛИСТЬЕВ'}<b>{phase==='ready'?`${25-mines} / 25`:`${leaves} / ${25-mines}`}</b></span></div>
  <div className="tea-playfield"><div className="tea-board"><TeaGardenArtwork/><div className="tea-tiles" role="group" aria-label={`Поле 5 на 5, мин ${mines}`}>{Array.from({length:25},(_,i)=>{
   const hit=displayBoard.includes(i),picked=opened.includes(i),reveal=picked||done,state:TeaTileState=reveal?hit?picked?'triggered':'mine':picked?'leaf':'unpicked':'closed';
   return <button type="button" key={i} disabled={phase!=='playing'||picked} onClick={()=>pick(i)} className={`tea-tile is-${state}`} aria-label={`Ряд ${Math.floor(i/5)+1}, клетка ${i%5+1}: ${reveal?hit?'мина':'чайный лист':'закрыта'}`}><TeaTileArtwork state={state}/></button>;
  })}</div></div>
  {done&&<section className={`casino-result tea-result ${phase==='cashed'?'is-win':''}`} role="status"><small>{phase==='lost'?'МИНА · РАУНД ЗАВЕРШЁН':'ЛИСТЬЯ СОБРАНЫ'}</small><strong>{amount.toLocaleString('ru-RU')} KC</strong><p>{phase==='lost'?'Попробуй другой маршрут':`Выплата ×${mult.toFixed(2)} уже на балансе`}</p></section>}
  </div>
  {phase==='ready'&&<div className="casino-setup">{p.canChooseBet?<WagerSlider balance={p.balance} amount={selected} onChange={setBet}/>:<p className="casino-hint">Ставка — весь активный баланс</p>}<div className="casino-choices tea-mine-choices" role="group" aria-label="Количество мин">{[1,3,5].map(n=><button type="button" key={n} aria-pressed={mines===n} onClick={()=>setMines(n)}>{n} {n===1?'мина':n===5?'мин':'мины'}</button>)}</div></div>}
  {phase==='playing'&&<div className="tea-next" role="status"><span>СЕЙЧАС <b>×{mult.toFixed(2)}</b></span><span>СЛЕДУЮЩИЙ ЛИСТ <b>×{next.toFixed(2)}</b></span></div>}
  <footer className="casino-footer">
  {phase==='ready'&&<button className="casino-primary" type="button" disabled={selected<1} onClick={start}>Заварить поле</button>}
  {phase==='playing'&&<button type="button" className="casino-primary" disabled={!leaves} onClick={()=>finish(false)}>{leaves?`Забрать ${payout(displayStake,mult).toLocaleString('ru-RU')} KC`:'Открой первый лист'}</button>}
  {done&&<div className="casino-actions">{p.onReplay&&<button className="casino-primary" type="button" onClick={p.onReplay}>Ещё раз</button>}<button type="button" onClick={p.onClose}>К напиткам</button></div>}
  <ArcadeRules><p>25 плиток: {mines} {mines===1?'мина':mines===5?'мин':'мины'} и {25-mines} чайных листьев. Открывай листья и забирай монеты до мины. Все безопасные плитки завершают раунд автоматически.</p><p>Все расположения мин равновероятны. Множитель — 0.96 / вероятность собрать столько листьев, округлённый вниз до сотых. Выплата включает ставку. Одна бутылка — один раунд.</p><p>С ирокезом выбери сумму ползунком. Без него ставка равна активному балансу.</p><p>Игр {p.stats.minePlays} · выводов {p.stats.mineWins}</p></ArcadeRules>
  </footer>
  {askExit&&phase==='playing'&&<RoundExitConfirm onCancel={()=>setAskExit(false)} onConfirm={()=>{finish(true);p.onClose();}}/>}
 </div></GameModal>;
}
