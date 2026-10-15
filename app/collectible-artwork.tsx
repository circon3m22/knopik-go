"use client";
import type { CaseKind } from "./case-engine";
import { PixelCoin, PixelCasePart, PixelDog } from "./pixel-artwork";
export {AuraCoinArtwork} from "./aura-artwork";

export function CoinArtwork() {
  return <PixelCoin />;
}

export function CaseArtwork({ kind }: { kind: CaseKind }) {
  return <span className={`case-artwork case-artwork-${kind}`} aria-hidden="true">
    <PixelCasePart kind={kind} part="body" className="case-art-body" />
    <PixelCasePart kind={kind} part="lid" className="case-art-lid" />
  </span>;
}

export function NavigationArtwork({ kind }: { kind: "shop" | "dog" | "cases" | "play" }) {
  if (kind === "dog") return <PixelDog ears className="nav-icon" />;
  return <svg className="nav-icon pixel-art" viewBox="0 0 24 24" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true">
    {kind === "shop" ? <><path d="M7 2h10v5h4v15H3V7h4Zm2 2v3h6V4ZM5 9v11h14V9Z" /><path d="M9 12h6v2H9Z" /></>
      : kind === "play" ? <><path d="M6 3h3v2h3v2h3v2h3v2h3v2h-3v2h-3v2h-3v2H9v2H6Z" /><path d="M3 7h2v10H3Z" opacity=".45" /></>
      : <><path d="M7 2h10v4h5v16H2V6h5Zm2 2v2h6V4ZM4 8v4h6v-2h4v2h6V8Zm0 6v6h16v-6h-6v2Z" /></>}
  </svg>;
}
