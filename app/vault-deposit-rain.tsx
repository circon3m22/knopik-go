'use client';
import {useEffect,useRef} from 'react';
import {getVisualProfile} from './graphics-quality';
import {vaultCoinPose} from './vault-coin-physics';
export function VaultDepositRain({amount}:{amount:number}){
 const ref=useRef<SVGSVGElement>(null),count=getVisualProfile().detail===0?18:getVisualProfile().detail===1?28:44;
 useEffect(()=>{const svg=ref.current;if(!svg)return;const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;if(reduced){svg.style.display='none';return;}
  const width=window.innerWidth,height=window.innerHeight,rect=document.querySelector('.game-shell .vault-swipe .safe-icon')?.getBoundingClientRect(),target={x:rect?rect.left+rect.width/2:width*.78,y:rect?rect.top+rect.height/2:height*.78};svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const coins=Array.from(svg.querySelectorAll('[data-vault-coin]')),began=performance.now();let frame=0;const paint=(now:number)=>{const t=(now-began)/1000;for(let i=0;i<coins.length;i++){const p=vaultCoinPose(i,t,width,target),n=coins[i];n.setAttribute('display',p.visible?'inline':'none');if(!p.visible)continue;n.setAttribute('transform',`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rotation.toFixed(1)}) scale(${p.flip.toFixed(2)} 1)`);n.setAttribute('opacity',p.opacity.toFixed(2));}if(t<1.85)frame=requestAnimationFrame(paint);};frame=requestAnimationFrame(paint);return()=>cancelAnimationFrame(frame);
 },[]);
 return <div className="vault-deposit-rain" role="status" aria-label={`В сейф перенесено ${amount.toLocaleString('ru-RU')} KC`}><svg ref={ref} aria-hidden="true" shapeRendering="crispEdges">{Array.from({length:count},(_,i)=><g key={i} data-vault-coin={i} display="none"><path d="M-5-10H5v2h3v3h2V5H8v3H5v2H-5V8h-3V5h-2V-5h2v-3h3Z" fill="#80573d"/><path d="M-4-9H4v2h3v3h2V4H7v3H4v2H-4V7h-3V4h-2V-4h2v-3h3Z" fill="#dfb96e"/><path d="M-4-7H4v2H-4Zm-3 3h2V4h-2Z" fill="#f6df9c"/><path d="M-3-4h2v3h2v-3h2v4H1v2h3v2H1V2h-2v2h-2Z" fill="#aa7c48"/></g>)}</svg><strong>+{amount.toLocaleString('ru-RU')} <small>В СЕЙФ</small></strong></div>;
}
