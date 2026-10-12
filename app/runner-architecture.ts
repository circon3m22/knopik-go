import { setRunnerAttribute } from "./runner-svg.ts";
import type { RunnerObject } from "./runner-engine";
import { runnerLitColor } from "./runner-atmosphere.ts";

type Point = { x: number; y: number; scale: number };
export type WorldProject = (x: number, z: number, height?: number, floor?: number) => Point;
const NS = "http://www.w3.org/2000/svg";
const polygon = (points: Point[]) => `M${points.map(point => `${point.x} ${point.y}`).join("L")}Z`;
type WindowPaint = { d: string; color: number; left: number; right: number; top: number; bottom: number };
function windowPaint(points: Point[], d: string, color: number): WindowPaint {
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const point of points){left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);}
  return { d, color, left:left-1, right:right+1, top:top-1, bottom:bottom+1 };
}
const frontWindowColors = ["#45475e","#ebbf8b"];
const sideWindowColors = ["#383f56","#efca8d"];
/** Combining fills changes paint order. Only batch disjoint stroke bounds;
 * short façades and rounded distant windows keep their original painter order.
 */
function paintWindows(paths: SVGPathElement[], windows: WindowPaint[], colors: readonly string[], preserveOrder = false) {
  let disjoint = !preserveOrder;
  for (let i=0;i<windows.length && disjoint;i++) for(let j=0;j<i;j++) {
    const a=windows[i],b=windows[j];
    if(a.left<=b.right && a.right>=b.left && a.top<=b.bottom && a.bottom>=b.top){disjoint=false;break;}
  }
  const shapes = disjoint ? ["",""] : windows.map(window=>window.d);
  if(disjoint) for(const window of windows) shapes[window.color]+=window.d;
  for(let i=0;i<paths.length;i++) {
    const d=shapes[i]??"";
    setRunnerAttribute(paths[i],"visibility",d ? "visible":"hidden");
    if(!d)continue;
    setRunnerAttribute(paths[i],"d",d);
    setRunnerAttribute(paths[i],"fill",colors[disjoint ? i : windows[i].color]);
  }
}
type Mesh = { pool: Mesh[] | null; object: RunnerObject | null; frame: number; group: SVGGElement; frontPlane: SVGGElement; trimPlane: SVGGElement; signPlane: SVGGElement; shapeKey: string; windowStamp: string; trimStamp: string; grids: string[] | null; faces: Map<string,string>; roof: SVGPathElement; side: SVGPathElement; front: SVGPathElement; sideClip: SVGPathElement; frontClip: SVGPathElement; windows: SVGPathElement[]; glass: SVGPathElement[]; sideWindows: SVGPathElement[]; ledges: SVGPathElement[]; door: SVGPathElement; awning: SVGPathElement; stripes: SVGPathElement[]; ornaments: SVGPathElement[]; sign: SVGTextElement };
let clipSerial = 0;
const NEAR_PLANE = -7.9;

/** Real world-space façades and roofs, rather than scaled flat house icons. */
export class RunnerArchitecture {
  private far: Mesh[];
  private near: Mesh[];
  private distant: Mesh[];
  private frame = 0;
  private leases = new WeakMap<RunnerObject, Mesh>();
  private live = new Set<RunnerObject>();
  private tier(object: RunnerObject, z: number) { return object.kind==="city-block" || z>=180 ? this.distant : z<6 ? this.near : this.far; }
  private cachedIllumination = -1;
  private colors = new Map<string,string>();
  private lit(color: string, illumination: number) {
    if (illumination !== this.cachedIllumination) { this.cachedIllumination = illumination; this.colors.clear(); }
    let result = this.colors.get(color);
    if (!result) { result = runnerLitColor(color,illumination); this.colors.set(color,result); }
    return result;
  }

  constructor(svg: SVGSVGElement) {
    const shape = () => svg.ownerDocument.createElementNS(NS, "path");
    svg.querySelectorAll('[data-runner-mesh="building"]').forEach(node=>node.remove());
    const make = (parent: SVGElement, detailed = true): Mesh => {
      const group = svg.ownerDocument.createElementNS(NS, "g");
      const frontPlane = svg.ownerDocument.createElementNS(NS, "g"), trimPlane = svg.ownerDocument.createElementNS(NS, "g"), signPlane = svg.ownerDocument.createElementNS(NS, "g");
      const frontGlazing=svg.ownerDocument.createElementNS(NS,"g"),sideGlazing=svg.ownerDocument.createElementNS(NS,"g");
      setRunnerAttribute(sideGlazing,"visibility","visible");
      setRunnerAttribute(frontPlane,"data-runner-facade-plane","");
      setRunnerAttribute(trimPlane,"data-runner-facade-trim","");
      setRunnerAttribute(group, "data-runner-mesh","building");
      const side = shape(), front = shape(), roof = shape(), door = shape(), awning = shape();
      // Retain slots for overlapping windows; batch disjoint windows at paint.
      // Opaque, unstroked mullions can always share one compound path.
      const windows = Array.from({ length: detailed?12:0 }, shape);
      const glass = Array.from({ length: detailed?1:0 }, shape);
      const sideWindows = Array.from({ length: detailed?8:0 }, shape);
      const ledges = Array.from({ length: detailed?1:0 }, shape);
      const stripes = Array.from({ length: detailed?1:0 }, shape);
      const ornaments = Array.from({ length: detailed?12:0 }, shape);
      const sign = svg.ownerDocument.createElementNS(NS, "text");
      setRunnerAttribute(sign, "text-anchor", "middle"); setRunnerAttribute(sign, "font-family", "Knopik Pixel, monospace");
      const defs = svg.ownerDocument.createElementNS(NS, "defs");
      const sideClip = shape(), frontClip = shape();
      for (const [face, paths, parent] of [[sideClip, sideWindows, sideGlazing], [frontClip, [...windows, ...glass], frontGlazing]] as const) {
        if(!paths.length)continue;
        const clip = svg.ownerDocument.createElementNS(NS, "clipPath");
        clip.id = `runner-facade-${++clipSerial}`;
        setRunnerAttribute(clip, "clipPathUnits", "userSpaceOnUse"); clip.append(face); defs.append(clip);
        setRunnerAttribute(parent, "clip-path", `url(#${clip.id})`);
      }
      if (detailed) {
        group.append(defs);
        frontGlazing.append(...windows,...glass);sideGlazing.append(...sideWindows);
        frontPlane.append(front,...ledges,frontGlazing,door);
        trimPlane.append(...ornaments); signPlane.append(sign);
        group.append(side,sideGlazing,frontPlane,roof,trimPlane,awning,...stripes,signPlane);
      } else { frontPlane.append(front,door); group.append(side,frontPlane,roof,awning); }
      parent.append(group);
      setRunnerAttribute(group, "display", "none");
      setRunnerAttribute(front, "stroke", "#544858"); setRunnerAttribute(side, "stroke", "#544858"); setRunnerAttribute(roof, "stroke", "#e8d4b0");
      for (const path of [front, side, roof]) { setRunnerAttribute(path, "stroke-width", "1.5"); setRunnerAttribute(path, "stroke-linejoin", "miter"); }
      setRunnerAttribute(front,"vector-effect","non-scaling-stroke");
      [...windows, ...sideWindows].forEach(path => { setRunnerAttribute(path, "fill", "#434459"); setRunnerAttribute(path, "stroke", "#e1c49b"); setRunnerAttribute(path, "stroke-width", "2"); });
      windows.forEach(path=>setRunnerAttribute(path,"vector-effect","non-scaling-stroke"));
      ledges.forEach(path => setRunnerAttribute(path, "fill", "#584c5b"));
      setRunnerAttribute(door, "fill", "#4a3c4a");
      stripes.forEach(path => setRunnerAttribute(path, "fill", "#e8cda5"));
      return { pool:null,object:null,frame:-1,group, frontPlane, trimPlane, signPlane, shapeKey:"", windowStamp:"",trimStamp:"",grids:null,faces:new Map(), side, front, roof, sideClip, frontClip, windows, glass, sideWindows, ledges, door, awning, stripes, ornaments, sign };
    };
    const farParent = svg.querySelector<SVGGElement>("[data-runner-far-buildings]")!;
    const nearParent = svg.querySelector<SVGGElement>("[data-runner-near-buildings]")!;
    // React's development effect replay must reuse the same bounded pool size.
    farParent.replaceChildren(); nearParent.replaceChildren();
    this.far = Array.from({ length: 24 }, () => make(farParent));
    this.distant = Array.from({ length: 96 }, () => make(farParent,false));
    this.near = Array.from({ length: 12 }, () => make(nearParent));
    for(const pool of [this.far,this.near,this.distant])for(const mesh of pool)mesh.pool=pool;
  }

  begin(objects?: readonly RunnerObject[], distance=0) {
    this.frame++;this.live.clear();
    if(objects)for(const object of objects)this.live.add(object);
    for(const pool of [this.far,this.near,this.distant])for(const mesh of pool) {
      if(mesh.object && (!this.live.has(mesh.object) || this.tier(mesh.object,mesh.object.z-distance)!==pool))mesh.object=null;
    }
  }

  draw(object: RunnerObject, z: number, project: WorldProject, wall: string, near: boolean, illumination = 1) {
    const background = object.kind === "city-block";
    const pool=background ? this.distant : near ? this.near : z>=180 ? this.distant : this.far;
    let mesh=this.leases.get(object);
    if(!mesh || mesh.object!==object || mesh.pool!==pool) {
      mesh=pool.find(item=>!item.object);
      if(mesh){mesh.object=object;this.leases.set(object,mesh);}
    }
    if (!mesh) return null;
    mesh.frame=this.frame;
    const platform = object.kind === "platform";
    const variant = object.variant % 8;
    const business = object.district === 9 && !platform;
    const width = platform ? 82 : background ? (business ? 230+variant*13 : 180 + variant * 11) : business ? [132,168,146,184,154,160,196,138][variant] : [152, 186, 170, 206, 160, 188, 180, 148][variant];
    const warehouse = !platform && object.district === 2;
    const rows = platform ? 1 : warehouse ? 2 : variant % 3 === 0 ? 3 : 4;
    const columns = platform ? 2 : variant % 3 === 1 ? 2 : 3;
    const detail = !background && z < 180;
    const china = object.district === 6;
    const x1 = object.x - width / 2, x2 = object.x + width / 2;
    const front = z - object.depth / 2, back = z + object.depth / 2;
    const h = object.height;
    if (back <= NEAR_PLANE) { setRunnerAttribute(mesh.group, "display", "none"); return null; }
    const frontVisible = front >= NEAR_PLANE;
    const clippedFront = Math.max(front, NEAR_PLANE);
    // Façades and their details follow the same street elevation as road objects.
    const world = (x: number, depth: number, height: number) => project(x, depth, height);
    // A façade is one plane. Keep every detail in stable world-local coordinates
    // and move three SVG groups, rather than rewrite hundreds of projected points.
    // Fit the four outer corners to the existing pixel-snapped projection.
    const leftPoint=world(x1,front,0),rightPoint=world(x2,front,0),topPoint=world(object.x,front,h);
    const sx=(rightPoint.x-leftPoint.x)/width,sy=(leftPoint.y-topPoint.y)/h;
    const ox=(leftPoint.x+rightPoint.x)/2,oy=leftPoint.y;
    const matrix=`matrix(${sx} 0 0 ${sy} ${ox} ${oy})`;
    for(const plane of [mesh.frontPlane,mesh.trimPlane,mesh.signPlane])setRunnerAttribute(plane,"transform",matrix);
    const inverse=`matrix(${1/sx} 0 0 ${1/sy} ${-ox/sx} ${-oy/sy})`;
    if(mesh.ornaments.length) {
      setRunnerAttribute(mesh.ornaments[2],"transform",business?inverse:"");
      setRunnerAttribute(mesh.ornaments[10],"transform",!china&&!business?inverse:"");
    }
    const p = (x: number, depth: number, height: number) => depth===front ? {x:x-object.x,y:-height,scale:1} : world(x,depth,height);
    const shapeKey=`${object.id}/${object.kind}/${width}/${h}/${variant}/${object.district}/${detail}/${frontVisible}/${z<340}`;
    if(shapeKey!==mesh.shapeKey){mesh.shapeKey=shapeKey;mesh.faces.clear();mesh.windowStamp="";mesh.trimStamp="";mesh.grids=null;}
    const face = (left: number, right: number, bottom: number, top: number, depth = front) => {
      if(depth!==front)return polygon([world(left,depth,bottom),world(right,depth,bottom),world(right,depth,top),world(left,depth,top)]);
      const key=`${left-object.x}/${right-object.x}/${bottom}/${top}`;
      let cached=mesh.faces.get(key);
      if(!cached){cached=`M${left-object.x} ${-bottom}L${right-object.x} ${-bottom} ${right-object.x} ${-top} ${left-object.x} ${-top}Z`;mesh.faces.set(key,cached);}
      return cached;
    };
    const inside = object.x < 0 ? x2 : x1;
    setRunnerAttribute(mesh.group, "display", "inline");
    setRunnerAttribute(mesh.front, "visibility", frontVisible ? "visible" : "hidden");
    const frontShape = frontVisible ? face(x1, x2, 0, h) : "";
    setRunnerAttribute(mesh.front, "d", frontShape); setRunnerAttribute(mesh.frontClip, "d", frontShape);
    setRunnerAttribute(mesh.front, "fill", business ? this.lit(["#5b8097","#779ca9","#626d8f","#568b94"][variant%4],illumination) : platform ? "#ae8566" : wall);
    const sideShape = polygon([world(inside, clippedFront, 0), world(inside, back, 0), world(inside, back, h), world(inside, clippedFront, h)]);
    setRunnerAttribute(mesh.side, "d", sideShape); setRunnerAttribute(mesh.sideClip, "d", sideShape);
    setRunnerAttribute(mesh.side, "fill", this.lit(platform ? "#775c58" : china ? "#804e48" : ["#775969", "#635b76", "#7b796c", "#6b6e80", "#84664f", "#4e6d69", "#77636c", "#766f59"][variant], illumination));
    setRunnerAttribute(mesh.roof, "d", polygon([world(x1, clippedFront, h), world(x2, clippedFront, h), world(x2, back, h), world(x1, back, h)]));
    setRunnerAttribute(mesh.roof, "fill", this.lit(platform ? "#d7c2a0" : china ? "#47665a" : ["#bd7961", "#879999", "#68747d", "#a48d76", "#797b64", "#ac7265", "#968599", "#847861"][variant], illumination));
    if (business && detail) {
      // A dense glass grid is batched into paths; tower detail does not add DOM nodes.
      for(const node of [...mesh.windows,...mesh.glass,...mesh.sideWindows,...mesh.ledges,mesh.awning,...mesh.stripes]) setRunnerAttribute(node,"visibility","hidden");
      mesh.ornaments.forEach((node,i)=>setRunnerAttribute(node,"visibility",frontVisible || i===2 ? "visible":"hidden"));
      if(!mesh.grids) {
        mesh.grids=["",""]; const floors=18+variant%4*3, cols=variant%2?5:4;
        for(let row=0;row<floors;row++)for(let col=0;col<cols;col++) {
          const x=x1+10+col*(width-20)/cols,y=94+row*(h-125)/floors;
          mesh.grids[(row+col+variant)%3===0?1:0]+=face(x,x+(width-20)/cols-5,y,y+(h-125)/floors-6);
        }
      }
      setRunnerAttribute(mesh.ornaments[0],"d",mesh.grids[0]);setRunnerAttribute(mesh.ornaments[0],"fill",this.lit("#31556d",illumination));
      setRunnerAttribute(mesh.ornaments[1],"d",mesh.grids[1]);setRunnerAttribute(mesh.ornaments[1],"fill",this.lit(illumination<.8?"#e1c68e":"#a6cbd2",illumination));
      const sideGlass=[0,1,2].map(col=> {
        const d=Math.max(front+3+col*object.depth/3,NEAR_PLANE),end=Math.min(back-1,d+object.depth/4);
        return end>d?polygon([world(inside,d,86),world(inside,end,86),world(inside,end,h-18),world(inside,d,h-18)]):"";
      }).join("");
      setRunnerAttribute(mesh.ornaments[2],"d",sideGlass);setRunnerAttribute(mesh.ornaments[2],"fill",this.lit("#7499b1",illumination));
      setRunnerAttribute(mesh.ornaments[3],"d",face(x1+4,x1+8,0,h)+face(x2-8,x2-4,0,h));setRunnerAttribute(mesh.ornaments[3],"fill",this.lit("#b8cbd0",illumination));
      setRunnerAttribute(mesh.ornaments[4],"d",[0,1,2].map(i=>face(x1,x2,73+i*7,76+i*7)).join(""));setRunnerAttribute(mesh.ornaments[4],"fill",this.lit("#adb8b5",illumination));
      setRunnerAttribute(mesh.ornaments[5],"d",face(x1+12,x2-12,3,65));setRunnerAttribute(mesh.ornaments[5],"fill",this.lit("#a5c7c7",illumination));
      const crown=variant%4===0 ? face(x1-5,x2+5,h-8,h+18)+face(object.x-2,object.x+2,h+18,h+78) : variant%4===1 ? face(x1+8,x2-8,h,h+25)+face(x1+22,x2-22,h+25,h+49)+face(object.x-17,object.x+17,h+49,h+79) : variant%4===2 ? polygon([p(x1,front,h),p(x2,front,h),p(x2-7,front,h+69),p(x1+8,front,h+26)]) : face(x1-4,x2+4,h-6,h+15)+face(x1+8,x1+18,h+15,h+52)+face(x2-18,x2-8,h+15,h+52)+face(x1+8,x2-8,h+46,h+54);
      setRunnerAttribute(mesh.ornaments[6],"d",crown);setRunnerAttribute(mesh.ornaments[6],"fill",this.lit("#c6dcdb",illumination));
      setRunnerAttribute(mesh.ornaments[7],"d",face(object.x-3,object.x+3,h+72,h+79));setRunnerAttribute(mesh.ornaments[7],"fill",illumination<.8?"#ef9475":"#b47778");
      setRunnerAttribute(mesh.ornaments[8],"d",face(object.x-16,object.x+16,0,54));setRunnerAttribute(mesh.ornaments[8],"fill",this.lit("#354b60",illumination));
      setRunnerAttribute(mesh.ornaments[9],"d",face(x1+14,x1+18,0,65)+face(x2-18,x2-14,0,65)+face(object.x-1,object.x+1,0,54));setRunnerAttribute(mesh.ornaments[9],"fill",this.lit("#d4d8c6",illumination));
      setRunnerAttribute(mesh.ornaments[10],"d",face(object.x-29,object.x+29,64,73));setRunnerAttribute(mesh.ornaments[10],"fill","#344f65");
      setRunnerAttribute(mesh.ornaments[11],"d",face(x1+15,x1+24,100,h-25));setRunnerAttribute(mesh.ornaments[11],"fill",this.lit("#a7c4cc",illumination));
      setRunnerAttribute(mesh.door,"visibility","hidden");
      const point=p(object.x,front,65);setRunnerAttribute(mesh.sign,"visibility",frontVisible&&z<100?"visible":"hidden");
      setRunnerAttribute(mesh.sign,"x",String(point.x));setRunnerAttribute(mesh.sign,"y",String(point.y));setRunnerAttribute(mesh.sign,"font-size",String(Math.max(1,10*point.scale)));setRunnerAttribute(mesh.sign,"fill","#ecdfbc");
      const label=["БАНК","ТЕХНО","ГОУ","АТЛАС","ОРБИТА","ОФИСЫ","АРКАДА","ПЛАЗА"][variant];if(mesh.sign.textContent!==label)mesh.sign.textContent=label;
      return mesh.group;
    }
    if (!detail) {
      // Neighbouring blocks gain windows using two compound paths, not dozens
      // of independently painted nodes. Beyond 340 units only silhouettes remain.
      const frontWindows: string[] = [], sideWindows: string[] = [];
      const distantRows=business?9:4,distantColumns=business?4:3;
      if (z < 340) for (let row=0;row<distantRows;row++) {
        const y=80+row*(h-112)/distantRows;
        if (frontVisible) for(let col=0;col<distantColumns;col++) {
          const x=x1+width*.12+col*width*(business ? .2 : .28);
          frontWindows.push(face(x,x+width*(business ? .14 : .12),y,y+(business?(h-112)/distantRows-8:26)));
        }
        for(let col=0;col<2;col++) {
          const start=Math.max(front+2+col*object.depth*.4,NEAR_PLANE), end=Math.min(back-1,start+object.depth*.2);
          if(end>start)sideWindows.push(polygon([world(inside,start,y),world(inside,end,y),world(inside,end,y+26),world(inside,start,y+26)]));
        }
      }
      setRunnerAttribute(mesh.door,"d",frontWindows.join('')); setRunnerAttribute(mesh.awning,"d",sideWindows.join(''));
      setRunnerAttribute(mesh.door,"visibility",frontWindows.length?'visible':'hidden'); setRunnerAttribute(mesh.awning,"visibility",sideWindows.length?'visible':'hidden');
      const glass=this.lit(illumination<.8?'#d9b586':'#a1b3ae',illumination);
      setRunnerAttribute(mesh.door,"fill",glass);setRunnerAttribute(mesh.awning,"fill",glass);
      return mesh.group;
    }
    const sideWindowPaths: WindowPaint[] = [];
    if (!platform) for (let i = 0; i < (warehouse ? 4 : 8); i++) {
      const depth = front + 3 + (i % 2) * (object.depth - 5) / 2;
      const end = depth + (object.depth - 9) / 3;
      if (end <= NEAR_PLANE) continue;
      const start = Math.max(depth, NEAR_PLANE);
      const y = 96 + Math.floor(i / 2) * (h - 132) / 4;
      const lit = (i + object.variant) % (illumination < .8 ? 2 : 4) === 0 ? 1 : 0;
      const points = [world(inside, start, y), world(inside, end, y), world(inside, end, y + 42), world(inside, start, y + 42)];
      sideWindowPaths.push(windowPaint(points,polygon(points),lit));
    }
    paintWindows(mesh.sideWindows,sideWindowPaths,sideWindowColors);
    const windowStamp=String(illumination<.8);
    if(mesh.windowStamp!==windowStamp) {
    mesh.windowStamp=windowStamp;
    const windowPaths: WindowPaint[] = [];
    let glassPath = "";
    for (let i = 0; frontVisible && i < rows * columns; i++) {
      const row = Math.floor(i / columns), col = i % columns;
      const step = (width - 30) / columns;
      const wx = platform ? x1 + 12 + i * 34 : x1 + 18 + col * step;
      const wy = platform ? 32 : 104 + row * (h - 145) / rows;
      const ww = platform ? 18 : variant === 1 ? 47 : 30;
      const wh = platform ? 18 : variant === 4 ? 31 : 42;
      const lit = (object.variant + i) % (illumination < .8 ? 2 : 5) === 0 ? 1 : 0;
      const d = variant === 0 && !platform ? polygon([p(wx,front,wy),p(wx+ww,front,wy),p(wx+ww,front,wy+wh-8),p(wx+ww-6,front,wy+wh-8),p(wx+ww-6,front,wy+wh),p(wx+6,front,wy+wh),p(wx+6,front,wy+wh-8),p(wx,front,wy+wh-8)]) : face(wx, wx+ww, wy, wy+wh);
      windowPaths.push(windowPaint([p(wx,front,wy),p(wx+ww,front,wy+wh)],d,lit));
      glassPath += face(wx + ww / 2 - 1, wx + ww / 2 + 1, wy + 2, wy + wh - 3) + face(wx + 2, wx + ww - 2, wy + wh / 2, wy + wh / 2 + 2);
    }
    paintWindows(mesh.windows,windowPaths,frontWindowColors,true);
    setRunnerAttribute(mesh.glass[0], "visibility", glassPath ? "visible" : "hidden");
    setRunnerAttribute(mesh.glass[0], "d", glassPath);
    setRunnerAttribute(mesh.glass[0], "fill", "#c2b7a0");
    }
    let ledgePath = "";
    if (!platform && frontVisible) for (let i = 0; i < Math.min(4, rows); i++) {
      const y = 96 + i * (h - 145) / rows;
      ledgePath += face(x1 - 3, x2 + 3, y, y + (variant === 3 ? 10 : 5));
    }
    setRunnerAttribute(mesh.ledges[0], "visibility", ledgePath ? "visible" : "hidden");
    setRunnerAttribute(mesh.ledges[0], "d", ledgePath);
    setRunnerAttribute(mesh.door, "d", face(object.x - (warehouse?40:15), object.x + (warehouse?40:15), 0, platform ? 43 : warehouse?82:65));
    setRunnerAttribute(mesh.door, "visibility", frontVisible && detail ? "visible" : "hidden");
    setRunnerAttribute(mesh.awning, "visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible");
    mesh.stripes.forEach(path => setRunnerAttribute(path, "visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible"));
    if (!platform && detail) {
      setRunnerAttribute(mesh.awning, "fill", ["#ab6369", "#668f83", "#687a9a", "#ab8a57", "#c38261", "#608b79", "#ac729d", "#9b9c68"][variant]);
      setRunnerAttribute(mesh.awning, "d", polygon([world(x1 + 7, front, 84), world(x2 - 7, front, 84), world(x2 - 7, front - 3, 71), world(x1 + 7, front - 3, 71)]));
      let stripePath = "";
      for (let i = 0; i < 4; i++) {
        const x = x1 + 12 + i * (width - 24) / 4;
        stripePath += polygon([world(x, front, 84), world(x + 13, front, 84), world(x + 13, front - 3, 71), world(x, front - 3, 71)]);
      }
      setRunnerAttribute(mesh.stripes[0], "d", stripePath);
    }
    mesh.ornaments.forEach((path,i) => setRunnerAttribute(path, "visibility", platform || !frontVisible || !detail || i===10 && front<=NEAR_PLANE+6 ? "hidden" : "visible"));
    const trimStamp=String(illumination);
    if (!platform && frontVisible && detail && mesh.trimStamp!==trimStamp) {
      mesh.trimStamp=trimStamp;
      const roofFace = mesh.ornaments[0];
      const ridge = variant % 3 === 0 ? 30 : 9;
      setRunnerAttribute(roofFace, "d", variant % 3 === 0 ? polygon([p(x1,front,h),p(x1+width*.2,front,h),p(x1+width*.2,front,h+ridge/2),p(object.x-15,front,h+ridge/2),p(object.x-15,front,h+ridge),p(object.x+15,front,h+ridge),p(object.x+15,front,h+ridge/2),p(x2-width*.2,front,h+ridge/2),p(x2-width*.2,front,h),p(x2,front,h)]) : face(x1-3,x2+3,h-5,h+ridge));
      setRunnerAttribute(roofFace, "fill", china ? "#50785c" : "#e1c59d");
      if (china) setRunnerAttribute(roofFace,"d",[0,1,2].map(i=>polygon([p(x1-12+i*6,front,h+i*12),p(x1+8,front,h+i*12-7),p(x2-8,front,h+i*12-7),p(x2+12-i*6,front,h+i*12),p(x2+12-i*6,front,h+i*12-4),p(x1-12+i*6,front,h+i*12-4)])).join(''));
      setRunnerAttribute(mesh.ornaments[1], "d", face(x1+18,x1+34,h,h+27)); setRunnerAttribute(mesh.ornaments[1], "fill", "#755765");
      setRunnerAttribute(mesh.ornaments[2], "d", face(x1+7,x1+14,0,h)); setRunnerAttribute(mesh.ornaments[2], "fill", "#e1c59d");
      setRunnerAttribute(mesh.ornaments[3], "d", face(x2-14,x2-7,0,h)); setRunnerAttribute(mesh.ornaments[3], "fill", "#e1c59d");
      setRunnerAttribute(mesh.ornaments[4], "d", face(x1+20,x2-20,65,82)); setRunnerAttribute(mesh.ornaments[4], "fill", variant === 6 ? "#684f77" : "#424e55");
      setRunnerAttribute(mesh.ornaments[5], "d", face(object.x-28,object.x+28,h-45,h-24)); setRunnerAttribute(mesh.ornaments[5], "fill", variant === 7 ? "#c2bc8f" : "#8a7778");
      setRunnerAttribute(mesh.ornaments[6], "d", face(x2-40,x2-19,94,115)); setRunnerAttribute(mesh.ornaments[6], "fill", "#a5b0ac");
      setRunnerAttribute(mesh.ornaments[7], "d", face(x2-37,x2-22,99,102)+face(x2-37,x2-22,105,108)); setRunnerAttribute(mesh.ornaments[7], "fill", "#586e78");
      setRunnerAttribute(mesh.ornaments[8], "d", face(object.x-20,object.x+20,2,5)+face(object.x-3,object.x-1,4,53)+face(object.x+3,object.x+5,4,53)); setRunnerAttribute(mesh.ornaments[8], "fill", "#a59b8b");
      setRunnerAttribute(mesh.ornaments[9], "d", [0,1,2,3].map(i => face(x1+20+i%2*22,x1+35+i%2*22,19+Math.floor(i/2)*11,22+Math.floor(i/2)*11)).join("")); setRunnerAttribute(mesh.ornaments[9], "fill", "#93806f");
      setRunnerAttribute(mesh.ornaments[11],"d",face(x1+22,x1+45,4,48)+face(x2-45,x2-22,4,48)+face(x1+24,x1+43,51,58)+face(x2-43,x2-24,51,58));
      setRunnerAttribute(mesh.ornaments[11],"fill",this.lit(china?'#dfb16c':'#72928a',illumination));
    }
    if (!platform && frontVisible && detail) {
      const balconyHeight=142+variant%2*48;
      const balconies=[0,1].map(i=> {
        const y=balconyHeight+i*(h-170)/3;
        return polygon([p(x1+19,front-2,y),p(x2-19,front-2,y),p(x2-19,front-5,y),p(x1+19,front-5,y)])+face(x1+19,x2-19,y,y+3,front-5)+face(x1+19,x2-19,y+17,y+20,front-5)+[0,1,2,3,4].map(c=>face(x1+22+c*(width-44)/5,x1+25+c*(width-44)/5,y,y+20,front-5)).join('');
      });
      setRunnerAttribute(mesh.ornaments[10],"d",china ? [-25,25].map(x=>face(object.x+x-8,object.x+x+8,72,95)+face(object.x+x-2,object.x+x+2,65,72)).join('') : balconies.join(''));
      setRunnerAttribute(mesh.ornaments[10],"fill",this.lit(china?'#d2684e':'#b1aaa0',illumination));
    }
    const signPoint = p(object.x,front,68);
    setRunnerAttribute(mesh.sign, "visibility", !platform && detail && frontVisible && z < 100 ? "visible" : "hidden");
    setRunnerAttribute(mesh.sign, "x", String(signPoint.x)); setRunnerAttribute(mesh.sign, "y", String(signPoint.y));
    setRunnerAttribute(mesh.sign, "font-size", String(Math.max(1,12*signPoint.scale))); setRunnerAttribute(mesh.sign, "fill", "#f9e7b1");
    const label = (china ? ["ЧАЙ","ЛАПША","ДИМСАМ","ШЁЛК","СПЕЦИИ","ПЕКИН","ФОНАРИ","РИС"] : warehouse ? ["ДОК 01","СКЛАД","ПОРТ","МОРЕ","ДОК 02","МАСТЕРСКАЯ","ГРУЗЫ","ДОК 03"] : object.district===3 ? ["КИНО","БАР","МУЗЫКА","КЛУБ","ЛАПША","ТАКСИ","АРКАДА","24 ЧАСА"] : ["ПЕКАРНЯ", "КАФЕ", "ПОЧТА", "РЫНОК", "ЧАЙ", "АПТЕКА", "АРКАДА", "ЧАСЫ"])[variant];
    if (mesh.sign.textContent !== label) mesh.sign.textContent = label;
    return mesh.group;
  }

  end() {
    for(const pool of [this.far,this.near,this.distant])for(const mesh of pool)if(mesh.frame!==this.frame)setRunnerAttribute(mesh.group,"display","none");
  }
}
