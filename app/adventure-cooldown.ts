import type { AdventureEngine } from "./adventure-engine.ts";
import { ENERGY_WAVE } from "./knopik-combat-equipment.ts";

/** Paint only the two small meters; simulation ticks must not trigger React renders. */
export class AdventureCooldownPainter {
  private nodes = new WeakMap<HTMLButtonElement, { fill: HTMLElement | null; time: HTMLElement | null; progress: number; seconds: number }>();
  paintButton(button: HTMLButtonElement | null, remaining: number, duration: number) {
    if (!button) return;
    let cached = this.nodes.get(button);
    if (!cached) {
      cached = { fill: button.querySelector("[data-cooldown-fill]"), time: button.querySelector("[data-cooldown-time]"), progress: -1, seconds: -1 };
      this.nodes.set(button, cached);
    }
    const progress = Math.round(Math.max(0, Math.min(1, duration > 0 ? 1 - remaining / duration : 1)) * 1000);
    const seconds = Math.ceil(Math.max(0, remaining - 1e-8));
    if (progress !== cached.progress) {
      if (cached.fill) cached.fill.style.transform = `scaleY(${progress / 1000})`;
      cached.progress = progress;
    }
    if (seconds !== cached.seconds) {
      if (cached.time) cached.time.textContent = seconds > 0 ? `${seconds}с` : "Готово";
      button.setAttribute("data-cooldown-state", seconds > 0 ? "charging" : "ready");
      cached.seconds = seconds;
    }
  }
  paint(engine: AdventureEngine, attack: HTMLButtonElement | null, energy: HTMLButtonElement | null) {
    this.paintButton(attack, engine.punchCooldown, engine.punchCooldownDuration);
    this.paintButton(energy, engine.energyCooldown, ENERGY_WAVE.cooldown);
  }
}
