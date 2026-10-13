import { useId } from "react";
import { PixelLogo } from "./pixel-artwork";
import { GameLoadingScene } from "./game-loading-scene";

export function GameLoadingScreen() {
  const prefix = `loading-${useId().replaceAll(":", "")}`;
  return (
    <main className="pixel-game game-loading" aria-busy="true">
      <section className="game-loading__content" aria-label="Загрузка Knopik GO">
        <header className="game-loading__header">
          <p className="game-loading__eyebrow"><span aria-hidden="true"/>ДОМ. КВАРТАЛ. ПРИКЛЮЧЕНИЯ.</p>
          <h1 className="game-loading__logo" aria-label="Knopik GO"><PixelLogo /></h1>
          <p className="game-loading__tagline">Большие истории маленького пса</p>
        </header>
        <figure className="game-loading__poster">
          <GameLoadingScene prefix={prefix}/>
          <figcaption><span className="game-loading__location"><svg viewBox="0 0 18 22" aria-hidden="true"><path d="M5 0h8v3h3v10h-3v3h-2v4H7v-4H5v-3H2V3h3Zm1 5v6h6V5Z" fill="currentColor"/></svg>Липовый квартал</span><span className="game-loading__chapter">ТВОЙ МАЛЕНЬКИЙ МИР</span></figcaption>
        </figure>
        <div className="game-loading__arrival">
          <div className="game-loading__status" role="status" aria-live="polite">Загружаем твой мир<span className="game-loading__dots" aria-hidden="true">…</span></div>
          <div className="game-loading__windows" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
        </div>
        <p className="game-loading__hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v13h-7v4h-4v-4H3Zm4 4v2h10V8Zm0 4v2h7v-2Z" fill="currentColor"/></svg><span>Загляни к соседям.<br/>У каждого своя маленькая история.</span></p>
      </section>
      <footer className="game-loading__footer"><span aria-hidden="true"/>Кнопик уже ждёт тебя<span aria-hidden="true"/></footer>
    </main>
  );
}
