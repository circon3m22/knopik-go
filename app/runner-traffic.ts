import { setRunnerAttribute } from "./runner-svg.ts";
import type { RunnerObject } from "./runner-engine";
import type { WorldProject } from "./runner-architecture";

const NS = "http://www.w3.org/2000/svg";
const colors = ["#cc655a", "#78a8ab", "#eed8b6", "#80916b", "#bd9ac4", "#d6a34c", "#567698", "#bebdc4"];
type Mesh = { group: SVGGElement; paths: SVGPathElement[] };
const polygon = (points: {x: number; y: number}[]) => `M${points.map(p => `${p.x} ${p.y}`).join("L")}Z`;

/** Bounded pools of projected polygon cars, rails and train coaches. No frame creates DOM. */
export class RunnerTraffic {
  private cars: Mesh[];
  private crossings: Mesh[];
  private carIndex = 0;
  private crossingIndex = 0;
  constructor(svg: SVGSVGElement) {
    svg.querySelectorAll('[data-runner-mesh="traffic"]').forEach(node=>node.remove());
    const make = (parent: SVGElement, count: number) => {
      const group = document.createElementNS(NS, "g");
      setRunnerAttribute(group, "data-runner-mesh","traffic");
      const paths = Array.from({length: count}, () => document.createElementNS(NS, "path"));
      group.append(...paths); parent.append(group); setRunnerAttribute(group, "display", "none");
      return {group, paths};
    };
    const cars = svg.querySelector<SVGGElement>("[data-runner-traffic]")!;
    const crossings = svg.querySelector<SVGGElement>("[data-runner-crossings]")!;
    cars.replaceChildren(); crossings.replaceChildren();
    this.cars = Array.from({length: 48}, () => make(cars, 20));
    this.crossings = Array.from({length: 3}, () => make(crossings, 72));
  }
  begin() { this.carIndex = this.crossingIndex = 0; }
  draw(object: RunnerObject, z: number, project: WorldProject, clock: number, reducedMotion: boolean) {
    if (object.kind === "crossing") return this.crossing(object, z, project);
    const mesh = this.cars[this.carIndex++];
    if (!mesh) return;
    setRunnerAttribute(mesh.group, "display", "inline");
    let index = 0;
    const face = (points: [number, number, number][], fill: string) => {
      const path = mesh.paths[index++]; if (!path) return;
      setRunnerAttribute(path, "d", polygon(points.map(([x, d, h]) => project(object.x + x, z + d, h))));
      setRunnerAttribute(path, "fill", fill); setRunnerAttribute(path, "visibility", "visible");
    };
    const rect = (x1: number, x2: number, d: number, y1: number, y2: number, fill: string) => face([[x1,d,y1],[x2,d,y1],[x2,d,y2],[x1,d,y2]],fill);
    const top = (x1: number, x2: number, d1: number, d2: number, h: number, fill: string) => face([[x1,d1,h],[x2,d1,h],[x2,d2,h],[x1,d2,h]],fill);
    const paint = colors[object.variant];
    if(object.kind === "truck") {
      top(-35,35,-10,10,0,"#292b3b80");
      for(const x of [-34,27])face([[x,-7,2],[x+7,-7,2],[x+7,7,2],[x,7,2]],"#242a33");
      face([[-34,0,16],[-34,9,16],[-34,9,136],[-34,0,136]],"#637887");
      face([[34,0,16],[34,9,16],[34,9,136],[34,0,136]],"#81979d");
      rect(-34,34,0,16,136,"#b5bdb2");top(-34,34,0,9,136,"#e6d9be");
      for(const x of [-25,-9,7,23])rect(x,x+3,-.1,26,126,"#8e9c9b");
      face([[-32,-9,12],[-32,0,12],[-32,0,70],[-32,-9,70]],"#597182");
      face([[32,-9,12],[32,0,12],[32,0,70],[32,-9,70]],paint);
      rect(-32,32,-9,12,70,paint);top(-32,32,-9,0,70,paint);
      rect(-26,26,-9.1,43,65,"#233d50");rect(-22,-2,-9.2,46,62,"#9bbfc0");
      rect(-29,29,-9.1,15,21,"#aeb5ab");rect(-28,-19,-9.2,27,34,"#f5d49a");rect(19,28,-9.2,27,34,"#f5d49a");
      for (;index<mesh.paths.length;index++)setRunnerAttribute(mesh.paths[index], "visibility","hidden");
      return mesh.group;
    }
    const coupe = object.variant % 3 === 0;
    top(-34,34,-10,10,0,"#292b3b80");
    for (const x of [-32, 25]) face([[x,-6,3],[x+7,-6,3],[x+7,6,3],[x,6,3]],"#242a33");
    face([[-31,-9,9],[-31,9,9],[-31,9,43],[-31,-9,43]],"#536073");
    face([[31,-9,9],[31,9,9],[31,9,43],[31,-9,43]],paint);
    rect(-31,31,-9,9,43,paint);
    top(-31,31,-9,9,43,paint);
    face([[-27,-4,43],[-22,6,62],[22,6,62],[27,-4,43]],"#243e51");
    top(-22,22,0,6,62,paint);
    face([[-27,-4,43],[-22,0,62],[22,0,62],[27,-4,43]],"#263d4d");
    face([[-23,-3.7,46],[-19,0,59],[18,0,59],[23,-3.7,46]],"#8bb9c5");
    face([[-19,-2.8,48],[-16,0,57],[-2,0,57],[-6,-2.8,48]],"#c3dadd");
    top(-28,28,-8,-4,44,paint);
    rect(-30,30,-9.1,10,15,"#b9bfbb");
    rect(-21,21,-9.2,16,21,"#3d434b");
    rect(-8,8,-9.3,17,21,"#f0e5c9");
    const on = object.activatedAt >= 0 && (reducedMotion || Math.floor((clock-object.activatedAt)*4)%2 === 0);
    rect(-28,-19,-9.4,29,36,on ? "#ffcf63" : "#b85249");
    rect(19,28,-9.4,29,36,on ? "#ffcf63" : "#b85249");
    if (!coupe) top(-16,16,1,5,62.5,"#c3d9da");
    for (; index < mesh.paths.length; index++) setRunnerAttribute(mesh.paths[index], "visibility", "hidden");
    return mesh.group;
  }
  private crossing(object: RunnerObject, z: number, project: WorldProject) {
    const mesh = this.crossings[this.crossingIndex++]; if (!mesh) return;
    setRunnerAttribute(mesh.group, "display", "inline");
    let index = 0;
    const face = (points: [number, number, number][], fill: string) => {
      const path = mesh.paths[index++]; if (!path) return;
      setRunnerAttribute(path, "d", polygon(points.map(([x,d,h]) => project(x,z+d,h,0))));
      setRunnerAttribute(path, "fill",fill); setRunnerAttribute(path, "visibility","visible");
    };
    // Ballast and rails continue beyond the road through the reserved city gap.
    face([[-1200,-8,0],[1200,-8,0],[1200,8,0],[-1200,8,0]],"#8c8580");
    let sleepers = "";
    for (let x=-1200;x<=1200;x+=38) sleepers += polygon([[x-5,-6,1],[x+5,-6,1],[x+5,6,1],[x-5,6,1]].map(([xx,d,h])=>project(xx,z+d,h,0)));
    setRunnerAttribute(mesh.paths[index], "d",sleepers); setRunnerAttribute(mesh.paths[index], "fill","#796956"); setRunnerAttribute(mesh.paths[index++], "visibility","visible");
    for (const d of [-4,4]) face([[-1200,d,3],[1200,d,3],[1200,d+.65,3],[-1200,d+.65,3]],"#c3c9c8");
    for (const x of [-170,170]) {
      face([[x-3,-2,0],[x+3,-2,0],[x+3,-2,102],[x-3,-2,102]],"#463b46");
      face([[x-15,-2,81],[x+15,-2,81],[x+15,-2,100],[x-15,-2,100]],"#eed8a2");
      face([[x-12,-2.1,86],[x-4,-2.1,86],[x-4,-2.1,95],[x-12,-2.1,95]],z > 28 && z < 110 ? "#e56d60" : "#6d8b67");
      face([[x+4,-2.1,86],[x+12,-2.1,86],[x+12,-2.1,95],[x+4,-2.1,95]],z > 28 && z < 110 ? "#e56d60" : "#6d8b67");
    }
    // Distance, rather than a wall clock, guarantees the last coach clears the street
    // at z=28, well before the player at z=6, including turbo and pause/resume.
    if (z < 110 && z > 28) {
      const nose = -1050 + (110-z)/82*2450;
      for (let coach = 4; coach >= 0; coach--) {
        const left = nose-coach*152-145, right = nose-coach*152;
        const roofEnd = coach === 0 ? right-30 : right;
        face(coach === 0 ? [[left,-6,10],[right,-6,10],[right,-6,40],[right-14,-6,69],[roofEnd,-6,88],[left,-6,88]] : [[left,-6,10],[right,-6,10],[right,-6,88],[left,-6,88]],"#dae0d5");
        face([[left,-6,88],[roofEnd,-6,88],[roofEnd,6,88],[left,6,88]],"#f5e8cd");
        face(coach === 0 ? [[right,-6,10],[right,6,10],[right,6,40],[right-14,6,69],[roofEnd,6,88],[roofEnd,-6,88],[right-14,-6,69],[right,-6,40]] : [[right,-6,10],[right,6,10],[right,6,88],[right,-6,88]],"#98b3b6");
        face([[left,-6.1,26],[right,-6.1,26],[right,-6.1,37],[left,-6.1,37]],"#cc6259");
        face([[left+8,-6.2,48],[roofEnd-8,-6.2,48],[roofEnd-8,-6.2,76],[left+8,-6.2,76]],"#294954");
        for (const wx of [left+15,left+49,left+83]) face([[wx,-6.3,53],[wx+23,-6.3,53],[wx+23,-6.3,69],[wx,-6.3,69]],"#8bbcb7");
        for (const wx of [left+20,roofEnd-25]) face([[wx,-6.3,3],[wx+17,-6.3,3],[wx+17,-6.3,14],[wx,-6.3,14]],"#343e4b");
        if (coach === 0) face([[roofEnd,-6.4,72],[right-14,-6.4,59],[right-18,-6.4,47],[roofEnd-12,-6.4,57]],"#304c5c");
      }
    }
    for (;index<mesh.paths.length;index++) setRunnerAttribute(mesh.paths[index], "visibility","hidden");
    return mesh.group;
  }
  end() {
    for (let i=this.carIndex;i<this.cars.length;i++) setRunnerAttribute(this.cars[i].group, "display", "none");
    for (let i=this.crossingIndex;i<this.crossings.length;i++) setRunnerAttribute(this.crossings[i].group, "display", "none");
  }
}
