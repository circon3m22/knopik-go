import { PixelDog, PixelLogo } from "./pixel-artwork";

export function GameLoadingScreen() {
  return (
    <main className="pixel-game game-loading" aria-busy="true">
      <div className="game-loading__stars" aria-hidden="true" />
      <section className="game-loading__content" aria-label="Загрузка Knopik GO">
        <p className="game-loading__eyebrow">МАЛЕНЬКИЙ ПЁС. БОЛЬШОЕ ПРИКЛЮЧЕНИЕ.</p>
        <h1 className="game-loading__logo" aria-label="Knopik GO"><PixelLogo /></h1>
        <div className="game-loading__scene" aria-hidden="true">
          <svg className="game-loading__city" viewBox="0 0 320 180" shapeRendering="crispEdges">
            <path d="M254 16h20v4h4v20h-4v4h-20v-4h-4V20h4Z" fill="#f3dba0" />
            <path d="M258 16h16v4h4v20h-4v4h-8V32h-8Z" fill="#c7b58d" />
            <path d="M0 78h25V58h34v35h25V68h30v35h26V82h39V53h29v42h28V70h39v23h25V65h20v91H0Z" fill="#343850" />
            <path d="M0 111h35V86h44v25h24v-8h37v19h47V91h37v20h22V99h41v17h33v43H0Z" fill="#45465c" />
            <path d="M41 97h6v8h-6Zm17 0h6v8h-6Zm137 5h6v8h-6Zm16 0h6v8h-6ZM6 89h6v9H6Zm31-20h6v9h-6Zm16 0h6v9h-6Zm134-5h6v9h-6Zm16 0h6v9h-6Zm43 19h6v9h-6Zm16 0h6v9h-6Z" fill="#d9ad72" />
            <path d="M0 150h320v6H0Z" fill="#b4b6aa" />
            <path d="M0 156h320v24H0Z" fill="#292c40" />
            <path d="M0 156h320v3H0Z" fill="#69717b" />
            <path d="M16 171h28v3H16Zm65 0h28v3H81Zm65 0h28v3h-28Zm65 0h28v3h-28Zm65 0h28v3h-28Z" fill="#a5a08e" />
          </svg>
          <div className="game-loading__halo" />
          <div className="game-loading__dog"><PixelDog ears joy={3} /></div>
          <span className="game-loading__spark game-loading__spark--left" />
          <span className="game-loading__spark game-loading__spark--right" />
        </div>
        <div className="game-loading__status" role="status" aria-live="polite">
          <span className="game-loading__light" aria-hidden="true" />
          Загружаем приключение<span className="game-loading__dots" aria-hidden="true">...</span>
        </div>
        <div className="game-loading__track" aria-hidden="true"><span /></div>
        <p className="game-loading__hint">Кнопик уже ждёт тебя</p>
      </section>
      <span className="game-loading__footer" aria-hidden="true">KNOPIK WORLD · GO</span>
    </main>
  );
}
