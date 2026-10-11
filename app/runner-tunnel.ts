import type { RunnerObject } from "./runner-engine";
import type { WorldProject } from "./runner-architecture";
const NS = "http://www.w3.org/2000/svg";
const polygon = (points: { x: number; y: number }[]) => `M${points.map(p => `${p.x} ${p.y}`).join("L")}Z`;
/** Pooled, projected tunnel sections share the same depth order as traffic. */
export class RunnerTunnel {
  private pool: { group: SVGGElement; surfaces: SVGPathElement[] }[];
  private used = 0;
  constructor(svg: SVGSVGElement) {
    svg.querySelectorAll('[data-runner-mesh="tunnel"]').forEach(node => node.remove());
    const parent = svg.querySelector<SVGGElement>('[data-runner-tunnel]')!;
    this.pool = Array.from({ length: 30 }, () => {
      const group = document.createElementNS(NS, "g"); group.setAttribute("data-runner-mesh", "tunnel"); group.setAttribute("display", "none");
      const surfaces = Array.from({ length: 15 }, () => document.createElementNS(NS, "path"));
      group.append(...surfaces); parent.append(group); return { group, surfaces };
    });
  }
  begin() { this.used = 0; }
  draw(object: RunnerObject, z: number, project: WorldProject, clock: number, reduced: boolean) {
    const mesh = this.pool[this.used++]; if (!mesh) return null;
    const near = Math.max(-7.9, z - 14), far = z + 14;
    if (far <= -7.9) { mesh.group.setAttribute("display", "none"); return null; }
    mesh.group.setAttribute("display", "inline");
    const p = (x: number, d: number, h = 0) => project(x, d, h);
    const wall = (x: number, h1: number, h2: number) => polygon([p(x, near, h1), p(x, far, h1), p(x, far, h2), p(x, near, h2)]);
    const face = (x1: number, x2: number, h1: number, h2: number, d: number) => polygon([p(x1, d, h1), p(x2, d, h1), p(x2, d, h2), p(x1, d, h2)]);
    const shapes = [wall(-164, 0, 380), wall(164, 0, 380), polygon([p(-164, near, 380), p(164, near, 380), p(164, far, 380), p(-164, far, 380)])];
    const colors = ["#253047", "#2d314a", "#1b2338"];
    for (let i = 0; i < 3; i++) { mesh.surfaces[i].setAttribute("d", shapes[i]); mesh.surfaces[i].setAttribute("fill", colors[i]); }
    const hue = (object.variant + (reduced ? 0 : Math.floor(clock * 2))) % 4;
    const neon = ["#83ece1", "#cc93f3", "#f991c3", "#dce987"][hue];
    const glow = ["#47737c", "#66567b", "#794b69", "#637455"][hue];
    const portals = [face(-166, -158, 0, 380, far), face(158, 166, 0, 380, far), face(-164, 164, 376, 384, far)];
    for (let i = 0; i < 3; i++) { mesh.surfaces[3 + i].setAttribute("d", portals[i]); mesh.surfaces[3 + i].setAttribute("fill", neon); }
    for (let side = 0; side < 2; side++) {
      const x = side ? 163 : -163;
      mesh.surfaces[6 + side].setAttribute("d", wall(x, 22, 27)); mesh.surfaces[6 + side].setAttribute("fill", neon);
      mesh.surfaces[8 + side].setAttribute("d", wall(x, 86, 148)); mesh.surfaces[8 + side].setAttribute("fill", glow);
      mesh.surfaces[10 + side].setAttribute("d", wall(x, 112, 120)); mesh.surfaces[10 + side].setAttribute("fill", "#323e56");
      mesh.surfaces[12 + side].setAttribute("d", polygon([p(side ? 142 : -160, near), p(side ? 160 : -142, near), p(side ? 160 : -142, far), p(side ? 142 : -160, far)])); mesh.surfaces[12 + side].setAttribute("fill", glow);
    }
    mesh.surfaces[14].setAttribute("d", polygon([p(-15, near, 379), p(15, near, 379), p(15, far, 379), p(-15, far, 379)])); mesh.surfaces[14].setAttribute("fill", "#6b7c92");
    return mesh.group;
  }
  end() { for (let i = this.used; i < this.pool.length; i++) this.pool[i].group.setAttribute("display", "none"); }
}
