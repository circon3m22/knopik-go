'use client';
import {WagerSlider} from './wager-slider';
type Props={balance:number;canChooseBet:boolean;amount:number;onChange:(amount:number)=>void};
export function SkillBetPicker({balance,canChooseBet,amount,onChange}:Props){
 return canChooseBet?<WagerSlider balance={balance} amount={amount} onChange={onChange} allowZero/>:null;
}
