"use client";
import {WagerSlider} from "./wager-slider";
import {memo, useMemo, type CSSProperties} from "react";
import {ArcadeDealer} from "./casino-artwork";
import type {KnopikSkin} from "./knopik-skins";
import {GameModal} from "./game-modal";
import {PixelBurst} from "./pixel-effects";
import {CoinArtwork} from "./collectible-artwork";
import type {RiskChance} from "./risk-engine";

const Dial=memo(function Dial({chance}:{chance:number}) {
  const paths=useMemo(()=>{
    const fills:Record<string,string>={};
    for(let y=0;y<192;y+=4)for(let x=0;x<192;x+=4) {
      const dx=x+2-96,dy=y+2-96,r=Math.hypot(dx,dy);
      if(r>94)continue;
      const angle=Math.abs(Math.atan2(dx,dy))*180/Math.PI;
      const win=angle<=chance*1.8;
      const tick=Math.round(Math.atan2(dy,dx)*180/Math.PI/15)%2===0;
      const color=r>90?"#453e46":r>86?"#d4a66c":r>81?(tick?"#fff1c0":"#886148"):r>77?"#423e48":win?(r>65?"#b6d590":dy>0?"#6eac82":"#5e927c"):(r>65?"#a27d72":"#6c5861");
      fills[color]=(fills[color]??"")+`M${x} ${y}h4v4h-4Z`;
    }
    return Object.entries(fills);
  },[chance]);
  return <svg className="pitbull-dial pixel-art" viewBox="0 0 192 192" shapeRendering="crispEdges" aria-hidden="true">
    {paths.map(([fill,d])=><path key={fill} fill={fill} d={d}/>)}
    <path d="M94 17h4v11h-4Zm0 147h4v11h-4ZM17 94h11v4H17Zm147 0h11v4h-11Z" fill="#fff1c0"/>
    {Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,x=Math.round(96+Math.cos(a)*73),y=Math.round(96+Math.sin(a)*73);return <g key={i}><rect x={x} y={y} width="2" height="2" fill="#f0d4a2"/>{i%3===0&&<path d={`M${x-1} ${y+3}h4v1h-4Z`} fill="#49454d"/>}</g>;})}
    <path d="M64 40h4v4h-4Zm54 103h4v4h-4Zm-75-32h4v4h-4Zm100-52h4v4h-4Z" fill="#d7bb99"/>
    <path d="M83 154h26v4H83Zm5 6h16v4H88Z" fill="#e5ecb0"/>
  </svg>;
});
type Props={skin?:KnopikSkin;phase:string; chance:RiskChance; bet:number; balance:number; multiplier:number; payout:number; result:"win"|"lose"|null; rotation:number; spinNonce:number; duration:number; canChooseBet:boolean; message:string; onChance:(chance:RiskChance)=>void;onBet:(amount:number)=>void;onSpin:()=>void;onClose:()=>void};
export function PitbullGame(props:Props) {
  const selecting=props.phase==="selecting";
  const bet=selecting?Math.min(props.balance,Math.max(1,props.bet)):props.bet;
  const status=props.result==="win"?`+${props.payout.toLocaleString("ru-RU")} KC`:props.result==="lose"?`−${bet.toLocaleString("ru-RU")} KC`:selecting?"ВЫБЕРИ СЕКТОР":"СТРЕЛКА РЕШАЕТ";
  return <GameModal className={`pitbull-game phase-${props.phase} ${props.result?`result-${props.result}`:""}`} label="Питбуль — сектор удачи" onDismiss={()=>{if(selecting)props.onClose();}}>
    <div className="pitbull-cabinet">
      <header className="pitbull-header"><div><small>KNOPIK ARCADE / 03</small><h2>ПИТБУЛЬ</h2></div><button type="button" disabled={!selecting} aria-label="К напиткам" onClick={props.onClose}>×</button></header>
      <div className="pitbull-readouts"><div><small>СТАВКА</small><strong style={{fontSize:bet>=1e12?"15px":undefined}}><CoinArtwork/>{bet.toLocaleString("ru-RU")}</strong></div><div><small>ВЫИГРЫШ</small><strong>×{props.multiplier}</strong></div></div>
      <div className="pitbull-wheel-stage"><ArcadeDealer skin={props.skin} pose={selecting?0:1}/>
        <div className="pitbull-wheel">
        <div className="pitbull-corner corner-tl"/><div className="pitbull-corner corner-tr"/><div className="pitbull-corner corner-bl"/><div className="pitbull-corner corner-br"/>
        <Dial chance={props.chance}/>
        <svg key={props.spinNonce} className="pitbull-needle pixel-art" viewBox="0 0 192 192" style={{"--pointer-end":`${props.rotation}deg`,"--pointer-duration":`${props.duration}ms`} as CSSProperties} aria-hidden="true">
          <g><path d="M91 73h10v41h-10Zm-3 38h16v33h-16Zm-5 30h26v8h-4v8h-4v8H91v-8h-4v-8h-4Z" fill="#463442"/><path d="M93 76h6v40h-6Zm-2 38h10v30H91Zm-4 29h18v5h-4v8h-3v6h-4v-6h-3v-8h-4Z" fill="#ffdc8a"/><path d="M93 79h2v62h-2Zm-2 65h4v9h-4Z" fill="#fff4cf"/></g>
        </svg>
        <svg className="pitbull-hub pixel-art" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 2h14v4h5v5h3v12h-4v5h-5v3H10v-4H5v-5H2V10h4V5h3Z" fill="#403944"/><path d="M11 5h10v4h5v12h-5v5H11v-5H6V11h5Z" fill="#d9ac70"/><path d="M12 9h8v3h3v8h-4v3h-7v-4H9v-7h3Z" fill="#fff1c0"/><path d="M13 12h6v8h-6Z" fill="#9c6d54"/></svg>
        {props.phase==="result"&&<PixelBurst key={props.spinNonce} kind={props.result==="win"?"gold":"rage"} count={80} className="pitbull-result-burst"/>}
        </div>
      </div>
      <div className="pitbull-lcd" role="status"><small title="Зелёный сектор — победа. Выплата включает ставку.">{props.result?props.result==="win"?"ПОБЕДА":"НЕ ПОВЕЗЛО":`${props.chance}% СЕКТОР`}</small><strong>{props.message||status}</strong></div>
      <div className="pitbull-controls">
        <label className="pitbull-sector"><span>Сектор <b>{props.chance}%</b></span><input type="range" min="10" max="90" step="10" value={props.chance} style={{"--range-progress":`${(props.chance-10)/80*100}%`} as CSSProperties} disabled={!selecting} onChange={event=>props.onChance(Number(event.currentTarget.value) as RiskChance)}/></label>
        {props.canChooseBet&&<WagerSlider className="pitbull-bet" balance={props.balance} amount={bet} onChange={props.onBet} disabled={!selecting}/>}
        <button type="button" className="pitbull-spin" disabled={!selecting||bet<1} onClick={props.onSpin}>{selecting?"КРУТИТЬ СТРЕЛКУ":props.phase==="result"?"РЕЗУЛЬТАТ":"КРУТИМ…"}<span aria-hidden="true">▶</span></button>
      </div>
    </div>
  </GameModal>;
}
