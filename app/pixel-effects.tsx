import {useGraphicsQuality} from "./use-graphics-quality";
import {VISUAL_PROFILES} from "./graphics-quality";
import { memo } from "react";
import type { CSSProperties } from "react";
import { PixelCoin } from "./pixel-artwork";

type EffectKind = "tap" | "gold" | "joy" | "rage" | "rest" | "case";
const colors = ["#f4d889", "#fff1d1", "#e4a45e", "#7aab8b", "#cf7975", "#8bb7ce"];
const snap = (value: number) => Math.round(value / 4) * 4;

/** Deterministic, bounded CSS particles: no per-frame React updates or bitmap assets. */
function PixelBurstDrawing({ kind = "tap", seed = 0, count = 24, className = "" }: { kind?: EffectKind; seed?: number; count?: number; className?: string }) {
  const profile=VISUAL_PROFILES[useGraphicsQuality()];
  count=Math.max(3,Math.round(count*profile.particles));
  const distance = kind === "tap" ? 65 : kind === "gold" ? 180 : 230;
  return <span className={`pixel-burst pixel-burst-${kind} ${className}`} aria-hidden="true">
    <svg className="pixel-shockwave pixel-art" viewBox="0 0 64 64" shapeRendering="crispEdges"><path d="M20 2h24v4h10v8h6v10h2v16h-2v10h-6v8H44v4H20v-4H10v-8H4V40H2V24h2V14h6V6h10Z M22 7v4H14v7H9v8H7v12h2v8h5v7h8v4h20v-4h8v-7h5v-8h2V26h-2v-8h-5v-7h-8V7Z" fill="currentColor" fillRule="evenodd" /></svg>
    {Array.from({ length: count }, (_, i) => {
      const angle = (i * 2.39996 + seed * .4);
      const radius = distance * (.4 + (i % 5) * .15);
      const style = { "--px-x": `${snap(Math.cos(angle) * radius)}px`, "--px-y": `${snap(Math.sin(angle) * radius - distance * .25)}px`, "--px-delay": `${(i % 6) * 12}ms`, "--px-size": `${4 + (i % 3) * 4}px`, color: colors[(i + seed) % colors.length] } as CSSProperties;
      return <i key={i} className={`pixel-fragment fragment-${i % 7}`} style={style}>{i % 7 === 0 ? <PixelCoin /> : i % 7 === 1 ? <PixelMark kind={kind === "rage" ? "bolt" : "spark"} /> : null}</i>;
    })}
  </span>;
}

function PixelMarkDrawing({ kind }: { kind: "heart" | "spark" | "bolt" | "sleep" }) {
  return <svg className="pixel-mark pixel-art" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
    <path fill="currentColor" d={kind === "heart" ? "M2 2h4v2h4V2h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V4h2Z" : kind === "bolt" ? "M8 0h6v2h-2v2h-2v2h6v2h-2v2h-2v2h-2v2H6v2H4v-2h2v-4H2V8h2V6h2V4h2Z" : kind === "sleep" ? "M2 2h12v4h-2v2h-2v2H8v2h6v2H2v-4h2V8h2V6h2V4H2Z" : "M6 0h4v4h2v2h4v4h-4v2h-2v4H6v-4H4v-2H0V6h4V4h2Z"} />
    {kind === "heart" && <rect x="3" y="4" width="3" height="2" fill="#fff1d1" />}
  </svg>;
}

function PixelMoodEffectsDrawing({ kind }: { kind: "joy" | "rage" | "rest" }) {
  return <span className={`pixel-mood-effects mood-fx-${kind}`} aria-hidden="true">{Array.from({ length: kind === "joy" ? 16 : 8 }, (_, i) => <i key={i} style={{ "--mood-x": `${i % 2 ? 82 + (i % 3) * 7 : 4 + (i % 3) * 7}%`, "--mood-y": `${25 + (i % 5) * 12}%`, "--mood-delay": `${i * .19}s`, "--mood-size": `${12 + (i % 3) * 4}px` } as CSSProperties}><PixelMark kind={kind === "joy" ? i % 3 ? "heart" : "spark" : kind === "rage" ? "bolt" : "sleep"} /></i>)}</span>;
}

function PixelUltraEffectsDrawing() {
  return <span className="pixel-ultra-effects" aria-hidden="true">
    <svg className="pixel-fire pixel-art" viewBox="0 0 160 96" preserveAspectRatio="none" shapeRendering="crispEdges">
      {["#a64f46", "#d88b4b", "#f4d889"].map((color, layer) => <g className={`pixel-flame-layer layer-${layer}`} fill={color} key={color} transform={`translate(0 ${layer * 16})`}>{Array.from({ length: 16 }, (_, i) => {
        const top = 6 + ((i * 17 + layer * 7) % 6) * 8;
        return <path key={i} d={`M${i * 10} 96V${top + 12}h2v-8h2v-4h2v8h2v12h2v76Z`} />;
      })}</g>)}
    </svg>
    {Array.from({ length: 40 }, (_, i) => <i className="pixel-ember" key={i} style={{ left: `${(i * 31) % 100}%`, "--ember-size": `${4 + (i % 3) * 3}px`, "--ember-delay": `${(i % 13) * .11}s`, "--ember-drift": `${snap((i % 5 - 2) * 16)}px` } as CSSProperties} />)}
  </span>;
}

function PixelRestRingDrawing({ ratio }: { ratio: number }) {
  return <svg className="fatigue-countdown-ring pixel-rest-ring pixel-art" viewBox="0 0 128 128" shapeRendering="crispEdges" aria-hidden="true">{Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round((64 + Math.cos(angle) * 60) / 4) * 4 - 2;
    const y = Math.round((64 + Math.sin(angle) * 60) / 4) * 4 - 2;
    return <rect key={i} x={x} y={y} width="4" height="4" fill={i / 64 < ratio ? "#fff1d1" : "#9b7948"} opacity={i / 64 < ratio ? 1 : .3} />;
  })}</svg>;
}

function PixelEyeLasersDrawing({portrait=false}:{portrait?:boolean}) {
  return <span className="pixel-eye-lasers" aria-hidden="true">
    <svg className="pixel-art" viewBox={portrait?"0 0 128 144":"0 0 128 128"} shapeRendering="crispEdges">
      {[false, true].map(right => <g key={String(right)} transform={`translate(${right ? 85 : 43} 64)`}>
        <g transform={`rotate(${right ? -20 : 20})`}>
          <g className="pixel-eye-beam">
            <path d="M-4 0h8v12h2v34h2v48h2v64h-20V94h2V46h2V12h2Z" fill="#e82d4f" opacity=".32" />
            <path d="M-2 0h4v18h2v48h2v90H-6V66h2V18h2Z" fill="#f54560" />
            <path d="M-1 0h2v64h1v90h-4V64h1Z" fill="#fff2df" />
          </g>
          <g className="pixel-laser-impact" transform="translate(0 154)">
            <path d="M-3-12h6v7h4v2h7v6H7v2H3v7h-6V5h-4V3h-7v-6h7v-2h4Z" fill="#f54560" />
            <path d="M-2-7h4v5h5v4H2v5h-4V2h-5v-4h5Z" fill="#fff2df" />
          </g>
        </g>
        <g className="pixel-laser-flare">
          <path d="M-2-7h4v5h5v4H2v5h-4V2h-5v-4h5Z" fill="#ff667d" />
          <rect x="-2" y="-2" width="4" height="4" fill="#fff2df" />
        </g>
      </g>)}
    </svg>
  </span>;
}

function PixelShieldDrawing() {
  return <svg className="pixel-shield pixel-art" viewBox="0 0 128 128" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M40 1h48v4h16v8h12v12h7v15h4v48h-4v15h-7v12h-12v8H88v4H40v-4H24v-8H12v-12H5V88H1V40h4V25h7V13h12V5h16Z M42 5v4H26v8H16v10H9v15H5v44h4v15h7v10h10v8h16v4h44v-4h16v-8h10v-10h7V86h4V42h-4V27h-7V17h-10V9H86V5Z" fill="#8bb7ce" fillRule="evenodd" />
    {[0,1,2,3].map(i=><rect className="pixel-shield-pip" key={i} x={i%2?118:4} y={i<2?28:92} width="6" height="6" fill="#fff1d1" style={{ animationDelay:`${i*.2}s` }} />)}
  </svg>;
}

export const PixelShield = memo(PixelShieldDrawing);
export const PixelEyeLasers = memo(PixelEyeLasersDrawing);
export const PixelBurst = memo(PixelBurstDrawing);
export const PixelMark = memo(PixelMarkDrawing);
export const PixelMoodEffects = memo(PixelMoodEffectsDrawing);
export const PixelUltraEffects = memo(PixelUltraEffectsDrawing);
export const PixelRestRing = memo(PixelRestRingDrawing);
