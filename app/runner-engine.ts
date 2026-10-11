import { RUNNER_FIREWORK_SECONDS, RUNNER_MAGNET_SECONDS, runnerFlightHeight, runnerGroundChaser } from "./runner-power-engine.ts";
import { runnerAtmosphere } from "./runner-atmosphere.ts";

export type RunnerLane = -1 | 0 | 1;
export type RunnerAction = "left" | "right" | "jump" | "roll";
export type RunnerPhase = "ready" | "intro" | "running" | "paused" | "caught" | "finished";
export type RunnerKind = "coin" | "magnet-pickup" | "firework-pickup" | "boost-pickup" | "slow-pickup" | "fence" | "cargo" | "platform" | "car" | "truck" | "crossing" | "pedestrian" | "dock-crane" | "neon-sign" | "bridge-pylon" | "boat" | "barrier" | "arch" | "gap" | "sahur" | "building" | "city-block" | "tree" | "lamp" | "stall" | "tunnel-wall" | "cat";
export type RunnerPowerup = "magnet-pickup" | "firework-pickup" | "boost-pickup" | "slow-pickup";
export type RunnerSound = RunnerAction | "coin" | "start" | "hit" | "near" | "beat" | "shield" | "magnet" | "rocket" | "flight" | "land" | "boost" | "slow" | "flyby" | "thunder";
export type RunnerOptions = { collar: boolean; collarLevel?: number; immortal: boolean; magnet: boolean; turbo: boolean };
export type RunnerResult = { distance: number; coins: number; nearMisses: number; seed: number };
export type RunnerObject = { id: number; kind: RunnerKind; x: number; z: number; height: number; depth: number; variant: number; district: number; passed: boolean; activatedAt: number };
export type RunnerParticle = { x: number; y: number; z: number; vx: number; vy: number; age: number; life: number; kind: "dust" | "spark" | "pickup" | "impact"; color: string };
export type RunnerEvents = { phase: (phase: RunnerPhase) => void; coins: (amount: number) => void; finish: (result: RunnerResult) => void; sound: (kind: RunnerSound, beat?: number) => void; zone: (zone: number) => void; route: (roofs: boolean) => void };

export const RUNNER_PLAYER_Z = 6;
export const RUNNER_LANE_WIDTH = 94;
export const RUNNER_VIEW_DISTANCE = 600;
// Tall sprites must pass completely below even a short phone viewport before
// leaving the scene. This is behind the player, not the collision plane.
export const RUNNER_NEAR_DISTANCE = -24;
export const RUNNER_CHASER_DELAY = .55;
export const RUNNER_INTRO_DURATION = 3;
export const RUNNER_LANE_DURATION = .14;
export function runnerDistrict(distance:number) { return Math.floor(Math.max(0,distance)/420)%6; }
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const isHazard = (kind: RunnerKind) => ["cargo", "truck", "barrier", "fence", "arch", "gap", "sahur"].includes(kind);

/** Market stairways lead onto continuous roofs, then return to the street. */
export function runnerRouteElevation(distance: number) {
  const position = ((distance % 2520) + 2520) % 2520;
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
  laneVelocity = 0;
  landingImpact = 0;
  jumpAge = -1;
  rollAge = -1;
  height = 0;
  platformHeight = 0;
  grounded = true;
  magnetUntil = 0;
  flightAge = -1;
  speedUntil = 0;
  speedEffect: "boost" | "slow" | null = null;
  private rocketSoundClock = 0;
  private speedSparkClock = 0;
  flybyAge = -1;
  birdAge = -1;
  private nextBird = 9;
  private nextThunder = 0;
  private nextFlyby = 20;
  private flightLaunchHeight = 0;
  private fireworkClock = 0;
  private chaserAutoUntil = 0;
  private verticalSpeed = 0;
  private jumpBuffer = 0;
  private coyoteTime = 0;
  private laneFrom = 0;
  private laneAge = RUNNER_LANE_DURATION;
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
  private rowIndex = 0;
  private lastRowEnd = 12;
  private lastPattern = "";
  private lastMandatory = -10;
  private nextPowerupRow = 4;
  private nextScenery = 9;
  private sceneryIndex = 0;
  private nextCrossing = 170;
  private safeLane: RunnerLane = 0;
  private dustClock = 0;
  private beatClock = 0;
  private beat = 0;
  private reported = false;
  private events: RunnerEvents;

  constructor(events: RunnerEvents, options: Partial<RunnerOptions> = {}) {
    this.events = events;
    this.options = { collar: false, immortal: false, magnet: false, turbo: false, ...options };
    this.shieldCharges = this.options.collar ? this.collarCharges : 0;
    for (let z = 11; z < 20; z += 4) this.add("coin", 0, z);
    this.generateAhead();
  }

  setOptions(options: RunnerOptions) {
    this.options = options;
    if (!options.collar) this.shieldCharges = 0;
    else if (this.phase === "ready" || this.phase === "finished") this.shieldCharges = this.collarCharges;
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
  get collarLevel() { return clamp(Math.floor(this.options.collarLevel ?? 1),1,5); }
  get collarCharges() { return 1+Math.floor((this.collarLevel-1)/2); }
  get rolling() { return this.rollAge >= 0; }
  get laneHop() { return this.grounded && !this.rolling ? Math.sin(Math.PI * this.laneAge / RUNNER_LANE_DURATION) * 13 : 0; }
  get flying() { return this.flightAge >= 0; }
  get magnetSeconds() { return Math.max(0, this.magnetUntil - this.elapsed); }
  get magnetic() { return this.options.magnet || this.magnetSeconds > 0; }
  get flightSeconds() { return this.flying ? Math.max(0, RUNNER_FIREWORK_SECONDS - this.flightAge) : 0; }
  get speedSeconds() { return Math.max(0, this.speedUntil - this.elapsed); }

  collectPowerup(kind: RunnerPowerup) {
    if (this.phase !== "running") return;
    if (kind === "magnet-pickup") {
      this.magnetUntil = this.elapsed + RUNNER_MAGNET_SECONDS;
      this.burst("spark", 20); this.events.sound("magnet");
    } else if (kind === "boost-pickup" || kind === "slow-pickup") {
      this.speedEffect = kind === "boost-pickup" ? "boost" : "slow";
      this.speedUntil = this.elapsed + (this.speedEffect === "boost" ? 4 : 3);
      this.burst("spark", 20); this.events.sound(this.speedEffect);
    } else if (!this.flying) {
      this.flightLaunchHeight = this.height;
      this.flightAge = this.fireworkClock = this.rocketSoundClock = 0;
      this.grounded = false; this.rollAge = -1; this.jumpAge = 0;
      this.verticalSpeed = this.jumpBuffer = 0;
      this.chaserAutoUntil = this.elapsed + RUNNER_FIREWORK_SECONDS + .7;
      for (let i = 0; i < 15; i++) {
        const ahead = this.speed * (.8 + i * .32);
        this.add("coin", this.lane * RUNNER_LANE_WIDTH, this.distance + RUNNER_PLAYER_Z + ahead, 210);
      }
      this.burst("spark", 24); this.events.sound("rocket");
    }
  }

  start() {
    if (this.phase !== "ready" && this.phase !== "finished") return;
    const prepared = this.phase === "ready" && this.objects.length > 0;
    if (!prepared) { this.seed = newSeed(); this.randomState = this.seed; }
    this.distance = this.elapsed = this.introTime = this.caughtTime = this.coins = this.nearMisses = this.shake = this.flash = 0;
    this.lane = 0;
    this.lanePosition = 0;
    this.laneVelocity = this.landingImpact = this.laneFrom = this.coyoteTime = 0;
    this.laneAge = RUNNER_LANE_DURATION;
    this.jumpAge = this.rollAge = -1;
    this.height = this.platformHeight = this.verticalSpeed = this.jumpBuffer = 0;
    this.grounded = true;
    this.roofs = false;
    this.speed = 22;
    this.shieldCharges = this.options.collar ? this.collarCharges : 0;
    this.shieldUntil = this.magnetUntil = this.fireworkClock = this.chaserAutoUntil = 0;
    this.flightAge = -1;
    this.speedUntil = this.rocketSoundClock = this.speedSparkClock = 0; this.speedEffect = null;
    this.flybyAge = -1; this.nextFlyby = 16 + this.random() * 12;
    this.birdAge = -1; this.nextBird = 7 + this.random() * 9; this.nextThunder = 0;
    Object.assign(this.chaserPose, { lane: 0, height: 0, rollAge: -1, distance: 0 });
    this.chaserHistory.forEach(sample => Object.assign(sample, { time: -10, lane: 0, height: 0, rollAge: -1, distance: 0 }));
    this.chaserHistoryIndex = 0;
    this.particles.length = 0;
    if (!prepared) {
      this.objects.length = 0; this.safeLane = 0;
      this.nextRow = 32; this.rowIndex = 0; this.lastRowEnd = 12;
      this.lastPattern = ""; this.lastMandatory = -10; this.nextPowerupRow = 4;
      this.nextScenery = 9; this.sceneryIndex = 0; this.nextCrossing = 170;
      for (let z = 11; z < 20; z += 4) this.add("coin", 0, z);
      this.generateAhead();
    }
    this.beatClock = this.dustClock = this.beat = this.zone = 0;
    this.reported = false;
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
      this.laneFrom = this.lanePosition;
      this.laneAge = 0;
      this.lane = lane;
    } else if (this.flying) { return;
    } else if (action === "jump") {
      if (!this.grounded && this.coyoteTime <= 0) { this.jumpBuffer = .16; return; }
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
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
    if (this.birdAge >= 0 && (this.birdAge += dt) >= 4) this.birdAge = -1;
    if (this.elapsed >= this.nextBird) { this.birdAge = 0; this.nextBird = this.elapsed + 18 + this.random() * 20; }
    const weather = runnerAtmosphere(this.elapsed, this.seed);
    if (weather.phase === 4 && this.elapsed >= this.nextThunder && weather.lightning > .05) { this.events.sound("thunder"); this.nextThunder = this.elapsed + 8; }
    if (this.flybyAge >= 0 && (this.flybyAge += dt) >= 8) this.flybyAge = -1;
    if (this.elapsed >= this.nextFlyby) {
      this.flybyAge = 0; this.nextFlyby = this.elapsed + 35 + this.random() * 22;
      this.events.sound("flyby");
    }
    if (!this.speedSeconds) this.speedEffect = null;
    const baseSpeed = Math.min(this.options.turbo ? 75 : 59, (22 + this.elapsed * .19) * (this.options.turbo ? 1.55 : 1));
    const targetSpeed = baseSpeed * (this.speedEffect === "boost" ? 1.4 : this.speedEffect === "slow" ? .68 : 1);
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 5);
    this.distance += this.speed * dt;
    const previousLane = this.lanePosition;
    this.laneAge = Math.min(RUNNER_LANE_DURATION, this.laneAge + dt);
    const laneProgress = this.laneAge / RUNNER_LANE_DURATION;
    this.lanePosition = this.laneFrom + (this.lane - this.laneFrom) * (1 - (1 - laneProgress) ** 3);
    this.laneVelocity = (this.lanePosition - previousLane) / dt;
    this.landingImpact = Math.max(0, this.landingImpact - dt * 5);
    this.coyoteTime = this.grounded ? .085 : Math.max(0, this.coyoteTime - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (!this.grounded && !this.flying) { this.jumpAge += dt; this.height += this.verticalSpeed * dt; this.verticalSpeed -= 1280 * dt; }
    if (this.rollAge >= 0 && (this.rollAge += dt) >= .63) this.rollAge = -1;
    this.generateAhead();
    let support = 0;
    for (const object of this.objects) {
      if ((object.kind !== "platform" && object.kind !== "car") || Math.abs(object.z - this.distance - RUNNER_PLAYER_Z) >= object.depth / 2 || Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition) >= .42) continue;
      if (!this.flying && this.height < object.height - 6 && this.platformHeight < object.height - 6) {
        if (!this.absorbCollision()) { this.collide(); return; }
        this.height = object.height; this.verticalSpeed = 0; this.grounded = true;
      }
      support = Math.max(support, object.height);
      if (!this.flying && object.kind === "car" && object.activatedAt < 0 && this.height >= object.height - 6 && (this.grounded || this.verticalSpeed <= 0)) {
        object.activatedAt = this.elapsed;
        this.burst("spark", 8);
        this.events.sound("near");
      }
    }
    this.platformHeight = support;
    if (this.flying) {
      this.flightAge = Math.min(RUNNER_FIREWORK_SECONDS, this.flightAge + dt);
      this.height = runnerFlightHeight(this.flightAge, this.flightLaunchHeight, support);
      this.fireworkClock += dt;
      this.rocketSoundClock += dt;
      if (this.fireworkClock > .055) { this.fireworkClock = 0; this.burst("spark", 4); }
      if (this.rocketSoundClock > .65) { this.rocketSoundClock = 0; this.events.sound("flight"); }
      if (this.flightAge >= RUNNER_FIREWORK_SECONDS) {
        this.flightAge = -1; this.height = support; this.grounded = true;
        this.jumpAge = -1; this.verticalSpeed = 0; this.landingImpact = .7;
        this.shieldUntil = Math.max(this.shieldUntil, this.elapsed + .85);
        this.burst("dust", 16); this.events.sound("land");
      }
    }
    if (!this.flying && this.height > support + 1 && this.grounded) { this.grounded = false; this.jumpAge = 0; this.verticalSpeed = 0; }
    if (!this.flying && !this.grounded && this.verticalSpeed <= 0 && this.height <= support) {
      this.landingImpact = Math.min(1, Math.abs(this.verticalSpeed) / 650);
      this.height = support; this.verticalSpeed = 0; this.grounded = true; this.jumpAge = -1;
      this.burst("dust", 8);
      if (this.jumpBuffer > 0) { this.jumpBuffer = 0; this.input("jump"); }
    }
    for (const object of this.objects) if (object.kind === "sahur" && !object.passed && object.z - this.distance < 105) object.z -= dt * 3.4;
    for (const object of this.objects) if (object.kind === "cat" && !object.passed) {
      if (object.activatedAt < 0 && object.z - this.distance < 75) object.activatedAt = this.elapsed;
      if (object.activatedAt >= 0) { object.x += (object.variant % 2 ? -1 : 1) * dt * 110; if (Math.abs(object.x) > 225) object.passed = true; }
    }
    this.followChaser(dt);
    let pickedUp = 0;
    for (const object of this.objects) {
      const z = object.z - this.distance;
      const laneDifference = Math.abs(object.x / RUNNER_LANE_WIDTH - this.lanePosition);
      const sameLane = laneDifference < .34;
      const magnetic = this.magnetic || this.options.collar;
      const withinMagnet = magnetic && Math.abs(z - RUNNER_PLAYER_Z) < (this.magnetic ? 8 : 6+this.collarLevel-1) && laneDifference < (this.magnetic ? 2.1 : 1.25+(this.collarLevel-1)*.2);
      if (object.kind.endsWith("-pickup") && !object.passed && !this.flying && Math.abs(z - RUNNER_PLAYER_Z) < 2.4 && laneDifference < .5 && this.height < (object.kind === "boost-pickup" || object.kind === "slow-pickup" ? 14 : 95)) {
        object.passed = true; this.collectPowerup(object.kind as RunnerPowerup);
      }
      if (object.kind === "coin" && !object.passed && (withinMagnet || (Math.abs(z - RUNNER_PLAYER_Z) < 1.8 && laneDifference < .48 && Math.abs(this.jumpHeight - object.height) < 48))) {
        object.passed = true;
        pickedUp++;
        if (this.particles.length < 72) this.particles.push({ x: object.x, y: object.height, z: object.z, vx: 0, vy: 0, age: 0, life: .6, kind: "pickup", color: "#ffe899" });
        this.burst("spark", 5);
      }
      const collisionHalfLength = object.kind === "cargo" || object.kind === "truck" || object.kind === "barrier" || object.kind === "fence" ? object.depth/2 : object.kind === "gap" ? 2 : 1.1;
      if (!this.flying && isHazard(object.kind) && Math.abs(z - RUNNER_PLAYER_Z) < collisionHalfLength && sameLane) {
        const cleared = object.kind === "arch" ? (this.rolling && this.height < 12) || this.height > 144 : (object.kind === "barrier" || object.kind === "fence") ? this.jumpHeight > object.height+4 : object.kind === "gap" ? this.jumpHeight > 34 : false;
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
    this.objects = this.objects.filter(object => object.z + object.depth / 2 - this.distance > RUNNER_NEAR_DISTANCE && !((object.kind === "coin" || object.kind.endsWith("-pickup")) && object.passed));
    this.speedSparkClock += dt;
    if (this.speedEffect && this.speedSparkClock > .1) { this.speedSparkClock = 0; this.burst("spark", 3); }
    this.dustClock += dt;
    if (this.dustClock > .11 && this.jumpAge < 0) { this.dustClock = 0; this.burst("dust", this.rolling ? 4 : 2); }
    this.beatClock += dt;
    if (this.beatClock > .195) { this.beatClock -= .195; this.events.sound("beat", this.beat++); }
    const zone = runnerDistrict(this.distance);
    if (zone !== this.zone) { this.zone = zone; this.events.zone(zone); }
    const roofs = runnerRouteElevation(this.distance + RUNNER_PLAYER_Z) > 35;
    if (roofs !== this.roofs) { this.roofs = roofs; this.events.route(roofs); this.events.sound("near"); }
  }

  private followChaser(dt: number) {
    this.chaserHistoryIndex = (this.chaserHistoryIndex + 1) % this.chaserHistory.length;
    Object.assign(this.chaserHistory[this.chaserHistoryIndex], { time: this.elapsed, lane: this.lanePosition, height: this.flying ? 0 : this.height, rollAge: this.flying ? -1 : this.rollAge, distance: this.distance });
    if (this.elapsed < this.chaserAutoUntil) {
      const distance = this.distance - this.speed * RUNNER_CHASER_DELAY;
      const pose = runnerGroundChaser(this.objects, distance + RUNNER_PLAYER_Z, this.speed, this.chaserPose.lane);
      this.chaserPose.lane += (pose.lane - this.chaserPose.lane) * Math.min(1, dt * 12);
      this.chaserPose.height = pose.height; this.chaserPose.rollAge = pose.rollAge;
      this.chaserPose.distance = distance;
      return;
    }
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
    if (this.objects.length >= 768) return;
    const district = runnerDistrict(z);
    const choice = Math.floor(this.random()*4);
    let variant = Math.floor(this.random() * 8);
    if (kind === "barrier") {
      variant = district === 1 ? [2,4,5,6][choice] : [1,3,7,1][choice];
      height = [36,38,39,44,54,39,54,38][variant]; depth = 6;
    }
    if (kind === "fence") { height = 56; depth = 3; }
    if (kind === "cargo") variant = district === 1 ? [2,4,5,6][choice] : district === 2 ? [1,3,7,3][choice] : district === 3 ? [2,6,3,0][choice] : [0,1,3,7][choice];
    if (kind === "arch") variant = district === 1 ? 4+choice : choice;
    if (kind === "cargo") { height = 102; depth = 8; }
    if (kind === "truck") { height = 136; depth = 18; }
    if (kind === "building" && district === 2) { height = 180+this.random()*110; depth=32; }
    if (kind === "car" && district === 3) variant = choice === 0 ? 5 : variant;
    this.objects.push({ id: this.nextId++, kind, x, z, height, depth, variant, district, passed: false, activatedAt: -1 });
  }

  private generateAhead() {
    const end = this.distance + RUNNER_VIEW_DISTANCE;
    while (this.nextCrossing < end) {
      if (runnerDistrict(this.nextCrossing)<4 && runnerRouteElevation(this.nextCrossing-20)===0 && runnerRouteElevation(this.nextCrossing+20)===0)
        this.add("crossing", 0, this.nextCrossing, 0, 10);
      this.nextCrossing += this.nextCrossing % 960 < 500 ? 590 : 370;
    }
    while (this.nextRow < end) {
      let z = this.nextRow;
      const previousLane = this.safeLane;
      const lanes: RunnerLane[] = [-1, 0, 1];
      const routePosition = z % 2520;
      const market = runnerDistrict(z) === 1;
      const bridge = runnerDistrict(z) === 4;
      const crossing = this.objects.find(object => object.kind === "crossing" && Math.abs(object.z - z) < 28);
      if (crossing) { this.nextRow = crossing.z + 35; this.lastRowEnd = this.nextRow - 20; continue; }
      // Plan for the speed on arrival, including rows generated 600 units ahead.
      // Distance spacing therefore never collapses into an unreadable late-game wall.
      const factor = this.options.turbo ? 1.55 : 1;
      const arrivalSpeed = Math.min(this.options.turbo ? 75 : 59, Math.sqrt((22 * factor) ** 2 + 2 * .19 * factor * z));
      const difficulty = Math.min(1, z / 3200);
      let pattern = this.random();
      if (this.rowIndex === 0) pattern = .42;
      else if (this.rowIndex === 1) pattern = .16;
      else if (this.rowIndex === 2) pattern = .62;
      // Jumpable rows dominate; arches come next, tall obstacles are scarce.
      const recovery = this.rowIndex > 3 && this.rowIndex % 8 === 7;
      const jumpRow = pattern < .52;
      const rollRow = pattern >= .52 && pattern < .84;
      const mandatory = !recovery && (jumpRow || rollRow) && this.rowIndex >= 1 && this.rowIndex - this.lastMandatory >= 3 && (this.rowIndex === 1 || this.random() < .36);
      if (mandatory) z = Math.max(z, this.lastRowEnd + arrivalSpeed * .9);
      const actionGap = arrivalSpeed * (mandatory ? 1.25 : .68 - difficulty * .05);
      const canUseCars = !market && z > 62 && (routePosition < 230 || routePosition > 670) && !this.objects.some(object => object.kind === "crossing" && Math.abs(object.z - z) < 85);
      if (!recovery && !mandatory) {
        const adjacent = lanes.filter(lane => Math.abs(lane - previousLane) === 1);
        this.safeLane = adjacent[Math.floor(this.random() * adjacent.length)];
      }
      const blocked = lanes.filter(lane => lane !== this.safeLane);
      let rowEnd = z + 3, action = "weave";
      const showTrail = this.rowIndex < 3 || mandatory || this.random() < .68;
      const trail = (height: number, endOffset = 6) => {
        if (!showTrail) return;
        const lead = Math.min(18, Math.max(10, (z - this.lastRowEnd) * .65));
        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          const lane = previousLane + (this.safeLane - previousLane) * Math.min(1, t * 2);
          this.add("coin", lane * RUNNER_LANE_WIDTH, z - lead + t * (lead + endOffset), height ? Math.sin(Math.PI * t) * height : 0);
        }
      };
      if (recovery) {
        action = "recovery";
        for (const lane of blocked) this.add("fence", lane * RUNNER_LANE_WIDTH, z);
        trail(0, 8); rowEnd = z + 8;
      } else if (jumpRow) {
        action = "jump";
        const kind = mandatory || this.random() < .58 ? "fence" : "barrier";
        for (const lane of mandatory ? lanes : blocked) this.add(kind, lane * RUNNER_LANE_WIDTH, z);
        trail(mandatory ? 85 : 0);
      } else if (rollRow) {
        action = "roll";
        for (const lane of mandatory ? lanes : blocked) this.add("arch", lane * RUNNER_LANE_WIDTH, z);
        trail(0);
      } else if (canUseCars && pattern < .97) {
        action = "traffic";
        const cars = this.random() < .3 ? 4 : 3;
        for (let i = 0; i < cars; i++) {
          this.add("car", blocked[0] * RUNNER_LANE_WIDTH, z + i * 18, 62, 18);
          for (let c = 0; c < 3; c++) this.add("coin", blocked[0] * RUNNER_LANE_WIDTH, z + i * 18 - 4 + c * 5, 62);
        }
        this.add(bridge && this.random() < .35 ? "truck" : "fence", blocked[1] * RUNNER_LANE_WIDTH, z + 8);
        trail(0, cars * 18 - 12); rowEnd = z + cars * 18 - 7;
      } else {
        this.add(bridge ? "truck" : this.random() < .5 ? "sahur" : "cargo", blocked[0] * RUNNER_LANE_WIDTH, z);
        this.add(this.random() < .66 ? "fence" : "arch", blocked[1] * RUNNER_LANE_WIDTH, z);
        trail(0); rowEnd = z + (bridge ? 9 : 4);
      }
      if (mandatory) this.lastMandatory = this.rowIndex;
      if (this.rowIndex >= this.nextPowerupRow && !mandatory && !recovery) {
        const choice = this.random();
        const kind: RunnerPowerup = choice < .28 ? "magnet-pickup" : choice < .56 ? "firework-pickup" : choice < .82 ? "boost-pickup" : "slow-pickup";
        this.add(kind, this.safeLane * RUNNER_LANE_WIDTH, z - 8);
        this.nextPowerupRow = this.rowIndex + 6 + Math.floor(this.random() * 5);
      }
      this.lastPattern = action;
      this.lastRowEnd = rowEnd;
      this.rowIndex++;
      this.nextRow = rowEnd + actionGap + this.random() * arrivalSpeed * .1;
    }
    while (this.nextScenery < end) {
      const z = this.nextScenery;
      // The transverse railway has its own corridor through the whole block,
      // not just a strip of rails that terminates against a facade.
      if (this.objects.some(object => object.kind === "crossing" && Math.abs(object.z-z) < 32)) {
        this.nextScenery += 26;
        continue;
      }
      for (const side of [-1, 1]) {
        if (runnerDistrict(z) === 5) { if (side === 1) this.add("tunnel-wall", 0, z, 380, 28); continue; }
        if (runnerDistrict(z)===4) {
          this.add("bridge-pylon",side*176,z);
          if(this.random()<.5)this.add("boat",side*(380+this.random()*150),z+10);
          continue;
        }
        this.add("building", side * (252 + this.random() * 22), z, 265 + this.random() * 280, 24 + this.random() * 10);
        if (this.sceneryIndex % 3 === 0) this.add("city-block", side * (485 + this.random() * 70), z + 10, 450 + this.random() * 230, 36);
        if (this.sceneryIndex % 6 === 0) this.add("city-block", side * (760 + this.random() * 80), z + 21, 560 + this.random() * 260, 46);
        const choice = this.random();
        const district=runnerDistrict(z);
        this.add(district===1 ? "stall" : district===2 && choice<.35 ? "dock-crane" : district===3 && choice<.45 ? "neon-sign" : choice<.35 ? "tree" : "lamp", side * (164 + this.random() * 15), z + 5);
        if (this.random() < .7) this.add("pedestrian", side * (154 + this.random() * 24), z + 12);
      }
      if (runnerDistrict(z) < 4 && runnerRouteElevation(z) === 0 && this.random() < .085) {
        const count = this.objects.length;
        this.add("cat", -210, z + 12);
        if (this.objects.length > count) { const cat = this.objects[this.objects.length - 1]; cat.variant = cat.id % 2; cat.x = cat.variant ? 210 : -210; }
      }
      this.nextScenery += 24 + this.random() * 6;
      this.sceneryIndex++;
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
    const colors = kind === "dust" ? ["#d5bc92", "#947b83"] : kind === "impact" ? ["#ffab7e", "#ff5772", "#fff1d1"] : this.flying ? ["#ff976a", "#ffd481", "#fff1d1", "#a9d6e4"] : this.speedEffect === "boost" || this.magnetic ? ["#9adbd6", "#a7d79d", "#fff1d1"] : this.speedEffect === "slow" ? ["#e9ba76", "#d7949d", "#fff1d1"] : ["#ffe899", "#ffbd57", "#fff1d1"];
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
