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
  private actors = [new AdventureEngine(3, silent), new AdventureEngine(1, silent), new AdventureEngine(1, silent)];
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
        const t = this.reduced?4:frame.local;
        actor.player.x=t<5.2?692:mix(692,840,(t-5.2)/2.8);
        actor.player.y=t<1.5?480:t<3?mix(480,570,(t-1.5)/1.5):mix(570,710,(t-3)/2.2);
        actor.homeDoors[2].angle=t>3.35?Math.min(1.43,(t-3.35)*3):0;
        actor.player.angle=t>5.2?0:Math.PI/2;actor.moving=!this.reduced&&t>1.5; height=520;
      } else if (frame.shot === 2) {
        actor.player.x=240;actor.player.y=mix(410,213,progress/.77);
        actor.moving=!this.reduced&&progress<.77;height=500;
      } else {
        actor.player.x=240;actor.player.y=mix(213,93,(frame.local-.8)/3.2);
        actor.moving=!this.reduced&&frame.local>.8;height=mix(390,340,progress);
      }
      actor.walkDistance=time*70;this.interiors[frame.shot-1].paint(actor,true);
      if(frame.shot===1){
        const opening=Math.max(0,Math.min(1,(frame.local-6.4)/.9));
        svg.querySelector('[data-home-hatch-opening]')?.setAttribute('display',opening>0?'inline':'none');
        svg.querySelector('[data-home-hatch-lid]')?.setAttribute('transform',`translate(0 -25) scale(1 ${1-opening*.85}) translate(0 25)`);
      }
      if(frame.shot===3)svg.querySelector('[data-player]')?.setAttribute('opacity',String(1-Math.max(0,Math.min(1,(frame.local-2.3)/1.4))));
      cx=actor.player.x;cy=frame.shot===3?136:actor.player.y*.82-42;
    }
    const width = Math.max(frame.shot===3?180:230, Math.min(820, height / this.ratio)), h = width * this.ratio;
    svg.setAttribute("viewBox", `${(cx - width / 2).toFixed(2)} ${Math.max(0, cy - h / 2).toFixed(2)} ${width.toFixed(2)} ${h.toFixed(2)}`);
    return frame;
  }
}
