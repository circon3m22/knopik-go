export type FrameRateSample = { fps: number; meanMs: number; maxGapMs: number; runner: boolean };

/** Count completed runner paints, rather than RAF callbacks on a fast display.
 * The same sampler measures interface frames when a chase is not active. */
export class FrameRateTracker {
  private began = 0;
  private frames = 0;
  private cost = 0;
  private previous = 0;
  private gap = 0;
  private runner = false;
  setRunner(active: boolean) {
    if (this.runner === active) return;
    this.runner = active; this.reset();
  }
  reset() { this.began = this.frames = this.cost = this.previous = this.gap = 0; }
  record(now: number, runner: boolean, cost = 0): FrameRateSample | null {
    if (runner !== this.runner) return null;
    if (!this.began) { this.began = now; this.previous = now; return null; }
    this.frames++; this.cost += cost; this.gap = Math.max(this.gap, now - this.previous); this.previous = now;
    const elapsed = now - this.began;
    if (elapsed < 1000) return null;
    const sample = { fps: Math.round(this.frames * 1000 / elapsed), meanMs: this.cost / this.frames, maxGapMs: this.gap, runner };
    this.began = now; this.frames = this.cost = this.gap = 0;
    return sample;
  }
}

const tracker = new FrameRateTracker();
const listeners = new Set<(sample: FrameRateSample) => void>();
let lastSample: FrameRateSample | null = null;
const publish = (sample: FrameRateSample | null) => { if (sample) { lastSample = sample; for (const listener of listeners) listener(sample); } };
export function runnerFrameRateActive(active: boolean) { tracker.setRunner(active); }
export function runnerFramePainted(now: number, cost: number) { publish(tracker.record(now, true, cost)); }

export function subscribeFrameRate(listener: (sample: FrameRateSample) => void) {
  listeners.add(listener);
  if (lastSample) listener(lastSample);
  // Only the first visible meter starts the interface sampler. A native dialog
  // owns another meter because it lives above the document in the top layer.
  if (listeners.size === 1) start();
  return () => { listeners.delete(listener); if (!listeners.size) stop(); };
}
let frame: number | null = null;
function tick(now: number) {
  if (!document.hidden) publish(tracker.record(now, false));
  frame = requestAnimationFrame(tick);
}
function visibility() { tracker.reset(); }
function start() { document.addEventListener("visibilitychange", visibility); frame = requestAnimationFrame(tick); }
function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; document.removeEventListener("visibilitychange", visibility); tracker.reset(); }
