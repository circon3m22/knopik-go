import { LaboratorySourceArtwork } from "./laboratory-source-art";
import {StreetLightPass} from "./world-lighting-art";
import { LAB_SOURCES } from "./laboratory-engine";
import { NeighborhoodCrowd } from "./neighborhood-crowd";
import { NeighborhoodCrowdRenderer } from "./neighborhood-crowd-renderer";
import { NeighborhoodWorkTools, NeighborhoodWorkWorld, NeighborhoodWorkLadder } from "./neighborhood-work-art";
import { NeighborhoodWorkRenderer } from "./neighborhood-work-renderer";
import { neighborhoodWorkLift } from "./neighborhood-work";
import { memo, forwardRef } from "react";
import { AnimatedAdventureKnopik } from "./knopik-adventure-art";
import { KnopikAnimator } from "./knopik-adventure-animation";
import { projectAdventureY } from "./adventure-projection";
import { NEIGHBORHOOD_OBJECTS, NEIGHBORHOOD_LAMPS, neighborhoodLight, neighborhoodActorMatrix } from "./neighborhood-map";
import { StreetProp, NeighborhoodResident, NeighborhoodCat, streetPalette, type StreetPalette } from "./neighborhood-props";
import { NeighborhoodTerrainDetails } from "./neighborhood-details";
import { MissionTerrain, MissionMarkers, CarriedMissionItem } from "./neighborhood-mission-art";
import { missionMask } from "./neighborhood-missions";
import type { NeighborhoodMissionId } from "./neighborhood-missions";
import { neighborhoodLampOn } from "./neighborhood-map";
import type { NeighborhoodEngine } from "./neighborhood-engine";

function StreetGround({p,prefix}:{p:StreetPalette;prefix:string}){
  return <g>
    <defs>
      <pattern id={`${prefix}-grass`} width="96" height="72" patternUnits="userSpaceOnUse"><rect width="96" height="72" fill={p.grass}/><path d="M12 19h4v5h-4Zm-2 5h9v2h-9Zm39 14h3v6h-3Zm-3 5h9v2h-9Zm26-33h3v4h-3Zm0 46h4v5h-4Z" fill={p.leaf} opacity=".22"/><path d="M28 51h8v2h-8Zm52-22h6v2h-6Z" fill={p.leafLight} opacity=".5"/></pattern>
      <pattern id={`${prefix}-paving`} width="80" height="48" patternUnits="userSpaceOnUse"><rect width="80" height="48" fill={p.paving}/><path d="M0 0h80v2H0Zm0 24h80v2H0Zm0 0h2v24H0Zm40 24h2v24h-2Z" fill={p.seam}/><path d="M5 4h29v1H5Zm38 0h33v1H43Zm-34 24h22v1H9Z" fill={p.trim} opacity=".8"/><path d="M54 10h12v2H54Zm-40 26h8v2h-8Z" fill={p.wood} opacity=".13"/></pattern>
      <pattern id={`${prefix}-park-path`} width="48" height="40" patternUnits="userSpaceOnUse"><rect width="48" height="40" fill={p.paving}/><path d="M9 8h6v2H9Zm29 7h4v3h-4Zm-13 20h8v2h-8Zm-20 1h4v2H5Z" fill={p.seam}/><path d="M17 17h3v2h-3Z" fill={p.trim}/></pattern>
      <pattern id={`${prefix}-water`} width="140" height="80" patternUnits="userSpaceOnUse"><rect width="140" height="80" fill={p.water}/><path d="M13 16h42v3H13Zm16 7h22v2H29Zm59 23h46v3H88Zm-51 15h26v2H37Z" fill={p.waterLight} opacity=".45"/><path d="M92 14h23v2H92Zm-71 32h35v2H21Z" fill={p.leafDark} opacity=".27"/></pattern>
      <radialGradient id={`${prefix}-light`}><stop stopColor="#f6d994" stopOpacity=".36"/><stop offset=".42" stopColor="#f6d994" stopOpacity=".18"/><stop offset="1" stopColor="#f6d994" stopOpacity="0"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="2400" height="2050" fill={p.ground}/>
    <rect x="0" y="180" width="2400" height="1535" fill={`url(#${prefix}-grass)`}/>
    <rect x="0" y="0" width="2400" height="180" fill={p.night?"#202a43":"#88b6b0"}/>
    {Array.from({length:16},(_,i)=><g key={i} transform={`translate(${i*164-60} ${128+i%3*18})`}><path d="M0 0v-67h14v-13h97v13h20V0Z" fill={p.night?"#344258":"#729c92"}/><path d="M5-64h121v5H5Z" fill={p.night?"#536479":"#a9c7b8"}/>{[0,1,2].map(row=>[0,1,2,3].map(col=><path key={`${row}-${col}`} d={`M${14+col*28} ${-51+row*18}h12v9h-12Z`} fill={p.night&&(i+row+col)%3?"#a38f76":p.night?"#202a43":"#d8c6a4"}/>))}</g>)}
    <rect x="1170" y="240" width="990" height="565" fill={`url(#${prefix}-grass)`}/>
    <path d="M0 173h2400v12H0ZM15 185h10v1505H15Zm2360 0h10v1505h-10Z" fill={p.leafDark}/><path d="M0 174h2400v3H0Z" fill={p.leafLight}/>
    <path d="M1200 272h916v11h-916ZM1190 280h11v513h-11Zm938 0h11v512h-11Z" fill={p.leafDark}/><path d="M1212 282h22v5h-22Zm870 0h28v5h-28Z" fill={p.leafLight}/>
    <path d="M1350 800V628h90v-80h90V470h138v85h272v185h-100V645h-262v25h-110v130Z" fill={p.seam}/><path d="M1360 800V638h90v-80h90v-78h118v85h272v165h-80V635h-282v25h-110v140Z" fill={`url(#${prefix}-park-path)`}/>
    <path d="M1880 636h178v170h-89V698h-89Z" fill={`url(#${prefix}-park-path)`}/>
    <path d="M1390 466h-58v-78h83v42h104v49h-32v-17h-97Z" fill={`url(#${prefix}-park-path)`}/>
    <path d="M1620 700h51v29h50v24h-80v-24h-21Z" fill={p.seam} opacity=".5"/>
    <rect x="120" y="580" width="1000" height="240" fill={`url(#${prefix}-paving)`}/>
    <path d="M340 580h140v1080H340ZM2060 805h110v855h-110Z" fill={`url(#${prefix}-paving)`}/>
    <rect x="0" y="790" width="2400" height="240" fill={`url(#${prefix}-paving)`}/>
    <rect x="0" y="845" width="2400" height="135" fill={p.road}/>
    <path d="M0 840h2400v5H0Zm0 140h2400v6H0Z" fill={p.trim}/><path d="M0 845h2400v4H0Zm0 130h2400v5H0Z" fill={p.seam}/>
    {Array.from({length:24},(_,i)=><path key={i} d={`M${i*110+12} 910h48v3h-48Z`} fill={p.trim} opacity=".65"/>)}
    <g data-street-boundary=""><path d="M16 821h9v177h-9Zm2359 0h9v177h-9Z" fill={p.ink}/><path d="M14 852h14v118H14Zm2359 0h14v118h-14Z" fill={p.trim}/>{[0,1,2,3,4].map(i=><g key={i}><path d={`M14 ${859+i*24}h14v10H14Zm2361 0h14v10h-14Z`} fill={p.night?"#9d7f84":"#be8471"}/></g>)}</g>
    {[400,1395,2115].map(x=><g key={x}>{Array.from({length:6},(_,i)=><path key={i} d={`M${x-42} ${850+i*20}h84v10h-84Z`} fill={p.night?"#9aa6a6":"#ece3ca"}/>)}<path d={`M${x-45} 990h90v5h-90Z`} fill={p.trim}/></g>)}
    {[120,620,1150,1870,2290].map(x=><g key={x}><path d={`M${x} 830h30v8h-30Zm0 162h30v8h-30Z`} fill={p.ink} opacity=".55"/><path d={`M${x+4} 831h2v6h-2Zm6 0h2v6h-2Zm6 0h2v6h-2Z`} fill={p.metal}/></g>)}
    <path d="M520 1050h85v435h-85Zm535-15h85v505h-85Zm490-2h95v495h-95ZM320 1465h1880v77H320Z" fill={`url(#${prefix}-paving)`}/>
    <g data-community-garden="">{[1165,1245,1325].map((y,row)=><g key={y}><path d={`M1738 ${y-3}h279v48h-279Z`} fill={p.wood}/><path d={`M1743 ${y+2}h269v37h-269Z`} fill={p.night?"#514952":"#ae8060"}/><path d={`M1740 ${y-2}h275v3h-275Z`} fill={p.trim}/>{Array.from({length:12},(_,col)=><g key={col} transform={`translate(${1755+col*22} ${y+20})`}><path d="M-5-6h5v-5h3v5h5v6H3v6H0V0h-5Z" fill={p.leaf}/><path d="M-3-5h3v3h-3Zm5-4h2v4H2Z" fill={p.leafLight}/>{row===1&&<path d="M-2 2h5v5h-5Z" fill={p.night?"#b09c92":"#be8471"}/>}</g>)}</g>)}<path d="M2040 1140h35v30h-35Z" fill={p.wood}/><path d="M2044 1144h27v21h-27Z" fill={p.water}/><path d="M2045 1144h25v3h-25Z" fill={p.waterLight}/></g>
    <path d="M340 1540h1830v141H340Z" fill={`url(#${prefix}-paving)`}/>
    <path d="M0 1700h1870v15H0Zm2090 0h310v15h-310Z" fill={p.wood}/><path d="M0 1696h1870v5H0Zm2090 0h310v5h-310Z" fill={p.trim}/>
    <rect x="0" y="1715" width="2400" height="335" fill={`url(#${prefix}-water)`}/>
    <path className="neighborhood-current" d="M43 1770h118v3H43Zm186 105h84v3h-84Zm194-69h129v3H423Zm272 127h112v3H695Zm274-147h126v3H969Zm206 73h103v3h-103Zm266 113h97v3h-97Zm640-128h170v3h-170Z" fill={p.waterLight} opacity=".45"/>
    <path d="M0 2017h340v-12h430v8h408v-9h410v12h812v34H0Z" fill={p.leafDark}/><path d="M60 2022h126v4H60Zm525-7h210v4H585Zm746 2h230v4h-230Z" fill={p.leafLight}/>
    <path d="M1868 1662h224v157h-224Z" fill={p.ink}/><path d="M1874 1668h212v145h-212Z" fill={p.wood}/>{Array.from({length:14},(_,i)=><g key={i}><path d={`M1878 ${1671+i*10}h204v7h-204Z`} fill={p.night?"#92847e":"#d1aa7a"}/><path d={`M1920 ${1675+i*10}h46v1h-46Z`} fill={p.wood}/></g>)}
    <path d="M1860 1710h12v99h-12Zm224 0h12v99h-12Z" fill={p.wood}/><path d="M1857 1707h18v7h-18Zm224 0h18v7h-18Z" fill={p.trim}/>
    {Array.from({length:29},(_,i)=>{const x=i*84;return x>1830&&x<2100?null:<g key={i}><path d={`M${x} 1667h6v32h-6Z`} fill={p.wood}/><path d={`M${x-3} 1663h12v7h-12Z`} fill={p.trim}/><path d={`M${x} 1671h82v4h-82Z`} fill={p.metal}/></g>;})}
    {[90,225,740,825,1580,2150,2250].map((x,i)=><g key={x} transform={`translate(${x} 1730)`}><path d="M0 0v-26h4v24h10v-32h4V2h-4v-4H4v7H0Z" fill={p.leaf}/><path d="M-2-30h8v12h-8Zm14-6h8v13h-8Z" fill={p.wood}/><path d={`M26 ${i%2*8}h17v2H26Z`} fill={p.waterLight}/></g>)}
    <g transform="translate(1070 1880)"><path d="M-79-7H80v17H66v9H-52v-5h-17Z" fill={p.wood}/><path d="M-66-4H69v10H57v7H-47v-5h-16Z" fill={p.trim}/><path d="M-42-31h79v24h-79Z" fill={p.wood}/><path d="M-37-27h69v16h-69Z" fill={p.paving}/><path d="M-13-22H8v11h-21Z" fill={p.water}/><path d="M0-61h4v40H0Z" fill={p.metal}/><path d="M4-60h22v13H4Z" fill={p.night?"#a78484":"#be8471"}/></g>
    <NeighborhoodTerrainDetails p={p}/><StreetLightPass prefix={prefix} night={p.night}/><MissionTerrain p={p}/>
    {p.night&&<g data-ground-lights="">{NEIGHBORHOOD_LAMPS.map(l=><ellipse data-lamp-glow={l.id} key={l.id} cx={l.x} cy={l.y-18} rx="152" ry="98" fill={`url(#${prefix}-light)`}/>)}<path d="M385 570h50l42 92H344Z" fill="#f0d39a" opacity=".14"/><ellipse cx="410" cy="601" rx="94" ry="61" fill={`url(#${prefix}-light)`}/></g>}
    {p.night&&<g fill="#d9bd89" opacity=".3"><path d="M1884 1823h16v3h-16Zm-4 8h27v2h-27Zm181-8h15v3h-15Zm-7 8h27v2h-27Z"/></g>}
  </g>;
}
export const NeighborhoodScene=memo(forwardRef<SVGSVGElement,{night:boolean;prefix:string}>(function NeighborhoodScene({night,prefix},ref){
  const p=streetPalette(night);
  return <svg ref={ref} className="neighborhood-scene" viewBox="170 270 480 520" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" role="img" aria-label="Район Кнопика: жилые дома, Липовый парк и набережная">
    <defs><filter id={`${prefix}-actor-light`} x="-40%" y="-20%" width="180%" height="150%" colorInterpolationFilters="sRGB"><feColorMatrix data-actor-light="" type="matrix" values={neighborhoodActorMatrix(.1)}/></filter><filter id={`${prefix}-resident-light`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={neighborhoodActorMatrix(.4)}/></filter></defs>
    <g transform="scale(1 .82)"><StreetGround p={p} prefix={prefix}/></g>
    <g data-depth-layer="">
      {NEIGHBORHOOD_OBJECTS.map(o=><g key={o.id} data-world-object={o.id} data-depth={o.y} data-x={o.x} data-y={o.y} data-extent={o.kind==="house"?Math.max(o.w!,o.h!):190} transform={`translate(${o.x} ${projectAdventureY(o.y)})`}><g transform="scale(1 .82)"><StreetProp object={o} p={p}/></g></g>)}
      {new NeighborhoodCrowd().residents.map(r=><g key={r.id} data-resident={r.id} data-depth={r.y} transform={`translate(${r.x} ${projectAdventureY(r.y)})`} filter={night?`url(#${prefix}-resident-light)`:undefined}><NeighborhoodResident variant={r.variant} p={p}/></g>)}
      <g data-depth="1290" data-cat="" transform="translate(1665 1057.8)"><NeighborhoodCat p={p}/></g>
      <g data-depth="550" data-badge="" transform="translate(1730 451)"><path d="M-6-3h12v12H-6Z" fill="#775442"/><path d="M-4-1h8v8H-4Z" fill="#e4cc9b"/><path d="M-1 0h3v4h-3Z" fill="#537d75"/></g>
      <g data-depth="1615" data-pebble="" transform="translate(2020 1324.3)"><path d="M-8-4H6v2h4v7H-9v-5h1Z" fill={p.ink}/><path d="M-5-3H5v2h3v3H-6Z" fill={p.waterLight}/></g>
      <g data-depth="420" data-secret="" transform="translate(1410 344.4)"><path d="M-8-16H8v18H-8Z" fill={p.wood}/><path d="M-5-13H5V-1H-5Z" fill="#e4cc9b"/><path d="M-2-12h4V0h-4Z" fill="#fff1d1"/><path d="M-3-19h6v3h-6Zm1 21h2v6h-2Z" fill={p.wood}/></g>
      <LaboratorySourceArtwork/><g data-depth="654" data-work-ladder-position="" display="none"><NeighborhoodWorkLadder p={p}/></g>
      <g data-depth="655" data-neighborhood-player="" transform="translate(410 537.1)"><g data-player-light="" filter={night?`url(#${prefix}-actor-light)`:undefined}><AnimatedAdventureKnopik/><CarriedMissionItem/><NeighborhoodWorkTools/></g></g>
    </g>
    <NeighborhoodWorkWorld p={p}/><MissionMarkers/><g data-mission-beacon="" display="none"><path d="M-26-3h12v3h-9v9h-3Zm40 0h12v12h-3V0h-9Z" fill="#f4d889"/><path d="M-6-110H6v6h-3v9h-6v-9h-3Z" fill="#f4d889"/></g>
    <g data-point-highlight="" display="none"><path d="M-12-1H12v4H-12Z" fill="#fff1d1" opacity=".65"/><path d="M-2-92H2v14H-2Zm0 19h4v4h-4Z" fill="#f4d889"/></g>
  </svg>;
}));
const attr=(node:Element|null,name:string,value:string)=>{if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);};
export class NeighborhoodRenderer{
  private sources:{node:Element;content:Element|null;glow:Element|null;id:typeof LAB_SOURCES[number]["id"]}[];
  private player:Element|null;private animator:KnopikAnimator;private layer:Element|null;private depth:Element[];private matrix:Element|null;
  private crowd:NeighborhoodCrowdRenderer;private work:NeighborhoodWorkRenderer;private catTail:Element|null;private badge:Element|null;private pebble:Element|null;private secret:Element|null;
  private objects:{node:Element;x:number;y:number;extent:number;crown:Element|null}[];
  private missionStamp="";private beacon:Element|null;private originalMarker:Element|null;
  private watered:Element[];private litter:Element[];private bowl:Element|null;
  private markers:{id:NeighborhoodMissionId;node:Element;label:Element|null}[];
  private lamps:{id:string;glow:Element|null;bulbs:{node:Element;color:string}[]}[];
  private carried:{id:NeighborhoodMissionId;node:Element|null}[];
  private camera={x:170,y:270};private ratio=1.15;private order="";private mapPoint:Element|null;
  constructor(private svg:SVGSVGElement,private night:boolean,private reduced=false){
    this.sources=Array.from(svg.querySelectorAll("[data-lab-source]")).map(node=>({node,content:node.querySelector("[data-lab-source-content]"),glow:node.querySelector("[data-lab-source-glow]"),id:node.getAttribute("data-lab-source") as typeof LAB_SOURCES[number]["id"]}));
    this.player=svg.querySelector("[data-neighborhood-player]");this.animator=new KnopikAnimator(this.player);this.layer=svg.querySelector("[data-depth-layer]");this.depth=Array.from(this.layer?.children??[]);this.matrix=svg.querySelector("[data-actor-light]");this.mapPoint=svg.querySelector("[data-point-highlight]");
    this.crowd=new NeighborhoodCrowdRenderer(svg);this.work=new NeighborhoodWorkRenderer(svg);this.catTail=svg.querySelector("[data-cat-tail]");this.badge=svg.querySelector("[data-badge]");this.pebble=svg.querySelector("[data-pebble]");this.secret=svg.querySelector("[data-secret]");
    this.objects=this.depth.filter(n=>n.getAttribute("data-world-object")!==null).map(node=>({node,x:Number(node.getAttribute("data-x")),y:projectAdventureY(Number(node.getAttribute("data-y"))),extent:Number(node.getAttribute("data-extent")),crown:node.querySelector("[data-tree-crown]")}));
    this.beacon=svg.querySelector("[data-mission-beacon]");this.watered=Array.from(svg.querySelectorAll("[data-watered-bed]"));this.litter=Array.from(svg.querySelectorAll("[data-shore-litter]"));this.bowl=svg.querySelector("[data-cat-bowl]");
    this.originalMarker=svg.querySelector("[data-original-marker]");
    this.markers=Array.from(svg.querySelectorAll("[data-mission-marker]")).map(node=>({node,id:node.getAttribute("data-mission-marker") as NeighborhoodMissionId,label:node.querySelector("[data-marker-label]")}));
    this.lamps=NEIGHBORHOOD_LAMPS.map(l=>({id:l.id,glow:svg.querySelector(`[data-lamp-glow="${l.id}"]`),bulbs:Array.from(svg.querySelector(`[data-world-object="${l.id}"]`)?.querySelectorAll("[data-lamp-bulb]")??[]).map(node=>({node,color:node.getAttribute("fill")??"#fff1c9"}))}));
    this.carried=[{id:"delivery",node:svg.querySelector("[data-carried-parcel]")},{id:"garden",node:svg.querySelector("[data-carried-can]")},{id:"photos",node:svg.querySelector("[data-carried-camera]")},{id:"shore",node:svg.querySelector("[data-carried-bag]")}];
  }
  resize(width:number,height:number){this.ratio=height/Math.max(1,width);}
  paint(engine:NeighborhoodEngine,snap=false){
    for(const s of this.sources){const ready=engine.canGather(s.id);attr(s.content,"display",ready?"inline":"none");attr(s.glow,"display",ready?"inline":"none");attr(s.node,"opacity",ready?"1":".55");}
    const stamp=Object.values(engine.progress.missions).map(m=>`${m.status}/${m.steps}`).join(";")+engine.progress.tracked+engine.progress.quest+engine.progress.offer+(engine.action?.kind??"");
    if(stamp!==this.missionStamp){this.missionStamp=stamp;
      this.watered.forEach((node,i)=>attr(node,"display",engine.progress.missions.garden.steps&(1<<i)?"inline":"none"));
      this.litter.forEach((node,i)=>attr(node,"display",engine.progress.missions.shore.steps&(1<<i)?"none":"inline"));
      attr(this.bowl,"display",engine.progress.missions.cat.steps&2?"inline":"none");
      attr(this.originalMarker,"display",engine.progress.quest===3?"none":"inline");
      for(const {id,node,label} of this.markers){const m=engine.progress.missions[id];attr(node,"display",m.status===2||m.status===0&&engine.progress.offer!==id?"none":"inline");if(label)label.textContent=m.status===1?(m.steps===missionMask(id)?"✓":"?"):"!";}
      for(const {id,glow,bulbs} of this.lamps){const on=neighborhoodLampOn(id,engine.progress);attr(glow,"display",on?"inline":"none");for(const b of bulbs)attr(b.node,"fill",on?b.color:this.night?"#485668":"#818b87");}
      for(const {id,node} of this.carried){const m=engine.progress.missions[id];attr(node,"display",!engine.action&&engine.progress.tracked===id&&m.status===1&&m.steps!==missionMask(id)?"inline":"none");}
    }
    const width=480,height=Math.max(220,Math.min(880,width*this.ratio)),py=projectAdventureY(engine.player.y);
    const tx=Math.max(0,Math.min(2400-width,engine.player.x-width/2)),ty=Math.max(0,Math.min(2050*.82-height,py-height*.58-neighborhoodWorkLift(engine.action)*.55));
    const follow=snap||this.reduced?1:.14;this.camera.x+=(tx-this.camera.x)*follow;this.camera.y+=(ty-this.camera.y)*follow;
    attr(this.svg,"viewBox",`${this.camera.x.toFixed(1)} ${this.camera.y.toFixed(1)} ${width} ${height.toFixed(1)}`);
    attr(this.player,"transform",`translate(${engine.player.x.toFixed(2)} ${(py-(engine.seated?32.8:0)-neighborhoodWorkLift(engine.action)).toFixed(2)})`);attr(this.player,"data-depth",engine.player.y.toFixed(2));
    const facing=this.animator.paint(engine.animationState,this.reduced);
    for(const {id,node} of this.carried){const m=engine.progress.missions[id];attr(node,"display",engine.dodgeTime<=0&&!engine.action&&engine.progress.tracked===id&&m.status===1&&m.steps!==missionMask(id)?"inline":"none");}
    this.work.paint(engine,facing,this.reduced);
    this.crowd.paint(engine,this.reduced,this.camera,width,height);
    if(this.night)attr(this.matrix,"values",neighborhoodActorMatrix(neighborhoodLight(engine.player.x,engine.player.y,engine.progress)));
    attr(this.catTail,"transform",this.reduced?"":"rotate("+(Math.sin(engine.time*2)*6).toFixed(1)+" -20 -10)");
    attr(this.badge,"display",engine.progress.quest===1&&!(engine.action?.point==="badge"&&engine.action.elapsed/engine.action.duration>.3)?"inline":"none");
    attr(this.pebble,"display",engine.progress.pebble||engine.action?.point==="pebble"&&engine.action.elapsed/engine.action.duration>.3?"none":"inline");
    attr(this.secret,"display",engine.progress.secret||engine.action?.point==="secret"&&engine.action.elapsed/engine.action.duration>.3?"none":"inline");
    for(const {node,x,y,extent:r,crown} of this.objects){
      const visible=x+r>this.camera.x-70&&x-r<this.camera.x+width+70&&y+30>this.camera.y-40&&y-r<this.camera.y+height+70;
      attr(node,"display",visible?"inline":"none");
      // Reveal the dog behind a crown without making the entire trunk disappear.
      if(crown)attr(crown,"opacity",Math.abs(engine.player.x-x)<70&&py<y&&py>y-170?engine.action?".25":".48":"1");
    }
    const sorted=[...this.depth].sort((a,b)=>Number(a.getAttribute("data-depth"))-Number(b.getAttribute("data-depth"))),order=sorted.map(n=>this.depth.indexOf(n)).join("/");
    if(order!==this.order){this.order=order;for(let i=0;i<sorted.length;i++)if(this.layer?.children[i]!==sorted[i])this.layer?.insertBefore(sorted[i],this.layer.children[i]??null);}
    const point=engine.nearestPoint();attr(this.mapPoint,"display",point?"inline":"none");if(point)attr(this.mapPoint,"transform",`translate(${point.x} ${projectAdventureY(point.y)})`);
    const goal=engine.goal();attr(this.beacon,"display",goal?"inline":"none");if(goal)attr(this.beacon,"transform",`translate(${goal.x} ${projectAdventureY(goal.y)})`);
  }
}
