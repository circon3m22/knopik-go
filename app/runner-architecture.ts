import type { RunnerObject } from "./runner-engine";

type Point = { x: number; y: number; scale: number };
export type WorldProject = (x: number, z: number, height?: number, floor?: number) => Point;
const NS = "http://www.w3.org/2000/svg";
const shape = () => document.createElementNS(NS, "path");
const polygon = (points: Point[]) => `M${points.map(point => `${point.x} ${point.y}`).join("L")}Z`;
type Mesh = { group: SVGGElement; roof: SVGPathElement; side: SVGPathElement; front: SVGPathElement; sideClip: SVGPathElement; frontClip: SVGPathElement; windows: SVGPathElement[]; sideWindows: SVGPathElement[]; ledges: SVGPathElement[]; door: SVGPathElement; awning: SVGPathElement; stripes: SVGPathElement[] };
let clipSerial = 0;
const NEAR_PLANE = -7.9;

/** Real world-space façades and roofs, rather than scaled flat house icons. */
export class RunnerArchitecture {
  private far: Mesh[];
  private near: Mesh[];
  private farCount = 0;
  private nearCount = 0;

  constructor(svg: SVGSVGElement) {
    const make = (parent: SVGElement): Mesh => {
      const group = document.createElementNS(NS, "g");
      const side = shape(), front = shape(), roof = shape(), door = shape(), awning = shape();
      const windows = Array.from({ length: 12 }, shape);
      const sideWindows = Array.from({ length: 8 }, shape);
      const ledges = Array.from({ length: 4 }, shape);
      const stripes = Array.from({ length: 4 }, shape);
      const defs = document.createElementNS(NS, "defs");
      const sideClip = shape(), frontClip = shape();
      for (const [face, paths] of [[sideClip, sideWindows], [frontClip, windows]] as const) {
        const clip = document.createElementNS(NS, "clipPath");
        clip.id = `runner-facade-${++clipSerial}`;
        clip.setAttribute("clipPathUnits", "userSpaceOnUse"); clip.append(face); defs.append(clip);
        paths.forEach(path => path.setAttribute("clip-path", `url(#${clip.id})`));
      }
      group.append(defs);
      group.append(side, ...sideWindows, front, ...ledges, ...windows, door, roof, awning, ...stripes);
      parent.append(group);
      group.setAttribute("visibility", "hidden");
      front.setAttribute("stroke", "#544858"); side.setAttribute("stroke", "#544858"); roof.setAttribute("stroke", "#e8d4b0");
      for (const path of [front, side, roof]) { path.setAttribute("stroke-width", "1.5"); path.setAttribute("stroke-linejoin", "miter"); }
      [...windows, ...sideWindows].forEach(path => { path.setAttribute("fill", "#434459"); path.setAttribute("stroke", "#e1c49b"); path.setAttribute("stroke-width", "2"); });
      ledges.forEach(path => path.setAttribute("fill", "#584c5b"));
      door.setAttribute("fill", "#4a3c4a");
      stripes.forEach(path => path.setAttribute("fill", "#e8cda5"));
      return { group, side, front, roof, sideClip, frontClip, windows, sideWindows, ledges, door, awning, stripes };
    };
    const farParent = svg.querySelector<SVGGElement>("[data-runner-far-buildings]")!;
    const nearParent = svg.querySelector<SVGGElement>("[data-runner-near-buildings]")!;
    // React's development effect replay must reuse the same bounded pool size.
    farParent.replaceChildren(); nearParent.replaceChildren();
    this.far = Array.from({ length: 20 }, () => make(farParent));
    this.near = Array.from({ length: 12 }, () => make(nearParent));
  }

  begin() { this.farCount = this.nearCount = 0; }

  draw(object: RunnerObject, z: number, project: WorldProject, wall: string, near: boolean) {
    const mesh = near ? this.near[this.nearCount++] : this.far[this.farCount++];
    if (!mesh) return;
    const platform = object.kind === "platform";
    const width = platform ? 82 : 168;
    const x1 = object.x - width / 2, x2 = object.x + width / 2;
    const front = z - object.depth / 2, back = z + object.depth / 2;
    const h = object.height;
    if (back <= NEAR_PLANE) { mesh.group.setAttribute("visibility", "hidden"); return; }
    const frontVisible = front >= NEAR_PLANE;
    const clippedFront = Math.max(front, NEAR_PLANE);
    // Street façades stay on the ground while the runner ascends to the roofs.
    const floor = platform ? undefined : 0;
    const p = (x: number, depth: number, height: number) => project(x, depth, height, floor);
    const face = (left: number, right: number, bottom: number, top: number, depth = front) => polygon([p(left, depth, bottom), p(right, depth, bottom), p(right, depth, top), p(left, depth, top)]);
    const inside = object.x < 0 ? x2 : x1;
    mesh.group.setAttribute("visibility", "visible");
    mesh.front.setAttribute("visibility", frontVisible ? "visible" : "hidden");
    const frontShape = frontVisible ? face(x1, x2, 0, h) : "";
    mesh.front.setAttribute("d", frontShape); mesh.frontClip.setAttribute("d", frontShape);
    mesh.front.setAttribute("fill", platform ? "#ae8566" : wall);
    const sideShape = polygon([p(inside, clippedFront, 0), p(inside, back, 0), p(inside, back, h), p(inside, clippedFront, h)]);
    mesh.side.setAttribute("d", sideShape); mesh.sideClip.setAttribute("d", sideShape);
    mesh.side.setAttribute("fill", platform ? "#775c58" : ["#775969", "#635b76", "#7b796c", "#6b6e80"][object.variant]);
    mesh.roof.setAttribute("d", polygon([p(x1, clippedFront, h), p(x2, clippedFront, h), p(x2, back, h), p(x1, back, h)]));
    mesh.roof.setAttribute("fill", platform ? "#d7c2a0" : "#a898a0");
    mesh.sideWindows.forEach((window, i) => {
      window.setAttribute("visibility", platform ? "hidden" : "visible");
      if (platform) return;
      const depth = front + 3 + (i % 2) * (object.depth - 5) / 2;
      const end = depth + (object.depth - 9) / 3;
      if (end <= NEAR_PLANE) { window.setAttribute("visibility", "hidden"); return; }
      const start = Math.max(depth, NEAR_PLANE);
      const y = 96 + Math.floor(i / 2) * (h - 132) / 4;
      window.setAttribute("d", polygon([p(inside, start, y), p(inside, end, y), p(inside, end, y + 42), p(inside, start, y + 42)]));
      window.setAttribute("fill", (i + object.variant) % 4 === 0 ? "#d7b487" : "#383f56");
    });
    for (let i = 0; i < mesh.windows.length; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const shown = frontVisible && (!platform || i < 2);
      mesh.windows[i].setAttribute("visibility", shown ? "visible" : "hidden");
      if (!shown) continue;
      const wx = platform ? x1 + 12 + i * 34 : x1 + 19 + col * 48;
      const wy = platform ? 32 : 96 + row * (h - 132) / 4;
      mesh.windows[i].setAttribute("d", face(wx, wx + (platform ? 18 : 29), wy, wy + (platform ? 18 : 42)));
      mesh.windows[i].setAttribute("fill", (object.variant + i) % 5 === 0 ? "#ebbf8b" : "#45475e");
    }
    for (let i = 0; i < mesh.ledges.length; i++) {
      mesh.ledges[i].setAttribute("visibility", platform || !frontVisible ? "hidden" : "visible");
      if (!platform) { const y = 88 + i * (h - 132) / 4; mesh.ledges[i].setAttribute("d", face(x1 - 3, x2 + 3, y, y + 5)); }
    }
    mesh.door.setAttribute("d", face(object.x - 15, object.x + 15, 0, platform ? 43 : 65));
    mesh.door.setAttribute("visibility", frontVisible ? "visible" : "hidden");
    mesh.awning.setAttribute("visibility", platform || front < NEAR_PLANE + 3 ? "hidden" : "visible");
    mesh.stripes.forEach(path => path.setAttribute("visibility", platform || front < NEAR_PLANE + 3 ? "hidden" : "visible"));
    if (!platform) {
      mesh.awning.setAttribute("fill", ["#ab6369", "#668f83", "#687a9a", "#ab8a57"][object.variant]);
      mesh.awning.setAttribute("d", polygon([p(x1 + 7, front, 84), p(x2 - 7, front, 84), p(x2 - 7, front - 3, 71), p(x1 + 7, front - 3, 71)]));
      for (let i = 0; i < 4; i++) {
        const x = x1 + 12 + i * 36;
        mesh.stripes[i].setAttribute("d", polygon([p(x, front, 84), p(x + 13, front, 84), p(x + 13, front - 3, 71), p(x, front - 3, 71)]));
      }
    }
  }

  end() {
    for (let i = this.farCount; i < this.far.length; i++) this.far[i].group.setAttribute("visibility", "hidden");
    for (let i = this.nearCount; i < this.near.length; i++) this.near[i].group.setAttribute("visibility", "hidden");
  }
}
