import { DRINK_GAMES, LIME_MAX_SCORE, scoreLime } from "./drink-game-engine.ts";

export type LimePhase = "ready" | "playing" | "paused" | "pressing" | "result";
export const LIME_ATTEMPT_MS = 6_000;

/** One bottle, one throw. Freeze the last painted fruit and target on input. */
export class LimeEngine {
  phase: LimePhase = "ready";
  target = { center: 50, width: 20 };
  accuracy = 0;
  private startedAt = 0;
  private pausedElapsed = 0;
  private displayed = { cursor: 8, center: 50 };
  start(now: number, random: () => number = Math.random) {
    if (this.phase !== "ready") return false;
    this.target = { center: 30 + Math.min(.999999, Math.max(0, random())) * 40, width: 20 };
    this.startedAt = now;
    this.phase = "playing";
    this.sample(now);
    return true;
  }
  sample(now: number) {
    const elapsed = this.phase === "paused" ? this.pausedElapsed : Math.max(0, now - this.startedAt);
    if (this.phase === "playing" || this.phase === "paused") {
      const progress = elapsed % 1_400 / 1_400;
      this.displayed = { cursor: 8 + (progress <= .5 ? progress * 2 : (1 - progress) * 2) * 84, center: this.target.center };
    }
    return { ...this.displayed, seconds: Math.max(0, Math.ceil((LIME_ATTEMPT_MS - elapsed) / 1000)), expired: elapsed >= LIME_ATTEMPT_MS };
  }
  press(now: number, expired = false) {
    if (this.phase !== "playing") return null;
    this.accuracy = expired || now - this.startedAt >= LIME_ATTEMPT_MS ? 0 : scoreLime(this.displayed.cursor, this.displayed.center, this.target.width);
    this.phase = "pressing";
    return this.accuracy;
  }
  pause(now: number) {
    if (this.phase !== "playing") return false;
    this.pausedElapsed = Math.max(0, now - this.startedAt);
    this.phase = "paused";
    return true;
  }
  resume(now: number) {
    if (this.phase !== "paused") return false;
    this.startedAt = now - this.pausedElapsed;
    this.phase = "playing";
    return true;
  }
  finish() {
    this.phase = "result";
    // Preserve the save's 0..2500 record scale; display it as accuracy in percent.
    return { score: Math.round(this.accuracy / 100 * LIME_MAX_SCORE), reward: Math.floor(this.accuracy / 100 * DRINK_GAMES.lime.maximumReward) };
  }
}
