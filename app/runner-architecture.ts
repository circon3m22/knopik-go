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

  constructor(svg: SVGSVGElement) {
    svg.querySelectorAll('[data-runner-mesh="building"]').forEach(node=>node.remove());
    const make = (parent: SVGElement, detailed = true): Mesh => {
      const group = document.createElementNS(NS, "g");
      group.setAttribute("data-runner-mesh","building");
      const side = shape(), front = shape(), roof = shape(), door = shape(), awning = shape();
      const windows = Array.from({ length: detailed?12:0 }, shape);
      const glass = Array.from({ length: detailed?12:0 }, shape);
      const sideWindows = Array.from({ length: detailed?8:0 }, shape);
      const ledges = Array.from({ length: detailed?4:0 }, shape);
      const stripes = Array.from({ length: detailed?4:0 }, shape);
      const ornaments = Array.from({ length: detailed?10:0 }, shape);
      const sign = document.createElementNS(NS, "text");
      sign.setAttribute("text-anchor", "middle"); sign.setAttribute("font-family", "Knopik Pixel, monospace");
      const defs = document.createElementNS(NS, "defs");
      const sideClip = shape(), frontClip = shape();
      for (const [face, paths] of [[sideClip, sideWindows], [frontClip, [...windows, ...glass]]] as const) {
        if(!paths.length)continue;
        const clip = document.createElementNS(NS, "clipPath");
        clip.id = `runner-facade-${++clipSerial}`;
        clip.setAttribute("clipPathUnits", "userSpaceOnUse"); clip.append(face); defs.append(clip);
        paths.forEach(path => path.setAttribute("clip-path", `url(#${clip.id})`));
      }
      group.append(defs);
      group.append(side, ...sideWindows, front, ...ledges, ...windows, ...glass, door, roof, ...ornaments, awning, ...stripes, sign);
      parent.append(group);
      group.setAttribute("display", "none");
      front.setAttribute("stroke", "#544858"); side.setAttribute("stroke", "#544858"); roof.setAttribute("stroke", "#e8d4b0");
      for (const path of [front, side, roof]) { path.setAttribute("stroke-width", "1.5"); path.setAttribute("stroke-linejoin", "miter"); }
      [...windows, ...sideWindows].forEach(path => { path.setAttribute("fill", "#434459"); path.setAttribute("stroke", "#e1c49b"); path.setAttribute("stroke-width", "2"); });
      ledges.forEach(path => path.setAttribute("fill", "#584c5b"));
      door.setAttribute("fill", "#4a3c4a");
      stripes.forEach(path => path.setAttribute("fill", "#e8cda5"));
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
    const mesh = background ? this.distant[this.distantCount++] : near ? this.near[this.nearCount++] : z>=150 ? this.distant[this.distantCount++] : this.far[this.farCount++];
    if (!mesh) return null;
    const platform = object.kind === "platform";
    const variant = object.variant % 8;
    const width = platform ? 82 : background ? 180 + variant * 11 : [152, 186, 170, 206, 160, 188, 180, 148][variant];
    const warehouse = !platform && object.district === 2;
    const rows = platform ? 1 : warehouse ? 2 : variant % 3 === 0 ? 3 : 4;
    const columns = platform ? 2 : variant % 3 === 1 ? 2 : 3;
    const detail = !background && z < 150;
    const x1 = object.x - width / 2, x2 = object.x + width / 2;
    const front = z - object.depth / 2, back = z + object.depth / 2;
    const h = object.height;
    if (back <= NEAR_PLANE) { mesh.group.setAttribute("display", "none"); return null; }
    const frontVisible = front >= NEAR_PLANE;
    const clippedFront = Math.max(front, NEAR_PLANE);
    // Façades and their details follow the same street elevation as road objects.
    const p = (x: number, depth: number, height: number) => project(x, depth, height);
    const face = (left: number, right: number, bottom: number, top: number, depth = front) => polygon([p(left, depth, bottom), p(right, depth, bottom), p(right, depth, top), p(left, depth, top)]);
    const inside = object.x < 0 ? x2 : x1;
    mesh.group.setAttribute("display", "inline");
    mesh.front.setAttribute("visibility", frontVisible ? "visible" : "hidden");
    const frontShape = frontVisible ? face(x1, x2, 0, h) : "";
    mesh.front.setAttribute("d", frontShape); mesh.frontClip.setAttribute("d", frontShape);
    mesh.front.setAttribute("fill", platform ? "#ae8566" : wall);
    const sideShape = polygon([p(inside, clippedFront, 0), p(inside, back, 0), p(inside, back, h), p(inside, clippedFront, h)]);
    mesh.side.setAttribute("d", sideShape); mesh.sideClip.setAttribute("d", sideShape);
    mesh.side.setAttribute("fill", runnerLitColor(platform ? "#775c58" : ["#775969", "#635b76", "#7b796c", "#6b6e80", "#84664f", "#4e6d69", "#77636c", "#766f59"][variant], illumination));
    mesh.roof.setAttribute("d", polygon([p(x1, clippedFront, h), p(x2, clippedFront, h), p(x2, back, h), p(x1, back, h)]));
    mesh.roof.setAttribute("fill", runnerLitColor(platform ? "#d7c2a0" : ["#bd7961", "#879999", "#68747d", "#a48d76", "#797b64", "#ac7265", "#968599", "#847861"][variant], illumination));
    mesh.sideWindows.forEach((window, i) => {
      window.setAttribute("visibility", platform || !detail || warehouse && i >= 4 ? "hidden" : "visible");
      if (platform || !detail || warehouse && i >= 4) return;
      const depth = front + 3 + (i % 2) * (object.depth - 5) / 2;
      const end = depth + (object.depth - 9) / 3;
      if (end <= NEAR_PLANE) { window.setAttribute("visibility", "hidden"); return; }
      const start = Math.max(depth, NEAR_PLANE);
      const y = 96 + Math.floor(i / 2) * (h - 132) / 4;
      window.setAttribute("d", polygon([p(inside, start, y), p(inside, end, y), p(inside, end, y + 42), p(inside, start, y + 42)]));
      window.setAttribute("fill", (i + object.variant) % (illumination < .8 ? 2 : 4) === 0 ? "#efca8d" : "#383f56");
    });
    for (let i = 0; i < mesh.windows.length; i++) {
      const row = Math.floor(i / columns), col = i % columns;
      const shown = frontVisible && detail && i < rows * columns;
      mesh.windows[i].setAttribute("visibility", shown ? "visible" : "hidden");
      mesh.glass[i].setAttribute("visibility", shown ? "visible" : "hidden");
      if (!shown) continue;
      const step = (width - 30) / columns;
      const wx = platform ? x1 + 12 + i * 34 : x1 + 18 + col * step;
      const wy = platform ? 32 : 104 + row * (h - 145) / rows;
      const ww = platform ? 18 : variant === 1 ? 47 : 30;
      const wh = platform ? 18 : variant === 4 ? 31 : 42;
      mesh.windows[i].setAttribute("d", variant === 0 && !platform ? polygon([p(wx,front,wy),p(wx+ww,front,wy),p(wx+ww,front,wy+wh-8),p(wx+ww-6,front,wy+wh-8),p(wx+ww-6,front,wy+wh),p(wx+6,front,wy+wh),p(wx+6,front,wy+wh-8),p(wx,front,wy+wh-8)]) : face(wx, wx+ww, wy, wy+wh));
      mesh.windows[i].setAttribute("fill", (object.variant + i) % (illumination < .8 ? 2 : 5) === 0 ? "#ebbf8b" : "#45475e");
      mesh.glass[i].setAttribute("d", face(wx + ww / 2 - 1, wx + ww / 2 + 1, wy + 2, wy + wh - 3) + face(wx + 2, wx + ww - 2, wy + wh / 2, wy + wh / 2 + 2));
      mesh.glass[i].setAttribute("fill", "#c2b7a0");
    }
    for (let i = 0; i < mesh.ledges.length; i++) {
      mesh.ledges[i].setAttribute("visibility", platform || !frontVisible || !detail || i >= rows ? "hidden" : "visible");
      if (!platform) { const y = 96 + i * (h - 145) / rows; mesh.ledges[i].setAttribute("d", face(x1 - 3, x2 + 3, y, y + (variant === 3 ? 10 : 5))); }
    }
    mesh.door.setAttribute("d", face(object.x - (warehouse?40:15), object.x + (warehouse?40:15), 0, platform ? 43 : warehouse?82:65));
    mesh.door.setAttribute("visibility", frontVisible && detail ? "visible" : "hidden");
    mesh.awning.setAttribute("visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible");
    mesh.stripes.forEach(path => path.setAttribute("visibility", platform || !detail || front < NEAR_PLANE + 3 ? "hidden" : "visible"));
    if (!platform && detail) {
      mesh.awning.setAttribute("fill", ["#ab6369", "#668f83", "#687a9a", "#ab8a57", "#c38261", "#608b79", "#ac729d", "#9b9c68"][variant]);
      mesh.awning.setAttribute("d", polygon([p(x1 + 7, front, 84), p(x2 - 7, front, 84), p(x2 - 7, front - 3, 71), p(x1 + 7, front - 3, 71)]));
      for (let i = 0; i < mesh.stripes.length; i++) {
        const x = x1 + 12 + i * (width - 24) / 4;
        mesh.stripes[i].setAttribute("d", polygon([p(x, front, 84), p(x + 13, front, 84), p(x + 13, front - 3, 71), p(x, front - 3, 71)]));
      }
    }
    mesh.ornaments.forEach(path => path.setAttribute("visibility", platform || !frontVisible || !detail ? "hidden" : "visible"));
    if (!platform && frontVisible && detail) {
      const roofFace = mesh.ornaments[0];
      const ridge = variant % 3 === 0 ? 30 : 9;
      roofFace.setAttribute("d", variant % 3 === 0 ? polygon([p(x1,front,h),p(x1+width*.2,front,h),p(x1+width*.2,front,h+ridge/2),p(object.x-15,front,h+ridge/2),p(object.x-15,front,h+ridge),p(object.x+15,front,h+ridge),p(object.x+15,front,h+ridge/2),p(x2-width*.2,front,h+ridge/2),p(x2-width*.2,front,h),p(x2,front,h)]) : face(x1-3,x2+3,h-5,h+ridge));
      roofFace.setAttribute("fill", "#e1c59d");
      mesh.ornaments[1].setAttribute("d", face(x1+18,x1+34,h,h+27)); mesh.ornaments[1].setAttribute("fill", "#755765");
      mesh.ornaments[2].setAttribute("d", face(x1+7,x1+14,0,h)); mesh.ornaments[2].setAttribute("fill", "#e1c59d");
      mesh.ornaments[3].setAttribute("d", face(x2-14,x2-7,0,h)); mesh.ornaments[3].setAttribute("fill", "#e1c59d");
      mesh.ornaments[4].setAttribute("d", face(x1+20,x2-20,65,82)); mesh.ornaments[4].setAttribute("fill", variant === 6 ? "#684f77" : "#424e55");
      mesh.ornaments[5].setAttribute("d", face(object.x-28,object.x+28,h-45,h-24)); mesh.ornaments[5].setAttribute("fill", variant === 7 ? "#c2bc8f" : "#8a7778");
      mesh.ornaments[6].setAttribute("d", face(x2-40,x2-19,94,115)); mesh.ornaments[6].setAttribute("fill", "#a5b0ac");
      mesh.ornaments[7].setAttribute("d", face(x2-37,x2-22,99,102)+face(x2-37,x2-22,105,108)); mesh.ornaments[7].setAttribute("fill", "#586e78");
      mesh.ornaments[8].setAttribute("d", face(object.x-20,object.x+20,2,5)+face(object.x-3,object.x-1,4,53)+face(object.x+3,object.x+5,4,53)); mesh.ornaments[8].setAttribute("fill", "#a59b8b");
      mesh.ornaments[9].setAttribute("d", [0,1,2,3].map(i => face(x1+20+i%2*22,x1+35+i%2*22,19+Math.floor(i/2)*11,22+Math.floor(i/2)*11)).join("")); mesh.ornaments[9].setAttribute("fill", "#93806f");
    }
    const signPoint = p(object.x,front,68);
    mesh.sign.setAttribute("visibility", !platform && detail && frontVisible && z < 100 ? "visible" : "hidden");
    mesh.sign.setAttribute("x", String(signPoint.x)); mesh.sign.setAttribute("y", String(signPoint.y));
    mesh.sign.setAttribute("font-size", String(Math.max(1,12*signPoint.scale))); mesh.sign.setAttribute("fill", "#f9e7b1");
    const label = (warehouse ? ["ДОК 01","СКЛАД","ПОРТ","МОРЕ","ДОК 02","МАСТЕРСКАЯ","ГРУЗЫ","ДОК 03"] : object.district===3 ? ["КИНО","БАР","МУЗЫКА","КЛУБ","ЛАПША","ТАКСИ","АРКАДА","24 ЧАСА"] : ["ПЕКАРНЯ", "КАФЕ", "ПОЧТА", "РЫНОК", "ЧАЙ", "АПТЕКА", "АРКАДА", "ЧАСЫ"])[variant];
    if (mesh.sign.textContent !== label) mesh.sign.textContent = label;
    return mesh.group;
  }

  end() {
    for (let i = this.farCount; i < this.far.length; i++) this.far[i].group.setAttribute("display", "none");
    for (let i = this.nearCount; i < this.near.length; i++) this.near[i].group.setAttribute("display", "none");
    for (let i = this.distantCount; i < this.distant.length; i++) this.distant[i].group.setAttribute("display", "none");
  }
}
