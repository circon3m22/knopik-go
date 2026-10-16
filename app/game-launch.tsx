"use client";
import {useState,useSyncExternalStore} from "react";
import {GAME_VERSION,GAME_RELEASE_TITLE} from "./game-release";
import {PixelLogo} from "./pixel-artwork";
import {GameLoadingScene} from "./game-loading-scene";
import {retryOfflinePack,useOfflinePack} from "./offline-support";
import {installSnapshot,installServerSnapshot,requestGameInstall,subscribeInstall} from "./game-install";

/** Adventure actors stay unmounted until Play unlocks sound and starts the game. */
export function GameLaunch({onPlay,onCoop}:{onPlay:()=>void;onCoop?:()=>void}){
 const [instructions,setInstructions]=useState(false);
 const status=useOfflinePack(),install=useSyncExternalStore(subscribeInstall,installSnapshot,installServerSnapshot);
 const ready=status.state==="ready",fallback=status.state==="error"||status.state==="unsupported";
 const percent=status.totalBytes?Math.min(100,Math.floor(100*status.bytes/status.totalBytes)):0;
 return <main className="pixel-game game-launch"><section className="launch-card" aria-label="Добро пожаловать в Кнопик GO">
  <h1 className="launch-logo" aria-label="Кнопик GO"><PixelLogo/></h1>
  <p className="launch-version">{GAME_VERSION} · {GAME_RELEASE_TITLE}</p>
  <div className="launch-world" aria-hidden="true"><GameLoadingScene prefix="launch-world"/></div>
  <div className="launch-actions">
   {!install.installed&&<button className="launch-install" type="button" onClick={async()=>{setInstructions(await requestGameInstall()==="manual");}}><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M9 1h6v11h5l-8 8-8-8h5ZM2 19h4v2h12v-2h4v5H2Z" fill="currentColor"/></svg>Установить игру</button>}
   {install.installed&&<p className="launch-installed">Игра установлена ✓</p>}
   {instructions&&<div className="launch-install-help" role="status"><strong>Добавить на главный экран</strong><p>На iPhone: открой игру в Safari → «Поделиться» → «На экран Домой».<br/>На Android: меню браузера → «Установить приложение» или «Добавить на главный экран».</p><button type="button" onClick={()=>setInstructions(false)}>Понятно</button></div>}
   <div className="launch-download" aria-live="polite" aria-busy={!ready&&!fallback}>
    <span>{ready?"Всё скачано · можно играть без интернета":fallback?status.state==="error"?"Не удалось закончить загрузку":"Офлайн-загрузка недоступна в этом браузере":status.state==="downloading"?`Скачиваем игру · ${percent}%`:"Готовим игру для телефона…"}</span>
    <progress max={100} value={ready?100:percent} aria-label="Загрузка игры для игры без интернета"/>
    {status.state==="downloading"&&<small>{(status.bytes/1048576).toFixed(1)} / {(status.totalBytes/1048576).toFixed(1)} МБ</small>}
   </div>
   {status.state==="error"&&<button type="button" className="launch-retry" onClick={retryOfflinePack}>Повторить загрузку</button>}
   {(ready||fallback)&&<button type="button" className="launch-play" onClick={onPlay}>{ready?"Играть":"Играть онлайн"}<span aria-hidden="true">▶</span></button>}
   {onCoop&&<button type="button" className="launch-coop" onClick={onCoop}>Играть вдвоём</button>}
  </div>
 </section></main>;
}
