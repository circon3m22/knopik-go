'use client';
import {useState} from 'react';
import {ArcadeGameCover} from './arcade-game-cover';
import {BottomNavigation} from './bottom-navigation';
import {GameModal} from './game-modal';
import {ARCADE_CATALOG,type ArcadeCategory,type ArcadeDrink} from './arcade-catalog';
import {BUFF_CATALOG,buffStockLimit,type BuffStock} from './buff-shelf-engine';
import {PotionArtwork} from './cosmetic-artwork';
import {canBuyLabDrink,LAB_MATERIALS,labRecipe,recipeAvailable,type LabMaterial,type LabRecipeId,type LaboratoryProgress} from './laboratory-engine';
import {barDrinkBlock} from './bar-drink-access';
import type {ThemeId} from './cosmetic-engine';
type Props={theme?:ThemeId;onNavigate?:(index:number)=>void;shieldActive?:boolean;stock:BuffStock;laboratory:LaboratoryProgress;balance:number;resting:boolean;busy:boolean;records:Partial<Record<ArcadeDrink,number>>;onPlay:(id:ArcadeDrink)=>void;onBuy:(id:LabRecipeId)=>void;onBrew:(id:LabRecipeId)=>void;onUseBuff:(id:'zhivchik'|'pepsi')=>void;onClose:()=>void};
export function ArcadeLibrary(p:Props){
 const [category,setCategory]=useState<'Все'|ArcadeCategory>('Все'),[info,setInfo]=useState<ArcadeDrink|null>(null);
 const games=ARCADE_CATALOG.filter(g=>category==='Все'||g.category===category);
 return <GameModal className={`arcade-library pixel-game theme-${p.theme??'classic'}`} label="Игры" onDismiss={p.onClose}>
  <div className="arcade-library-page">
   <header className="arcade-library-heading"><div><small>KNOPIK ARCADE</small><h2>Игры</h2></div><div className="arcade-library-wallet"><small>Активный баланс</small><strong>{p.balance.toLocaleString('ru-RU')} <span>KC</span></strong></div><button type="button" aria-label="Закрыть игры" onClick={p.onClose}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M3 2h2v2h2v2h2V4h2V2h2v3h-2v2H9v2h2v2h2v3h-2v-2H9v-2H7v2H5v2H3v-3h2V9h2V7H5V5H3Z" fill="currentColor"/></svg></button></header>
   <nav className="arcade-library-filters" aria-label="Категории игр">{(['Все','Казино','Аркады','Реакция','Память'] as const).map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>{setCategory(c);setInfo(null);}}>{c}</button>)}</nav>
   <div className="arcade-library-content">
    <div className="arcade-library-intro"><p className="arcade-library-help">Один напиток — одна попытка</p><span>{games.length} игр</span></div>
    <div className="arcade-library-grid">{games.map(g=>{
     const id=g.id,count=p.stock[id],unlocked=canBuyLabDrink(p.laboratory,id),recipe=labRecipe(id),available=recipeAvailable(p.laboratory,id),reason=barDrinkBlock(id,count,p.balance,p.resting,p.busy);
     const buy=!p.busy&&unlocked&&count<buffStockLimit(id)&&p.balance>=BUFF_CATALOG[id].price,record=p.records[id]??0,titleId=`arcade-title-${id}`,infoId=`arcade-info-${id}`,statusId=`arcade-status-${id}`;
     return <article key={id} className="arcade-library-card" data-unlocked={unlocked} aria-labelledby={titleId}>
      <div className="arcade-card-overview"><div className="arcade-library-cover"><ArcadeGameCover kind={id}/></div><div className="arcade-library-copy"><small>{g.category}</small><h3 id={titleId}>{g.title}</h3><span className="arcade-drink-name"><PotionArtwork kind={id}/>{BUFF_CATALOG[id].name}</span></div></div>
      <div className="arcade-card-status" id={statusId}><span className="arcade-stock" data-available={count>0}><i aria-hidden="true"/>{count} в запасе</span><span>{reason??'Можно играть'}</span></div>
      <div className="arcade-card-actions"><button type="button" className="arcade-play-button" disabled={!!reason} aria-label={`Играть · 1 напиток. ${g.title}`} aria-describedby={statusId} onClick={()=>p.onPlay(id)}><span>Играть</span><small>1 напиток <b aria-hidden="true">›</b></small></button>{unlocked?<button type="button" className="arcade-buy-button" disabled={!buy} onClick={()=>p.onBuy(id)}><span>{count>=buffStockLimit(id)?'Запас полон':'Купить напиток'}</span><small>{BUFF_CATALOG[id].price.toLocaleString('ru-RU')} KC</small></button>:<button type="button" className="arcade-buy-button" onClick={()=>p.onBrew(id)}><span>Приготовить впервые</span><small>Открыть рецепт</small></button>}</div>
      <div className="arcade-card-tools"><button type="button" className="arcade-rules-link" aria-expanded={info===id} aria-controls={infoId} onClick={()=>setInfo(info===id?null:id)}>Правила и рецепт <span aria-hidden="true">{info===id?'−':'+'}</span></button><span>{['pitbull','cocoa','bergamot'].includes(id)?'Побед':g.category==='Казино'?'Выплата':'Рекорд'} <b>{record.toLocaleString('ru-RU')}</b></span></div>
      {info===id&&<div className="arcade-card-info" id={infoId}><h4>Как играть</h4><p>{g.rules}</p><h4>{unlocked?'Рецепт открыт':'Первое приготовление'}</h4>{!unlocked&&<p>{available?'Приготовь напиток в лаборатории, чтобы открыть повторную покупку.':`Сначала приготовь: ${recipe.requires?labRecipe(recipe.requires).name:''}`}</p>}<ul>{Object.entries(recipe.cost).map(([m,n])=><li key={m}><span>{LAB_MATERIALS[m as LabMaterial].name}</span><strong>{p.laboratory.materials[m as LabMaterial]} / {n}</strong></li>)}</ul></div>}
     </article>;
    })}</div>
    <button type="button" className="arcade-lab-shortcut" onClick={()=>p.onBrew('lime')}><span>Лаборатория</span><small>{p.laboratory.job?'Приготовление идёт':'Приготовить напитки и открыть новые игры'} <b aria-hidden="true">›</b></small></button>
   </div>
  </div>
  {p.onNavigate&&<BottomNavigation computer activeIndex={2} onSelect={p.onNavigate}/>}
 </GameModal>;
}
