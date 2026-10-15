// The projection renderer writes to this small in-memory SVG tree. The browser
// sees one canvas, rather than thousands of SVG style/layout invalidations.
export type RunnerBounds = { x: number; y: number; width: number; height: number };
export type RunnerProjectedPath = { polygons: [number,number][][]; serialized: string | null };
const PRESENTATION_ATTRIBUTES=new Set(["fill","stroke","stroke-width","fill-opacity","stroke-opacity","font-size","stroke-linejoin","stroke-linecap","font-family","text-anchor"]);
export class RunnerSceneDocument {
  readonly ids = new Map<string, RunnerSceneNode>();
  readonly bounds: () => RunnerBounds;
  constructor(bounds: () => RunnerBounds) { this.bounds = bounds; }
  createElementNS(_namespace: string, tag: string) { return new RunnerSceneNode(tag, this); }
}

export class RunnerSceneNode {
  readonly attrs = new Map<string, string>();
  readonly children: RunnerSceneNode[] = [];
  parent: RunnerSceneNode | null = null;
  textContent = "";
  // Only source art is measured, once, before hiding the source SVG.
  bounds: RunnerBounds | null = null;
  readonly variables = new Map<string, string>();
  presentationVersion=0;
  projectedPath: RunnerProjectedPath | null = null;
  readonly style = { setProperty: (name: string, value: string) => { this.variables.set(name, value); } };
  readonly tag: string;
  readonly ownerDocument: RunnerSceneDocument;
  constructor(tag: string, ownerDocument: RunnerSceneDocument) { this.tag = tag; this.ownerDocument = ownerDocument; }
  get id() { return this.getAttribute("id") ?? ""; }
  set id(value: string) { this.setAttribute("id", value); }
  get firstElementChild(): RunnerSceneNode | null { return this.children[0] ?? null; }
  get lastElementChild(): RunnerSceneNode | null { return this.children.at(-1) ?? null; }
  getAttribute(name: string) {
    if(name==="d"&&this.projectedPath){
      this.projectedPath.serialized??=this.projectedPath.polygons.map(points=>`M${points.map(p=>`${p[0]} ${p[1]}`).join("L")}Z`).join("");
      this.attrs.set("d",this.projectedPath.serialized);
    }
    return this.attrs.get(name) ?? null;
  }
  setProjectedPolygons(polygons: {x:number;y:number}[][]) {
    const old=this.projectedPath?.polygons;
    if(old&&old.length===polygons.length&&polygons.every((p,i)=>p.length===old[i].length&&p.every((v,j)=>v.x===old[i][j][0]&&v.y===old[i][j][1])))return;
    this.projectedPath={polygons:polygons.map(points=>points.map(p=>[p.x,p.y])),serialized:null};
    this.attrs.delete("d");
  }
  setAttribute(name: string, value: string) {
    if(name==="d")this.projectedPath=null;
    if(PRESENTATION_ATTRIBUTES.has(name)&&this.attrs.get(name)!==String(value))this.presentationVersion++;
    if (name === "id") {
      if (this.id) this.ownerDocument.ids.delete(this.id);
      this.ownerDocument.ids.set(value, this);
    }
    this.attrs.set(name, String(value));
  }
  removeAttribute(name: string) {
    if(name==="d")this.projectedPath=null;
    if(PRESENTATION_ATTRIBUTES.has(name)&&this.attrs.has(name))this.presentationVersion++;
    if (name === "id") this.ownerDocument.ids.delete(this.id);
    this.attrs.delete(name);
  }
  append(...nodes: RunnerSceneNode[]) { for (const node of nodes) this.insertBefore(node, null); }
  insertBefore(node: RunnerSceneNode, reference: RunnerSceneNode | null) {
    if (node === reference) return;
    node.remove(); node.parent = this;
    const index = reference ? this.children.indexOf(reference) : -1;
    if (index < 0) this.children.push(node); else this.children.splice(index, 0, node);
  }
  remove() {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) this.parent.children.splice(index, 1);
    }
    this.parent = null;
  }
  replaceChildren(...nodes: RunnerSceneNode[]) {
    for (const child of this.children) child.parent = null;
    this.children.length = 0; this.append(...nodes);
  }
  private matches(selector: string) {
    if (!selector.startsWith("[")) return this.tag === selector;
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return !!match && this.attrs.has(match[1]) && (match[2] === undefined || this.getAttribute(match[1]) === match[2]);
  }
  querySelectorAll(selector: string): RunnerSceneNode[] {
    const child = selector.split(/\s*>\s*/);
    if (child.length === 2) return this.querySelectorAll(child[0]).flatMap(node => node.children.filter(node => node.matches(child[1])));
    const descendant = selector.split(/\s+(?=\[)/);
    if (descendant.length > 1) return this.querySelectorAll(descendant[0]).flatMap(node => node.querySelectorAll(descendant.slice(1).join(" ")));
    const result: RunnerSceneNode[] = [];
    const visit = (node: RunnerSceneNode) => {
      for (const child of node.children) { if (child.matches(selector)) result.push(child); visit(child); }
    };
    visit(this); return result;
  }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
  getBoundingClientRect() { return this.ownerDocument.bounds(); }
}

export function cloneRunnerScene(source: SVGSVGElement, bounds: () => RunnerBounds) {
  const document = new RunnerSceneDocument(bounds);
  const clone = (element: Element): RunnerSceneNode => {
    const node = document.createElementNS("", element.localName);
    for (const attribute of Array.from(element.attributes)) node.setAttribute(attribute.name, attribute.value);
    const style = (element as SVGElement).style;
    for (let i = 0; i < style.length; i++) if (style[i].startsWith("--")) node.variables.set(style[i], style.getPropertyValue(style[i]));
    if (element.localName === "text") node.textContent = element.textContent ?? "";
    // Art groups and their descendants only; pooled world geometry is generated
    // later and never reads layout or getBBox during animation.
    const rig = ["leg-left", "leg-right", "arm-left", "arm-right", "tail", "head", "roll", "collar"].some(part => element.hasAttribute(`data-runner-${part}`));
    if ((element.id && element.closest("defs") || rig) && "getBBox" in element) {
      const box = (element as SVGGraphicsElement).getBBox();
      if (box.width > 0 && box.height > 0) node.bounds = { x: box.x - 3, y: box.y - 3, width: box.width + 6, height: box.height + 6 };
    }
    for (const child of Array.from(element.children)) node.append(clone(child));
    return node;
  };
  const scene = clone(source), defs = scene.querySelector("defs")!;
  // Rig transforms still animate normally. Its unchanging local paths become
  // shared SVG symbols, so each arm/head/leg uses one cached draw operation.
  for (const part of ["leg-left", "leg-right", "arm-left", "arm-right", "tail", "head", "roll", "collar"]) {
    const group = scene.querySelector(`[data-runner-${part}]`);
    if (!group?.bounds) continue;
    const art = document.createElementNS("", "g"), use = document.createElementNS("", "use");
    art.id = `canvas-rig-${part}`; art.bounds = group.bounds;
    art.append(...group.children.slice()); defs.append(art);
    use.setAttribute("href", `#${art.id}`); group.append(use);
  }
  return scene;
}
