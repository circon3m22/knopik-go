export const ADVENTURE_DEPTH = .82;
export type AdventureFacing = "front" | "back" | "right" | "left" | "front-right" | "front-left" | "back-right" | "back-left";
export function adventureFacing(angle: number): AdventureFacing {
  if (!Number.isFinite(angle)) return "front";
  const directions: AdventureFacing[] = ["right", "front-right", "front", "front-left", "left", "back-left", "back", "back-right"];
  return directions[(Math.round(angle / (Math.PI / 4)) % 8 + 8) % 8];
}
export function projectAdventureY(y: number) { return y * ADVENTURE_DEPTH; }
