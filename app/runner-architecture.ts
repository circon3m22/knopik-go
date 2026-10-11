import { setRunnerAttribute } from "./runner-svg.ts";
import type { RunnerObject } from "./runner-engine";
import { runnerLitColor } from "./runner-atmosphere.ts";

type Point = { x: number; y: number; scale: number };
export type WorldProject = (x: number, z: number, height?: number, floor?: number) => Point;
const NS = "http://www.w3.org/2000/svg";
const shape = () => document.createElementNS(NS, "path");
const polygon = (points: Point[]) => `M${points.map(point => `${point.x} ${point.y}`).join("L")}Z`;
type Mesh = { group: SVGGElement; roof: SVGPathElement; side: SVGPathElement; front: SVGPathElement; sideClip: SVGPathElement; frontClip: SVGPathElement; windows: SVGPathElement[]; glass: SVGPathElement[]; sideWindows: SVGPathElement[]; ledges: SVGPathElement[]; door: SVGPathElement; awning: SVGPathElement; stripes: SVGPathElement[]; ornaments: SVGPathElement[]; sign: SVGTextElement };
let clipSerial = 0;
const NEAR_PLANE = -7.9;

/** Real world-space façades and roofs, rather than scaled flat house icons. */
export class RunnerArchitecture {
  private far: Mesh[];
  private near: Mesh[];
  private distant: Mesh[];
  private farCount = 0;
  private nearCount = 0;
  private distantCount = 0;
  private cachedIllumination = -1;
  private colors = new Map<string,string>();
  private lit(color: string, illumination: number) {
    if (illumination !== this.cachedIllumination) { this.cachedIllumination = illumination; this.colors.clear(); }
    let result = this.colors.get(color);
    if (!result) { result = runnerLitColor(color,illumination); this.colors.set(color,result); }
    return result;
  }

  constructor(svg: SVGSVGElement) {
    svg.querySelectorAll('[data-runner-mesh="building"]').forEach(node=>node.remove());
    const make = (parent: SVGElement, detailed = true): Mesh => {
      const group = document.createElementNS(NS, "g");
      setRunnerAttribute(group, "data-runner-mesh","building");
      const side = shape(), front = shape(), roof = shape(), door = shape(), awning = shape();
      const windows = Array.from({ length: detailed?12:0 }, shape);
      const glass = Array.from({ length: detailed?12:0 }, shape);
      const sideWindows = Array.from({ length: detailed?8:0 }, shape);
      const ledges = Array.from({ length: detailed?4:0 }, shape);
      const stripes = Array.from({ length: detailed?4:0 }, shape);
      const ornaments = Array.from({ length: detailed?12:0 }, shape);
      const sign = document.createElementNS(NS, "text");
      setRunnerAttribute(sign, "text-anchor", "middle"); setRunnerAttribute(sign, "font-family", "Knopik Pixel, monospace");
      const defs = document.createElementNS(NS, "defs");
      const sideClip = shape(), frontClip = shape();
      for (const [face, paths] of [[sideClip, sideWindows], [frontClip, [...windows, ...glass]]] as const) {
        if(!paths.length)continue;
        const clip = document.createElementNS(NS, "clipPath");
        clip.id = `runner-facade-${++clipSerial}`;
        setRunnerAttribute(clip, "clipPathUnits", "userSpaceOnUse"); clip.append(face); defs.append(clip);
        paths.forEach(path => setRunnerAttribute(path, "clip-path", `url(#${clip.id})`));
      }
      if (detailed) {
        group.append(defs);
        group.append(side, ...sideWindows, front, ...ledges, ...windows, ...glass, door, roof, ...ornaments, awning, ...stripes, sign);
      } else group.append(side,front,door,roof,awning);
      parent.append(group);
      setRunnerAttribute(group, "display", "none");
      setRunnerAttribute(front, "stroke", "#544858"); setRunnerAttribute(side, "stroke", "#544858"); setRunnerAttribute(roof, "stroke", "#e8d4b0");
      for (const path of [front, side, roof]) { setRunnerAttribute(path, "stroke-width", "1.5"); setRunnerAttribute(path, "stroke-linejoin", "miter"); }
      [...windows, ...sideWindows].forEach(path => { setRunnerAttribute(path, "fill", "#434459"); setRunnerAttribute(path, "stroke", "#e1c49b"); setRunnerAttribute(path, "stroke-width", "2"); });
      ledges.forEach(path => setRunnerAttribute(path, "fill", "#584c5b"));
      setRunnerAttribute(door, "fill", "#4a3c4a");
      stripes.forEach(path => setRunnerAttribute(path, "fill", "#e8cda5"));
      return { group, side, front, roof, sideClip, frontClip, windows, glass, sideWindows, ledges, door, awning, stripes, ornaments, sign };
    };
    const farParent = svg.querySelector<SVGGElement>("[data-runner-far-buildings]")!;
    const nearParent = svg.querySelector<SVGGElement>("[data-runner-near-buildings]")!;
    // React's development effect replay must reuse the same bounded pool size.
    farParent.replaceChildren(); nearParent.replaceChildren();
    this.far = Array.from({ length: 24 }, () => make(farParent));
    this.distant = Array.from({ length: 96 }, () => make(farParent,false));
    this.near = Array.from({ length: 12 }, () => make(nearParent));
  }

  begin() { this.farCount = this.nearCount = this.distantCount = 0; }

  draw(object: RunnerObject, z: number, project: WorldProject, wall: string, near: boolean, illumination = 1) {
    const background = object.kind === "city-block";
    const mesh = background ? this.distant[this.distantCount++] : near ? this.near[this.nearCount++] : z>=180 ? this.distant[this.distantCount++] : this.far[this.farCount++];
    if (!mesh) return null;
    const platform = object.kind === "platform";
    const variant = object.variant % 8;
    const width = platform ? 82 : background ? 180 + variant * 11 : [152, 186, 170, 206, 160, 188, 180, 148][variant];
    const warehouse = !platform && object.district === 2;
    const rows = platform ? 1 : warehouse ? 2 : variant % 3 === 0 ? 3 : 4;
    const columns = platform ? 2 : variant % 3 === 1 ? 2 : 3;
    const detail = !background && z < 180;
    const china = object.district === 6;
    const business = object.district === 9 && !platform;
    const x1 = object.x - width / 2, x2 = object.x + width / 2;
    const front = z - object.depth / 2, back = z + object.depth / 2;
    const h = object.height;
    if (back <= NEAR_PLANE) { setRunnerAttribute(mesh.group, "display", "none"); return null; }
    const frontVisible = front >= NEAR_PLANE;
    const clippedFront = Math.max(front, NEAR_PLANE);
    // Façades and their details follow the same street elevation as road objects.
    const p = (x: number, depth: number, height: number) => project(x, depth, height);
    const face = (left: number, right: number, bottom: number, top: number, depth = front) => polygon([p(left, depth, bottom), p(right, depth, bottom), p(right, depth, top), p(left, depth, top)]);
    const inside = object.x < 0 ? x2 : x1;
    setRunnerAttribute(mesh.group, "display", "inline");
    setRunnerAttribute(mesh.front, "visibility", frontVisible ? "visible" : "hidden");
    const frontShape = frontVisible ? face(x1, x2, 0, h) : "";
    setRunnerAttribute(mesh.front, "d", frontShape); setRunnerAttribute(mesh.frontClip, "d", frontShape);
    setRunnerAttribute(mesh.front, "fill", business ? this.lit(["#5b8097","#779ca9","#626d8f","#568b94"][variant%4],illumination) : platform ? "#ae8566" : wall);
    const sideShape = polygon([p(inside, clippedFront, 0), p(inside, back, 0), p(inside, back, h), p(inside, clippedFront, h)]);
    setRunnerAttribute(mesh.side, "d", sideShape); setRunnerAttribute(mesh.sideClip, "d", sideShape);
    setRunnerAttribute(mesh.side, "fill", this.lit(platform ? "#775c58" : china ? "#804e48" : ["#775969", "#635b76", "#7b796c", "#6b6e80", "#84664f", "#4e6d69", "#77636c", "#766f59"][variant], illumination));
    setRunnerAttribute(mesh.roof, "d", polygon([p(x1, clippedFront, h), p(x2, clippedFront, h), p(x2, back, h), p(x1, back, h)]));
    setRunnerAttribute(mesh.roof, "fill", this.lit(platform ? "#d7c2a0" : china ? "#47665a" : ["#bd7961", "#879999", "#68747d", "#a48d76", "#797b64", "#ac7265", "#968599", "#847861"][variant], illumination));
    if (business && detail) {
      // A dense glass grid is batched into paths; tower detail does not add DOM nodes.
      for(const node of [...mesh.windows,...mesh.glass,...mesh.sideWindows,...mesh.ledges,mesh.awning,...mesh.stripes]) setRunnerAttribute(node,"visibility","hidden");
      mesh.ornaments.forEach(node=>setRunnerAttribute(node,"visibility",frontVisible?"visible":"hidden"));
      const grids=["",""]; const floors=12+variant%4*2, cols=4;
      for(let row=0;row<floors;row++)for(let col=0;col<cols;col++) {
        const x=x1+10+col*(width-20)/cols,y=94+row*(h-125)/floors;
        grids[(row+col+variant)%3===0?1:0]+=face(x,x+(width-20)/cols-5,y,y+(h-125)/floors-6);
      }
      setRunnerAttribute(mesh.ornaments[0],"d",grids[0]);setRunnerAttribute(mesh.ornaments[0],"fill",this.lit("#31556d",illumination));
      setRunnerAttribute(mesh.ornaments[1],"d",grids[1]);setRunnerAttribute(mesh.ornaments[1],"fill",this.lit(illumination<.8?"#e1c68e":"#a6cbd2",illumination));
      const sideGlass=[0,1,2].map(col=> {
        const d=Math.max(front+3+col*object.depth/3,NEAR_PLANE),end=Math.min(back-1,d+object.depth/4);
        return end>d?polygon([p(inside,d,86),p(inside,end,86),p(inside,end,h-18),p(inside,d,h-18)]):"";
      }).join("");
      setRunnerAttribute(mesh.ornaments[2],"d",sideGlass);setRunnerAttribute(mesh.ornaments[2],"fill",this.lit("#7499b1",illumination));
      setRunnerAttribute(mesh.ornaments[2],"visibility","visible");
      setRunnerAttribute(mesh.ornaments[3],"d",face(x1+4,x1+8,0,h)+face(x2-8,x2-4,0,h));setRunnerAttribute(mesh.ornaments[3],"fill",this.lit("#b8cbd0",illumination));
      setRunnerAttribute(mesh.ornaments[4],"d",[0,1,2].map(i=>face(x1,x2,73+i*7,76+i*7)).join(""));setRunnerAttribute(mesh.ornaments[4],"fill",this.lit("#adb8b5",illumination));
      setRunnerAttribute(mesh.ornaments[5],"d",face(x1+12,x2-12,3,65));setRunnerAttribute(mesh.ornaments[5],"fill",this.lit("#a5c7c7",illumination));
      setRunnerAttribute(mesh.ornaments[6],"d",face(x1-2,x2+2,h-6,h+8)+face(object.x-2,object.x+2,h+8,h+42));setRunnerAttribute(mesh.ornaments[6],"fill",this.lit("#d2d2bd",illumination));
      setRunnerAttribute(mesh.ornaments[7],"d",face(object.x-3,object.x+3,h+35,h+41));setRunnerAttribute(mesh.ornaments[7],"fill",illumination<.8?"#ef9475":"#b47778");
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
      if (z < 340) for (let row=0;row<4;row++) {
        const y=80+row*(h-112)/4;
        if (frontVisible) for(let col=0;col<3;col++) {
          const x=x1+width*.12+col*width*.28;
          frontWindows.push(face(x,x+width*.12,y,y+26));
        }
        for(let col=0;col<2;col++) {
          const start=Math.max(front+2+col*object.depth*.4,NEAR_PLANE), end=Math.min(back-1,start+object.depth*.2);
          if(end>start)sideWindows.push(polygon([p(inside,start,y),p(inside,end,y),p(inside,end,y+26),p(inside,start,y+26)]));
        }
      }
      setRunnerAttribute(mesh.door,"d",frontWindows.join('')); setRunnerAttribute(mesh.awning,"d",sideWindows.join(''));
      setRunnerAttribute(mesh.door,"visibility",frontWindows.length?'visible':'hidden'); setRunnerAttribute(mesh.awning,"visibility",sideWindows.length?'visible':'hidden');
      const glass=this.lit(illumination<.8?'#d9b586':'#a1b3ae',illumination);
      setRunnerAttribute(mesh.door,"fill",glass);setRunnerAttribute(mesh.awning,"fill",glass);
      return mesh.group;
    }
    mesh.sideWindows.forEach((window, i) => {
      setRunnerAttribute(window, "visibility", platform || !detail || warehouse && i >= 4 ? "hidden" : "visible");
      if (platform || !detail || warehouse && i >= 4) return;
      const depth = front + 3 + (i % 2) * (object.depth - 5) / 2;
      const end = depth + (object.depth - 9) / 3;
      if (end <= NEAR_PLANE) { setRunnerAttribute(window, "visibility", "hidden"); return; }
      const start = Math.max(depth, NEAR_PLANE);
      const y = 96 + Math.floor(i / 2) * (h - 132) / 4;
      setRunnerAttribute(window, "d", polygon([p(inside, start, y), p(inside, end, y), p(inside, end, y + 42), p(inside, start, y + 42)]));
      setRunnerAttribute(window, "fill", (i + object.variant) % (illumination < .8 ? 2 : 4) === 0 ? "#efca8d" : "#383f56");
    });
    for (let i = 0; i < mesh.windows.length; i++) {
      const row = Math.floor(i / columns), col = i % columns;
      const shown = frontVisible && detail && i < rows * columns;
      setRunnerAttribute(mesh.windows[i], "visibility", shown ? "visible" : "hidden");
      setRunnerAttribute(mesh.glass[i], "visibility", shown ? "visible" : "hidden");
      if (!shown) continue;
      const step = (width - 30) / columns;
      const wx = platform ? x1 + 12 + i * 34 : x1 + 18 + col * step;
      const wy = platform ? 32 : 104 + row * (h - 145) / rows;
      const ww = platform ? 18 : variant === 1 ? 47 : 30;
      const wh = platform ? 18 : variant === 4 ? 31 : 42;
      setRunnerAttribute(mesh.windows[i], "d", variant === 0 && !platform ? polygon([p(wx,front,wy),p(wx+ww,front,wy),p(wx+ww,front,wy+wh-8),p(wx+ww-6,front,wy+wh-8),p(wx+ww-6,front,wy+wh),p(wx+6,front,wy+wh),p(wx+6,front,wy+wh-8),p(wx,front,wy+wh-8)]) : face(wx, wx+ww, wy, wy+wh));
      setRunnerAttribute(mesh.windows[i], "fill", (object.variant + i) % (illumination < .8 ? 2 : 5) === 0 ? "#ebbf8b" : "#45475e");
      setRunnerAttribute(mesh.glass[i], "d", face(wx + ww / 2 - 1, wx + ww / 2 + 1, wy + 2, wy + wh - 3) + face(wx + 2, wx + ww - 2, wy + wh / 2, wy + wh / 2 + 2));
      setRunnerAttribute(mesh.glass[i], "fill", "#c2b7a0");
    }
    for (let i = 0; i < mesh.ledges.length; i++) {
      setRunnerAttribute(mesh.ledges[i], "visibility", platform || !frontVisible || !detail || i >= rows ? "hidden" : "visible");
      if (!platform) { const y = 96 + i * (h - 145) / rows; setRunnerAttribute(mesh.ledges[i], "d", face(x1 - 3, x2 + 3, y, y + (variant === 3 ? 10 : 5))); }
    }
    setRunnerAttribute(mesh.door, "d", face(object.x - (warehouse?40:15), object.x + (warehouse?40:15), 0, platform ? 43 : warehouse?82:65));
    setRunnerAttribute(mesh.door, "visibility", frontVisible && detail ? "visible" : "hidden");
    setRunnerAttribute(mesh.awning, "visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible");
    mesh.stripes.forEach(path => setRunnerAttribute(path, "visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible"));
    if (!platform && detail) {
      setRunnerAttribute(mesh.awning, "fill", ["#ab6369", "#668f83", "#687a9a", "#ab8a57", "#c38261", "#608b79", "#ac729d", "#9b9c68"][variant]);
      setRunnerAttribute(mesh.awning, "d", polygon([p(x1 + 7, front, 84), p(x2 - 7, front, 84), p(x2 - 7, front - 3, 71), p(x1 + 7, front - 3, 71)]));
      for (let i = 0; i < mesh.stripes.length; i++) {
        const x = x1 + 12 + i * (width - 24) / 4;
        setRunnerAttribute(mesh.stripes[i], "d", polygon([p(x, front, 84), p(x + 13, front, 84), p(x + 13, front - 3, 71), p(x, front - 3, 71)]));
      }
    }
    mesh.ornaments.forEach(path => setRunnerAttribute(path, "visibility", platform || !frontVisible || !detail ? "hidden" : "visible"));
    if (!platform && frontVisible && detail) {
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
      const balconyHeight=142+variant%2*48;
      const balconies=[0,1].map(i=> {
        const y=balconyHeight+i*(h-170)/3;
        return polygon([p(x1+19,front-2,y),p(x2-19,front-2,y),p(x2-19,front-5,y),p(x1+19,front-5,y)])+face(x1+19,x2-19,y,y+3,front-5)+face(x1+19,x2-19,y+17,y+20,front-5)+[0,1,2,3,4].map(c=>face(x1+22+c*(width-44)/5,x1+25+c*(width-44)/5,y,y+20,front-5)).join('');
      });
      setRunnerAttribute(mesh.ornaments[10],"d",china ? [-25,25].map(x=>face(object.x+x-8,object.x+x+8,72,95)+face(object.x+x-2,object.x+x+2,65,72)).join('') : balconies.join(''));
      setRunnerAttribute(mesh.ornaments[10],"fill",this.lit(china?'#d2684e':'#b1aaa0',illumination));
      setRunnerAttribute(mesh.ornaments[10],"visibility",front>NEAR_PLANE+6?'visible':'hidden');
      setRunnerAttribute(mesh.ornaments[11],"d",face(x1+22,x1+45,4,48)+face(x2-45,x2-22,4,48)+face(x1+24,x1+43,51,58)+face(x2-43,x2-24,51,58));
      setRunnerAttribute(mesh.ornaments[11],"fill",this.lit(china?'#dfb16c':'#72928a',illumination));
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
    for (let i = this.farCount; i < this.far.length; i++) setRunnerAttribute(this.far[i].group, "display", "none");
    for (let i = this.nearCount; i < this.near.length; i++) setRunnerAttribute(this.near[i].group, "display", "none");
    for (let i = this.distantCount; i < this.distant.length; i++) setRunnerAttribute(this.distant[i].group, "display", "none");
  }
}
