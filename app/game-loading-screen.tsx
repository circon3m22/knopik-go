'use client';
import {useSyncExternalStore} from 'react';
import {earlyPlayRequested,earlyPlayServerSnapshot,requestEarlyPlay,subscribeEarlyPlay} from './game-start-intent';
import {ReleasePoster,releaseStyle} from './release-poster';
import {GAME_PRESENTATION} from './release-presentation';
import {GAME_VERSION} from './game-release';

export function GameLoadingScreen({starting=false}:{starting?:boolean}){
 const requested=useSyncExternalStore(subscribeEarlyPlay,earlyPlayRequested,earlyPlayServerSnapshot);
 const playRequested=starting||requested;
 return <main className="pixel-game game-loading release-loading release-immersive" data-presentation={GAME_PRESENTATION.id} style={releaseStyle} aria-busy="true">
  <section className="game-loading__content" aria-label="Загрузка Knopik GO">
   <h1 className="release-visually-hidden">Knopik GO — {GAME_PRESENTATION.title}</h1>
   <ReleasePoster format="portrait"/>
   <div className="game-loading__arrival">
    <p className="release-loading-version">ВЕРСИЯ {GAME_VERSION}</p>
    <button className="loading-quick-play" type="button" disabled={playRequested} onClick={requestEarlyPlay}>{playRequested?'Запускаем…':'Играть'}<span aria-hidden="true">▶</span></button>
    <div className="game-loading__status" role="status" aria-live="polite">Загружаем твой мир<span className="game-loading__dots" aria-hidden="true">…</span></div>
    <div className="game-loading__windows" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
    <p className="release-loading-hint">{playRequested?'Откроем игру, как только будет готов твой прогресс.':GAME_PRESENTATION.hint}</p>
   </div>
  </section>
 </main>;
}
