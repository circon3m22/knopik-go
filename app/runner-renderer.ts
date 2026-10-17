import {getVisualAccessibility} from "./visual-accessibility.ts";
import {getVisualProfile} from "./graphics-quality.ts";
import {KnopikSkinPainter} from "./knopik-skins.ts";
import { setRunnerAttribute, removeRunnerAttribute, setRunnerStyle, setRunnerPolygons } from "./runner-svg.ts";
import { RunnerEngine, RUNNER_LANE_WIDTH, RUNNER_PLAYER_Z, RUNNER_VIEW_DISTANCE, RUNNER_NEAR_DISTANCE, RUNNER_CHASER_DELAY, RUNNER_INTRO_DURATION, runnerRouteElevation, type RunnerObject } from "./runner-engine.ts";
import { RunnerArchitecture } from "./runner-architecture.ts";
import { RunnerTraffic } from "./runner-traffic.ts";
import { RunnerObstacles } from "./runner-obstacles.ts";
import { RunnerProjection } from "./runner-projection.ts";
import { runnerHasElevatedTerrain } from "./runner-terrain-range.ts";
import { runnerAtmosphere, runnerAtmosphereClock, runnerLitColor, runnerMixColor } from "./runner-atmosphere.ts";
import { RunnerTunnel } from "./runner-tunnel.ts";
import { runnerFenceVariant, runnerArchVariant } from "./runner-barrier-variants.ts";
import { runnerDistrictLight, runnerWeatherExposure } from "./runner-districts.ts";
export { RUNNER_ZONES } from "./runner-districts.ts";

const palettes = [
  ["#91bfc4", "#e6ddc4", "#ffe0a4", "#a49aab", "#868b9f", "#a7ac95", "#d5b38d", "#626579", "#686d80", "#e6cba4", "#cb8974", "#915f68", "#ffe4ac"],
  ["#e7b08b", "#f6d4a3", "#ffe8a8", "#b08792", "#8d778b", "#a6a47f", "#d9ad7a", "#756777", "#7d6f80", "#f6d49c", "#e4b878", "#a87960", "#a9cfb7"],
  ["#7d99af", "#c2cbd1", "#e8d6b3", "#82809c", "#697b96", "#8c9d9c", "#b6b9a0", "#52697b", "#5b7386", "#ccdac0", "#ae9290", "#73647c", "#baded2"],
  ["#282a51", "#544a76", "#dc96b4", "#494966", "#414e72", "#596683", "#8293a6", "#434a69", "#4a526f", "#a5d4d5", "#81748f", "#554460", "#f0b776"],
  ["#a4cbd1", "#e5e6cc", "#fff0ad", "#6d9bad", "#739da8", "#5e9bb0", "#b7bfac", "#607585", "#6c8191", "#e0d2a9", "#9daea3", "#546e82", "#c2ded1"],
  ["#20283e", "#303b51", "#90e8df", "#26324a", "#31415d", "#24324a", "#334458", "#34435b", "#3b4b65", "#9caec0", "#364257", "#29374e", "#92e7df"],
  ["#d4b095", "#efd0aa", "#ffe1a1", "#8b7775", "#87726b", "#9caa80", "#cbad86", "#ac967b", "#bca68b", "#eac79a", "#b36c59", "#83504d", "#f1c778"],
  ["#9bc7c7", "#e1e6c1", "#ffe7a5", "#728b69", "#52795d", "#77955d", "#77975a", "#6f9755", "#7ca260", "#afd27b", "#6d805c", "#3e634b", "#e4dcad"],
  ["#a8c9d4", "#f4d6d1", "#fff0bd", "#8d9fa4", "#759499", "#518b9a", "#82a779", "#447e94", "#4b899e", "#badbcc", "#ce9baa", "#796776", "#ffe8cb"],
  ["#a7c0d5", "#dce5db", "#ffdfb1", "#728b9f", "#567386", "#8a9b9b", "#c5c9c2", "#617d90", "#6d8797", "#cee5dd", "#7299ad", "#3a566b", "#b8e5dd"],
];
palettes.push(
 ["#819f91","#c0d0ae","#f3d493","#567457","#3a5a43","#617c49","#a3a076","#7a7952","#89865a","#cfbb82","#718453","#38583d","#d8ce9d"],
 ["#a4bfcc","#e0e5dc","#f8e5b2","#6e8a94","#566f7b","#859795","#c8cbb3","#829193","#98a4a0","#e1dcb4","#93a8a5","#506e79","#dae3cf"],
 ["#9eaf94","#d9d4b4","#f5d59b","#7d8164","#54674b","#8b8a5c","#b8a277","#8b7952","#a08a60","#dec18a","#9d8056","#4a6047","#e6ce9c"]);
const names = ["sky", "cloud", "sun", "distant", "mid", "ground", "sidewalk", "road", "road-light", "stripe", "wall", "wall-dark", "window"];
type Slot = { node: SVGGElement; art: SVGUseElement; kind: string; palette: string };
const round = (value: number) => Math.round(value * 2) / 2;
const ease = (t: number) => { const n = Math.max(0, Math.min(1, t)); return n * n * (3 - 2 * n); };

/** Fixed SVG pools and shared sprite definitions keep DOM size independent of run length. */
export class RunnerRenderer {
  private skinPainter:KnopikSkinPainter;
  private height = 680;
  private horizon = 204;
  private zone = -1;
  private far: Slot[];
  private near: Slot[];
  private objects: RunnerObject[] = [];
  private parts: Record<string, SVGElement> = {};
  private tiles: SVGPathElement[];
  private sidewalkTiles: SVGPathElement[][];
  private markings: SVGPathElement[];
  private particles: SVGGElement[];
  private wind: SVGPathElement[];
  private flybyPropellers: SVGElement[];
  private rain: SVGPathElement[];
  private splashes: SVGPathElement[];
  private reflections:SVGPathElement[]=[];
  private roadDetails: SVGPathElement[];
  private tunnel: RunnerTunnel;
  private litPalettes = palettes;
  private light = 1;
  private atmosphereStamp = -1;
  private architecture: RunnerArchitecture;
  private traffic: RunnerTraffic;
  private obstacles: RunnerObstacles;
  private roofWalls: SVGPathElement[][];
  private worldDistance = 0;
  private worldSeed = 0;
  private cameraElevation = 0;
  private flightView = 0;
  private tileColors: string[] = [];
  private depthLayer: SVGGElement;
  private drawOrder: SVGElement[] = [];
  private premiumShadows:SVGElement[]=[];
  private outfitNodes:Element[]=[];
  private terrainCuts: number[] = [];
  private elevatedTerrain = false;
  private terrainDefs: SVGDefsElement;
  private terrainClips = new Map<SVGElement, { id: string; rect: SVGRectElement }>();
  private projection = new RunnerProjection();
  private chaserArt: SVGUseElement;
  private litColors = new Map<string, string>();
  private svg: SVGSVGElement;
  private prefix: string;
  private reducedMotion: boolean;

  private lit(color: string) {
    let result = this.litColors.get(color);
    if (!result) { result = runnerLitColor(color, this.light); this.litColors.set(color, result); }
    return result;
  }

  private resetProjection() {
    this.projection.reset({ height: this.height, horizon: this.horizon, distance: this.worldDistance, elevation: this.cameraElevation, flight: this.flightView, seed: this.worldSeed });
  }

  constructor(svg: SVGSVGElement, prefix: string, reducedMotion = false) {
    this.svg = svg; this.prefix = prefix; this.reducedMotion = reducedMotion;
    svg.querySelector('[data-runner-terrain-clips]')?.remove();
    this.terrainDefs = this.svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs");
    setRunnerAttribute(this.terrainDefs, "data-runner-terrain-clips", "");
    svg.append(this.terrainDefs);
    for (const name of ["ground", "sidewalk", "road", "world", "skyline", "clouds", "stars", "sun", "moon", "bird", "rain", "splashes", "lightning", "sunset", "night-shade", "player", "pose", "roll", "shadow", "shield", "magnet", "firework", "flames", "flyby", "collar", "leg-left", "leg-right", "arm-left", "arm-right", "tail", "head", "turn", "chaser", "start", "start-back", "flash"]) {
      this.parts[name] = svg.querySelector<SVGElement>(`[data-runner-${name}]`)!;
    }
    const doc=svg.ownerDocument as Document&{ids?:Map<string,Element>};
    this.outfitNodes=Array.from(svg.querySelectorAll("[data-runner-outfit]"));
    this.skinPainter=new KnopikSkinPainter(this.parts.player,id=>doc.getElementById?.(id)??doc.ids?.get(id)??null);
    this.chaserArt = this.parts.chaser.querySelector<SVGUseElement>("use")!;
    const slots = (name: string) => Array.from(svg.querySelectorAll<SVGGElement>(`[data-runner-slot="${name}"]`)).map(node => ({ node, art: node.querySelector<SVGUseElement>("use")!, kind: "", palette: "" }));
    this.depthLayer = svg.querySelector<SVGGElement>("[data-runner-depth-objects]")!;
    this.far = slots("far");
    this.near = slots("near");
    this.tiles = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-road-tiles] > path"));
    this.sidewalkTiles = Array.from(svg.querySelectorAll<SVGGElement>("[data-runner-sidewalk-tiles] > g")).map(group => Array.from(group.querySelectorAll<SVGPathElement>("path")));
    this.markings = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-markings] > path"));
    this.particles = Array.from(svg.querySelectorAll<SVGGElement>("[data-runner-particles] > g"));
    this.wind = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-speed-lines] > path"));
    this.flybyPropellers = Array.from(svg.querySelectorAll<SVGElement>("[data-runner-flyby] [data-croc-propeller]"));
    this.rain = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-rain] > path"));
    this.splashes = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-splashes] > path"));
    this.reflections=Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-ultra-reflections]>path"));
    this.roadDetails = Array.from(svg.querySelectorAll<SVGPathElement>("[data-runner-road-details] > path"));
    this.tunnel = new RunnerTunnel(svg);
    this.roofWalls = Array.from(svg.querySelectorAll<SVGGElement>("[data-runner-roof-walls] > g")).map(group => Array.from(group.querySelectorAll("path")));
    this.architecture = new RunnerArchitecture(svg);
    this.traffic = new RunnerTraffic(svg);
    this.obstacles = new RunnerObstacles(svg);
    this.resize();
  }

  resize() {
    const bounds = this.svg.getBoundingClientRect();
    this.height = Math.max(470, Math.min(900, bounds.height / Math.max(1, bounds.width) * 360));
    this.horizon = this.height * .36;
    this.resetProjection();
    setRunnerAttribute(this.svg, "viewBox", `0 0 360 ${round(this.height)}`);
    setRunnerAttribute(this.parts.skyline, "transform", `translate(0 ${round(this.horizon + 4)})`);
    this.updateGround();
    this.paintQuads(this.parts.sidewalk,[-220,220,-5,9999]);
    this.paintQuads(this.parts.road,[-RUNNER_LANE_WIDTH*1.5,RUNNER_LANE_WIDTH*1.5,-5,9999]);
  }

  private project(x: number, z: number, height = 0, floor?: number) {
    return this.projection.project(x, z, height, floor);
  }

  private updateGround() {
    setRunnerAttribute(this.parts.ground, "d", `M0 ${round(this.horizon)}H360V1000H0Z`);
  }

  private clipToTerrain(node: SVGElement, object: RunnerObject, z: number, local?: { y: number; scale: number }) {
    if(!this.elevatedTerrain){removeRunnerAttribute(node,"clip-path");return;}
    const depth = z - object.depth / 2;
    const index = Math.floor((depth - RUNNER_PLAYER_Z) / 8);
    const cut = this.terrainCuts[Math.min(index, this.terrainCuts.length - 1)];
    const base = this.project(object.x, depth).y;
    if (depth <= RUNNER_PLAYER_Z || object.kind === "boat" || !Number.isFinite(cut) || cut >= base - 1) { removeRunnerAttribute(node, "clip-path"); return; }
    let clip = this.terrainClips.get(node);
    if (!clip) {
      const path = this.svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      const rect = this.svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "rect");
      const id = `${this.prefix}-terrain-${this.terrainClips.size}`;
      setRunnerAttribute(path, "id", id); setRunnerAttribute(path, "clipPathUnits", "userSpaceOnUse");
      path.append(rect); this.terrainDefs.append(path); clip = { id, rect }; this.terrainClips.set(node, clip);
    }
    const bottom = local ? (cut - local.y) / (Math.round(local.scale * 100) / 100) : cut;
    setRunnerAttribute(clip.rect, "x", "-4000"); setRunnerAttribute(clip.rect, "y", `${bottom - 8000}`);
    setRunnerAttribute(clip.rect, "width", "8000"); setRunnerAttribute(clip.rect, "height", "8000");
    setRunnerAttribute(node, "clip-path", `url(#${clip.id})`);
  }

  private paintQuads(node:Element,...quads:[number,number,number,number][]) {
    setRunnerPolygons(node,quads.map(([x1,x2,near,far])=>[this.project(x1,near),this.project(x2,near),this.project(x2,far),this.project(x1,far)]));
  }

  render(engine: RunnerEngine) {
    const profile=getVisualProfile(),minimal=profile.detail===0;
    this.skinPainter.paint(engine.options.skin);
    for(const outfit of this.outfitNodes)setRunnerAttribute(outfit,"display",outfit.getAttribute("data-runner-outfit")===engine.options.accessory?"inline":"none");
    if (engine.zone !== this.zone) {
      this.zone = engine.zone;
      this.atmosphereStamp = -1;
      setRunnerAttribute(this.parts.skyline, "opacity", [4,5,7,8,10,11,12].includes(this.zone)?"0":"1");
    }
    const clock = engine.elapsed;
    const atmosphere = runnerAtmosphereClock(clock, engine.seed, engine.options.night);
    if (this.atmosphereStamp !== Math.floor(clock * 5)) {
      const skyColors=runnerAtmosphere(clock,engine.seed,engine.options.night);
      this.atmosphereStamp = Math.floor(clock * 5);
      if (this.light !== atmosphere.illumination || this.litPalettes === palettes) {
        this.light = atmosphere.illumination; this.litColors.clear();
        this.litPalettes = palettes.map((palette, district) => palette.map(color => runnerLitColor(color, runnerDistrictLight(district, this.light))));
      }
      this.litPalettes[this.zone].forEach((color, index) => { if(index===0 || index===1 || index===12)return;setRunnerStyle(this.svg,`--run-${names[index]}`,color); });
      setRunnerStyle(this.svg,"--run-sky",this.zone===5?palettes[5][0]:skyColors.sky);
      setRunnerStyle(this.svg,"--run-cloud",skyColors.cloud);
      setRunnerStyle(this.svg,"--run-window",runnerMixColor("#cabfaa", "#ffe0a3", atmosphere.night));
      setRunnerAttribute(this.parts.stars, "opacity", this.zone === 5 ? "0" : `${atmosphere.night * .9}`);
      setRunnerAttribute(this.parts.moon, "opacity", this.zone === 5 ? "0" : `${atmosphere.night}`);
      setRunnerAttribute(this.parts.sun, "opacity", this.zone === 5 ? "0" : `${Math.max(0, 1 - atmosphere.night - atmosphere.rain * .6)}`);
      setRunnerAttribute(this.parts.clouds, "opacity", this.zone === 5 ? "0" : "1");
      setRunnerAttribute(this.parts.sunset, "opacity", this.zone === 5 ? "0" : atmosphere.phase === 0 ? ".8" : atmosphere.phase === 2 ? ".45" : "0");
      setRunnerAttribute(this.parts.sunset, "transform", `translate(0 ${round(this.horizon - 88)})`);
      setRunnerAttribute(this.parts.sun, "transform", `translate(0 ${atmosphere.phase === 0 || atmosphere.phase === 2 ? round(this.horizon - 120) : 0})`);
      setRunnerAttribute(this.parts["night-shade"], "opacity", `${atmosphere.night * (this.zone === 5 ? .035 : .14)}`);
    }
    this.worldDistance = engine.distance;
    this.worldSeed = engine.seed;
    const previousElevation = this.cameraElevation;
    this.flightView = engine.flying ? ease(engine.flightAge / .75) * (1 - ease((engine.flightAge - 5.6) / 1.4)) : 0;
    this.cameraElevation = runnerRouteElevation(engine.distance + RUNNER_PLAYER_Z,engine.seed) + this.flightView * 38;
    const visualPhase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const stopped = visualPhase === "ready" || visualPhase === "intro";
    const flyby = engine.flybyAge / 8;
    const flybyVisible = profile.detail>1 && !stopped && engine.flybyAge >= 0 && this.zone !== 5;
    setRunnerAttribute(this.parts.flyby, "opacity", flybyVisible ? "1" : "0");
    if (flybyVisible) {
      setRunnerAttribute(this.parts.flyby, "transform", `translate(${round(-80 + flyby * 520)} ${round(this.horizon - 49 - Math.sin(Math.PI * flyby) * 18)}) scale(${.8 + Math.sin(Math.PI * flyby) * .28})`);
      for (const propeller of this.flybyPropellers) setRunnerAttribute(propeller, "transform", `translate(${propeller.getAttribute("data-croc-origin")}) rotate(${this.reducedMotion ? 0 : Math.floor(clock * 24) % 4 * 45})`);
    }
    const birdVisible = profile.detail>1 && !stopped && engine.birdAge >= 0 && this.zone !== 5;
    setRunnerAttribute(this.parts.bird, "opacity", birdVisible ? "1" : "0");
    if (birdVisible) setRunnerAttribute(this.parts.bird, "transform", `translate(${round(400 - engine.birdAge * 115)} ${round(65 + Math.sin(engine.birdAge * 3) * 9)}) scale(1 ${this.reducedMotion ? 1 : Math.floor(clock * 7) % 2 ? .5 : 1})`);
    const horizon = this.height * (.36 - this.flightView * .08);
    const horizonChanged = Math.abs(horizon - this.horizon) > .1 || Math.abs(previousElevation - this.cameraElevation) > .1;
    if (horizonChanged) this.horizon = horizon;
    this.resetProjection();
    if (horizonChanged) {
      setRunnerAttribute(this.parts.skyline, "transform", `translate(0 ${round(horizon + 4)})`);
      this.updateGround();
      this.paintQuads(this.parts.sidewalk,[-220,220,-5,9999]);
      this.paintQuads(this.parts.road,[-RUNNER_LANE_WIDTH*1.5,RUNNER_LANE_WIDTH*1.5,-5,9999]);
    }
    const roadDistance = stopped ? 0 : engine.distance;
    this.elevatedTerrain=runnerHasElevatedTerrain(this.worldDistance,this.worldSeed);
    if(this.elevatedTerrain)this.projection.terrainCrests(RUNNER_VIEW_DISTANCE,this.terrainCuts);
    else this.terrainCuts.length=0;
    const scroll = roadDistance % 8;
    for (let i = 0; i < this.tiles.length; i++) {
      const near = i * 8 - scroll, simplified = i >= 22;
      if (simplified && i % 2) {
        setRunnerAttribute(this.tiles[i], "display", "none");
        for (const node of [...this.sidewalkTiles[i],...this.roofWalls[i]]) setRunnerAttribute(node, "display", "none");
        continue;
      }
      setRunnerAttribute(this.tiles[i], "display", "inline");
      for (const node of [...this.sidewalkTiles[i],...this.roofWalls[i]]) setRunnerAttribute(node, "display", "inline");
      const far = near + (simplified ? 16 : 8);
      this.paintQuads(this.tiles[i],[-140,140,near,far]);
      const elevated = runnerRouteElevation(engine.distance + near + 4,engine.seed) > 20;
      const district = engine.districtAt(engine.distance + near + 4);
      for (let side = 0; side < 2; side++) {
        const sidewalk = this.sidewalkTiles[i][side];
        this.paintQuads(sidewalk,side?[140,220,near,far]:[-220,-140,near,far]);
        setRunnerAttribute(sidewalk, "fill", district === 4 ? this.lit("#adc2b3") : this.litPalettes[district][6]);
      }
      const fill = elevated ? this.lit(i % 2 ? "#bca591" : "#cdb9a0") : district === 1 || district === 6 ? this.lit(i % 2 ? "#c0a582" : "#d0b794") : this.litPalettes[district][i % 2 ? 8 : 7];
      if (fill !== this.tileColors[i]) { setRunnerAttribute(this.tiles[i], "fill", fill); this.tileColors[i] = fill; }
      for (let side = 0; side < 2; side++) {
        const wall = this.roofWalls[i][side];
        const bridge=district===4;
        setRunnerAttribute(wall, "visibility", elevated || bridge ? "visible" : "hidden");
        if (!elevated && !bridge) continue;
        const x = side ? 141 : -141;
        const points = bridge ? [this.project(x,near,0),this.project(x,far,0),this.project(x,far,35),this.project(x,near,35)] : [this.project(x, near), this.project(x, far), this.project(x, far, 0, 0), this.project(x, near, 0, 0)];
        setRunnerAttribute(wall, "fill",bridge?side?"#c1c5b0":"#879ca0":side?"#a18171":"#795d62");
        setRunnerPolygons(wall,[points]);
      }
    }
    for (let i = 0; i < this.roadDetails.length; i++) {
      const step = Math.floor(roadDistance / 12), z = i * 12 - roadDistance % 12;
      const index = i + step, x = [-119, -20, 119, 22][index % 4];
      if(profile.detail<=1&&i%4!==0||minimal){setRunnerAttribute(this.roadDetails[i],"display","none");continue;}
      const path = this.roadDetails[i], district = engine.districtAt(engine.distance + z);
      setRunnerAttribute(path, "display", z < 175 && z > -8 ? "inline" : "none");
      if (z >= 175 || z <= -8) continue;
      if (district === 7) {
        setRunnerAttribute(path, "fill", this.litPalettes[7][index % 2 ? 9 : 5]);
        this.paintQuads(path,[x-5,x-2,z,z+1.5],[x,x+3,z+.4,z+2],[x+5,x+7,z,z+1]); continue;
      }
      if (district === 8) {
        const drift = this.reducedMotion ? 0 : Math.sin(clock*1.5+index)*3;
        setRunnerAttribute(path,"fill",this.litPalettes[8][index%2?9:6]);
        this.paintQuads(path,[x-16+drift,x+12+drift,z,z+.4],[x-5+drift,x+20+drift,z+1.2,z+1.6]);
        continue;
      }
      setRunnerAttribute(path, "fill", district === 5 ? ["#498f9c", "#725987", "#925f8a"][index % 3] : this.lit(index % 3 ? "#424c60" : "#85949c"));
      this.paintQuads(path,...(index%3===0?[[x-8,x+8,z,z+1.2],[x-5,x-3,z+1.3,z+2],[x+3,x+5,z+1.3,z+2]]:[[x-2,x+2,z,z+2.5],[x+2,x+9,z+2,z+2.5]]) as [number,number,number,number][]);
    }
    for(let i=0;i<this.reflections.length;i++){
      const node=this.reflections[i];setRunnerAttribute(node,"opacity",profile.detail===4?String(.05+atmosphere.night*.13+atmosphere.rain*.12):"0");
      if(profile.detail!==4)continue;
      const z=12+i*13-engine.distance%13,x=(i%2?1:-1)*(65+i%3*8);
      this.paintQuads(node,[x-10,x+8,z,z+1.5],[x-6,x+5,z+2,z+2.6]);
      setRunnerAttribute(node,"fill",i%3===0?"#f0d7a2":"#9cd8ec");
    }
    for (let i = 0; i < this.markings.length; i++) {
      const z = Math.floor(i / 2) * 6.4 - roadDistance % 6.4;
      const district = engine.districtAt(engine.distance+z);
      const shown = z <= 220 && ![1,6,7,8].includes(district) && runnerRouteElevation(engine.distance+z,engine.seed)<=20;
      setRunnerAttribute(this.markings[i], "display", shown ? "inline" : "none");
      if (!shown) continue;
      const x = i % 2 ? 47 : -47;
      setRunnerAttribute(this.markings[i], "visibility", "visible");
      this.paintQuads(this.markings[i],[x-1.3,x+1.3,z,z+2.7]);
    }
    const sway = this.reducedMotion ? 0 : Math.sin(clock * 1.8) * Math.min(1.4, engine.speed / 40);
    const shake = this.reducedMotion || !getVisualAccessibility().cameraShake ? 0 : Math.sin(clock * 67 + engine.caughtTime * 60) * engine.shake;
    setRunnerAttribute(this.parts.world, "transform", `translate(${round(sway + shake)} 0)`);
    setRunnerAttribute(this.parts.clouds, "transform", `translate(${this.reducedMotion ? 0 : round(Math.sin(clock * .025) * 11)} 0)`);
    setRunnerAttribute(this.parts.flash, "opacity", this.reducedMotion ? "0" : `${engine.flash * .25}`);

    this.objects.length = 0;
    for (const object of engine.objects) if (!object.passed || !(object.kind === "coin" || object.kind.endsWith("-pickup"))) {
      if(minimal&&["building","city-block","tree","park-tree","cherry-tree","park-grove","cherry-grove","office-plaza","office-light","office-totem","office-link","dock-crane","boat","pine","cliff","sawmill"].includes(object.kind))continue;
      const z = object.z - engine.distance;
      if(profile.detail===1&&z>180&&["tree","lamp","pine","park-tree","cherry-tree"].includes(object.kind)&&object.id%2)continue;
      // Keep passed furniture moving below the viewport. The expanded near
      // plane avoids clamping it onto a stationary foreground polygon.
      if (object.kind === "cat" && object.passed) continue;
      const visibleDistance = object.kind === "building" || object.kind === "city-block" || object.kind === "park-tree" || object.kind === "cherry-tree" || object.kind === "bridge-pylon" || object.kind === "tunnel-wall" || object.kind === "tunnel-entrance" || object.kind === "park-grove" || object.kind === "cherry-grove" || object.kind === "office-link" ? RUNNER_VIEW_DISTANCE : object.kind === "coin" ? 160 : object.kind === "crossing" ? 260 : 230;
      if (z + object.depth / 2 > RUNNER_NEAR_DISTANCE && z < Math.min(visibleDistance,profile.runnerDistance)) this.objects.push(object);
    }
    this.objects.sort((a, b) => (b.z+b.depth/2)-(a.z+a.depth/2) || a.id-b.id);
    this.drawOrder.length = 0;
    let shadowIndex=0;

    let playerPlaced = false;
    this.architecture.begin(this.objects,engine.distance);
    this.traffic.begin();
    this.obstacles.begin();
    this.tunnel.begin();
    let farIndex = 0, nearIndex = 0;
    for (const object of this.objects) {
      const z = object.z - engine.distance;

      if(profile.premium&&shadowIndex<48&&["building","city-block","platform","car","truck","crossing","cargo","barrier","hedge"].includes(object.kind)){
        let shadow=this.premiumShadows[shadowIndex];
        if(!shadow){shadow=this.depthLayer.ownerDocument.createElementNS("http://www.w3.org/2000/svg","path") as SVGElement;shadow.setAttribute("fill","#15243c");shadow.setAttribute("fill-opacity",".2");shadow.setAttribute("data-premium-shadow",String(shadowIndex));this.depthLayer.append(shadow);this.premiumShadows.push(shadow);}
        const half=object.kind==="building"||object.kind==="city-block"?65:object.kind==="truck"?43:32;
        const points=[this.project(object.x-half,z-4),this.project(object.x+half,z-4),this.project(object.x+half+30,z+22),this.project(object.x-half+30,z+22)];
        setRunnerPolygons(shadow,[points]);setRunnerAttribute(shadow,"display","inline");this.drawOrder.push(shadow);shadowIndex++;
      }
      if (object.kind === "tunnel-wall" || object.kind === "tunnel-entrance") {
        const node = this.tunnel.draw(object, z, (x, depth, height) => this.project(x, depth, height), clock, this.reducedMotion);
        if (node) { this.clipToTerrain(node, object, z); this.drawOrder.push(node); } continue;
      }
      if (!engine.flying && !playerPlaced && z+object.depth/2 < RUNNER_PLAYER_Z) {
        this.drawOrder.push(this.parts["start-back"],this.parts.player); playerPlaced=true;
      }
      // Arches and drums deliberately use flat pixel sprites. They still share
      // the same depth order and lifetime as the projected solid objects.
      const flatObstacle = object.kind === "arch" || object.kind === "barrier" && object.variant === 3 || object.kind === "cargo" && object.variant === 1;
      if (["barrier", "cargo", "hedge", "thorn", "mower", "floating"].includes(object.kind) && !flatObstacle && object.district !== 6 && object.district !== 9) {
        const node=this.obstacles.draw(object, z, (x, depth, height, floor) => this.project(x, depth, height, floor));
        if(node) { this.clipToTerrain(node, object, z); this.drawOrder.push(node); }
        continue;
      }
      if (object.kind === "car" || object.kind === "truck" || object.kind === "crossing") {
        const node=this.traffic.draw(object, z, (x, depth, height, floor) => this.project(x, depth, height, floor), clock, this.reducedMotion);
        if(node) { this.clipToTerrain(node, object, z); this.drawOrder.push(node); }
        continue;
      }
      if (object.kind === "building" || object.kind === "city-block" || object.kind === "platform") {
        const node=this.architecture.draw(object, z, (x, depth, height, floor) => this.project(x, depth, height, floor), this.litPalettes[object.district][[10, 6, 7, 5][object.variant % 4]], z < RUNNER_PLAYER_Z, this.light);
        if(node) { this.clipToTerrain(node, object, z); this.drawOrder.push(node); }
        continue;
      }
      const slot = z >= RUNNER_PLAYER_Z ? this.far[farIndex++] : this.near[nearIndex++];
      if (!slot) continue;
      const walking = object.kind === "pedestrian" && !this.reducedMotion ? Math.sin(clock*1.8+object.id)*3 : 0;
      let objectX = object.x + walking, objectHeight = object.kind === "coin" ? object.height + 45 : object.kind === "boost-pickup" || object.kind === "slow-pickup" ? 2 : object.kind.endsWith("-pickup") ? 52 + Math.sin(clock * 5 + object.id) * 5 : object.kind === "boat" ? -18 : 0;
      let objectZ = z;
      if (object.kind === "coin" && (engine.magnetic || engine.options.collar)) {
        const reach = engine.magnetic ? 29 : 15 + engine.collarLevel;
        if (z >= RUNNER_PLAYER_Z && z < RUNNER_PLAYER_Z + reach && Math.abs(object.x / RUNNER_LANE_WIDTH - engine.lanePosition) < (engine.magnetic ? 2.1 : 1.25 + (engine.collarLevel - 1) * .2)) {
          const attraction = ease((RUNNER_PLAYER_Z + reach - z) / reach);
          objectX += (engine.lanePosition * RUNNER_LANE_WIDTH - objectX) * attraction;
          objectHeight += (engine.height + 50 - objectHeight) * attraction;
          objectZ += (RUNNER_PLAYER_Z - z) * attraction * .4;
        }
      }
      const point = this.project(objectX, objectZ, objectHeight, object.kind === "boat" ? 0 : undefined);
      if (Math.abs(point.x - 180) > 330) { setRunnerAttribute(slot.node, "display", "none"); continue; }
      const guardFrame = z < 21 ? 2 + Math.floor(clock * 8) % 2 : Math.floor(clock * 5) % 2;
      const china = object.district === 6;
      const kind = object.kind === "park-grove" || object.kind === "cherry-grove" ? `${object.kind}-${object.variant%3}` : object.kind === "cherry-tree" ? `cherry-tree-${object.variant%3}` : object.district === 9 && object.kind === "arch" ? `office-arch-${object.variant%3}` : object.district === 9 && (object.kind === "fence" || object.kind === "barrier") ? `office-low-${object.variant%3}` : object.district === 9 && object.kind === "cargo" ? "office-cargo" : china && (object.kind === "fence" || object.kind === "barrier") ? `china-low-${object.variant%3}` : china && object.kind === "arch" ? `china-arch-${object.variant%3}` : china && object.kind === "cargo" ? "china-cart" : china && object.kind === "stall" ? `china-stall-${object.variant%2}` : object.kind === "park-tree" ? `park-tree-${object.variant%3}` : object.district === 7 && object.kind === "arch" ? `park-arch-${object.variant%3}` : object.kind === "fence" ? `fence-${runnerFenceVariant(object.district, object.variant)}` : object.kind === "arch" ? `arch-${runnerArchVariant(object.district, object.variant)}` : object.kind === "cat" ? `cat-${this.reducedMotion ? 0 : Math.floor(clock * 9) % 2}` : object.kind === "sahur" ? `${china ? "china-" : ""}sahur-${guardFrame}` : object.kind === "pedestrian" ? `pedestrian-${object.variant}-${this.reducedMotion ? 0 : Math.floor(clock*3+object.id)%2}` : ["barrier","cargo"].includes(object.kind) ? `${object.kind}-${object.variant}` : object.kind;
      if (slot.kind !== kind) { setRunnerAttribute(slot.art, "href", `#${this.prefix}-${kind}`); slot.kind = kind; }
      setRunnerAttribute(slot.node, "visibility", "visible");
      setRunnerAttribute(slot.node, "display", "inline");
      this.drawOrder.push(slot.node);
      setRunnerAttribute(slot.node, "transform", `translate(${point.x} ${point.y}) scale(${round(point.scale * 100) / 100})`);
      this.clipToTerrain(slot.node, object, z, point);
      if (object.kind === "coin") setRunnerAttribute(slot.art, "transform", `scale(${Math.max(.2, Math.abs(Math.cos(clock * 7 + object.id)))} 1)`);
      else if (object.kind === "cat") setRunnerAttribute(slot.art, "transform", `scale(${object.variant ? -1 : 1} 1)`);
      else removeRunnerAttribute(slot.art, "transform");
      const palette = palettes[this.zone][[10, 6, 7, 5][object.variant % 4]];
      if (slot.palette !== palette) { slot.node.style.setProperty("--run-wall", palette); slot.palette = palette; }
    }
    for (let i = farIndex; i < this.far.length; i++) setRunnerAttribute(this.far[i].node, "display", "none");
    for (let i = nearIndex; i < this.near.length; i++) setRunnerAttribute(this.near[i].node, "display", "none");
    for(let i=shadowIndex;i<this.premiumShadows.length;i++)setRunnerAttribute(this.premiumShadows[i],"display","none");
    this.architecture.end();
    this.traffic.end();
    this.obstacles.end();
    this.tunnel.end();
    if(!playerPlaced)this.drawOrder.push(this.parts["start-back"],this.parts.player);
    // Meshes and sprites share one painter order. Move a node only when depth
    // order actually changes; never rebuild the scene or allocate DOM per frame.
    for(let i=0;i<this.drawOrder.length;i++) {
      const node=this.drawOrder[i];
      if(this.depthLayer.children[i]!==node)this.depthLayer.insertBefore(node,this.depthLayer.children[i]??null);
    }
    this.drawDog(engine);
    this.drawChaser(engine);
    this.drawParticles(engine);
    const rainfall = (minimal?0:1)*runnerWeatherExposure(this.zone) * atmosphere.rain;
    setRunnerAttribute(this.parts.rain, "opacity", `${rainfall * .5}`);
    setRunnerAttribute(this.parts.splashes, "opacity", `${rainfall * .45}`);
    setRunnerAttribute(this.parts.lightning, "opacity", this.reducedMotion || this.zone === 5 ? "0" : `${atmosphere.lightning * 4}`);
    if (rainfall > .01) {
      const weatherClock = this.reducedMotion ? 0 : clock;
      for (let i = 0; i < this.rain.length; i++) {
      if(i>=this.rain.length*profile.particles){setRunnerAttribute(this.rain[i],"opacity","0");continue;}
        setRunnerAttribute(this.rain[i],"opacity","1");
        const x = (i * 67 + weatherClock * 90) % 400 - 20, y = (i * 109 + weatherClock * (240 + i % 3 * 50)) % (this.height + 35) - 35;
        setRunnerAttribute(this.rain[i], "d", `M${round(x)} ${round(y)}l-4 ${7 + i % 3 * 3}`);
      }
      for (let i = 0; i < this.splashes.length; i++) {
        const p = this.project(-110 + i * 73 % 220, 8 + i * 13 % 88), size = 2 + Math.floor(weatherClock * 7 + i) % 3;
        setRunnerAttribute(this.splashes[i], "d", `M${p.x-size} ${p.y}h${size*2}v1h-${size*2}Zm-2-3h1v2h-1Zm${size*2+3} 0h1v2h-1Z`);
      }
    }
    for (let i = 0; i < this.wind.length; i++) {
      if(i>=this.wind.length*profile.particles){setRunnerAttribute(this.wind[i],"opacity","0");continue;}
      const progress = (clock * (1 + engine.speed / 45) + i / this.wind.length) % 1;
      const side = i % 2 ? 1 : -1;
      const x = 180 + side * (90 + progress * 100), y = this.horizon + progress * this.height * .75;
      setRunnerAttribute(this.wind[i], "d", `M${round(x)} ${round(y)}h3v${round(8 + progress * 22)}h-3Z`);
      setRunnerAttribute(this.wind[i], "opacity", this.reducedMotion || stopped || engine.phase !== "running" ? "0" : `${(engine.flying ? .23 : engine.speedEffect === "boost" ? .18 : .06) + Math.max(0, engine.speed - 28) * .004}`);
      setRunnerAttribute(this.wind[i], "fill", engine.flying ? "#f8d4b7" : engine.speedEffect === "boost" ? "#a8e5d8" : "#e9d5b2");
    }
  }

  private drawDog(engine: RunnerEngine) {
    const phase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const intro = phase === "intro" || phase === "ready";
    const t = engine.introTime / RUNNER_INTRO_DURATION;
    const ground = this.project(engine.lanePosition * RUNNER_LANE_WIDTH, RUNNER_PLAYER_Z);
    const visualHeight = engine.flying ? Math.min(engine.jumpHeight, Math.max(100, (ground.y - 120) / ground.scale - 130)) : engine.jumpHeight;
    const x = ground.x;
    const y = ground.y;
    const scale = ground.scale * .92;
    setRunnerAttribute(this.parts.player, "transform", `translate(${round(x)} ${round(y)}) scale(${scale})`);
    const turn = intro && phase === "intro" && t < .4;
    setRunnerAttribute(this.parts.head, "opacity", turn ? "0" : "1");
    setRunnerAttribute(this.parts.turn, "opacity", turn ? "1" : "0");
    const running = phase === "running";
    const stride = running ? Math.sin(engine.elapsed * (engine.flying ? 6 : 13 + engine.speed * .1)) * (engine.flying ? .18 : 1) : intro && phase === "intro" ? Math.sin(t * 15) * .25 : 0;
    const roll = engine.rolling ? engine.rollAge / .63 : 0;
    const bob = intro || !running || engine.jumpAge >= 0 || engine.rolling ? 0 : Math.abs(stride) * 2;
    const crouch = 0;
    const lean = Math.max(-12, Math.min(12, -engine.laneVelocity * .55));
    const squash = this.reducedMotion ? 0 : engine.landingImpact * .1;
    const hop = engine.laneHop, airborne = !intro && !engine.grounded && !engine.rolling;
    setRunnerAttribute(this.parts.pose, "transform", `translate(0 ${round(-visualHeight - hop - bob + crouch)}) rotate(${round(lean - 0)} 0 -44) scale(${1 + squash} ${1 - squash})`);
    setRunnerAttribute(this.parts.pose, "opacity", engine.rolling ? "0" : "1");
    setRunnerAttribute(this.parts.roll, "opacity", engine.rolling ? "1" : "0");
    setRunnerAttribute(this.parts.roll, "transform", `translate(0 ${round(-engine.jumpHeight)}) rotate(${Math.round(roll * 360)} 0 -24)`);
    setRunnerAttribute(this.parts.shadow, "opacity", `${Math.max(.12, .55 - engine.jumpHeight * .002)}`);
    setRunnerAttribute(this.parts.shadow, "transform", `translate(0 ${-engine.platformHeight})`);
    const protectedNow = engine.shieldUntil > engine.elapsed;
    setRunnerAttribute(this.parts.shield, "opacity", protectedNow ? `${.6 + Math.sin(engine.elapsed * 22) * .2}` : engine.options.immortal ? ".45" : engine.shieldCount > 0 ? ".22" : "0");
    const shieldVisible = protectedNow || engine.options.immortal || engine.shieldCharges > 0;
    setRunnerAttribute(this.parts.shield, "display", shieldVisible ? "inline" : "none");
    if (shieldVisible) setRunnerAttribute(this.parts.shield, "transform", `translate(0 ${round(-engine.jumpHeight)})`);
    setRunnerAttribute(this.parts.magnet, "opacity", engine.options.collar || engine.magnetic ? ".6" : "0");
    const magnetVisible = engine.options.collar || engine.magnetic;
    setRunnerAttribute(this.parts.magnet, "display", magnetVisible ? "inline" : "none");
    if (magnetVisible) setRunnerAttribute(this.parts.magnet, "transform", `scale(${1 + Math.sin(engine.elapsed * 4) * .12} 1)`);
    setRunnerAttribute(this.parts.firework, "opacity", engine.flying ? "1" : "0");
    setRunnerAttribute(this.parts.firework, "display", engine.flying ? "inline" : "none");
    if (engine.flying) setRunnerAttribute(this.parts.flames, "transform", `translate(0 -43) scale(1 ${.72 + (Math.floor(engine.elapsed * 18) % 3) * .18}) translate(0 43)`);
    setRunnerAttribute(this.parts.collar, "opacity", engine.options.collar && !engine.rolling ? "1" : "0");
    setRunnerAttribute(this.parts["leg-left"], "transform", airborne || hop > 3 ? `translate(0 12) rotate(-24 -12 -30)` : `translate(0 ${round(stride * 10)}) rotate(${round(stride * 9)} -12 -30)`);
    setRunnerAttribute(this.parts["leg-right"], "transform", airborne || hop > 3 ? `translate(0 12) rotate(24 12 -30)` : `translate(0 ${round(-stride * 10)}) rotate(${round(-stride * 9)} 12 -30)`);
    setRunnerAttribute(this.parts["arm-left"], "transform", airborne ? "rotate(48 -22 -64)" : `translate(0 ${round(-stride * 7)}) rotate(${round(-stride * 4 - hop * .25)} -22 -64) scale(1 ${1 + stride * .045})`);
    setRunnerAttribute(this.parts["arm-right"], "transform", airborne ? "rotate(-48 22 -64)" : `translate(0 ${round(stride * 7)}) rotate(${round(stride * 4 + hop * .25)} 22 -64) scale(1 ${1 - stride * .045})`);
    if (!turn) setRunnerAttribute(this.parts.head, "transform", `rotate(${airborne ? -3 : round(stride * 2)} 0 -75)`);
    setRunnerAttribute(this.parts.tail, "transform", `rotate(${round(stride * 6)} 0 -42)`);
    const departure = ease(t);
    for (const name of ["start", "start-back"]) {
      setRunnerAttribute(this.parts[name], "transform", `translate(${round(ground.x)} ${round(ground.y)}) scale(${ground.scale})`);
      setRunnerAttribute(this.parts[name], "opacity", intro ? `${1 - departure}` : "0");
      setRunnerAttribute(this.parts[name], "display", intro ? "inline" : "none");
    }
  }

  private drawChaser(engine: RunnerEngine) {
    const phase = engine.phase === "paused" ? engine.previousPhase : engine.phase;
    const intro = phase === "intro";
    const chase = engine.phase === "caught" || engine.phase === "finished" ? ease(engine.caughtTime / .75) : 0;
    const transition = ease(engine.introTime / RUNNER_INTRO_DURATION);
    const arrival = transition;
    const trail = engine.chaserPose;
    const flightView = engine.flying ? ease(engine.flightAge / .65) * (1 - ease((engine.flightAge - 5.6) / 1.4)) : 0;
    const x = intro ? 180 : 180 + trail.lane * (92 - flightView * 27);
    const delayedGround = runnerRouteElevation(trail.distance + RUNNER_PLAYER_Z,engine.seed) - this.cameraElevation;
    const y = intro ? this.height * (1.2 - transition * .135) : this.height * (1.065 - flightView * .185 - chase * .18) - (trail.height + delayedGround) * (1.25 - flightView * .41) * (1 - chase);
    const bob = Math.abs(Math.sin((intro ? engine.introTime : engine.elapsed - RUNNER_CHASER_DELAY) * 15)) * 4;
    const lateralHop = Math.sin(Math.PI * Math.abs(trail.lane - Math.round(trail.lane)) * 2) * 12;
    const sideLean = Math.sin(trail.lane * Math.PI * 2) * 7;
    setRunnerAttribute(this.parts.chaser, "transform", `translate(${round(x)} ${round(y - bob - (intro ? 0 : lateralHop))}) scale(${intro ? 1.25 : 1.25 - flightView * .41}) rotate(${round(intro ? 0 : sideLean)} 0 -45)`);
    setRunnerAttribute(this.parts.chaser, "opacity", phase === "ready" ? "0" : intro ? `${arrival}` : "1");
    const art = this.chaserArt;
    const frame = Math.floor((intro ? engine.introTime : engine.elapsed - RUNNER_CHASER_DELAY) * 8 + engine.caughtTime * 8 + 8) % 2;
    const rolling = !intro && trail.rollAge >= 0 && chase === 0;
    setRunnerAttribute(art, "href", rolling ? `#${this.prefix}-sahur-roll` : intro && transition < .28 ? `#${this.prefix}-sahur-${2 + frame}` : trail.height > 15 || lateralHop > 5 ? `#${this.prefix}-sahur-back-jump` : `#${this.prefix}-sahur-back-${frame}`);
    setRunnerAttribute(art, "transform", rolling ? `rotate(${round(trail.rollAge / .63 * 360)} 0 -24)` : "");
  }

  private drawParticles(engine: RunnerEngine) {
    for (let i = 0; i < this.particles.length; i++) {
      const node = this.particles[i], particle = engine.particles[i];
      if (!particle || this.reducedMotion || i>=this.particles.length*getVisualProfile().particles) { setRunnerAttribute(node, "visibility", "hidden"); continue; }
      const t = particle.age / particle.life;
      const rect = node.firstElementChild!, coin = node.lastElementChild!;
      let point = this.project(particle.x, particle.z - engine.distance, particle.y);
      if (particle.kind === "pickup") {
        const origin = this.project(particle.x, RUNNER_PLAYER_Z, particle.y + 45);
        const progress = ease(t);
        point = { x: origin.x + (32 - origin.x) * progress + Math.sin(Math.PI * t) * 32, y: origin.y + (47 - origin.y) * progress, scale: .65 - t * .4 };
      }
      setRunnerAttribute(node, "visibility", "visible");
      setRunnerAttribute(node, "transform", `translate(${round(point.x)} ${round(point.y)}) scale(${particle.kind === "pickup" ? point.scale : 1 + (1 - t) * .6})`);
      setRunnerAttribute(node, "opacity", `${Math.min(1, (1 - t) * 3)}`);
      setRunnerAttribute(rect, "fill", particle.color);
      setRunnerAttribute(rect, "display", particle.kind === "pickup" ? "none" : "block");
      setRunnerAttribute(coin, "display", particle.kind === "pickup" ? "block" : "none");
    }
  }
}
