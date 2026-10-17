'use client';
import {useState,type ReactNode} from 'react';
import {GameModal} from './game-modal';

export function ArcadeRules({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="arcade-rules-button" aria-label="Правила и выплаты" title="Правила и выплаты" onClick={()=>setOpen(true)}>?</button>{open&&<GameModal className="arcade-rules-dialog" label="Правила и выплаты" onDismiss={()=>setOpen(false)}><section><header><h2>Правила и выплаты</h2><button type="button" aria-label="Закрыть правила" autoFocus onClick={()=>setOpen(false)}>×</button></header>{children}<p className="arcade-economy-rule">Прибыль уменьшается с общим заработком и балансом, включая сейф. После 10 000 KC зарабатывать сложнее, около 50 000 KC — крайне трудно. Не более 2 000 KC прибыли за попытку до снижения; возврат ставки не урезается. Итог показывает начисленную сумму.</p><button type="button" onClick={()=>setOpen(false)}>Понятно</button></section></GameModal>}</>;
}
