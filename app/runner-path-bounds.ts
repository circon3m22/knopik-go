import type { RunnerBounds } from "./runner-scene-model.ts";

/** Conservative local bounds. Bézier control points enclose their curves; arcs
 * deliberately fall back to an uncropped layer. No browser layout is read. */
export function runnerPathBounds(source: string): RunnerBounds | null {
  const tokens = source.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0, command = "", x = 0, y = 0, startX = 0, startY = 0;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const point = (px: number, py: number) => { left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py); };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) command = tokens[i++];
    const upper = command.toUpperCase(), relative = command !== upper;
    if (upper === "Z") { x = startX; y = startY; command = ""; continue; }
    const count = ({ M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4 } as Record<string, number>)[upper];
    if (!count || i + count > tokens.length) return null;
    const n = tokens.slice(i, i + count).map(Number); i += count;
    if (!n.every(Number.isFinite)) return null;
    if (upper === "H") { x = n[0] + (relative ? x : 0); point(x, y); }
    else if (upper === "V") { y = n[0] + (relative ? y : 0); point(x, y); }
    else {
      for (let j = 0; j < n.length; j += 2) point(n[j] + (relative ? x : 0), n[j + 1] + (relative ? y : 0));
      x = n.at(-2)! + (relative ? x : 0); y = n.at(-1)! + (relative ? y : 0);
      if (upper === "M") { startX = x; startY = y; command = relative ? "l" : "L"; }
    }
  }
  return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : { x: 0, y: 0, width: 0, height: 0 };
}
