'use client';
import {useEffect,useRef,useState} from 'react';
import {GameModal} from './game-modal';
import {PotionArtwork} from './cosmetic-artwork';
import {WagerSlider} from './wager-slider';
import {ArcadeRules} from './arcade-rules';
import {RoundExitConfirm} from './round-exit-confirm';
import {useArcadeQuote} from './arcade-economy-context';
import {CASINO_GAMES,payout} from './casino-engine';
import {ExpeditionDrinkRound,relicMultiplier} from './expedition-drink-engine';
import type {CasinoGameProps} from './casino-game';
export function ExpeditionDrinkGame(props:CasinoGameProps){
 const kind=props.kind==='hibiscus'?'hibiscus':'tonic',game=CASINO_GAMES[kind],{quote}=useArcadeQuote();
 const [round]=useState(()=>new ExpeditionDrinkRound(kind)),[,paint]=useState(0),[bet,setBet]=useState(Math.min(100,props.balance)),[stakeAmount,setStakeAmount]=useState(0),[amount,setAmount]=useState(0),[flash,setFlash]=useState(-1),[ask,setAsk]=useState(false),[error,setError]=useState('');
 const ref=useRef(props),stake=useRef(0),paid=useRef(false);useEffect(()=>{ref.current=props;});
 const selected=props.canChooseBet?Math.min(props.balance,Math.max(1,Math.floor(bet))):props.balance;
 const showing=round.phase==='showing',ready=round.phase==='ready',result=round.phase==='settled',live=!ready&&!result;
 const settle=()=>{if(round.phase!=='settled'||paid.current)return;paid.current=true;const gross=payout(stake.current,round.factor),actual=ref.current.onResolve(kind,gross);setAmount(actual??gross);ref.current.onSound(round.factor>1?'win':'lose');};
 useEffect(()=>{if(!showing)return;let alive=true;const timers:ReturnType<typeof setTimeout>[]=[];
  round.sequence.forEach((cell,i)=>{timers.push(setTimeout(()=>{if(alive)setFlash(cell);},500+i*700));timers.push(setTimeout(()=>{if(alive)setFlash(-1);},980+i*700));});
  timers.push(setTimeout(()=>{if(alive){round.revealDone();paint(n=>n+1);}},round.sequence.length*700+600));
  return()=>{alive=false;timers.forEach(clearTimeout);};
 },[showing,round]);
 const pick=(cell:number)=>{if(!round.pick(cell))return;props.onSound('tick');paint(n=>n+1);settle();};
 const close=()=>{if(live)setAsk(true);else props.onClose();};
 return <GameModal className={`casino-game expedition-drink casino-${kind} phase-${ready?'ready':result?'result':'playing'}`} label={game.title} onDismiss={close}><div className="casino-cabinet">
  <header className="casino-heading"><PotionArtwork kind={kind}/><div><small>EXPEDITION / KNOPIK ARCADE</small><h2>{game.title}</h2></div><button type="button" aria-label="К напиткам" onClick={close}>×</button></header>
  <div className="casino-readout"><span>СТАВКА<b>{(ready?selected:stakeAmount).toLocaleString('ru-RU')} KC</b></span><span>{kind==='hibiscus'?'СИГНАЛЫ':'КОМНАТА'}<b>{round.step} / {kind==='hibiscus'?4:3}</b></span></div>
  <div className="casino-stage expedition-table"><svg className="expedition-table-art" viewBox="0 0 320 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shapeRendering="crispEdges"><path d="M0 0h320v320H0Z" fill="#263144"/><path d="M12 12h296v296H12Z" fill="#344457"/><path d="M24 24h272v272H24Z" fill="#263d47"/>{Array.from({length:8},(_,i)=><path key={i} d={`M0 ${i*44}h320v3H0ZM${i*44} 0h3v320h-3Z`} fill="#51616b"/>)}<path d="M15 15h32v5H20v27h-5Zm258 0h32v32h-5V20h-27ZM15 273h5v27h27v5H15Zm285 0h5v32h-32v-5h27Z" fill="#c5ae7c"/></svg>
   <div className="expedition-play"><p role="status">{result?'Вылазка завершена':ready?kind==='hibiscus'?'Запомни четыре сигнала':'Три комнаты. Два пути безопасны.':showing?'Запоминай порядок…':kind==='hibiscus'?`Повтори: ${round.step+1} из 4`:`Выбери путь · комната ${round.step+1}`}</p>
    <div className={`expedition-board ${kind==='tonic'?'is-doors':''}`}>{Array.from({length:kind==='hibiscus'?9:3},(_,i)=><button key={i} type="button" disabled={round.phase!=='playing'} aria-label={kind==='hibiscus'?`Плита ${i+1}`:`Проход ${i+1}`} data-lit={flash===i} onClick={()=>pick(i)}><svg viewBox="0 0 40 48" aria-hidden="true" shapeRendering="crispEdges"><path d={kind==='tonic'?'M7 4h26v40H7Z':'M5 7h30v34H5Z'} fill="#172b36"/><path d={kind==='tonic'?'M11 8h18v33H11Z':'M9 11h22v26H9Z'} fill={flash===i?'#e4c480':'#738c8a'}/><path d={kind==='tonic'?'M14 12h12v3H14Zm0 7h12v3H14Zm8 9h4v4h-4Z':`M15 ${15+i%3*3}h10v4H15Zm3 4h4v9h-4Z`} fill={flash===i?'#fff1ce':'#bad0b7'}/></svg></button>)}</div>
    {result&&<div className="expedition-outcome" role="status"><strong>{amount.toLocaleString('ru-RU')} KC</strong><span>{amount?'Выплата уже на балансе':'Попробуй другой маршрут'}</span></div>}
   </div>
  </div>
  {ready&&<div className="casino-setup">{props.canChooseBet?<WagerSlider balance={props.balance} amount={selected} onChange={setBet}/>:<p className="casino-hint">Ставка — активный баланс. Ирокез открывает ползунок.</p>}</div>}
  <footer className="casino-footer">{error&&<p role="alert">{error}</p>}
   {ready?<button className="casino-primary" type="button" disabled={selected<1} onClick={()=>{if(round.phase!=='ready')return;if(!props.onCommit(kind,selected)){setError('Нужны бутылка и активные KC');return;}stake.current=selected;setStakeAmount(selected);round.start();props.onSound('tick');paint(n=>n+1);}}>Начать экспедицию</button>:result?<div className="casino-actions"><button type="button" disabled={!props.onReplay} onClick={props.onReplay}>Ещё раз</button><button type="button" onClick={props.onClose}>К напиткам</button></div>:kind==='tonic'?<button className="casino-primary" type="button" disabled={round.step===0} onClick={()=>{if(round.cashout()){paint(n=>n+1);settle();}}}>Забрать {quote(payout(stakeAmount,relicMultiplier(round.step)),stakeAmount).toLocaleString('ru-RU')} KC</button>:<p className="casino-live">{showing?'Следи за подсветкой плит':'Нажимай плиты в том же порядке'}</p>}
   <ArcadeRules><p>{game.rules}</p><p>Прибыль ограничивается общим балансом аркады. Игр: {props.stats.plays}.</p></ArcadeRules>
  </footer>
  {ask&&<RoundExitConfirm onCancel={()=>setAsk(false)} onConfirm={()=>{round.abandon();settle();props.onClose();}}/>}
 </div></GameModal>;
}
