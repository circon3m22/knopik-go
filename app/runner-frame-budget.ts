import {FramePaintLimiter,type FpsLimit} from "./render-preferences.ts";
export type RunnerGraphicsMode = "auto" | "sharp" | "fast" | "ultra" | "cinematic" | "extreme";
export function sanitizeRunnerGraphics(value: unknown): RunnerGraphicsMode {
  return value === "sharp" || value === "fast" || value === "ultra" || value === "cinematic" || value === "extreme" ? value : "auto";
}

/** Adapt raster density, never the 60 Hz simulation or the number of frames.
 * RAF intervals also catch GPU pressure that JS submission time cannot see. */
export class RunnerFrameBudget {
  readonly fps = 60;
  private limiter=new FramePaintLimiter();
  private mode: RunnerGraphicsMode = "auto";
  private density = 1;
  private cost = 0;
  private interval = 1000 / 60;
  private busy = 0;
  private spare = 0;
  private samples = 0;
  private lastPaint = -Infinity;
  private settled = 0;
  private targetInterval=1000/60;

  pixelRatio(native: number, mode: RunnerGraphicsMode = "auto") {
    if (this.mode !== mode) {
      this.mode = mode; this.density = 1; this.reset();
    }
    const ratio = Number.isFinite(native) && native > 0 ? Math.min(4, native) : 1;
    return Math.min(ratio, mode === "extreme" ? 4 : mode === "cinematic" ? 3.5 : mode === "ultra" ? 3 : mode === "sharp" ? 2.5 : mode === "fast" ? .65 : this.density);
  }
  due(now: number,cap:FpsLimit=60) { this.targetInterval=1000/cap;return this.limiter.due(now,cap); }
  painted(now: number, milliseconds: number) {
    if (Number.isFinite(this.lastPaint)) {
      this.interval += (Math.min(100, Math.max(0, now - this.lastPaint)) - this.interval) * .08;
    }
    this.lastPaint = now;
    this.cost += (Math.max(0, Math.min(100, milliseconds)) - this.cost) * .08;
    if (this.mode !== "auto" || ++this.samples < 30) return;
    this.busy = this.cost > Math.min(12, this.targetInterval*.7) || this.interval > this.targetInterval*1.29 ? this.busy + 1 : 0;
    this.spare = this.cost < Math.min(6, this.targetInterval*.4) && this.interval < this.targetInterval*1.08 ? this.spare + 1 : 0;
    if (this.settled > 0) { this.settled--; return; }
    if (this.busy >= 24 && this.density > .75) {
      this.density -= .25; this.busy = this.spare = 0; this.settled = 90;
    } else if (this.spare >= 360 && this.density < 1.25) {
      this.density += .25; this.busy = this.spare = 0; this.settled = 180;
    }
  }
  reset() {
    this.limiter.reset();this.lastPaint = -Infinity; this.interval = 1000 / 60;
    this.cost = this.busy = this.spare = this.samples = this.settled = 0;
  }
}
