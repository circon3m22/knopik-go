"use client";

import { memo, useId, type CSSProperties } from "react";
import { PixelBurst } from "./pixel-effects";
import { SLOT_SYMBOL_LABELS, type SlotOutcome, type SlotSymbol } from "./mini-game-engine";

export const COCOA_REEL_STOPS = [20, 25, 30] as const;
export const COCOA_REEL_TIMES = [1800, 2280, 2780] as const;
export const COCOA_SPIN_TIME = 2960;
const SYMBOLS: readonly SlotSymbol[] = ["cherry", "lemon", "seven", "star", "diamond"];

/** Shared vector art: long reel strips contain references, not repeated drawings. */
function CocoaSymbolDrawing({ kind }: { kind: SlotSymbol }) {
  return <g shapeRendering="crispEdges">
    {kind === "cherry" ? <>
      <path d="M15 26h4V16h7V7h8v4h-5v9h-6v10h-5Z" fill="#315b44" />
      <path d="M28 7h10v3h5v4H32v-3h-4Z" fill="#648e52" /><path d="M31 8h7v2h-7Z" fill="#bad484" />
      <path d="M6 24h10v3h4v4h2v10h-4v4H6v-3H2V30h4Zm25-5h9v3h5v5h2v10h-4v4H31v-3h-4V25h4Z" fill="#602d35" />
      <path d="M7 26h9v4h3v10h-4v3H7v-3H4V31h3Zm25-5h8v3h4v12h-4v3h-8v-4h-3V26h3Z" fill="#b64f4e" />
      <path d="M7 27h6v4H7v5H5v-5h2Zm25-4h6v3h-6v7h-2v-6h2Z" fill="#f5b29a" />
      <path d="M14 36h4v4h-4Zm25-5h4v5h-4Z" fill="#8d3d45" />
    </> : kind === "lemon" ? <>
      <path d="M32 3h9v3h4v4h-9v4h-7V7h3Z" fill="#416c46" /><path d="M34 5h7v2h-7Z" fill="#95b968" />
      <path d="M15 9h14v3h8v5h5v8h3v10h-6v6h-9v4H16v-3H8v-6H4V25h3v-9h8Z" fill="#987049" />
      <path d="M16 11h12v4h8v5h4v14h-5v5h-7v3H17v-3H9v-6H7v-9h3v-7h6Z" fill="#e8b952" />
      <path d="M17 13h9v3h7v4h4v9h-4v5H16v-4H11v-8h3v-5h3Z" fill="#f8d77b" />
      <path d="M17 15h9v3h-9Zm-4 6h4v5h-4Z" fill="#fff0b2" />
      <path d="M12 32h3v3h-3Zm11 4h3v3h-3Zm12-9h3v4h-3Z" fill="#c29141" />
    </> : kind === "seven" ? <>
      <path d="M6 5h35v13h-6v7h-5v7h-5v12H11V30h5v-7h5v-6H6Z" fill="#6f303b" />
      <path d="M8 7h31v9h-6v7h-5v7h-5v12H13V31h5v-7h5v-7h5v-3H8Z" fill="#bd5757" />
      <path d="M9 8h28v4H9Zm22 8h4v5h-4Zm-6 8h4v5h-4Zm-5 8h3v8h-3Z" fill="#f4b799" />
      <path d="M9 8h21v2H9Z" fill="#fff0c7" /><path d="M14 36h4v6h-4Z" fill="#97424c" />
    </> : kind === "star" ? <>
      <path d="M21 3h6v7h4v6h14v7h-7v5h-4v7h4v9h-8v-4h-6v-4h-5v4h-6v4H6v-9h5v-7H7v-5H2v-7h14v-6h5Z" fill="#986841" />
      <path d="M22 5h4v7h4v6h13v3h-7v6h-4v7h4v8h-4v-4h-7v-5h-7v5h-7v4H8v-6h5V26H9v-5H4v-3h14v-6h4Z" fill="#efbf64" />
      <path d="M23 8h2v11h-6v3H8v-2h12v-5h3Z" fill="#fff0b2" />
      <path d="M25 21h6v9h-4v-4h-2Zm-7 4h3v6h-3Z" fill="#d59a47" /><path d="M20 20h3v3h-3Z" fill="#fff9da" />
    </> : <>
      <path d="M13 6h22v4h6v7h4v10h-5v6h-5v6h-6v6H19v-6h-6v-6H8v-6H3V17h4v-7h6Z" fill="#284c67" />
      <path d="M14 8h20v4h6v7h3v7h-5v5h-5v6h-6v6h-6v-6h-6v-6h-5v-5H5v-7h4v-7h5Z" fill="#78aaba" />
      <path d="M14 8h9v10H7v-4h7Zm11 0h9v5h5v5H25Z" fill="#bededb" />
      <path d="M7 21h14v18h-4v-7h-5v-6H7Z" fill="#82c7ce" />
      <path d="M25 21h16v5h-5v6h-5v6h-6Z" fill="#3e7398" />
      <path d="M21 9h4v9h-4Zm1 12h3v20h-3Z" fill="#e7f4df" /><path d="M11 13h7v3h-7Z" fill="#fff7de" />
    </>}
  </g>;
}
const CocoaSymbol = memo(CocoaSymbolDrawing);

type Props = {
  phase: "ready" | "spinning" | "result";
  stopped: number;
  outcome: SlotOutcome | null;
  spinOutcome: SlotOutcome | null;
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  bet: number;
};

export function CocoaMachine({ phase, stopped, outcome, spinOutcome, reels, bet }: Props) {
  const id = `cocoa-${useId().replace(/:/g, "")}`;
  const won = phase === "result" && (outcome?.payout ?? 0) > 0;
  const jackpot = won && outcome?.tier === "jackpot";
  const resultLabel = won ? jackpot ? "ДЖЕКПОТ" : outcome?.tier === "pair" ? "ПАРА" : "ТРИ В РЯД" : "БЕЗ КОМБИНАЦИИ";
  const amount = phase === "result" ? `${won ? "+" : "−"}${(won ? outcome!.payout : bet).toLocaleString("ru-RU")}` : phase === "spinning" ? "● ● ●" : "ГОТОВ К ИГРЕ";
  return <div className={`cocoa-machine phase-${phase} ${won ? "is-win" : ""} ${jackpot ? "is-jackpot" : ""}`}>
    <svg className="cocoa-cabinet-art" viewBox="0 0 360 408" shapeRendering="crispEdges" role="img" aria-label={phase === "spinning" ? "Какао: барабаны вращаются" : `Какао: ${reels.map(symbol => SLOT_SYMBOL_LABELS[symbol]).join(", ")}`}>
      <defs>
        {SYMBOLS.map(symbol => <g key={symbol} id={`${id}-${symbol}`}><CocoaSymbol kind={symbol}/></g>)}
        <g id={`${id}-coin`}><path d="M-7-10H7v3h3V7H7v3H-7V7h-3V-7h3Z" fill="#845b35"/><path d="M-6-9H6v3h3V6H6v3H-6V6h-3V-6h3Z" fill="#efbd59"/><path d="M-6-7H4v2H-6v7h-2v-7h2Z" fill="#fff0ad"/><path d="M-3-5h2v4h2v-4h3v2H2v4h2v4H1V1h-2v4h-2Z" fill="#a07137"/></g>
      </defs>
      <path d="M38 29h279v12h17v336h-12v24H47v-14H29V53h9Z" fill="#131f27" />
      <path d="M42 14h255v8h18v15h10v336h-12v19H37v-19H25V37h9V22h8Z" fill="#453132" />
      <path d="M44 18h251v8h15v15h10v327h-12v19H42v-19H30V41h9V26h5Z" fill="#8d6047" />
      <path d="M44 18h251v8H44Zm-5 9h9v18h-9Zm-9 18h7v318h-7Z" fill="#e8bb7b" />
      <path d="M306 42h14v326h-12v19H43v-8h255v-18h8Z" fill="#62413b" />
      <path d="M48 30h249v7h8v324h-8v14H48v-14h-8V37h8Z" fill="#315551" />
      <path d="M48 30h249v5H48ZM40 38h6v320h-6Z" fill="#71927a" />
      <path d="M296 37h9v324h-8v14H48v-6h239v-16h9Z" fill="#203b3e" />
      <path d="M54 42h235v5h7v43H46V47h8Z" fill="#172d34" />
      <path d="M55 43h230v4H55Z" fill="#83a085" />
      <text x="170" y="73" textAnchor="middle" className="cocoa-marquee">КАКАО</text>
      <path d="M72 82h197v3H72Z" fill="#a98253" />
      {Array.from({ length: 28 }, (_, i) => {
        const side = i < 14;
        return <g key={i} className="cocoa-lamp" style={{ "--lamp-delay": `${i * 65}ms` } as CSSProperties}>
          <rect x={side ? 33 : 310} y={52 + (i % 14) * 22} width="6" height="9" fill="#412f32" />
          <rect className="cocoa-lamp-light" x={side ? 34 : 311} y={53 + (i % 14) * 22} width="4" height="5" fill="#f6d78c" />
        </g>;
      })}
      <path d="M46 98h250v158H46Z" fill="#dba769" />
      <path d="M49 101h244v152H49Z" fill="#60493c" />
      <path d="M49 101h244v5H49Zm0 0h5v152h-5Z" fill="#f3d5a2" />
      <path d="M287 106h6v147H54v-5h233Z" fill="#a47d52" />
      {[0, 1, 2].map(reel => {
        const stop = COCOA_REEL_STOPS[reel];
        const matching = won && outcome!.reels.filter(symbol => symbol === outcome!.reels[reel]).length > 1;
        return <g className={`cocoa-reel ${stopped > reel ? "is-stopped" : ""} ${matching ? "is-match" : ""}`} key={reel}>
          <svg x={56 + reel * 77} y="111" width="73" height="135" viewBox="0 0 73 135" overflow="hidden" aria-hidden="true">
            <rect width="73" height="135" fill="#f6e7c7" />
            <g className={`cocoa-reel-strip ${phase !== "ready" ? "has-spun" : ""}`} style={{ "--reel-travel": `${-stop * 80}px`, "--reel-time": `${COCOA_REEL_TIMES[reel]}ms` } as CSSProperties}>
              {Array.from({ length: 33 }, (_, face) => {
                const symbol = spinOutcome && face === stop ? spinOutcome.reels[reel] : SYMBOLS[(face + reel) % SYMBOLS.length];
                return <g key={face} transform={`translate(0 ${27.5 + face * 80})`}><path d="M0 1h73v2H0Z" fill="#e5d2ac"/><use href={`#${id}-${symbol}`} x="11" y="14" width="48" height="48" /></g>;
              })}
            </g>
            <path d="M0 0h73v9H0Zm0 126h73v9H0Z" fill="#82715c" opacity=".7" />
            <path d="M0 9h73v9H0Zm0 108h73v9H0Z" fill="#b5a286" opacity=".55" />
            <path d="M0 18h73v8H0Zm0 100h73v8H0Z" fill="#d4c2a4" opacity=".45" />
            <path d="M1 1h3v133H1Z" fill="#fff4da" opacity=".65" />
            <rect className="cocoa-reel-match" x="2" y="29" width="69" height="77" fill="none" stroke="#bf813f" strokeWidth="3" />
          </svg>
          <rect x={70 + reel * 77} y="260" width="44" height="5" fill="#162f34" />
          <rect className="cocoa-stop-light" x={72 + reel * 77} y="261" width="40" height="3" fill={stopped > reel ? "#f6d78c" : "#58826b"} />
        </g>;
      })}
      <path d="M44 171h8v-5h5v16h-5v-5h-8Zm254 0h-8v-5h-5v16h5v-5h8Z" fill="#f7d48c" />
      <path d="M49 172h242v2H49Z" className="cocoa-payline" fill="#b98545" />
      <path d="M58 274h226v5h5v49H53v-49h5Z" fill="#12292f" />
      <path d="M59 275h223v3H59Z" fill="#8bad86" />
      {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M59 ${280 + i * 2.5}h223v1H59Z`} fill="#38564d" opacity=".25" />)}
      <path d="M92 345h160v28H92Z" fill="#ab8054" /><path d="M96 348h152v20H96Z" fill="#172b30" />
      <path d="M98 364h148v6H98Z" fill="#e6bc7d" /><path d="M100 367h142v3H100Z" fill="#f9dd9f" />
      <path d="M56 340h21v5H56Zm0 9h21v5H56Zm0 9h21v5H56Zm208-18h20v5h-20Zm0 9h20v5h-20Zm0 9h20v5h-20Z" fill="#17383a" />
      {[[47, 35], [291, 35], [47, 363], [291, 363], [52, 95], [289, 95]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="5" height="5" fill="#eed095"/><path d={`M${x + 1} ${y + 2}h3v1h-3Z`} fill="#6e513d"/></g>)}
      {Array.from({length:18},(_,i)=><g key={`engraving-${i}`}><path d={`M${55+i*13} 89h6v1h-6Zm0 245h6v1h-6Z`} fill="#cca76e"/><path d={`M${57+i*13} 90h2v3h-2Z`} fill="#a97c50"/></g>)}
      <path d="M66 335h18v32H66Zm190 0h18v32h-18Z" fill="#152e35"/>
      <path d="M69 338h12v2H69Zm0 5h12v2H69Zm0 5h12v2H69Zm0 5h12v2H69Zm190-15h12v2h-12Zm0 5h12v2h-12Zm0 5h12v2h-12Zm0 5h12v2h-12Z" fill="#65877a"/>
      <g className="cocoa-lever">
        <path d="M321 185h11v57h-11Z" fill="#d4a672" /><path d="M323 189h6v51h-6Z" fill="#725346" />
        <path d="M327 204h13v-59h-7v62h-6Z" fill="#45333a" /><path d="M334 150h4v55h-4Z" fill="#f0d7aa" />
        <path d="M327 125h19v4h4v17h-4v5h-19v-5h-4v-17h4Z" fill="#642e3c" />
        <path d="M328 127h15v4h4v12h-4v4h-15v-4h-3v-12h3Z" fill="#b75558" />
        <path d="M329 129h10v4h-10v6h-3v-6h3Z" fill="#f3b496" />
      </g>
      {won && <g className="cocoa-coin-shower" aria-hidden="true">{Array.from({ length: jackpot ? 64 : 42 }, (_, i) => <g className="cocoa-flying-coin" key={i} style={{ "--coin-x": `${(i * 61 % 293) - 146}px`, "--coin-y": `${44 + i * 47 % 87}px`, "--coin-arc": `${-48 - i * 13 % 85}px`, "--coin-delay": `${i * 37}ms`, "--coin-turn": `${i % 2 ? 170 : -140}deg` } as CSSProperties}><g transform="translate(171 350)"><use className="cocoa-coin-face" href={`#${id}-coin`}/></g></g>)}</g>}
    </svg>
    <div className="cocoa-display" role="status" aria-live="polite">
      <small>{phase === "result" ? `${resultLabel}${won ? ` · ×${outcome!.multiplier.toLocaleString("ru-RU")}` : ""}` : phase === "spinning" ? stopped === 0 ? "ВРАЩЕНИЕ" : `БАРАБАН ${stopped} · СТОП` : "KNOPIK COIN"}</small>
      <strong style={{ "--amount-size": amount.length > 13 ? "18px" : "26px" } as CSSProperties}>{amount}</strong>
    </div>
    {won && <PixelBurst kind="gold" count={jackpot ? 96 : 56} className="cocoa-reward-burst"/>}
  </div>;
}

export function CocoaPaytable() {
  return <div className="cocoa-paytable" aria-label="Комбинации и множители">
    <span><svg viewBox="0 0 48 48" aria-hidden="true"><CocoaSymbol kind="diamond"/></svg><b>×6</b></span>
    <span><svg viewBox="0 0 48 48" aria-hidden="true"><CocoaSymbol kind="seven"/></svg><b>×4</b></span>
    <span>Три <b>×3,2</b></span><span>Пара <b>×1,35</b></span>
  </div>;
}
