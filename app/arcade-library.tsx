'use client';
import {useEffect,useRef,useState} from 'react';
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
function Arrow({back=false}:{back?:boolean}){return <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M2 7h9V5H9V3h2v2h2v2h2v2h-2v2h-2v2H9v-2h2V9H2Z" fill="currentColor" transform={back?'translate(16 0) scale(-1 1)':undefined}/></svg>;}
/** The only launch/purchase area: opening an illustration spends nothing. */
export function ArcadeGamePanel(p:Props&{kind:ArcadeDrink;onBack:()=>void}){
 const game=ARCADE_CATALOG.find(g=>g.id===p.kind)!,id=game.id,count=p.stock[id],recipe=labRecipe(id),unlocked=canBuyLabDrink(p.laboratory,id),available=recipeAvailable(p.laboratory,id);
 const reason=barDrinkBlock(id,count,p.balance,p.resting,p.busy),canBuy=!p.busy&&unlocked&&count<buffStockLimit(id)&&p.balance>=BUFF_CATALOG[id].price;
 return <section className="arcade-game-page" aria-labelledby={`arcade-detail-${id}`}>
  <button type="button" className="arcade-game-back" onClick={p.onBack}><Arrow back/>Все игры</button>
  <div className="arcade-game-hero"><ArcadeGameCover kind={id}/></div>
  <div className="arcade-game-title"><span>{game.category}</span><h3 id={`arcade-detail-${id}`}>{game.title}</h3></div>
  <div className="arcade-game-facts"><span className="arcade-game-drink"><PotionArtwork kind={id}/><span>{BUFF_CATALOG[id].name}<small>Напиток для игры</small></span></span><span className="arcade-game-stock"><b>{count}</b><small>в запасе</small></span></div>
  <p className="arcade-game-readiness" id={`arcade-status-${id}`}>{reason??'На одну попытку нужен один напиток'}</p>
  <div className="arcade-game-actions">
   <button type="button" className="arcade-play-button" disabled={!!reason} aria-label={`Играть · 1 напиток. ${game.title}`} aria-describedby={`arcade-status-${id}`} onClick={()=>p.onPlay(id)}><span>Играть</span><small>1 напиток</small><Arrow/></button>
   {unlocked?<button type="button" className="arcade-supply-button" disabled={!canBuy} onClick={()=>p.onBuy(id)}><span>{count>=buffStockLimit(id)?'Запас полон':'Купить напиток'}</span><small>{BUFF_CATALOG[id].price.toLocaleString('ru-RU')} KC</small></button>:<button type="button" className="arcade-supply-button" onClick={()=>p.onBrew(id)} aria-label={`Приготовить впервые: ${BUFF_CATALOG[id].name}`}><span>Приготовить</span><small>Открыть рецепт</small><Arrow/></button>}
  </div>
  <div className="arcade-game-record"><span>{['pitbull','cocoa','bergamot'].includes(id)?'Побед':game.category==='Казино'?'Лучшая выплата':'Рекорд'}</span><strong>{(p.records[id]??0).toLocaleString('ru-RU')}</strong></div>
  <details className="arcade-game-rules"><summary>Правила и рецепт <span aria-hidden="true">+</span></summary><div><h4>Как играть</h4><p>{game.rules}</p><h4>{unlocked?'Рецепт открыт':'Первое приготовление'}</h4>{!unlocked&&<p>{available?'Приготовь напиток в лаборатории, чтобы открыть повторную покупку.':`Сначала приготовь: ${recipe.requires?labRecipe(recipe.requires).name:''}`}</p>}<ul>{Object.entries(recipe.cost).map(([m,n])=><li key={m}><span>{LAB_MATERIALS[m as LabMaterial].name}</span><strong>{p.laboratory.materials[m as LabMaterial]} / {n}</strong></li>)}</ul></div></details>
 </section>;
}
export function ArcadeLibrary(p:Props){
 const [category,setCategory]=useState<'Все'|ArcadeCategory>('Все'),[selected,setSelected]=useState<ArcadeDrink|null>(null);
 const content=useRef<HTMLDivElement>(null),lastTile=useRef<HTMLButtonElement|null>(null),scroll=useRef(0),wasSelected=useRef(false);
 useEffect(()=>{const node=content.current;if(!node)return;if(selected){node.scrollTop=0;wasSelected.current=true;node.querySelector<HTMLButtonElement>('.arcade-game-back')?.focus({preventScroll:true});}else if(wasSelected.current){node.scrollTop=scroll.current;lastTile.current?.focus({preventScroll:true});wasSelected.current=false;}},[selected]);
 const games=ARCADE_CATALOG.filter(g=>category==='Все'||g.category===category);
 return <GameModal className={`arcade-library pixel-game theme-${p.theme??'classic'}`} label="Игры" onDismiss={selected?()=>setSelected(null):p.onClose}>
  <div className="arcade-library-page" data-library-layout="gallery-3" data-game-selected={selected!==null}>
   <header className="arcade-library-heading"><div><small>KNOPIK ARCADE</small><h2>Игры</h2></div><div className="arcade-library-wallet"><strong>{p.balance.toLocaleString('ru-RU')} <span>KC</span></strong></div><button type="button" aria-label="Закрыть игры" onClick={p.onClose}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M3 2h2v2h2v2h2V4h2V2h2v3h-2v2H9v2h2v2h2v3h-2v-2H9v-2H7v2H5v2H3v-3h2V9h2V7H5V5H3Z" fill="currentColor"/></svg></button></header>
   <nav className="arcade-library-filters" aria-label="Категории игр" hidden={selected!==null}>{(['Все','Казино','Аркады','Реакция','Память'] as const).map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>{scroll.current=0;lastTile.current=null;setSelected(null);setCategory(c);if(content.current)content.current.scrollTop=0;}}>{c}</button>)}</nav>
   <div className="arcade-library-content" ref={content}>
    <div className="arcade-gallery" hidden={selected!==null}>
     <p className="arcade-library-help">Выбери игру · одна попытка за напиток</p>
     <div className="arcade-library-grid">{games.map(game=><article key={game.id} className="arcade-library-card" aria-labelledby={`arcade-title-${game.id}`} data-unlocked={canBuyLabDrink(p.laboratory,game.id)}>
      <button type="button" className="arcade-game-tile" data-arcade-tile={game.id} aria-label={`Открыть игру: ${game.title}. Напитков: ${p.stock[game.id]}`} onClick={event=>{scroll.current=content.current?.scrollTop??0;lastTile.current=event.currentTarget;setSelected(game.id);}}>
       <span className="arcade-library-cover"><ArcadeGameCover kind={game.id}/></span>
       <span className="arcade-library-copy"><span className="arcade-tile-title" role="heading" aria-level={3} id={`arcade-title-${game.id}`}>{game.title}</span><span className="arcade-tile-stock" data-available={p.stock[game.id]>0}><PotionArtwork kind={game.id}/><span>{BUFF_CATALOG[game.id].name}</span><b>×{p.stock[game.id]}</b></span></span>
      </button>
     </article>)}</div>
     <button type="button" className="arcade-lab-shortcut" onClick={()=>p.onBrew('lime')}><span>Лаборатория <small>{p.laboratory.job?'Приготовление идёт':'Приготовить напитки'}</small></span><Arrow/></button>
    </div>
    {selected&&<ArcadeGamePanel {...p} kind={selected} onBack={()=>setSelected(null)}/>}
   </div>
  </div>
  {p.onNavigate&&<BottomNavigation computer activeIndex={2} onSelect={p.onNavigate}/>}
 </GameModal>;
}
