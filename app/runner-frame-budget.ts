/** Adaptive painting only; collisions and input retain the fixed 60Hz clock. */
export class RunnerFrameBudget {
  fps = 60;
  private cost = 0;
  private busy = 0;
  private spare = 0;
  private lastPaint = -Infinity;
  due(now: number) { return now - this.lastPaint >= (this.fps === 30 ? 1000 / 30 - 1 : 0); }
  painted(now: number, milliseconds: number) {
    this.lastPaint = now;
    this.cost += (Math.max(0, Math.min(100, milliseconds)) - this.cost) * .08;
    this.busy = this.cost > 12 ? this.busy + 1 : 0;
    this.spare = this.cost < 9 ? this.spare + 1 : 0;
    if (this.busy >= 24) { this.fps = 30; this.spare = 0; }
    if (this.fps === 30 && this.spare >= 180) { this.fps = 60; this.busy = 0; }
  }
  reset() { this.lastPaint = -Infinity; }
}
