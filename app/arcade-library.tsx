'use client';
import {ArcadeGameCover} from './arcade-game-cover';
import {BottomNavigation} from './bottom-navigation';
import type {ThemeId} from './cosmetic-engine';
import {useState} from 'react';
import {GameModal} from './game-modal';
import {ARCADE_CATALOG,type ArcadeCategory,type ArcadeDrink} from './arcade-catalog';
import {BUFF_CATALOG,buffStockLimit,type BuffStock} from './buff-shelf-engine';
import {PotionArtwork} from './cosmetic-artwork';
import {canBuyLabDrink,LAB_MATERIALS,labRecipe,recipeAvailable,type LabMaterial,type LabRecipeId,type LaboratoryProgress} from './laboratory-engine';
import {barDrinkBlock} from './bar-drink-access';
type Props={theme?:ThemeId;onNavigate?:(index:number)=>void;shieldActive?:boolean;stock:BuffStock;laboratory:LaboratoryProgress;balance:number;resting:boolean;busy:boolean;records:Partial<Record<ArcadeDrink,number>>;onPlay:(id:ArcadeDrink)=>void;onBuy:(id:LabRecipeId)=>void;onBrew:(id:LabRecipeId)=>void;onUseBuff:(id:'zhivchik'|'pepsi')=>void;onClose:()=>void};
export function ArcadeLibrary(p:Props){
 const [category,setCategory]=useState<'Все'|ArcadeCategory|'Припасы'>('Все'),[info,setInfo]=useState<LabRecipeId|null>(null);
 const games=category==='Припасы'?(['zhivchik','pepsi','heal'] as const).map(id=>({id,title:({zhivchik:'Бодрость на минуту',pepsi:'Защитный щит',heal:'Лечение в подземелье'})[id],category:'Припасы',rules:'Напиток применяется из общего запаса. Первое приготовление открывает повторную покупку.'})):ARCADE_CATALOG.filter(g=>category==='Все'||g.category===category);
 return <GameModal className={`arcade-library pixel-game theme-${p.theme??"classic"}`} label="Игры" onDismiss={p.onClose}><div className="arcade-library-page"><header className="arcade-library-heading"><div><small>KNOPIK ARCADE</small><h2>Игры</h2><p>{ARCADE_CATALOG.filter(g=>canBuyLabDrink(p.laboratory,g.id)).length} / {ARCADE_CATALOG.length} игр открыто · {p.balance.toLocaleString('ru-RU')} KC</p></div><button type="button" aria-label="Закрыть игры" onClick={p.onClose}>×</button></header>
 <nav className="arcade-library-filters" aria-label="Категории игр">{(['Все','Казино','Реакция','Память','Аркады'] as const).map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>{setCategory(c);setInfo(null);}}>{c}</button>)}</nav>
 <p className="arcade-library-help">Один напиток — одна попытка. Выбери игру, пополни запас и побей рекорд.</p>
 <div className="arcade-library-grid">{games.map(g=>{const id=g.id,count=p.stock[id],unlocked=canBuyLabDrink(p.laboratory,id),recipe=labRecipe(id),available=recipeAvailable(p.laboratory,id),buff=id==='zhivchik'||id==='pepsi'||id==='heal',reason=id==='pepsi'&&p.shieldActive?'Щит уже включён':barDrinkBlock(id,count,p.balance,p.resting,p.busy),buy=!p.busy&&unlocked&&count<buffStockLimit(id)&&p.balance>=BUFF_CATALOG[id].price;
 return <article key={id} className="arcade-library-card" data-unlocked={unlocked}><div className="arcade-library-cover">{!buff&&<ArcadeGameCover kind={id as ArcadeDrink}/>}<span className="arcade-cover-stock"><PotionArtwork kind={id}/><b>{count}</b></span><small>{g.category}</small></div><div className="arcade-library-copy"><small>{BUFF_CATALOG[id].name}</small><h3>{g.title}</h3><p>{unlocked?'Рецепт открыт':available?'Нужно первое приготовление':`Сначала приготовь: ${recipe.requires?labRecipe(recipe.requires).name:''}`}{!buff&&` · ${["pitbull","cocoa","bergamot"].includes(id)?"Побед":g.category==="Казино"?"Выплата":"Рекорд"} ${p.records[id as ArcadeDrink]??0}`}</p><button type="button" className="arcade-rules-link" aria-expanded={info===id} onClick={()=>setInfo(info===id?null:id)}>Правила и рецепт</button></div>
 {info===id&&<div className="arcade-card-info"><p>{g.rules}</p><p>{Object.entries(recipe.cost).map(([m,n])=>`${LAB_MATERIALS[m as LabMaterial].name} ${p.laboratory.materials[m as LabMaterial]}/${n}`).join(' · ')}</p></div>}
 <div className="arcade-card-actions"><button type="button" disabled={!!reason||id==='heal'} onClick={()=>{if(id==='zhivchik'||id==='pepsi')p.onUseBuff(id);else if(!buff)p.onPlay(id as ArcadeDrink);}}>{id==='heal'?'Для подземелья':reason??(buff?'Применить':'Играть · 1 напиток')}</button>{unlocked?<button type="button" disabled={!buy} onClick={()=>p.onBuy(id)}>{count>=buffStockLimit(id)?'Запас полон':`Купить · ${BUFF_CATALOG[id].price.toLocaleString('ru-RU')} KC`}</button>:<button type="button" onClick={()=>p.onBrew(id)}>Приготовить впервые</button>}</div>
 </article>;})}</div><button type="button" className="arcade-lab-shortcut" onClick={()=>p.onBrew('lime')}>Открыть лабораторию · {p.laboratory.job?'варка идёт':'книга рецептов'}</button></div>{p.onNavigate&&<BottomNavigation computer activeIndex={2} onSelect={p.onNavigate}/>}</GameModal>;
}
