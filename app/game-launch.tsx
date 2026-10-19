"use client";
import {useState,useSyncExternalStore} from "react";
import {GAME_VERSION} from "./game-release";
import {ReleasePoster,releaseStyle} from "./release-poster";
import {GAME_PRESENTATION} from "./release-presentation";
import {retryOfflinePack,useOfflinePack} from "./offline-support";
import {installSnapshot,installServerSnapshot,requestGameInstall,subscribeInstall} from "./game-install";

/** Adventure actors stay unmounted until Play unlocks sound and starts the game. */
export function GameLaunch({onPlay,onCoop}:{onPlay:()=>void;onCoop?:()=>void}){
 const [instructions,setInstructions]=useState(false);
 const status=useOfflinePack(),install=useSyncExternalStore(subscribeInstall,installSnapshot,installServerSnapshot);
 const ready=status.state==="ready",fallback=status.state==="error"||status.state==="unsupported";
 const percent=status.totalBytes?Math.min(100,Math.floor(100*status.bytes/status.totalBytes)):0;
 return <main className="pixel-game game-launch release-launch release-immersive" data-presentation={GAME_PRESENTATION.id} style={releaseStyle}><section className="launch-card" aria-label="Добро пожаловать в Кнопик GO">
  <div className="launch-art"><h1 className="release-visually-hidden">Knopik GO — {GAME_PRESENTATION.title}</h1><ReleasePoster format="portrait"/></div>
  <div className="launch-actions">
   <div className="launch-edition"><small>KNOPIK GO · ВЕРСИЯ {GAME_VERSION}</small><h2>{GAME_PRESENTATION.title}</h2><p>{GAME_PRESENTATION.tagline}</p></div>
   <button type="button" className="launch-play" onClick={onPlay}>Играть<span aria-hidden="true">▶</span></button>
   {onCoop&&<button type="button" className="launch-coop" onClick={onCoop}><span className="launch-coop-label">Играть вдвоём</span></button>}
   {!install.installed&&<button className="launch-install" type="button" onClick={async()=>{setInstructions(await requestGameInstall()==="manual");}}><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M9 1h6v11h5l-8 8-8-8h5ZM2 19h4v2h12v-2h4v5H2Z" fill="currentColor"/></svg>Установить игру</button>}
   {install.installed&&<p className="launch-installed">Игра установлена ✓</p>}
   {instructions&&<div className="launch-install-help" role="status"><strong>Добавить на главный экран</strong><p>На iPhone: открой игру в Safari → «Поделиться» → «На экран Домой».<br/>На Android: меню браузера → «Установить приложение» или «Добавить на главный экран».</p><button type="button" onClick={()=>setInstructions(false)}>Понятно</button></div>}
   <div className="launch-download" aria-live="polite" aria-busy={!ready&&!fallback}>
    <span>{ready?"Всё скачано · можно играть без интернета":fallback?status.state==="error"?"Офлайн-пакет пока не скачан · можно играть онлайн":"Можно играть онлайн":status.state==="downloading"?`Офлайн-пакет загружается в фоне · ${percent}%`:"Можно играть · готовим офлайн-пакет в фоне"}</span>
    <progress max={100} value={ready?100:percent} aria-label="Загрузка игры для игры без интернета"/>
    {status.state==="downloading"&&<small>{(status.bytes/1048576).toFixed(1)} / {(status.totalBytes/1048576).toFixed(1)} МБ</small>}
   </div>
   {status.state==="error"&&<button type="button" className="launch-retry" onClick={retryOfflinePack}>Повторить загрузку</button>}
   <p className="launch-release-hint">{GAME_PRESENTATION.hint}</p>
  </div>
 </section></main>;
}
