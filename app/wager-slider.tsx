'use client';
import {useId,type CSSProperties} from 'react';

export function wagerRange(balance:number,amount:number,allowZero=false){
 const max=Number.isSafeInteger(balance)?Math.max(0,balance):0;
 const min=allowZero||max===0?0:1;
 const value=Math.min(max,Math.max(min,Number.isFinite(amount)?Math.floor(amount):min));
 return {min,max,value,progress:max>min?(value-min)/(max-min)*100:0};
}

export function WagerSlider({balance,amount,onChange,allowZero=false,disabled=false,className=''}:{balance:number;amount:number;onChange:(amount:number)=>void;allowZero?:boolean;disabled?:boolean;className?:string}){
 const id=useId(),{min,max,value,progress}=wagerRange(balance,amount,allowZero);
 return <section className={`arcade-wager ${className}`} aria-label="Ставка с ирокезом">
  <label htmlFor={id}><span>СТАВКА · ИРОКЕЗ</span><output htmlFor={id}>{value===0&&allowZero?'Без ставки':`${value.toLocaleString('ru-RU')} KC`}</output></label>
  <input id={id} aria-label="Размер ставки" aria-valuetext={value===0?'Без ставки':`${value.toLocaleString('ru-RU')} KC`} type="range" min={min} max={max} step="1" value={value} disabled={disabled||max===min} style={{'--range-progress':`${progress}%`} as CSSProperties} onChange={event=>onChange(wagerRange(max,Number(event.currentTarget.value),allowZero).value)}/>
 </section>;
}
