import { RunnerEngine, RUNNER_LANE_WIDTH, RUNNER_PLAYER_Z, RUNNER_VIEW_DISTANCE, RUNNER_CHASER_DELAY, runnerRouteElevation, type RunnerObject } from "./runner-engine";
import { RunnerArchitecture } from "./runner-architecture";

export const RUNNER_ZONES = ["СТАРЫЙ ГОРОД", "СОЛНЕЧНЫЙ БАЗАР", "НЕОНОВЫЙ КВАРТАЛ", "ПОСЛЕ ДОЖДЯ"];
const palettes = [
  ["#91bfc4", "#e6ddc4", "#ffe0a4", "#a49aab", "#868b9f", "#a7ac95", "#d5b38d", "#626579", "#686d80", "#e6cba4", "#cb8974", "#915f68", "#ffe4ac"],
  ["#e7b08b", "#f6d4a3", "#ffe8a8", "#b08792", "#8d778b", "#a6a47f", "#d9ad7a", "#756777", "#7d6f80", "#f6d49c", "#e4b878", "#a87960", "#a9cfb7"],
  ["#282a51", "#544a76", "#dc96b4", "#494966", "#414e72", "#596683", "#8293a6", "#434a69", "#4a526f", "#a5d4d5", "#81748f", "#554460", "#f0b776"],
  ["#7d99af", "#c2cbd1", "#e8d6b3", "#82809c", "#697b96", "#8c9d9c", "#b6b9a0", "#52697b", "#5b7386", "#ccdac0", "#ae9290", "#73647c", "#baded2"],
];
const names = ["sky", "cloud", "sun", "distant", "mid", "ground", "sidewalk", "road", "road-light", "stripe", "wall", "wall-dark", "window"];
type Slot = { node: SVGGElement; art: SVGUseElement; kind: string; palette: string };
const round = (value: number) => Math.round(value * 2) / 2;
const ease = (t: number) => { const n = Math.max(0, Math.min(1, t)); return n * n * (3 - 2 * n); };

/** Fixed SVG pools and shared sprite definitions keep DOM size independent of run length. */
export class RunnerRenderer {
  private height = 680;
  private horizon = 204;
  private zone = -1;
  private far: Slot[];
  private near: Slot[];
  private objects: RunnerObject[] = [];
  private parts: Record<string, SVGElement> = {};
  private tiles: SVGPathElement[];
  private markings: SVGPathElement[];
  private particles: SVGGElement[];
  private wind: SVGPathElement[];
  private architecture: RunnerArchitecture;
  private roofWalls: SVGPathElement[][];
  private worldDistance = 0;
  private cameraElevation = 0;
  private tileColors: string[] = [];

  constructor(private svg: SVGSVGElement, private prefix: string, private reducedMotion = false) {
    for (const name of ["ground", "sidewalk", "road", "world", "skyline", "clouds", "player", "pose", "roll", "shadow", "shield", "magnet", "collar", "leg-left", "leg-right", "arm-left", "arm-right", "tail", "head", "turn", "chaser", "balcony", "balcony-back", "balcony-door", "flash"]) {
      this.parts[name] = svg.querySelector<SVGElement>(`[data-runner-${name}]`)!;
    }
    const slots = (name: string) => Array.from(svg.querySelectorAll<SVGGElement>(`[data-runner-${name}-objects] > g`)).map(node => ({ node, art: node.querySelector<SVGUseElement>("use")!, kind: "", palette: "" }));
    this.far = slots("far");
    this.near = slots("near");
    this.tiles = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-road-tiles] > path"));
    this.markings = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-markings] > path"));
    this.particles = Array.from(svg.querySelectorAll<SVGGElement>("[data-runner-particles] > g"));
    this.wind = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-speed-lines] > path"));
    this.roofWalls = Array.from(svg.querySelectorAll<SVGGElement>("[data-runner-roof-walls] > g")).map(group => Array.from(group.querySelectorAll("path")));
    this.architecture = new RunnerArchitecture(svg);
    this.resize();
  }

  resize() {
    const bounds = this.svg.getBoundingClientRect();
    this.height = Math.max(470, Math.min(900, bounds.height / Math.max(1, bounds.width) * 360));
    this.horizon = this.height * .36;
    this.svg.setAttribute("viewBox", `0 0 360 ${round(this.height)}`);
    this.parts.skyline.setAttribute("transform", `translate(0 ${round(this.horizon + 4)})`);
    this.parts.ground.setAttribute("d", `M0 ${this.horizon}H360V1000H0Z`);
    this.parts.sidewalk.setAttribute("d", this.quad(-220, 220, -5, 9999));
    this.parts.road.setAttribute("d", this.quad(-RUNNER_LANE_WIDTH * 1.5, RUNNER_LANE_WIDTH * 1.5, -5, 9999));
  }

  private project(x: number, z: number, height = 0, floor?: number) {
    const perspective = 30 / (30 + Math.max(-8, z));
    const scale = perspective * 1.35;
    const ground = floor ?? runnerRouteElevation(this.worldDistance + z);
    return { x: round(180 + x * scale), y: round(this.horizon + this.height * .58 * perspective - (ground + height - this.cameraElevation) * scale), scale };
  }

  private quad(x1: number, x2: number, near: number, far: number) {
    const a = this.project(x1, near), b = this.project(x2, near), c = this.project(x2, far), d = this.project(x1, far);
    return `M${a.x} ${a.y}L${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}Z`;
  }

  render(engine: RunnerEngine) {
    if (engine.zone !== this.zone) {
      this.zone = engine.zone;
      palettes[this.zone].forEach((color, index) => this.svg.style.setProperty(`--run-${names[index]}`, color));
    }
    const clock = engine.elapsed;
    this.worldDistance = engine.distance;
    const previousElevation = this.cameraElevation;
    this.cameraElevation = runnerRouteElevation(engine.distance + RUNNER_PLAYER_Z);
    const visualPhase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const stopped = visualPhase === "ready" || visualPhase === "intro";
    const camera = stopped ? 1 - ease((engine.introTime - 2.2) / 2.3) : 0;
    const horizon = this.height * (.36 - camera * .06);
    if (Math.abs(horizon - this.horizon) > .1 || Math.abs(previousElevation - this.cameraElevation) > .1) {
      this.horizon = horizon;
      this.parts.skyline.setAttribute("transform", `translate(0 ${round(horizon + 4)})`);
      this.parts.ground.setAttribute("d", `M0 ${horizon}H360V1000H0Z`);
      this.parts.sidewalk.setAttribute("d", this.quad(-220, 220, -5, 9999));
      this.parts.road.setAttribute("d", this.quad(-RUNNER_LANE_WIDTH * 1.5, RUNNER_LANE_WIDTH * 1.5, -5, 9999));
    }
    const roadDistance = stopped ? 0 : engine.distance;
    const scroll = roadDistance % 8;
    for (let i = 0; i < this.tiles.length; i++) {
      const near = i * 8 - scroll, far = near + 8;
      this.tiles[i].setAttribute("d", this.quad(-140, 140, near, far));
      const elevated = runnerRouteElevation(engine.distance + near + 4) > 20;
      const fill = elevated ? i % 2 ? "#bca591" : "#cdb9a0" : i % 2 ? "var(--run-road-light)" : "var(--run-road)";
      if (fill !== this.tileColors[i]) { this.tiles[i].setAttribute("fill", fill); this.tileColors[i] = fill; }
      for (let side = 0; side < 2; side++) {
        const wall = this.roofWalls[i][side];
        wall.setAttribute("visibility", elevated ? "visible" : "hidden");
        if (!elevated) continue;
        const x = side ? 141 : -141;
        const points = [this.project(x, near), this.project(x, far), this.project(x, far, 0, 0), this.project(x, near, 0, 0)];
        wall.setAttribute("d", `M${points.map(point => `${point.x} ${point.y}`).join("L")}Z`);
      }
    }
    for (let i = 0; i < this.markings.length; i++) {
      const z = Math.floor(i / 2) * 6.4 - roadDistance % 6.4;
      const x = i % 2 ? 47 : -47;
      this.markings[i].setAttribute("d", this.quad(x - 1.3, x + 1.3, z, z + 2.7));
    }
    const sway = this.reducedMotion ? 0 : Math.sin(clock * 1.8) * Math.min(1.4, engine.speed / 40);
    const shake = this.reducedMotion ? 0 : Math.sin(clock * 67 + engine.caughtTime * 60) * engine.shake;
    this.parts.world.setAttribute("transform", `translate(${round(sway + shake)} 0)`);
    this.parts.clouds.setAttribute("transform", `translate(${this.reducedMotion ? 0 : round(Math.sin(clock * .025) * 11)} 0)`);
    this.parts.flash.setAttribute("opacity", this.reducedMotion ? "0" : `${engine.flash * .25}`);

    this.objects.length = 0;
    for (const object of engine.objects) if (!object.passed || object.kind !== "coin") {
      if (stopped && !["building", "tree", "lamp", "stall"].includes(object.kind)) continue;
      const z = object.z - engine.distance;
      if (z > -8 && z < RUNNER_VIEW_DISTANCE) this.objects.push(object);
    }
    this.objects.sort((a, b) => b.z - a.z || a.id - b.id);
    this.architecture.begin();
    let farIndex = 0, nearIndex = 0;
    for (const object of this.objects) {
      const z = object.z - engine.distance;
      if (object.kind === "building" || object.kind === "platform") {
        this.architecture.draw(object, z, (x, depth, height, floor) => this.project(x, depth, height, floor), palettes[this.zone][[10, 6, 7, 5][object.variant]], z < RUNNER_PLAYER_Z);
        continue;
      }
      const slot = z >= RUNNER_PLAYER_Z ? this.far[farIndex++] : this.near[nearIndex++];
      if (!slot) continue;
      const point = this.project(object.x, z, object.kind === "coin" ? object.height + 45 : 0);
      if (Math.abs(point.x - 180) > 330) { slot.node.setAttribute("visibility", "hidden"); continue; }
      const guardFrame = z < 21 ? 2 + Math.floor(clock * 8) % 2 : 0;
      const kind = object.kind === "sahur" ? `sahur-${guardFrame}` : object.kind;
      if (slot.kind !== kind) { slot.art.setAttribute("href", `#${this.prefix}-${kind}`); slot.kind = kind; }
      slot.node.setAttribute("visibility", "visible");
      slot.node.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${round(point.scale * 100) / 100})`);
      if (object.kind === "coin") slot.art.setAttribute("transform", `scale(${Math.max(.2, Math.abs(Math.cos(clock * 7 + object.id)))} 1)`);
      else slot.art.removeAttribute("transform");
      const palette = palettes[this.zone][[10, 6, 7, 5][object.variant]];
      if (slot.palette !== palette) { slot.node.style.setProperty("--run-wall", palette); slot.palette = palette; }
    }
    for (let i = farIndex; i < this.far.length; i++) this.far[i].node.setAttribute("visibility", "hidden");
    for (let i = nearIndex; i < this.near.length; i++) this.near[i].node.setAttribute("visibility", "hidden");
    this.architecture.end();
    this.drawDog(engine);
    this.drawChaser(engine);
    this.drawParticles(engine);
    for (let i = 0; i < this.wind.length; i++) {
      const progress = (clock * (1 + engine.speed / 45) + i / this.wind.length) % 1;
      const side = i % 2 ? 1 : -1;
      const x = 180 + side * (90 + progress * 100), y = this.horizon + progress * this.height * .75;
      this.wind[i].setAttribute("d", `M${round(x)} ${round(y)}h3v${round(8 + progress * 22)}h-3Z`);
      this.wind[i].setAttribute("opacity", this.reducedMotion || stopped || engine.phase !== "running" ? "0" : `${.06 + Math.max(0, engine.speed - 28) * .004}`);
    }
  }

  private drawDog(engine: RunnerEngine) {
    const phase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const intro = phase === "intro" || phase === "ready";
    const t = engine.introTime;
    const landing = ease((t - 2.45) / 2.05);
    const ground = this.project(engine.lanePosition * RUNNER_LANE_WIDTH, RUNNER_PLAYER_Z);
    const x = intro ? 220 + (ground.x - 220) * landing : ground.x;
    const y = intro ? this.height * .64 + (ground.y - this.height * .64) * landing - Math.sin(Math.PI * landing) * 90 : ground.y;
    const scale = intro ? 1.04 + (ground.scale - 1.04) * landing : ground.scale;
    this.parts.player.setAttribute("transform", `translate(${round(x)} ${round(y)}) scale(${scale})`);
    const turn = intro && t > 1.3 && t < 2.65;
    this.parts.head.setAttribute("opacity", turn ? "0" : "1");
    this.parts.turn.setAttribute("opacity", turn ? "1" : "0");
    const running = phase === "running";
    const stride = running ? Math.sin(engine.elapsed * (13 + engine.speed * .1)) : intro && t > 2.2 ? Math.sin(t * 15) * .4 : 0;
    const roll = engine.rolling ? engine.rollAge / .63 : 0;
    const bob = intro || !running || engine.jumpAge >= 0 || engine.rolling ? 0 : Math.abs(stride) * 3;
    const crouch = intro && t > 2.08 && t < 2.5 ? Math.sin((t - 2.08) / .42 * Math.PI) * 7 : 0;
    this.parts.pose.setAttribute("transform", `translate(0 ${round(-engine.jumpHeight - bob + crouch)}) rotate(${round((engine.lane - engine.lanePosition) * -9 - (intro ? Math.sin(Math.PI * landing) * 8 : 0))} 0 -44)`);
    this.parts.pose.setAttribute("opacity", engine.rolling ? "0" : "1");
    this.parts.roll.setAttribute("opacity", engine.rolling ? "1" : "0");
    this.parts.roll.setAttribute("transform", `translate(0 ${round(-engine.jumpHeight)}) rotate(${Math.round(roll * 360)} 0 -24)`);
    this.parts.shadow.setAttribute("opacity", `${.55 - engine.jumpHeight * .003}`);
    this.parts.shadow.setAttribute("transform", `translate(0 ${-engine.platformHeight})`);
    const protectedNow = engine.shieldUntil > engine.elapsed;
    this.parts.shield.setAttribute("opacity", protectedNow ? `${.6 + Math.sin(engine.elapsed * 22) * .2}` : engine.options.immortal ? ".45" : engine.shieldCharges > 0 ? ".22" : "0");
    this.parts.shield.setAttribute("transform", `translate(0 ${round(-engine.jumpHeight)})`);
    this.parts.magnet.setAttribute("opacity", engine.options.collar || engine.options.magnet ? ".6" : "0");
    this.parts.magnet.setAttribute("transform", `scale(${1 + Math.sin(engine.elapsed * 4) * .12} 1)`);
    this.parts.collar.setAttribute("opacity", engine.options.collar && !engine.rolling ? "1" : "0");
    this.parts["leg-left"].setAttribute("transform", `translate(0 ${round(stride * 10)})`);
    this.parts["leg-right"].setAttribute("transform", `translate(0 ${round(-stride * 10)})`);
    this.parts["arm-left"].setAttribute("transform", `rotate(${round(-stride * 15)} -22 -64)`);
    this.parts["arm-right"].setAttribute("transform", `rotate(${round(stride * 15)} 22 -64)`);
    this.parts.tail.setAttribute("transform", `rotate(${round(stride * 6)} 0 -42)`);
    const departure = ease((t - 2.65) / 1.75);
    for (const name of ["balcony", "balcony-back"]) {
      this.parts[name].setAttribute("transform", `translate(${round(180 - departure * 100)} ${round(this.height * .64 + departure * this.height * .8)}) scale(${1 - departure * .18})`);
      this.parts[name].setAttribute("opacity", intro ? `${1 - ease((t - 3.7) / .7)}` : "0");
    }
    this.parts["balcony-door"].setAttribute("transform", `translate(-171 -117) scale(${1 - ease((t - .7) / .45) * .85} 1) translate(171 117)`);
  }

  private drawChaser(engine: RunnerEngine) {
    const phase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const intro = phase === "intro";
    const chase = engine.phase === "caught" || engine.phase === "finished" ? ease(engine.caughtTime / .75) : 0;
    const arrival = ease((engine.introTime - .95) / .55);
    const transition = ease((engine.introTime - 2.95) / 1.65);
    const trail = engine.chaserPose;
    const x = intro ? 28 + arrival * 52 + transition * 100 : 180 + trail.lane * 92;
    const delayedGround = runnerRouteElevation(trail.distance + RUNNER_PLAYER_Z) - this.cameraElevation;
    const y = intro ? this.height * .64 + transition * this.height * .425 - Math.sin(Math.PI * transition) * 70 : this.height * (1.065 - chase * .18) - (trail.height + delayedGround) * 1.25 * (1 - chase);
    const bob = Math.abs(Math.sin((intro ? engine.introTime : engine.elapsed - RUNNER_CHASER_DELAY) * 15)) * 4;
    this.parts.chaser.setAttribute("transform", `translate(${round(x)} ${round(y - bob)}) scale(${intro ? 1 + transition * .25 : 1.25})`);
    this.parts.chaser.setAttribute("opacity", phase === "ready" ? "0" : intro ? `${arrival}` : "1");
    const art = this.parts.chaser.querySelector("use")!;
    const frame = Math.floor((intro ? engine.introTime : engine.elapsed - RUNNER_CHASER_DELAY) * 8 + engine.caughtTime * 8 + 8) % 2;
    const rolling = !intro && trail.rollAge >= 0 && chase === 0;
    art.setAttribute("href", rolling ? `#${this.prefix}-sahur-roll` : intro && transition < .28 ? `#${this.prefix}-sahur-${2 + frame}` : `#${this.prefix}-sahur-back-${frame}`);
    art.setAttribute("transform", rolling ? `rotate(${round(trail.rollAge / .63 * 360)} 0 -24)` : "");
  }

  private drawParticles(engine: RunnerEngine) {
    for (let i = 0; i < this.particles.length; i++) {
      const node = this.particles[i], particle = engine.particles[i];
      if (!particle || this.reducedMotion) { node.setAttribute("visibility", "hidden"); continue; }
      const t = particle.age / particle.life;
      const rect = node.firstElementChild!, coin = node.lastElementChild!;
      let point = this.project(particle.x, particle.z - engine.distance, particle.y);
      if (particle.kind === "pickup") {
        const origin = this.project(particle.x, RUNNER_PLAYER_Z, particle.y + 45);
        const progress = ease(t);
        point = { x: origin.x + (32 - origin.x) * progress + Math.sin(Math.PI * t) * 32, y: origin.y + (47 - origin.y) * progress, scale: .65 - t * .4 };
      }
      node.setAttribute("visibility", "visible");
      node.setAttribute("transform", `translate(${round(point.x)} ${round(point.y)}) scale(${particle.kind === "pickup" ? point.scale : 1 + (1 - t) * .6})`);
      node.setAttribute("opacity", `${Math.min(1, (1 - t) * 3)}`);
      rect.setAttribute("fill", particle.color);
      rect.setAttribute("display", particle.kind === "pickup" ? "none" : "block");
      coin.setAttribute("display", particle.kind === "pickup" ? "block" : "none");
    }
  }
}
