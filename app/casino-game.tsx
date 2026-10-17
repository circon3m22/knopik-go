'use client';
import {useArcadeQuote} from "./arcade-economy-context";
import {useEffect,useRef,useState} from 'react';
import {WagerSlider} from './wager-slider';
import {ArcadeRules} from './arcade-rules';
import {GameModal} from './game-modal';
import {RoundExitConfirm} from './round-exit-confirm';
import {PotionArtwork} from './cosmetic-artwork';
import {ArcadeDealer,PlayingCard,PixelDice,PlinkoBoard,RouletteWheel,TableDetails} from './casino-artwork';
import {BlackjackHand,CASINO_GAMES,PLINKO_TABLES,RED_NUMBERS,baccaratMultiplier,baccaratValue,crashCashout,crashMultiplier,crashPoint,dealBaccarat,diceMultiplier,handValue,payout,plinkoPath,rouletteMultiplier,unit,type BaccaratBet,type CasinoKind,type CasinoStats,type DiceBet,type PlinkoRisk,type RouletteBet} from './casino-engine';
import type {KnopikSkin} from './knopik-skins';
type Phase='ready'|'playing'|'result';
type Props={kind:CasinoKind;balance:number;canChooseBet:boolean;skin:KnopikSkin;stats:CasinoStats[CasinoKind];onCommit:(kind:CasinoKind,bet:number)=>boolean;onDouble:(kind:CasinoKind,bet:number)=>boolean;onResolve:(kind:CasinoKind,amount:number)=> number|void;onClose:()=>void;onReplay?:()=>void;onSound:(cue:'tick'|'win'|'lose')=>void};
const betNames={red:'Красное',black:'Чёрное',even:'Чётное',odd:'Нечётное',low:'1–18',high:'19–36'};
export function CasinoGame(props:Props){
 const {quote}=useArcadeQuote();
 const game=CASINO_GAMES[props.kind],ref=useRef(props);useEffect(()=>{ref.current=props;});
 const [phase,setPhase]=useState<Phase>('ready'),phaseRef=useRef<Phase>('ready'),[bet,setBet]=useState(Math.min(100,props.balance)),[stake,setStake]=useState(0),stakeRef=useRef(0),[amount,setAmount]=useState(0),[askExit,setAskExit]=useState(false),[error,setError]=useState('');
 const [blackjack,setBlackjack]=useState<BlackjackHand|null>(null),handRef=useRef<BlackjackHand|null>(null),[,paint]=useState(0);
 const [rouletteBet,setRouletteBet]=useState<RouletteBet>('red'),[number,setNumber]=useState<number|null>(null);
 const [baccaratBet,setBaccaratBet]=useState<BaccaratBet>('player'),[deal,setDeal]=useState<ReturnType<typeof dealBaccarat>|null>(null),[shown,setShown]=useState(0);
 const [diceBet,setDiceBet]=useState<DiceBet>('low'),[dice,setDice]=useState([1,1,1]);
 const [risk,setRisk]=useState<PlinkoRisk>('low'),[path,setPath]=useState<number[]>([]),[progress,setProgress]=useState(0);
 const [auto,setAuto]=useState('2.00'),[useAuto,setUseAuto]=useState(true),[multiplier,setMultiplier]=useState(1),[crashed,setCrashed]=useState(false),[stopPoint,setStopPoint]=useState<number|null>(null);
 const flight=useRef<{start:number;wall:number;point:number;auto:number|null}|null>(null),animation=useRef<{start:number;multiplier:number;duration:number}|null>(null),[animationEpoch,setAnimationEpoch]=useState(0);
 const selected=props.canChooseBet?Math.min(props.balance,Math.max(1,Number.isFinite(bet)?Math.floor(bet):1)):props.balance;
 const finish=(factor:number)=>{if(phaseRef.current!=='playing')return;phaseRef.current='result';const n=payout(stakeRef.current,factor);setPhase('result');const actual=ref.current.onResolve(ref.current.kind,n);setAmount(actual??n);ref.current.onSound(n>stakeRef.current?'win':n===0?'lose':'tick');};
 const finishRef=useRef(finish);useEffect(()=>{finishRef.current=finish;});
 const close=()=>{if(phaseRef.current==='playing')setAskExit(true);else props.onClose();};
 const syncHand=()=>{paint(n=>n+1);if(handRef.current?.done)finish(handRef.current.multiplier);};
 const start=()=>{
  if(phaseRef.current!=='ready'||selected<1)return;
  if(props.kind==='currant'&&useAuto&&(!Number.isFinite(Number(auto))||Number(auto)<1.01||Number(auto)>100)){setError('Автовывод: число от 1.01 до 100');return;}
  if(!props.onCommit(props.kind,selected)){setError('Не удалось начать: проверь запас напитка и активные KC.');return;}
  stakeRef.current=selected;setStake(selected);phaseRef.current='playing';setPhase('playing');setError('');props.onSound('tick');
  let factor=0,duration=1800;
  if(props.kind==='espresso'){const hand=new BlackjackHand();handRef.current=hand;setBlackjack(hand);if(hand.done)finish(hand.multiplier);return;}
  if(props.kind==='grape'){const n=Math.floor(unit()*37);setNumber(n);factor=rouletteMultiplier(n,rouletteBet);duration=2100;}
  if(props.kind==='whiteTea'){const d=dealBaccarat();setDeal(d);factor=baccaratMultiplier(d.winner,baccaratBet);duration=2800;}
  if(props.kind==='ginger'){const ds=Array.from({length:3},()=>1+Math.floor(unit()*6));setDice(ds);factor=diceMultiplier(ds,diceBet);duration=1600;}
  if(props.kind==='peach'){const route=plinkoPath();setPath(route);factor=PLINKO_TABLES[risk][route.reduce<number>((a,b)=>a+b,0)];duration=2200;}
  if(props.kind==='currant'){flight.current={start:performance.now(),wall:Date.now(),point:crashPoint(),auto:useAuto?Number(auto):null};setAnimationEpoch(n=>n+1);return;}
  animation.current={start:performance.now(),multiplier:factor,duration};setAnimationEpoch(n=>n+1);
 };
 useEffect(()=>{
  if(phase!=='playing'||props.kind==='espresso')return;
  let id=0,last=0;
  const frame=(now:number)=>{
   if(phaseRef.current!=='playing')return;
   const f=flight.current,a=animation.current;
   if(f){const outcome=crashCashout(f.point,Math.max(now-f.start,Date.now()-f.wall),f.auto);if(outcome.done){setMultiplier(outcome.crashed?f.point:outcome.multiplier);setStopPoint(f.point);setCrashed(outcome.crashed);finishRef.current(outcome.multiplier);return;}if(now-last>=33){setMultiplier(outcome.multiplier);last=now;}}
   if(a){const t=Math.min(1,(now-a.start)/a.duration);if(now-last>=33){if(ref.current.kind==="peach"||ref.current.kind==="ginger")setProgress(t*8);if(ref.current.kind==="whiteTea")setShown(Math.floor(t*7));last=now;}if(t>=1){setProgress(8);setShown(6);finishRef.current(a.multiplier);return;}}
   id=requestAnimationFrame(frame);
  };
  id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);
 },[phase,props.kind,animationEpoch]);
 const cashout=()=>{const f=flight.current;if(!f||phaseRef.current!=='playing')return;const elapsed=Math.max(performance.now()-f.start,Date.now()-f.wall),outcome=crashCashout(f.point,elapsed,f.auto);setStopPoint(f.point);setCrashed(outcome.crashed);setMultiplier(outcome.done?(outcome.crashed?f.point:outcome.multiplier):crashMultiplier(elapsed));finish(outcome.done?outcome.multiplier:Math.floor(crashMultiplier(elapsed)*100)/100);};
 const ready=phase==='ready',result=phase==='result',playing=phase==='playing';
 const cardRow=(owner:'player'|'banker')=>{if(!deal)return null;const cards=deal[owner],count=owner==='player'?Math.ceil(shown/2):Math.floor(shown/2);return <section className="arcade-hand"><small>{owner==='player'?'ИГРОК':'БАНКИР'} · {shown>=6?baccaratValue(cards):baccaratValue(cards.slice(0,count))}</small><div>{cards.map((card,i)=><PlayingCard key={i} card={card} hidden={i>=count&&shown<6}/>)}</div></section>;};
 return <GameModal className={`casino-game casino-${props.kind} phase-${phase}`} label={game.title} onDismiss={close}><div className="casino-cabinet">
  <header className="casino-heading"><PotionArtwork kind={props.kind}/><div><small>KNOPIK ARCADE / CASINO</small><h2>{game.title}</h2></div><button type="button" aria-label="К напиткам" onClick={close}>×</button></header>
  <div className="casino-readout"><span>СТАВКА<b>{(ready?selected:stake).toLocaleString('ru-RU')} KC</b></span><span>БАЛАНС<b>{props.balance.toLocaleString('ru-RU')} KC</b></span></div>
  <div className={`casino-stage ${playing?'is-active':''}`}><TableDetails/>
   {(props.kind==='espresso'||props.kind==='whiteTea')&&<ArcadeDealer skin={props.skin} pose={playing?1:0}/>}
   {props.kind==='espresso'&&<div className="arcade-card-table">{blackjack?<><section className="arcade-hand"><small>ДИЛЕР · {result?handValue(blackjack.dealer):handValue(blackjack.dealer.slice(0,1))}</small><div>{blackjack.dealer.map((c,i)=><PlayingCard key={i} card={c} hidden={!result&&i>0}/>)}</div></section><section className="arcade-hand"><small>ТВОЯ РУКА · {handValue(blackjack.player)}</small><div>{blackjack.player.map((c,i)=><PlayingCard key={i} card={c}/>)}</div></section></>:<><div className="arcade-deck"><PlayingCard hidden/><PlayingCard hidden/></div><strong className="casino-stage-caption">21</strong><p>ЭСПРЕССО & КАРТЫ</p></>}</div>}
   {props.kind==='whiteTea'&&<div className="arcade-card-table baccarat-table">{deal?<>{cardRow('banker')}{cardRow('player')}</>:<><div className="arcade-deck"><PlayingCard hidden/><PlayingCard hidden/></div><strong className="casino-stage-caption">9</strong><p>БЕЛЫЙ ЧАЙ & БАРХАТ</p></>}</div>}
   {props.kind==='grape'&&<><RouletteWheel number={number} spinning={playing||result}/>{number!==null&&result&&<span className={`roulette-outcome ${number===0?'is-zero':RED_NUMBERS.has(number)?'is-red':'is-black'}`}>{number}</span>}</>}
   {props.kind==='ginger'&&<div className={`arcade-dice-tray ${playing?'is-shaking':''}`}><svg className="dice-cup" viewBox="0 0 120 90" shapeRendering="crispEdges" aria-hidden="true"><path d="M36 3h48v5h12v10h8v54h-8v8H24v-8h-8V18h8V8h12Z" fill="#c9e0d5" opacity=".25"/><path d="M36 3h48v4H36ZM24 10h5v57h-5Zm68 4h5v55h-5ZM18 72h84v7H18Z" fill="#c2c9b0"/><path d="M35 10h9v4h-9Zm-3 10h4v28h-4Z" fill="#f5ebcd"/></svg><div>{dice.map((d,i)=><PixelDice key={i} value={playing?1+Math.floor(progress+i*2)%6:d}/>)}</div><p>{result?`СУММА ${dice.reduce((a,b)=>a+b,0)}`:'ИМБИРНЫЙ КЛУБ'}</p></div>}
   {props.kind==='peach'&&<PlinkoBoard path={path} progress={progress} risk={risk}/>}
   {props.kind==='currant'&&<div className={`crash-flight ${crashed?'has-crashed':''}`}><svg viewBox="0 0 320 240" shapeRendering="crispEdges" aria-hidden="true"><rect x="22" y="20" width="276" height="200" fill="#273a55"/>{Array.from({length:36},(_,i)=><rect key={i} x={28+i*71%260} y={26+i*43%180} width={i%4===0?3:1} height="2" fill="#9c9db2"/>)}<path d="M30 202h260M30 40v162" fill="none" stroke="#62728a" strokeWidth="2"/><path d={`M30 198L${Math.min(280,40+Math.log(multiplier)*52)} ${Math.max(40,198-Math.log(multiplier)*36)}`} fill="none" stroke={crashed?'#d78b95':'#cfbfed'} strokeWidth="3"/><g transform={`translate(${Math.min(272,36+Math.log(multiplier)*52)} ${Math.max(32,188-Math.log(multiplier)*36)})`}><path d="M0-16h7v5h5v14H-5v-14h5Z" fill="#e8d7af"/><path d="M1-9h5v7H1Z" fill="#887bb4"/><path d="M-5 1h17v6H-5Z" fill="#b77c91"/><path d="M0 7h7v10H0Z" fill={crashed?'#687284':'#f0c77d'}/></g></svg><strong>×{multiplier.toFixed(2)}</strong><span>{crashed?'СВЯЗЬ С РАКЕТОЙ ПОТЕРЯНА':ready?'ДО СТАРТА':'СМОТРИ ЗА РАЗГОНОМ'}</span></div>}
  {result&&<section className={`casino-result ${amount>stake?'is-win':''}`} role="status"><small>{amount===stake?'СТАВКА ВОЗВРАЩЕНА':amount>stake?'ПОБЕДА':'РАУНД ЗАВЕРШЁН'}</small><strong>{amount.toLocaleString('ru-RU')} KC</strong><p>{amount?`Выплата ×${(amount/stake).toFixed(2)} уже на балансе`:'Ставка проиграна'}{stopPoint!==null&&` · Остановка ×${stopPoint.toFixed(2)}`}</p><div className="casino-actions"><button type="button" disabled={!props.onReplay} title={props.onReplay?"Ещё один раунд":"Нужны бутылка и активные KC"} onClick={props.onReplay}>Ещё раз</button><button type="button" onClick={props.onClose}>К напиткам</button></div></section>}
  </div>
  {ready&&<div className="casino-setup">
   {props.canChooseBet?<WagerSlider balance={props.balance} amount={selected} onChange={setBet}/>: <p className="casino-hint">Ставка — весь активный баланс. Ирокез открывает выбор суммы.</p>}
   {props.kind==='grape'&&<><div className="casino-choices">{Object.entries(betNames).map(([v,label])=><button type="button" key={v} aria-pressed={rouletteBet===v} onClick={()=>setRouletteBet(v as RouletteBet)}>{label} ×2</button>)}</div><label className="casino-number">Одно число ×36<select aria-label="Ставка на одно число" value={typeof rouletteBet==='number'?rouletteBet:''} onChange={e=>{if(e.target.value!=='')setRouletteBet(Number(e.target.value));}}><option value="">Выбрать число</option>{Array.from({length:37},(_,i)=><option key={i} value={i}>{i}</option>)}</select></label></>}
   {props.kind==='whiteTea'&&<div className="casino-choices">{(['player','banker','tie'] as const).map((v,i)=><button key={v} type="button" aria-pressed={baccaratBet===v} onClick={()=>setBaccaratBet(v)}>{['Игрок ×2','Банкир ×1.95','Ничья ×9'][i]}</button>)}</div>}
   {props.kind==='ginger'&&<div className="casino-choices">{(['low','high','pair','triple','ten'] as const).map((v,i)=><button key={v} type="button" aria-pressed={diceBet===v} onClick={()=>setDiceBet(v)}>{['Мало ×2','Много ×2','Пара ×2','Тройка ×31','Сумма 10 ×7'][i]}</button>)}</div>}
   {props.kind==='peach'&&<div className="casino-choices">{(['low','medium','high'] as const).map((v,i)=><button key={v} type="button" aria-pressed={risk===v} onClick={()=>setRisk(v)}>{['Мягкий','Средний','Высокий'][i]} риск</button>)}</div>}
   {props.kind==='currant'&&<label className="casino-auto"><input type="checkbox" checked={useAuto} onChange={e=>setUseAuto(e.target.checked)}/>Автовывод ×<input aria-label="Множитель автоматического вывода" type="number" min="1.01" max="100" step=".01" disabled={!useAuto} value={auto} onChange={e=>setAuto(e.target.value)}/></label>}
  </div>}
  <footer className="casino-footer">
  {error&&<p className="casino-error" role="alert">{error}</p>}
  {playing&&props.kind==='espresso'&&<div className="casino-actions"><button type="button" onClick={()=>{handRef.current?.hit();props.onSound('tick');syncHand();}}>Ещё карту</button><button type="button" onClick={()=>{handRef.current?.stand();syncHand();}}>Хватит</button><button type="button" disabled={blackjack?.player.length!==2||props.balance<stake} onClick={()=>{const h=handRef.current;if(!h||h.done||h.player.length!==2)return;if(!props.onDouble(props.kind,stake)){setError('Для удвоения не хватает активных KC');return;}stakeRef.current*=2;setStake(stakeRef.current);h.double();syncHand();}}>Удвоить</button></div>}
  {playing&&props.kind==='currant'&&<button className="casino-primary" type="button" onClick={cashout}>Забрать {quote(payout(stake,Math.floor(multiplier*100)/100),stake).toLocaleString('ru-RU')} KC</button>}
  {playing&&props.kind!=='espresso'&&props.kind!=='currant'&&<p className="casino-live" role="status">{props.kind==='whiteTea'?'Дилер раздаёт карты…':props.kind==='peach'?'Шар в игре…':'Ставка принята…'}</p>}
  {ready&&<button className="casino-primary" type="button" disabled={selected<1} onClick={start}>{props.kind==='espresso'||props.kind==='whiteTea'?'Раздать карты':props.kind==='peach'?'Бросить шар':props.kind==='currant'?'Запустить ракету':'Начать игру'}</button>}

  <ArcadeRules><p>{game.rules}</p><p>Одна бутылка — один раунд. Только игровые KC. Выплата включает возвращённую ставку.</p><p>Игр {props.stats.plays} · побед {props.stats.wins} · лучшая выплата {props.stats.best.toLocaleString("ru-RU")} KC</p></ArcadeRules>
  </footer>
  {askExit&&playing&&<RoundExitConfirm onCancel={()=>setAskExit(false)} onConfirm={()=>{setAskExit(false);finish(0);props.onClose();}}/>}
 </div></GameModal>;
}
