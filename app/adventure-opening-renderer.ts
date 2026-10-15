import { AdventureEngine } from "./adventure-engine.ts";
import { AdventureRenderer } from "./adventure-artwork";
import { NeighborhoodEngine } from "./neighborhood-engine.ts";
import { NeighborhoodRenderer } from "./neighborhood-artwork";
import { defaultNeighborhoodProgress } from "./neighborhood-progress.ts";
import { openingFrame } from "./adventure-opening.ts";
const silent = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
const mix = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

/** Separate stage actors: the introduction cannot spend, collect or advance a real save. */
export class AdventureOpeningRenderer {
  private roots: SVGSVGElement[];
  private reduced: boolean;
  private district = new NeighborhoodEngine(defaultNeighborhoodProgress(), { change() {}, progress() {}, home() {}, run() {}, sound() {} });
  private actors = [new AdventureEngine(3, silent), new AdventureEngine(1, silent), new AdventureEngine(2, silent, { immortal: true })];
  private street: NeighborhoodRenderer;
  private interiors: AdventureRenderer[];
  private ratio = 1.6;
  private lastTime = 0;
  private lastShot = -1;
  constructor(roots: SVGSVGElement[], reduced: boolean) {
    this.roots = roots; this.reduced = reduced;
    this.street = new NeighborhoodRenderer(roots[0], true, reduced);
    this.interiors = roots.slice(1).map(svg => new AdventureRenderer(svg, reduced));
  }
  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.ratio = height / width; this.street.resize(width, height);
    this.interiors.forEach(renderer => renderer.resize(width, height));
  }
  paint(time: number) {
    const frame = openingFrame(time), dt = Math.min(.1, Math.max(0, time - this.lastTime)); this.lastTime = time;
    if (frame.shot !== this.lastShot) { this.roots.forEach((svg, i) => svg.style.setProperty("display", i === frame.shot ? "block" : "none")); this.lastShot = frame.shot; }
    const svg = this.roots[frame.shot], progress = this.reduced ? .5 : frame.progress;
    let cx = 410, cy = 340, height = 700;
    if (frame.shot === 0) {
      this.district.player.x = 410; this.district.player.y = 650; this.district.advance(dt); this.street.paint(this.district);
      svg.querySelector("[data-neighborhood-player]")?.setAttribute("display", "none"); cy = mix(305, 385, progress);
    } else {
      const actor = this.actors[frame.shot - 1]; actor.time = time; actor.effects.step(dt); actor.player.angle = -Math.PI / 2;
      if (frame.shot === 1) {
        const t = frame.local; actor.checkpoint = t < 1.2 ? 0 : 3; actor.tutorialOpened = t >= 1.2;
        actor.player.x = t < 1.2 ? 575 : t < 1.8 ? mix(575, 670, (t - 1.2) / .6) : t < 3 ? mix(670, 692, (t - 1.8) / 1.2) : 692;
        actor.player.y = t < 1.2 ? 430 : t < 1.8 ? mix(430, 477, (t - 1.2) / .6) : t < 3 ? mix(477, 555, (t - 1.8) / 1.2) : mix(555, 710, (t - 3) / 1.4);
        actor.homeDoors[2].angle=t>3?Math.min(1.43,(t-3)*4):0;
        actor.player.angle = Math.PI / 2; actor.moving = t > 1.2; height = 520;
      } else if (frame.shot === 2) {
        actor.player.x = 240; actor.player.y = mix(410, 235, progress); actor.moving = true; height = 450;
      } else {
        actor.player.x = actor.levelData.spawn.x; actor.player.y = actor.levelData.spawn.y - mix(0, 52, progress); actor.moving = true; height = mix(500, 620, progress);
        if (frame.local > .4 && frame.local - dt <= .4) actor.effects.burst("blast", actor.player.x + 90, actor.player.y - 190, 82);
      }
      actor.walkDistance = time * 105; this.interiors[frame.shot - 1].paint(actor, true);
      cx = actor.player.x; cy = actor.player.y * .82 - 42;
    }
    const width = Math.max(230, Math.min(820, height / this.ratio)), h = width * this.ratio;
    svg.setAttribute("viewBox", `${(cx - width / 2).toFixed(2)} ${Math.max(0, cy - h / 2).toFixed(2)} ${width.toFixed(2)} ${h.toFixed(2)}`);
    return frame;
  }
}
