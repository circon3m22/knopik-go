import { setRunnerAttribute } from "./runner-svg.ts";
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
      const group = document.createElementNS(NS, "g"); setRunnerAttribute(group, "data-runner-mesh", "tunnel"); setRunnerAttribute(group, "display", "none");
      const surfaces = Array.from({ length: 15 }, () => document.createElementNS(NS, "path"));
      group.append(...surfaces); parent.append(group); return { group, surfaces };
    });
  }
  begin() { this.used = 0; }
  draw(object: RunnerObject, z: number, project: WorldProject, clock: number, reduced: boolean) {
    const mesh = this.pool[this.used++]; if (!mesh) return null;
    const near = Math.max(-7.9, z - 14), far = z + 14;
    if (far <= -7.9) { setRunnerAttribute(mesh.group, "display", "none"); return null; }
    setRunnerAttribute(mesh.group, "display", "inline");
    const p = (x: number, d: number, h = 0) => project(x, d, h);
    const wall = (x: number, h1: number, h2: number) => polygon([p(x, near, h1), p(x, far, h1), p(x, far, h2), p(x, near, h2)]);
    const face = (x1: number, x2: number, h1: number, h2: number, d: number) => polygon([p(x1, d, h1), p(x2, d, h1), p(x2, d, h2), p(x1, d, h2)]);
    const shapes = [wall(-164, 0, 380), wall(164, 0, 380), polygon([p(-164, near, 380), p(164, near, 380), p(164, far, 380), p(-164, far, 380)])];
    const colors = ["#253047", "#2d314a", "#1b2338"];
    for (let i = 0; i < 3; i++) { setRunnerAttribute(mesh.surfaces[i], "d", shapes[i]); setRunnerAttribute(mesh.surfaces[i], "fill", colors[i]); }
    const hue = (object.variant + (reduced ? 0 : Math.floor(clock * 2))) % 4;
    const neon = ["#83ece1", "#cc93f3", "#f991c3", "#dce987"][hue];
    const glow = ["#47737c", "#66567b", "#794b69", "#637455"][hue];
    const portals = [face(-166, -158, 0, 380, far), face(158, 166, 0, 380, far), face(-164, 164, 376, 384, far)];
    for (let i = 0; i < 3; i++) { setRunnerAttribute(mesh.surfaces[3 + i], "d", portals[i]); setRunnerAttribute(mesh.surfaces[3 + i], "fill", neon); }
    for (let side = 0; side < 2; side++) {
      const x = side ? 163 : -163;
      setRunnerAttribute(mesh.surfaces[6 + side], "d", wall(x, 22, 27)); setRunnerAttribute(mesh.surfaces[6 + side], "fill", neon);
      setRunnerAttribute(mesh.surfaces[8 + side], "d", wall(x, 86, 148)); setRunnerAttribute(mesh.surfaces[8 + side], "fill", glow);
      setRunnerAttribute(mesh.surfaces[10 + side], "d", wall(x, 112, 120)); setRunnerAttribute(mesh.surfaces[10 + side], "fill", "#323e56");
      setRunnerAttribute(mesh.surfaces[12 + side], "d", polygon([p(side ? 142 : -160, near), p(side ? 160 : -142, near), p(side ? 160 : -142, far), p(side ? 142 : -160, far)])); setRunnerAttribute(mesh.surfaces[12 + side], "fill", glow);
    }
    setRunnerAttribute(mesh.surfaces[14], "d", polygon([p(-15, near, 379), p(15, near, 379), p(15, far, 379), p(-15, far, 379)])); setRunnerAttribute(mesh.surfaces[14], "fill", "#6b7c92");
    return mesh.group;
  }
  end() { for (let i = this.used; i < this.pool.length; i++) setRunnerAttribute(this.pool[i].group, "display", "none"); }
}
