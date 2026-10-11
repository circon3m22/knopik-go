export type RunnerLane = -1 | 0 | 1;
export type RunnerAction = "left" | "right" | "jump" | "roll";
export type RunnerPhase = "ready" | "intro" | "running" | "paused" | "caught" | "finished";
export type RunnerKind = "coin" | "cargo" | "platform" | "barrier" | "arch" | "gap" | "sahur" | "building" | "tree" | "lamp" | "stall";
export type RunnerSound = RunnerAction | "coin" | "start" | "hit" | "near" | "beat" | "shield";
export type RunnerOptions = { collar: boolean; immortal: boolean; magnet: boolean; turbo: boolean };
export type RunnerResult = { distance: number; coins: number; nearMisses: number; seed: number };
export type RunnerObject = { id: number; kind: RunnerKind; x: number; z: number; height: number; depth: number; variant: number; passed: boolean };
export type RunnerParticle = { x: number; y: number; z: number; vx: number; vy: number; age: number; life: number; kind: "dust" | "spark" | "pickup" | "impact"; color: string };
export type RunnerEvents = { phase: (phase: RunnerPhase) => void; coins: (amount: number) => void; finish: (result: RunnerResult) => void; sound: (kind: RunnerSound, beat?: number) => void; zone: (zone: number) => void; route: (roofs: boolean) => void };

export const RUNNER_PLAYER_Z = 6;
export const RUNNER_LANE_WIDTH = 94;
export const RUNNER_VIEW_DISTANCE = 145;
export const RUNNER_CHASER_DELAY = .55;
export const RUNNER_INTRO_DURATION = 4.6;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const isHazard = (kind: RunnerKind) => ["cargo", "barrier", "arch", "gap", "sahur"].includes(kind);

/** Market stairways lead onto continuous roofs, then return to the street. */
export function runnerRouteElevation(distance: number) {
  const position = ((distance % 960) + 960) % 960;
  const ease = (t: number) => t * t * (3 - 2 * t);
  if (position < 280 || position >= 625) return 0;
  if (position < 330) return ease((position - 280) / 50) * 180;
  if (position < 570) return 180;
  return (1 - ease((position - 570) / 55)) * 180;
}

function newSeed() {
  const values = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(values);
  else values[0] = Math.floor(Math.random() * 0xffffffff);
  return values[0] || 1;
}

/** World coordinates and collisions are independent of the SVG renderer and frame rate. */
export class RunnerEngine {
  phase: RunnerPhase = "ready";
  previousPhase: RunnerPhase = "running";
  seed = newSeed();
  distance = 0;
  elapsed = 0;
  introTime = 0;
  caughtTime = 0;
  speed = 22;
  lane: RunnerLane = 0;
  lanePosition = 0;
  jumpAge = -1;
  rollAge = -1;
  height = 0;
  platformHeight = 0;
  grounded = true;
  private verticalSpeed = 0;
  private jumpBuffer = 0;
  roofs = false;
  coins = 0;
  nearMisses = 0;
  zone = 0;
  shake = 0;
  flash = 0;
  shieldCharges = 0;
  shieldUntil = 0;
  chaserPose = { lane: 0, height: 0, rollAge: -1, distance: 0 };
  private chaserHistory = Array.from({ length: 64 }, () => ({ time: -10, lane: 0, height: 0, rollAge: -1, distance: 0 }));
  private chaserHistoryIndex = 0;
  options: RunnerOptions;
  objects: RunnerObject[] = [];
  particles: RunnerParticle[] = [];
  private randomState = this.seed;
  private nextId = 0;
  private nextRow = 32;
  private nextScenery = 9;
  private safeLane: RunnerLane = 0;
  private dustClock = 0;
  private beatClock = 0;
  private beat = 0;
  private reported = false;

  constructor(private events: RunnerEvents, options: Partial<RunnerOptions> = {}) {
    this.options = { collar: false, immortal: false, magnet: false, turbo: false, ...options };
    this.shieldCharges = this.options.collar ? 1 : 0;
    this.generateAhead();
  }

  setOptions(options: RunnerOptions) {
    this.options = options;
    if (!options.collar) this.shieldCharges = 0;
    else if (this.phase === "ready" || this.phase === "finished") this.shieldCharges = 1;
  }

  private random() {
    let n = this.randomState += 0x6d2b79f5;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  }

  private changePhase(phase: RunnerPhase) {
    this.phase = phase;
    this.events.phase(phase);
  }

  get jumpHeight() { return this.height; }
  get rolling() { return this.rollAge >= 0; }

  start() {
    if (this.phase !== "ready" && this.phase !== "finished") return;
    this.seed = newSeed();
    this.randomState = this.seed;
    this.distance = this.elapsed = this.introTime = this.caughtTime = this.coins = this.nearMisses = this.shake = this.flash = 0;
    this.lane = this.safeLane = 0;
    this.lanePosition = 0;
    this.jumpAge = this.rollAge = -1;
    this.height = this.platformHeight = this.verticalSpeed = this.jumpBuffer = 0;
    this.grounded = true;
    this.roofs = false;
    this.speed = 22;
    this.shieldCharges = this.options.collar ? 1 : 0;
    this.shieldUntil = 0;
    Object.assign(this.chaserPose, { lane: 0, height: 0, rollAge: -1, distance: 0 });
    this.chaserHistory.forEach(sample => Object.assign(sample, { time: -10, lane: 0, height: 0, rollAge: -1, distance: 0 }));
    this.chaserHistoryIndex = 0;
    this.objects.length = this.particles.length = 0;
    this.nextRow = 32;
    this.nextScenery = 9;
    this.beatClock = this.dustClock = this.beat = this.zone = 0;
    this.reported = false;
    for (let z = 13; z < 29; z += 3) this.add("coin", 0, z);
    this.generateAhead();
    this.events.zone(0);
    this.events.route(false);
    this.changePhase("intro");
    this.events.sound("start");
  }

  pause() {
    if (this.phase !== "running" && this.phase !== "intro") return;
    this.previousPhase = this.phase;
    this.changePhase("paused");
  }

  resume() { if (this.phase === "paused") this.changePhase(this.previousPhase); }
  restart() { this.close(); this.phase = "finished"; this.start(); }

  input(action: RunnerAction) {
    if (this.phase !== "running") return;
    if (action === "left" || action === "right") {
      const lane = clamp(this.lane + (action === "left" ? -1 : 1), -1, 1) as RunnerLane;
      if (lane === this.lane) return;
      this.lane = lane;
    } else if (action === "jump") {
      if (!this.grounded) { this.jumpBuffer = .13; return; }
      this.rollAge = -1;
      this.jumpAge = 0;
      this.grounded = false;
      this.verticalSpeed = 485;
    } else {
      if (this.rollAge >= 0) return;
      if (!this.grounded) this.verticalSpeed = -720;
      this.rollAge = 0;
      this.burst("dust", 10);
    }
    this.events.sound(action);
  }

  update(dt: number) {
    if (this.phase === "ready" || this.phase === "paused" || this.phase === "finished") return;
    this.shake = Math.max(0, this.shake - dt * 20);
    this.flash = Math.max(0, this.flash - dt * 2);
    this.updateParticles(dt);
    if (this.phase === "intro") {
      this.introTime += dt;
      if (this.introTime >= RUNNER_INTRO_DURATION) this.changePhase("running");
      return;
    }
    if (this.phase === "caught") {
      this.caughtTime += dt;
      if (this.caughtTime >= 1.15) {
        this.report();
        this.changePhase("finished");
      }
      return;
    }
    // The owner advances this engine in fixed steps, so high refresh screens do not change difficulty.
    this.elapsed += dt;
    this.speed = Math.min(this.options.turbo ? 75 : 59, (22 + this.elapsed * .19) * (this.options.turbo ? 1.55 : 1));
    this.distance += this.speed * dt;
    this.lanePosition += (this.lane - this.lanePosition) * Math.min(1, dt * 17);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (!this.grounded) { this.jumpAge += dt; this.height += this.verticalSpeed * dt; this.verticalSpeed -= 1280 * dt; }
    if (this.rollAge >= 0 && (this.rollAge += dt) >= .63) this.rollAge = -1;
    this.generateAhead();
    let support = 0;
    for (const object of this.objects) {
      if (object.kind !== "platform" || Math.abs(object.z - this.distance - RUNNER_PLAYER_Z) >= object.depth / 2 || Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition) >= .46) continue;
      if (this.height < object.height - 6 && this.platformHeight < object.height - 6) {
        if (!this.absorbCollision()) { this.collide(); return; }
        this.height = object.height; this.verticalSpeed = 0; this.grounded = true;
      }
      support = Math.max(support, object.height);
    }
    this.platformHeight = support;
    if (this.height > support + 1 && this.grounded) { this.grounded = false; this.jumpAge = 0; this.verticalSpeed = 0; }
    if (!this.grounded && this.verticalSpeed <= 0 && this.height <= support) {
      this.height = support; this.verticalSpeed = 0; this.grounded = true; this.jumpAge = -1;
      this.burst("dust", 8);
      if (this.jumpBuffer > 0) { this.jumpBuffer = 0; this.input("jump"); }
    }
    this.followChaser();
    let pickedUp = 0;
    for (const object of this.objects) {
      const z = object.z - this.distance;
      const sameLane = Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition) < .4;
      const magnetic = this.options.magnet || this.options.collar;
      const withinMagnet = magnetic && Math.abs(z - RUNNER_PLAYER_Z) < 6 && Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition) < (this.options.magnet ? 2.1 : 1.25);
      if (object.kind === "coin" && !object.passed && (withinMagnet || (Math.abs(z - RUNNER_PLAYER_Z) < 1.5 && sameLane && Math.abs(this.jumpHeight - object.height) < 48))) {
        object.passed = true;
        pickedUp++;
        if (this.particles.length < 72) this.particles.push({ x: object.x, y: object.height, z: object.z, vx: 0, vy: 0, age: 0, life: .6, kind: "pickup", color: "#ffe899" });
        this.burst("spark", 5);
      }
      const collisionHalfLength = object.kind === "cargo" ? 1.8 : object.kind === "gap" ? 2 : 1.1;
      if (isHazard(object.kind) && Math.abs(z - RUNNER_PLAYER_Z) < collisionHalfLength && sameLane) {
        const cleared = object.kind === "arch" ? (this.rolling && this.height < 12) || this.height > 144 : object.kind === "barrier" || object.kind === "gap" ? this.jumpHeight > 34 : false;
        if (!cleared && !this.absorbCollision()) { this.collide(); break; }
      }
      if (isHazard(object.kind) && !object.passed && z < RUNNER_PLAYER_Z - collisionHalfLength) {
        object.passed = true;
        if (Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition) < 1.15) {
          this.nearMisses++;
          if (this.nearMisses % 3 === 0) this.events.sound("near");
        }
      }
    }
    if (pickedUp) {
      this.coins += pickedUp;
      this.events.coins(pickedUp);
      this.events.sound("coin", this.coins);
    }
    this.objects = this.objects.filter(object => object.z - this.distance > -14 && !(object.kind === "coin" && object.passed));
    this.dustClock += dt;
    if (this.dustClock > .11 && this.jumpAge < 0) { this.dustClock = 0; this.burst("dust", this.rolling ? 4 : 2); }
    this.beatClock += dt;
    if (this.beatClock > .195) { this.beatClock -= .195; this.events.sound("beat", this.beat++); }
    const zone = Math.floor(this.distance / 420) % 4;
    if (zone !== this.zone) { this.zone = zone; this.events.zone(zone); }
    const roofs = runnerRouteElevation(this.distance + RUNNER_PLAYER_Z) > 35;
    if (roofs !== this.roofs) { this.roofs = roofs; this.events.route(roofs); this.events.sound("near"); }
  }

  private followChaser() {
    this.chaserHistoryIndex = (this.chaserHistoryIndex + 1) % this.chaserHistory.length;
    Object.assign(this.chaserHistory[this.chaserHistoryIndex], { time: this.elapsed, lane: this.lanePosition, height: this.height, rollAge: this.rollAge, distance: this.distance });
    const target = this.elapsed - RUNNER_CHASER_DELAY;
    if (target < 0) return;
    let next = this.chaserHistory[this.chaserHistoryIndex];
    for (let i = 1; i < this.chaserHistory.length; i++) {
      const previous = this.chaserHistory[(this.chaserHistoryIndex - i + this.chaserHistory.length) % this.chaserHistory.length];
      if (previous.time <= target) {
        const ratio = Math.max(0, Math.min(1, (target - previous.time) / Math.max(.001, next.time - previous.time)));
        this.chaserPose.lane = previous.lane + (next.lane - previous.lane) * ratio;
        this.chaserPose.height = previous.height + (next.height - previous.height) * ratio;
        this.chaserPose.distance = previous.distance + (next.distance - previous.distance) * ratio;
        this.chaserPose.rollAge = previous.rollAge >= 0 && next.rollAge >= 0 ? previous.rollAge + (next.rollAge - previous.rollAge) * ratio : previous.rollAge;
        return;
      }
      next = previous;
    }
  }

  private add(kind: RunnerKind, x: number, z: number, height = 0, depth = 0) {
    if (this.objects.length >= 150) return;
    this.objects.push({ id: this.nextId++, kind, x, z, height, depth, variant: Math.floor(this.random() * 4), passed: false });
  }

  private generateAhead() {
    const end = this.distance + RUNNER_VIEW_DISTANCE;
    while (this.nextRow < end) {
      const z = this.nextRow;
      // The escape lane changes every row; straight running is never the default route.
      this.safeLane = this.safeLane === 0 ? (this.random() < .5 ? -1 : 1) : 0;
      const lanes: RunnerLane[] = [-1, 0, 1];
      const blocked = lanes.filter(lane => lane !== this.safeLane);
      let pattern = z < 34 ? .05 : z < 56 ? .22 : this.random();
      const routePosition = z % 960;
      if (pattern >= .88 && ((routePosition > 260 && routePosition < 350) || (routePosition > 550 && routePosition < 645))) pattern = .5;
      let coinHeight = 0, extraSpace = 0;
      if (pattern < .16) {
        const kind = z > 100 && this.random() < .4 ? "gap" : "barrier";
        for (const lane of lanes) this.add(kind, lane * RUNNER_LANE_WIDTH, z);
        coinHeight = 48;
      } else if (pattern < .3) {
        for (const lane of lanes) this.add("arch", lane * RUNNER_LANE_WIDTH, z);
      } else if (pattern < .67) {
        for (const lane of blocked) this.add(this.random() < .55 ? "cargo" : "sahur", lane * RUNNER_LANE_WIDTH, z);
      } else if (pattern < .88) {
        this.add("cargo", blocked[0] * RUNNER_LANE_WIDTH, z);
        this.add("arch", blocked[1] * RUNNER_LANE_WIDTH, z);
        this.add(this.random() < .5 ? "barrier" : "gap", this.safeLane * RUNNER_LANE_WIDTH, z);
        coinHeight = 48;
      } else {
        this.add("platform", this.safeLane * RUNNER_LANE_WIDTH, z, 76, 22);
        for (const lane of blocked) this.add("sahur", lane * RUNNER_LANE_WIDTH, z);
        coinHeight = 76; extraSpace = 18;
      }
      for (let i = 0; i < 4; i++) this.add("coin", this.safeLane * RUNNER_LANE_WIDTH, z - 3.5 + i * 2.2, coinHeight);
      this.nextRow += 11 + this.speed * .3 + this.random() * 3 + extraSpace;
    }
    while (this.nextScenery < end) {
      const z = this.nextScenery;
      for (const side of [-1, 1]) {
        this.add("building", side * (248 + this.random() * 22), z, 290 + this.random() * 210, 21 + this.random() * 10);
        const choice = this.random();
        this.add(choice < .4 ? "tree" : choice < .7 ? "lamp" : "stall", side * (164 + this.random() * 15), z + 5);
      }
      this.nextScenery += 24 + this.random() * 6;
    }
  }

  private absorbCollision() {
    if (this.options.immortal || this.elapsed < this.shieldUntil) return true;
    if (this.shieldCharges < 1) return false;
    this.shieldCharges--;
    this.shieldUntil = this.elapsed + .65;
    this.shake = 3;
    this.burst("spark", 24);
    this.events.sound("shield");
    return true;
  }

  private collide() {
    this.shake = 8;
    this.flash = .7;
    this.caughtTime = 0;
    this.burst("impact", 28);
    this.events.sound("hit");
    this.changePhase("caught");
  }

  private burst(kind: RunnerParticle["kind"], count: number) {
    const colors = kind === "dust" ? ["#d5bc92", "#947b83"] : kind === "impact" ? ["#ffab7e", "#ff5772", "#fff1d1"] : ["#ffe899", "#ffbd57", "#fff1d1"];
    for (let i = 0; i < count && this.particles.length < 72; i++) {
      this.particles.push({ x: this.lanePosition * RUNNER_LANE_WIDTH + (this.random() - .5) * 20, y: (kind === "dust" ? 2 : 35) + this.jumpHeight, z: this.distance + RUNNER_PLAYER_Z, vx: (this.random() - .5) * 150, vy: kind === "dust" ? 30 + this.random() * 25 : 70 + this.random() * 90, age: 0, life: kind === "impact" ? .85 : .42 + this.random() * .2, kind, color: colors[i % colors.length] });
    }
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.age += dt;
      if (particle.kind !== "pickup") { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy -= 280 * dt; }
    }
    this.particles = this.particles.filter(particle => particle.age < particle.life);
  }

  private report() {
    if (this.reported) return;
    this.reported = true;
    this.events.finish({ distance: Math.floor(this.distance), coins: this.coins, nearMisses: this.nearMisses, seed: this.seed });
  }

  close() { if (this.phase !== "ready") this.report(); }
}
