import { DungeonAimArtwork } from "./dungeon-aim-art";
import { forwardRef, memo, useId } from "react";
import { BASEMENT_SOLIDS, type AdventureArea, type AdventureEngine, type Rect } from "./adventure-engine";

import { DirectionalSahur as OverheadSahur } from "./adventure-direction-art";
import { ADVENTURE_DEPTH, adventureFacing, projectAdventureY, type AdventureFacing } from "./adventure-projection";

import type { ThemeId } from "./cosmetic-engine";
import { ApartmentScene } from "./apartment-artwork";
import type { NeighborhoodProgress } from "./neighborhood-progress";
import { neighborhoodActorMatrix } from "./neighborhood-map";
import { adventureLevel } from "./adventure-levels";
import { LevelChambers } from "./adventure-level-art";
import { DungeonChestPickups, DungeonExitPointer } from "./dungeon-pickup-art";
import { APARTMENT_DESTINATIONS, type ApartmentDestination } from "./apartment-interactions";
import { ApartmentDestinationButton } from "./apartment-destination-button";
import { StandardSahurSprite } from "./sahur-sprite";
import { sahurAnimationFrame, stableSahurFacing } from "./sahur-animation";
import { AdventureChestArt } from "./adventure-chest-art";
import { adventureChestPositions } from "./adventure-loot";
import { AnimatedAdventureKnopik } from "./knopik-adventure-art";
import { KnopikAnimator } from "./knopik-adventure-animation";
import { DungeonInteractiveProps, DungeonEffectsArtwork, DungeonEnemyEquipment } from "./dungeon-combat-art";
import { DungeonRenderer } from "./dungeon-renderer";
import { DungeonEnergyArtwork } from "./dungeon-energy-art";

const INK = "#343041";
export function AdventureHeart({ filled = true }: { filled?: boolean }) {
  return <svg className="adventure-heart" viewBox="0 0 16 15" aria-hidden="true" shapeRendering="crispEdges"><path d="M2 1h4v2h4V1h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2V9H0V3h2Z" fill={INK}/><path d="M2 3h4v2h4V3h4v6h-2v2h-2v2H6v-2H4V9H2Z" fill={filled ? "#d97b70" : "#746875"}/>{filled && <path d="M3 4h3v2H3Z" fill="#fff1d1"/>}</svg>;
}

function Block({ r, sewer = false }: { r: Rect; sewer?: boolean }) {
  return <g><rect x={r.x + 4} y={r.y + 6} width={r.w} height={r.h} fill="#20232e55"/><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={sewer ? "#343d48" : "#775442"}/><rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 8} fill={sewer ? "#698077" : "#ae8060"}/><path d={`M${r.x + 8} ${r.y + 8}h${r.w - 16}v5h-${r.w - 16}Z`} fill={sewer ? "#98ab91" : "#d1aa7a"}/><rect x={r.x + 3} y={r.y + r.h - 15} width={r.w - 6} height="12" fill={sewer ? "#586566" : "#775442"}/><path d={`M${r.x + 6} ${r.y + r.h - 15}h${r.w - 12}v3h-${r.w - 12}Z`} fill={sewer ? "#98ab91" : "#d1aa7a"}/></g>;
}
function Basement({ prefix }: { prefix: string }) {
  return <g><rect width="480" height="560" fill="#272936"/><rect x="26" y="60" width="428" height="406" fill={`url(#${prefix}-brick)`}/><rect x="36" y="102" width="408" height="352" fill={`url(#${prefix}-stone)`}/>
    <path d="M192 60h94v14h16v42h-16v16h-94v-13h-17V79h17Z" fill="#182c31"/><path d="M199 67h74v8h12v34h-12v10h-74v-10h-12V80h12Z" fill="#537d75"/><path d="M208 89h49v6h-49Zm12 13h54v5h-54Z" fill="#88a980"/>
    <path d="M163 130h18v11h-18Zm31 8h23v9h-23Zm99-11h19v13h-19Zm-22 26h12v10h-12Z" fill="#ae8060"/>
    {BASEMENT_SOLIDS.map((r, i) => <Block key={i} r={r}/>)}
    <path d="M46 129h95v9H46Zm0 0h12v47H46Zm83 0h12v47h-12Z" fill="#775442"/><path d="M66 135h21v31H66Zm32 0h14v23H98Z" fill="#ae8060"/>
    <path d="M380 109h45v10h-45v103h-10V109h10Z" fill="#698077"/><path d="M372 146h11v5h-11Zm0 44h11v5h-11Z" fill="#98ab91"/>
    <path d="M182 444h115v8H182Zm9-12h97v8h-97Zm9-12h79v8h-79Z" fill="#ae8060"/>
    <text x="240" y="170" textAnchor="middle" className="adventure-map-label adventure-map-light">ПРОЛОМ</text>
    <text x="240" y="480" textAnchor="middle" className="adventure-map-label adventure-map-light">ДОМОЙ ↑</text>
    <path d="M77 331h66v9H77Zm13 17h54v5H90Zm202-117h43v8h-43Z" fill="#34304133"/>
  </g>;
}
export const AdventureScene = memo(forwardRef<SVGSVGElement, { keepsakes?: NeighborhoodProgress; area: AdventureArea; theme?: ThemeId; level?: number; engine?: AdventureEngine; onDestination?: (destination: ApartmentDestination) => void; destinationsDisabled?: boolean }>(function AdventureScene({ keepsakes, area, theme = "classic", level = 1, engine, onDestination, destinationsDisabled = false }, ref) {
  const prefix = `adventure-${useId().replaceAll(":", "")}`;
  return <svg ref={ref} className="adventure-scene" viewBox="0 0 480 600" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" role={area === "apartment" && onDestination ? "group" : "img"} aria-label={area === "apartment" ? "Квартира Кнопика с мини-баром, диваном и дверью подвала, вид сверху" : area === "basement" ? "Подвал с проломом в канализацию, вид сверху" : `Уровень ${level}: ${adventureLevel(level).rooms.length} залов канализации с Сахурами, вид с перспективой`}>
    <defs>
      {theme === "night" && area === "apartment" && <filter id={`${prefix}-home-actor-light`} colorInterpolationFilters="sRGB"><feColorMatrix data-home-actor-light="" type="matrix" values={neighborhoodActorMatrix(.3)}/></filter>}
      <pattern id={`${prefix}-wood`} width="96" height="32" patternUnits="userSpaceOnUse"><rect width="96" height="32" fill="#c7a37f"/><path d="M0 0h96v2H0Zm0 16h96v2H0Zm32 0h2v16h-2Zm40 16h2v16h-2Z" fill="#ae8060"/><path d="M4 5h18v2H4Zm44 17h28v2H48Z" fill="#d1aa7a"/></pattern>
      <pattern id={`${prefix}-wall`} width="24" height="40" patternUnits="userSpaceOnUse"><rect width="24" height="40" fill="#ece3ca"/><path d="M5 0h2v40H5Zm12 0h2v40h-2Z" fill="#d8c6a4"/></pattern>
      <pattern id={`${prefix}-brick`} width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="#343d48"/><path d="M2 2h58v11H2Zm-28 16h58v11h-58Zm64 0h58v11H38Z" fill="#586566"/><path d="M2 2h58v2H2Zm36 14h26v2H38Z" fill="#698077"/></pattern>
      <pattern id={`${prefix}-stone`} width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#809084"/><path d="M0 0h48v2H0Zm0 24h48v2H0Zm0 0h2v24H0Zm24 24h2v24h-2Z" fill="#698077"/><path d="M5 6h9v2H5Zm27 25h11v2H32Z" fill="#98ab91"/><path d="M16 10h2v5h-2Zm19 25h2v4h-2Z" fill="#746875"/></pattern>
      <pattern id={`${prefix}-water`} width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#263d45"/><path d="M3 3h14v3H3Zm9 16h18v3H12Zm-4 10h17v2H-4Z" fill="#537d75"/></pattern>
    </defs>
    <g data-environment="" transform={`scale(1 ${ADVENTURE_DEPTH})`}>{area === "apartment" ? <ApartmentScene prefix={prefix} theme={theme} keepsakes={keepsakes}/> : area === "basement" ? <Basement prefix={prefix}/> : <LevelChambers prefix={prefix} id={level}/>}</g>
    <g data-coins="">{Array.from({ length: 40 }, (_, i) => <g data-coin={i} key={i} display="none"><path d="M-8 2H8v4H-8Z" fill="#20232e44"/><g data-coin-pose=""><path d="M-5-8H5v2h3V6H5v2H-5V6h-3V-6h3Z" fill="#775442"/><path d="M-4-6H4v2h2v8H4v2H-4V4h-2V-4h2Z" fill="#f4d889"/><path d="M-4-6H4v2H-4Zm-2 2h2v6h-2Z" fill="#fff1d1"/><path d="M-2-3h2v3h2v-3h2v3H2v2h2v2H2V2H0v2h-2Z" fill="#ae8060"/></g></g>)}</g>
    <g>{Array.from({length:64},(_,i)=><ellipse key={i} data-grenade-warning={i} display="none" rx="78" ry="64" fill="#d97b7026" stroke="#e6a071" strokeWidth="2" strokeDasharray="9 5"/>)}</g>
    <g data-bullets="">{Array.from({ length: 64 }, (_, i) => <g data-bullet={i} key={i} display="none"><g data-bullet-round=""><path d="M-14-1H5v2h-19Z" fill="#f4d889" opacity=".6"/><rect x="-4" y="-2" width="9" height="4" fill="#fff1d1"/></g><g data-bullet-grenade="" display="none"><path d="M-5-7H5v3h3v8H5v3H-5V4h-3v-8h3Z" fill="#343b44"/><path d="M-4-5H4v3h2v5H4v2H-4V3h-2v-5h2Z" fill="#a1b68a"/><path d="M-2-9h4v4h-4Z" fill="#f4d889"/></g></g>)}</g>
    <g data-actors="">{area==="sewer"&&<DungeonInteractiveProps level={adventureLevel(level)}/>} {area === "sewer" && adventureChestPositions(adventureLevel(level)).map(c => <AdventureChestArt key={`chest-${c.room}`} room={c.room} x={c.x} y={projectAdventureY(c.y)}/>)}{Array.from({ length: area === "sewer" ? adventureLevel(level).enemies.length : 7 }, (_, i) => <g data-enemy={i} key={i} display={engine?.enemies[i] ? undefined : "none"} transform={engine?.enemies[i] ? `translate(${engine.enemies[i].x} ${projectAdventureY(engine.enemies[i].y)})` : undefined}>
      <g data-warning="" display="none"><path data-bat-warning="" d="M0 0 64-37A74 74 0 0 1 64 37Z" fill="#d97b7077" stroke="#b76253" strokeWidth="2"/><path data-charge-warning="" display="none" d="M0-16h175v-16l42 32-42 32V16H0Z" fill="#dfad643d" stroke="#dfad64" strokeWidth="2"/>{adventureLevel(level).zone===4?<path data-boss-warning="" display="none" d="M166 0A166 166 0 1 0-166 0A166 166 0 1 0 166 0ZM58 0A58 58 0 1 1-58 0A58 58 0 1 1 58 0Z" fillRule="evenodd" fill="#d97b7044" stroke="#d97b70" strokeWidth="3"/>:<circle data-boss-warning="" display="none" r="104" fill="#d97b7044" stroke="#d97b70" strokeWidth="3"/>}<g data-gun-warning=""><path d="M0-2h270v4H0Z" fill="#d97b7077"/><path d="M255-8v16m-8-8h16" fill="none" stroke="#fff1d1" strokeWidth="2"/></g></g>
      <g data-enemy-body="">{area === "sewer" && adventureLevel(level).enemies[i]?.kind === "gun" ? <g data-gun=""><StandardSahurSprite gun/></g> : <g data-bat="">{area === "sewer" && adventureLevel(level).enemies[i]?.boss ? <OverheadSahur/> : <StandardSahurSprite/>}</g>}<DungeonEnemyEquipment role={adventureLevel(level).enemies[i]?.role} boss={adventureLevel(level).enemies[i]?.boss} zone={adventureLevel(level).zone}/></g>
      <g data-enemy-health="" transform="translate(-14 -91)">{[0, 1, 2].map(n => <rect key={n} data-hp={n} x={n * 10} width="8" height="4" fill="#b76253"/>)}</g>
      <g data-extra-health="" display="none"><path d="M-24-2h48v8h-48Z" fill="#343041"/><rect x="-22" width="44" height="4" fill="#746875"/><rect data-health-width="" x="-22" width="44" height="4" fill="#d97b70"/></g><g data-boss-crown="" display="none" transform="translate(-12 -109)"><path d="M0 0h5v5h5V0h5v5h5V0h5v15H0Z" fill="#775442"/><path d="M2 2h2v6h8V2h2v6h8V2h1v10H2Z" fill="#f4d889"/></g>
    </g>)}
    <g data-player="" transform={`translate(${engine?.player.x ?? 123} ${projectAdventureY(engine?.player.y ?? 421)})`}><g data-life-shield="" display="none"><path d="M-18-79H18v5h10v16h5v47h-5V1H18v5H-18V1h-10v-12h-5v-47h5v-16h10Z" fill="#88b6b011" stroke="#88b6b0" strokeWidth="2"/></g><g data-sabre-range="" display="none"><path d="M0 0 15-95A96 96 0 0 1 15 95Z" fill="#f4d88933" stroke="#fff1d1" strokeWidth="2"/></g><g data-player-body="" filter={theme === "night" && area === "apartment" ? `url(#${prefix}-home-actor-light)` : undefined}><AnimatedAdventureKnopik/></g><g data-punch="" display="none"><path d="M-8-2h4v-6h4v6h8v4H0v6h-4V2h-4Z" fill="#fff1d1"/></g></g></g>
    <DungeonAimArtwork/><DungeonEnergyArtwork/><DungeonEffectsArtwork/>
    {area==="sewer"&&<><DungeonChestPickups count={adventureLevel(level).rooms.length}/><DungeonExitPointer/></>}
    {area==="sewer"&&<g data-dungeon-goal="" display="none"><ellipse rx="32" ry="20" fill="none" stroke="#f4d889" strokeWidth="3" strokeDasharray="12 6"/><path d="M-5-108H5v8h7L0-82-12-100h7Z" fill="#f4d889"/></g>}
    {area === "apartment" && onDestination && <g transform={`scale(1 ${ADVENTURE_DEPTH})`}>{APARTMENT_DESTINATIONS.map(({id,label,x,y,w,h})=><foreignObject key={id} x={x} y={y} width={w} height={h}><ApartmentDestinationButton destination={id} label={label} disabled={destinationsDisabled} onChoose={onDestination}/></foreignObject>)}</g>}
  </svg>;
}));

export class AdventureRenderer {
  private player: SVGGElement | null;
  private playerBody: SVGGElement | null;
  private enemies: SVGGElement[];
  private bulletNodes: SVGGElement[];
  private coinNodes: SVGGElement[];
  private cameraY = 0;
  private cameraX = 0;
  private viewportRatio = 1.25;
  private worldHeight = 600;
  private depthOrder = "";
  private sahurPoses = new WeakMap<Element, { facing: AdventureFacing; viewBox: string }>();
  private chestNodes: Element[];
  private knopik: KnopikAnimator;
  private dungeon: DungeonRenderer;
  private propNodes: Element[];
  private nodes = new WeakMap<Element, Map<string, Element[]>>();
  private all(root: Element | null, selector: string): Element[] {
    if (!root) return [];
    let index=this.nodes.get(root); if (!index) { index=new Map(); this.nodes.set(root,index); }
    let nodes=index.get(selector); if (!nodes) { nodes=Array.from(root.querySelectorAll(selector)); index.set(selector,nodes); }
    return nodes;
  }
  private one(root: Element | null, selector: string) { return this.all(root,selector)[0] ?? null; }
  constructor(private svg: SVGSVGElement, private reducedMotion: boolean) {
    this.player = svg.querySelector("[data-player]"); this.playerBody = svg.querySelector("[data-player-body]");
    this.knopik = new KnopikAnimator(this.playerBody);
    this.dungeon = new DungeonRenderer(svg,reducedMotion);this.propNodes=Array.from(svg.querySelectorAll("[data-dungeon-prop-y]"));
    this.enemies = Array.from(svg.querySelectorAll<SVGGElement>("[data-enemy]")).sort((a,b)=>Number(a.getAttribute("data-enemy"))-Number(b.getAttribute("data-enemy"))); this.bulletNodes = Array.from(svg.querySelectorAll("[data-bullet]"));
    this.coinNodes = Array.from(svg.querySelectorAll("[data-coin]"));
    this.chestNodes = Array.from(svg.querySelectorAll("[data-chest]")).sort((a,b)=>Number(a.getAttribute("data-chest"))-Number(b.getAttribute("data-chest")));
  }
  resize(width: number, height: number) { if (width > 0 && height > 0) this.viewportRatio = height / width; }
  private face(body: Element | null, facing: AdventureFacing) {
    if (!body) return;
    for (const direction of this.all(body,"[data-direction]")) {
      const pose = direction.getAttribute("data-direction"), active = pose === facing || (pose === "side" && (facing === "left" || facing === "right")) || (pose === "front-diagonal" && facing.startsWith("front-")) || (pose === "back-diagonal" && facing.startsWith("back-"));
      direction.setAttribute("display", active ? "inline" : "none");
      if (pose === "side" || pose?.endsWith("diagonal")) direction.setAttribute("transform", facing === "left" || facing.endsWith("-left") ? "scale(-1 1)" : "scale(1 1)");
    }
  }
  private stepFeet(feet: Element, stride: number) {
    const legs = this.all(feet,"[data-step-leg]");
    feet.setAttribute("transform", legs.length ? "translate(0 0)" : `translate(0 ${stride})`);
    for (const leg of legs) leg.setAttribute("transform", `translate(0 ${stride * 2 * Number(leg.getAttribute("data-step-leg"))})`);
  }
  paint(engine: AdventureEngine, snap = false) {
    const width = engine.area === "apartment" ? 400 : 480;
    this.worldHeight = Math.max(250, Math.min(800, this.viewportRatio * width));
    const height = projectAdventureY(engine.area === "sewer" ? engine.levelData.height : engine.area === "basement" ? 560 : 600);
    const target = Math.max(0, Math.min(height - this.worldHeight, projectAdventureY(engine.player.y) - this.worldHeight * (engine.area === "apartment" ? .5 : .6)));
    const bounds = engine.area === "sewer" ? engine.levelData.bounds : { x: 0, w: 480 };
    const targetX = Math.max(bounds.x,Math.min(bounds.x+bounds.w-width,engine.player.x-width*.5));
    this.cameraY = snap || this.reducedMotion ? target : this.cameraY + (target - this.cameraY) * .16;
    this.cameraX = snap || this.reducedMotion ? targetX : this.cameraX+(targetX-this.cameraX)*.12;
    const blast=engine.effects.pool.find(e=>e.active&&e.kind==="blast"&&e.radius>60&&e.age<.24),shake=!this.reducedMotion&&engine.phase==="playing"&&blast?(1-blast.age/.24)*Math.min(6,blast.radius/25):0;
    this.svg.setAttribute("viewBox", `${(this.cameraX+Math.sin(engine.time*77)*shake).toFixed(2)} ${(this.cameraY+Math.cos(engine.time*91)*shake).toFixed(2)} ${width} ${this.worldHeight.toFixed(2)}`);
    this.player?.setAttribute("transform", `translate(${engine.player.x.toFixed(2)} ${projectAdventureY(engine.player.y).toFixed(2)})`);
    this.playerBody?.setAttribute("transform", "translate(0 0)");
    this.knopik.paint(engine, this.reducedMotion);
    this.svg.querySelector("[data-home-actor-light]")?.setAttribute("values", neighborhoodActorMatrix(Math.max(0, 1 - Math.hypot(engine.player.x - 228, engine.player.y - 250) / 135)));
    this.player?.setAttribute("opacity", engine.invincible > 0 ? this.reducedMotion ? ".7" : Math.floor(engine.time * 10) % 2 ? ".55" : "1" : "1");
    this.one(this.svg,"[data-life-shield]")?.setAttribute("display", engine.shieldReady || engine.reviveTime>0 ? "inline" : "none");
    const fist = engine.area !== "sewer" || engine.weapon === "fist";
    this.one(this.svg,"[data-punch]")?.setAttribute("display", fist && engine.punchTime > .17 ? "inline" : "none");
    this.one(this.svg,"[data-punch]")?.setAttribute("transform", `translate(${this.knopik.impact.x} ${this.knopik.impact.y})`);
    this.one(this.svg,"[data-sabre-range]")?.setAttribute("display",engine.area === "sewer" && engine.weapon === "sabre" && engine.punchTime > 0 ? "inline" : "none");
    this.one(this.svg,"[data-sabre-range]")?.setAttribute("transform",`scale(1 ${ADVENTURE_DEPTH}) rotate(${engine.player.angle*180/Math.PI})`);
    for (let i = 0; i < this.enemies.length; i++) {
      const node = this.enemies[i], e = engine.enemies[i];
      node.setAttribute("display", e&&e.awake!==false ? "inline" : "none"); if (!e||e.awake===false) continue;
      node.setAttribute("transform", `translate(${e.x.toFixed(2)} ${projectAdventureY(e.y).toFixed(2)})`);
      node.setAttribute("opacity", e.hp <= 0 ? ".35" : e.flash > 0 ? ".65" : "1");
      const enemyBody = this.one(node,"[data-enemy-body]"); enemyBody?.setAttribute("transform", e.hp <= 0 ? "translate(0 -4) rotate(90) scale(.65)" : e.boss ? "scale(1.35)" : "translate(0 0)");
      const sprite = this.one(node,"[data-sahur-frame]");
      if (sprite && !e.boss) {
        const old=this.sahurPoses.get(sprite),facing=e.mode === "windup" || e.attackRecovery ? adventureFacing(e.attackAngle) : stableSahurFacing(e.angle,old?.facing);
        const cellWidth=e.kind==="gun"?320:224,pose=sahurAnimationFrame(e,facing,this.reducedMotion),viewBox=`${pose.column*cellWidth} ${pose.row*192} ${cellWidth} 192`;
        if(viewBox!==old?.viewBox)sprite.setAttribute("viewBox",viewBox);
        if(old){old.facing=facing;old.viewBox=viewBox;}else this.sahurPoses.set(sprite,{facing,viewBox});
      } else this.face(enemyBody, adventureFacing(e.angle));
      this.one(node,"[data-bat]")?.setAttribute("display", e.kind === "bat" ? "inline" : "none"); this.one(node,"[data-gun]")?.setAttribute("display", e.kind === "gun" ? "inline" : "none");
      const warning = this.one(node,"[data-warning]"); warning?.setAttribute("display", e.mode === "windup" && e.hp > 0 ? "inline" : "none"); warning?.setAttribute("transform", `scale(1 ${ADVENTURE_DEPTH}) rotate(${e.attackAngle * 180 / Math.PI})`);
      this.one(node,"[data-bat-warning]")?.setAttribute("display", e.kind === "bat" && !e.boss&&e.role!=="charger" ? "inline" : "none");this.one(node,"[data-charge-warning]")?.setAttribute("display",e.role==="charger"?"inline":"none"); this.one(node,"[data-gun-warning]")?.setAttribute("display", e.kind === "gun" || e.boss && engine.levelData.zone>=2 ? "inline" : "none"); this.one(node,"[data-boss-warning]")?.setAttribute("display",e.boss?"inline":"none");this.one(node,"[data-boss-warning]")?.setAttribute("r",engine.levelData.zone===4?"166":"104");
      this.one(node,"[data-boss-crown]")?.setAttribute("display",e.boss && e.hp>0?"inline":"none");
      this.one(node,"[data-enemy-health]")?.setAttribute("display",e.maxHp<=3 && e.hp>0?"inline":"none");
      const extraHealth=this.one(node,"[data-extra-health]"); extraHealth?.setAttribute("display",e.maxHp>3 && e.hp>0?"inline":"none"); extraHealth?.setAttribute("transform",`translate(0 ${e.boss?-119:-89})`); this.one(node,"[data-health-width]")?.setAttribute("width",String(44*Math.max(0,e.hp)/e.maxHp));
      for (const hp of this.all(node,"[data-hp]")) hp.setAttribute("display", Number(hp.getAttribute("data-hp")) < e.hp ? "inline" : "none");
      for (const feet of this.all(node,"[data-feet]")) this.stepFeet(feet, !this.reducedMotion && e.mode === "chase" && e.hp > 0 ? Math.sin(engine.time * 14 + i) * 2 : 0);
      for (const weapon of this.all(node,"[data-weapon]")) weapon.setAttribute("transform", e.kind === "bat" && !this.reducedMotion && e.hp > 0 ? `rotate(${e.mode === "windup" ? -55 * (1 - Math.max(0, e.timer) / .6) : e.mode === "recover" && e.timer > .58 ? 45 : 0} ${weapon.getAttribute("data-grip-x") ?? 26} ${weapon.getAttribute("data-grip-y") ?? -37})` : "rotate(0)");
    }
    engine.bullets.forEach((b, i) => { const node = this.bulletNodes[i]; node?.setAttribute("display", b.active ? "inline" : "none"); if (b.active){const lift=b.kind==="grenade"?Math.sin(Math.max(0,Math.min(1,1-b.life/(b.maxLife??.9)))*Math.PI)*45:0;node?.setAttribute("transform", `translate(${b.x} ${projectAdventureY(b.y)-lift}) rotate(${Math.atan2(b.vy * ADVENTURE_DEPTH, b.vx) * 180 / Math.PI})`);this.one(node,"[data-bullet-round]")?.setAttribute("display",b.kind==="grenade"?"none":"inline");this.one(node,"[data-bullet-grenade]")?.setAttribute("display",b.kind==="grenade"?"inline":"none");} });
    engine.coins.forEach((coin, i) => { const node = this.coinNodes[i]; node?.setAttribute("display", coin.active ? "inline" : "none"); if (coin.active) { const bounce = this.reducedMotion ? 0 : Math.sin(Math.min(1, coin.age / .28) * Math.PI) * 12; node?.setAttribute("transform", `translate(${coin.x} ${projectAdventureY(coin.y) - bounce})`); this.one(node,"[data-coin-pose]")?.setAttribute("transform", `scale(${this.reducedMotion ? 1 : .55 + Math.abs(Math.cos(coin.age * 4)) * .45} 1)`); } });
    engine.chests.forEach((chest, i) => {
      const node = this.chestNodes[i], age = engine.time - chest.openedAt;
      this.one(node,"[data-chest-lock]")?.setAttribute("display",engine.cleared[chest.room] ? "none" : "inline");
      this.one(node,"[data-chest-ready]")?.setAttribute("display",engine.cleared[chest.room] && !chest.opened ? "inline" : "none");
      this.one(node,"[data-chest-interior]")?.setAttribute("display",chest.opened ? "inline" : "none");
      const rise = !chest.opened ? 0 : this.reducedMotion ? 18 : Math.round(18 * (1 - (1 - Math.min(1, age / .28)) ** 3));
      this.one(node,"[data-chest-lid]")?.setAttribute("transform",`translate(0 ${-rise})`);
      const glow = this.one(node,"[data-chest-glow]"); glow?.setAttribute("display",chest.opened && age < .85 ? "inline" : "none"); glow?.setAttribute("opacity",String(this.reducedMotion ? 1 : Math.max(0,1-age/.85)));
    });
    const sorted = [...this.enemies.map((node, i) => ({ node, y: engine.enemies[i]?.y ?? -1, id: String(i) })), ...this.chestNodes.map((node, i) => ({ node, y: engine.chests[i]?.y ?? -1, id: `chest-${i}` })),...this.propNodes.map((node,i)=>({node,y:Number(node.getAttribute("data-dungeon-prop-y")),id:`prop-${i}`})), { node: this.player, y: engine.player.y, id: "player" }].sort((a, b) => a.y - b.y);
    const order = sorted.map(item => item.id).join(","); if (order !== this.depthOrder) { this.depthOrder = order; const actors = this.one(this.svg,"[data-actors]"); for (const item of sorted) if (item.node) actors?.append(item.node); }
    for (const gate of this.all(this.svg,"[data-gate]")) gate.setAttribute("display", engine.gateOpen(Number(gate.getAttribute("data-gate"))) ? "none" : "inline");
    for (const jet of this.all(this.svg,"[data-jet]")) { const phase=engine.jetPhase(Number(jet.getAttribute("data-jet"))); jet.setAttribute("display",phase==="off"?"none":"inline"); this.one(jet,"[data-jet-steam]")?.setAttribute("display",phase==="active"?"inline":"none"); }
    engine.barrels.forEach((barrel,i)=> { this.one(this.svg,`[data-barrel="${i}"]`)?.setAttribute("display",barrel.active?"inline":"none"); const blast=this.one(this.svg,`[data-explosion="${i}"]`); blast?.setAttribute("display",barrel.explosion>0?"inline":"none"); blast?.setAttribute("opacity",String(barrel.explosion/.45)); });
    this.one(this.svg,"[data-door-opening]")?.setAttribute("display", engine.tutorialOpened ? "inline" : "none");
    this.dungeon.paint(engine,{x:this.cameraX+Math.sin(engine.time*77)*shake,y:this.cameraY+Math.cos(engine.time*91)*shake,w:width,h:this.worldHeight});
  }
}
