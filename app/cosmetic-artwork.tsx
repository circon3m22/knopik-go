"use client";
import type { CosmeticId } from "./cosmetic-engine";
import { PixelClothing, PixelDog, PixelPotion, type PotionKind } from "./pixel-artwork";
import { WornHeadwearPortrait } from "./knopik-equipment";

export function CosmeticArtwork({ kind }: { kind: CosmeticId }) {
  return <PixelClothing kind={kind} className="cosmetic-artwork" />;
}

export function KnopikPortrait() {
  return <PixelDog ears className="knopik-portrait" />;
}

export function PotionArtwork({ kind, className = "buff-icon-image" }: { kind: PotionKind; className?: string }) {
  return <PixelPotion kind={kind} className={className} />;
}

export function ClothingArtwork({ kind, className = "" }: { kind: "hat" | "mohawk"; className?: string }) {
  if(className.includes("dog-hat")||className.includes("dog-mohawk"))return <WornHeadwearPortrait kind={kind} className={className}/>;
  return <PixelClothing kind={kind} className={className} />;
}
