'use client';
import {resolveSkillWager} from './skill-wager-engine';
type Props={balance:number;canChooseBet:boolean;amount:number;onChange:(amount:number)=>void};
export function SkillBetPicker({balance,canChooseBet,amount,onChange}:Props){
 if(!canChooseBet)return null;
 const max=Number.isSafeInteger(balance)?Math.max(0,balance):0;
 const selected=resolveSkillWager(max,amount,true);
 return <section className="skill-wager" aria-label="Ставка с ирокезом">
  <div className="skill-wager-heading"><strong>СТАВКА · ИРОКЕЗ</strong><span>Активно: {max.toLocaleString('ru-RU')} KC</span></div>
  <div className="skill-wager-input"><label htmlFor="skill-wager-amount">Ставка KC</label><input id="skill-wager-amount" type="number" inputMode="numeric" min="0" max={max} step="1" value={selected} onChange={e=>onChange(resolveSkillWager(max,Number(e.target.value),true))}/><button type="button" onClick={()=>onChange(max)}>Всё</button></div>
  <div className="skill-wager-quick">{[0,.25,.5,1].map((part,i)=><button key={i} type="button" aria-pressed={selected===(part===0?0:Math.max(1,Math.floor(max*part)))} onClick={()=>onChange(part===0?0:Math.max(1,Math.floor(max*part)))}>{['Без ставки','25%','50%','100%'][i]}</button>)}</div>
  <small>Ставка списывается при старте. По результату вернётся от 0 до ×2 ставки. Награда за игру — дополнительно.</small>
 </section>;
}
