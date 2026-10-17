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
const worldSources=new Set<unknown>();
export function runnerFrameRateActive(active: boolean,owner:unknown='default') {
 const before=worldSources.size>0;
 if(active)worldSources.add(owner);else worldSources.delete(owner);
 if(before!==(worldSources.size>0)){tracker.setRunner(worldSources.size>0);lastSample=null;syncSampler();}
}
export function runnerFramePainted(now: number, cost: number) { if(listeners.size)publish(tracker.record(now, true, cost)); }

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
  frame=null;
  if (!document.hidden) publish(tracker.record(now, false));
  syncSampler();
}
function syncSampler(){
 const needed=listeners.size>0&&!worldSources.size&&typeof document!=='undefined'&&!document.hidden;
 if(needed&&frame===null)frame=requestAnimationFrame(tick);
 else if(!needed&&frame!==null){cancelAnimationFrame(frame);frame=null;}
}
function visibility() { tracker.reset();lastSample=null;syncSampler(); }
function start() { document.addEventListener("visibilitychange", visibility);syncSampler(); }
function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; document.removeEventListener("visibilitychange", visibility); tracker.reset(); }
