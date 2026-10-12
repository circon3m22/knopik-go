import { RunnerRenderer } from "./runner-renderer.ts";
import { cloneRunnerScene, type RunnerSceneNode, type RunnerBounds } from "./runner-scene-model.ts";
import type { RunnerEngine } from "./runner-engine";

type Surface = HTMLCanvasElement;
type Texture = { surface: Surface; box: RunnerBounds; scale: number; bytes: number; used: number };
type Geometry = { key: string; path: Path2D };
type Matrix = [number, number, number, number, number, number];
// The visible canvas must use normal compositor synchronization. A low-latency
// front buffer can expose the background clear before the world has been drawn.
export const RUNNER_CANVAS_CONTEXT: Readonly<CanvasRenderingContext2DSettings> = Object.freeze({ alpha: false, desynchronized: false });
const numbers = (value: string) => (value.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
export function runnerCanvasTransform(value: string): Matrix {
  let matrix: Matrix = [...IDENTITY];
  for (const match of value.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]+)\)/g)) {
    const n = numbers(match[2]); let next: Matrix = [...IDENTITY];
    if (match[1] === "matrix") next = n as Matrix;
    if (match[1] === "translate") next = [1, 0, 0, 1, n[0], n[1] ?? 0];
    if (match[1] === "scale") next = [n[0], 0, 0, n[1] ?? n[0], 0, 0];
    if (match[1] === "rotate") {
      const radians = n[0] * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians), x = n[1] ?? 0, y = n[2] ?? 0;
      next = [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
    }
    if (match[1] === "skewX") next[2] = Math.tan(n[0] * Math.PI / 180);
    if (match[1] === "skewY") next[1] = Math.tan(n[0] * Math.PI / 180);
    const [a,b,c,d,e,f] = matrix, [g,h,i,j,k,l] = next;
    matrix = [a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f];
  }
  return matrix;
}

/** SVG source paths remain the art authority. This paints the same projected
 * scene with bounded native-resolution textures for immutable <use> sprites. */
export class RunnerCanvasPainter {
  private geometry = new WeakMap<RunnerSceneNode, Geometry>();
  private transforms = new WeakMap<RunnerSceneNode, { key: string; matrix: Matrix }>();
  private textures = new Map<string, Texture>();
  private spriteVariables = new WeakMap<RunnerSceneNode, string[]>();
  private textureBytes = 0;
  private frame = 0;
  private layers: Surface[] = [];
  private variables = new Map<string, string>();
  private pixelRatio = 1;
  private targetWidth = 0;
  private targetHeight = 0;
  readonly stats = { paths: 0, sprites: 0, culled: 0, textureBytes: 0, textures: 0 };
  readonly scene: RunnerSceneNode;
  private surface: Surface;
  private frameSurface: Surface;
  private createSurface: () => Surface;
  private cacheLimit: number;
  constructor(scene: RunnerSceneNode, surface: Surface, createSurface: () => Surface = () => document.createElement("canvas"), cacheLimit = 32 * 1024 * 1024) {
    this.scene = scene; this.surface = surface; this.createSurface = createSurface; this.cacheLimit = cacheLimit;
    this.frameSurface = createSurface();
  }

  private resolve(value: string) {
    return value.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_, name, fallback) => this.variables.get(name) ?? fallback ?? "#343041");
  }
  private path(node: RunnerSceneNode): Path2D {
    let key = node.getAttribute("d") ?? "";
    if (node.tag === "rect") {
      const x = +(node.getAttribute("x") ?? 0), y = +(node.getAttribute("y") ?? 0), w = +(node.getAttribute("width") ?? 0), h = +(node.getAttribute("height") ?? 0);
      key = w > 0 && h > 0 ? `M${x} ${y}h${w}v${h}h${-w}Z` : "";
    }
    let geometry = this.geometry.get(node);
    if (!geometry || geometry.key !== key) { geometry = { key, path: new Path2D(key) }; this.geometry.set(node, geometry); }
    return geometry.path;
  }
  private transform(node: RunnerSceneNode, context: CanvasRenderingContext2D) {
    const key = node.getAttribute("transform"); if (!key) return;
    let cached = this.transforms.get(node);
    if (!cached || cached.key !== key) { cached = { key, matrix: runnerCanvasTransform(key) }; this.transforms.set(node, cached); }
    context.transform(...cached.matrix);
  }
  private clip(node: RunnerSceneNode, context: CanvasRenderingContext2D) {
    const id = node.getAttribute("clip-path")?.match(/url\(#([^\)]+)\)/)?.[1];
    if (!id) return;
    const clip = this.scene.ownerDocument.ids.get(id); if (!clip) return;
    const path = new Path2D();
    for (const child of clip.children) path.addPath(this.path(child));
    context.clip(path);
  }
  private style(node: RunnerSceneNode, context: CanvasRenderingContext2D) {
    const fill = node.getAttribute("fill"), stroke = node.getAttribute("stroke");
    if (fill && fill !== "none") context.fillStyle = this.resolve(fill);
    if (stroke && stroke !== "none") context.strokeStyle = this.resolve(stroke);
    const width = node.getAttribute("stroke-width"); if (width) context.lineWidth = +width;
    const join = node.getAttribute("stroke-linejoin"); if (join) context.lineJoin = join as CanvasLineJoin;
    const cap = node.getAttribute("stroke-linecap"); if (cap) context.lineCap = cap as CanvasLineCap;
  }
  // SVG fill/stroke are inherited, while opacity applies to a completed group.
  private inherited(node: RunnerSceneNode, attribute: string, fallback: string): string {
    for (let parent: RunnerSceneNode | null = node; parent; parent = parent.parent) {
      const value = parent.getAttribute(attribute); if (value !== null) return value;
    }
    return fallback;
  }
  private trimTextures() {
    // Map order is LRU, and eviction frees the actual canvas backing store.
    while (this.textureBytes > this.cacheLimit && this.textures.size > 1) {
      const key = this.textures.keys().next().value!; const texture = this.textures.get(key)!;
      this.textureBytes -= texture.bytes; texture.surface.width = texture.surface.height = 1; this.textures.delete(key);
    }
  }
  private sprite(node: RunnerSceneNode, context: CanvasRenderingContext2D, depth: number, allowTextures: boolean): boolean {
    const id = (node.getAttribute("href") ?? node.getAttribute("xlink:href") ?? "").slice(1);
    const art = this.scene.ownerDocument.ids.get(id); if (!art) return true;
    context.translate(+(node.getAttribute("x") ?? 0), +(node.getAttribute("y") ?? 0));
    const box = art.bounds;
    if (allowTextures && box) {
      const matrix = context.getTransform();
      const { x, y, width, height } = box;
      const corners = [[x,y],[x+width,y],[x,y+height],[x+width,y+height]].map(([x,y]) => [matrix.a*x+matrix.c*y+matrix.e,matrix.b*x+matrix.d*y+matrix.f]);
      if (Math.max(...corners.map(p=>p[0])) < 0 || Math.min(...corners.map(p=>p[0])) > this.targetWidth || Math.max(...corners.map(p=>p[1])) < 0 || Math.min(...corners.map(p=>p[1])) > this.targetHeight) { this.stats.culled++; return true; }
      const scale = 2 ** Math.ceil(Math.log2(Math.max(.0625, Math.hypot(matrix.a,matrix.b), Math.hypot(matrix.c,matrix.d))));
      const w = Math.ceil(width * scale), h = Math.ceil(height * scale), bytes = w*h*4;
      // Larger sprites are drawn as vectors; resolution is never capped.
      const compound = art.children.length > 1 && art.children.every(child => child.tag === "use");
      if (!compound && w <= 2048 && h <= 2048 && bytes <= this.cacheLimit / 4) {
        let names = this.spriteVariables.get(art);
        if (!names) {
          const used = new Set<string>(), visited = new Set<RunnerSceneNode>();
          const visit = (node: RunnerSceneNode) => {
            if (visited.has(node)) return; visited.add(node);
            for (const value of node.attrs.values()) for (const match of value.matchAll(/var\((--[\w-]+)/g)) used.add(match[1]);
            if (node.tag === "use") { const ref = this.scene.ownerDocument.ids.get((node.getAttribute("href") ?? "").slice(1)); if (ref) visit(ref); }
            for (const child of node.children) visit(child);
          };
          visit(art); names = [...used]; this.spriteVariables.set(art,names);
        }
        const variables = names.map(key=>`${key}:${this.variables.get(key) ?? ""}`).join(";");
        const key = `${id}|${scale}|${variables}|${context.fillStyle}|${context.strokeStyle}`;
        let texture = this.textures.get(key);
        if (!texture) {
          const surface = this.createSurface(); surface.width = w; surface.height = h;
          const paint = surface.getContext("2d")!;
          paint.imageSmoothingEnabled = false;
          paint.setTransform(scale,0,0,scale,-x*scale,-y*scale);
          paint.fillStyle = context.fillStyle; paint.strokeStyle = context.strokeStyle; paint.lineWidth = context.lineWidth;
          // Nested <use> geometry is included once, without recursively making
          // textures or using screen-sized compositing buffers inside a sprite.
          this.draw(art, paint, depth, false, 1);
          texture = { surface, box, scale, bytes, used: this.frame };
          this.textures.set(key, texture); this.textureBytes += bytes;
          this.trimTextures();
        } else { this.textures.delete(key); this.textures.set(key, texture); }
        texture.used = this.frame;
        context.drawImage(texture.surface, 0, 0, w, h, x, y, w/scale, h/scale);
        this.stats.sprites++; return true;
      }
    }
    this.draw(art, context, depth, allowTextures, context.globalAlpha); return true;
  }

  private draw(node: RunnerSceneNode, context: CanvasRenderingContext2D, depth: number, allowTextures: boolean, parentOpacity: number, viewport?: RunnerBounds) {
    if (node.tag === "defs" || node.tag === "clipPath" || node.getAttribute("display") === "none" || node.getAttribute("visibility") === "hidden") return;
    if (node.tag === "path" && !node.getAttribute("d")) return;
    const opacity = +(node.getAttribute("opacity") ?? 1); if (opacity <= 0) return;
    context.save();
    const previousVariables: [string, string | undefined][] = [];
    for (const [key,value] of node.variables) { previousVariables.push([key,this.variables.get(key)]); this.variables.set(key,value); }
    this.transform(node, context); this.style(node, context);
    if (node.tag === "svg" && node !== this.scene) {
      const box = numbers(node.getAttribute("viewBox") ?? "0 0 128 128");
      const width = +(node.getAttribute("width") ?? viewport?.width ?? box[2]), height = +(node.getAttribute("height") ?? viewport?.height ?? box[3]);
      context.translate(+(node.getAttribute("x") ?? 0), +(node.getAttribute("y") ?? 0));
      const clip = new Path2D(); clip.rect(0,0,width,height); context.clip(clip);
      const s = Math.min(width/box[2],height/box[3]);
      context.translate((width-box[2]*s)/2,(height-box[3]*s)/2); context.scale(s,s); context.translate(-box[0],-box[1]);
      viewport = { x: box[0], y: box[1], width: box[2], height: box[3] };
    }
    this.clip(node, context);
    // Rain, sky bands and other translucent groups are composited once, just
    // like SVG group opacity, so overlapping children retain their colors.
    let paint = context, layer: Surface | null = null;
    if (opacity < 1 && node.children.length > 1) {
      layer = allowTextures ? this.layers[depth] ?? (this.layers[depth] = this.createSurface()) : this.createSurface();
      if (layer.width !== context.canvas.width || layer.height !== context.canvas.height) { layer.width = context.canvas.width; layer.height = context.canvas.height; }
      paint = layer.getContext("2d")!; paint.setTransform(1,0,0,1,0,0); paint.clearRect(0,0,layer.width,layer.height);
      const matrix = context.getTransform(); paint.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);
      paint.fillStyle = context.fillStyle; paint.strokeStyle = context.strokeStyle; paint.lineWidth = context.lineWidth;
      paint.lineJoin = context.lineJoin; paint.lineCap = context.lineCap; paint.imageSmoothingEnabled = false;
      paint.globalAlpha = 1;
    } else context.globalAlpha = parentOpacity * opacity;
    if (node.tag === "use") this.sprite(node, paint, depth + (layer ? 1 : 0), allowTextures);
    if (node.tag === "path" || node.tag === "rect") {
      const path = this.path(node), fill = this.inherited(node,"fill","#000"), stroke = this.inherited(node,"stroke","none");
      const alpha = paint.globalAlpha;
      if (fill !== "none") { paint.globalAlpha = alpha * +(this.inherited(node,"fill-opacity","1")); paint.fill(path, this.inherited(node,"fill-rule","nonzero") as CanvasFillRule); }
      if (stroke !== "none") {
        paint.globalAlpha = alpha * +(this.inherited(node,"stroke-opacity","1"));
        if (node.getAttribute("vector-effect") === "non-scaling-stroke") {
          const matrix = paint.getTransform(); const inverse = { a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f };
          const screen = new Path2D(); screen.addPath(path,inverse);
          paint.save(); paint.setTransform(1,0,0,1,0,0); paint.lineWidth = +(node.getAttribute("stroke-width") ?? 1) * this.pixelRatio; paint.stroke(screen); paint.restore();
        } else paint.stroke(path);
      }
      paint.globalAlpha = alpha; this.stats.paths++;
    }
    if (node.tag === "text") {
      paint.font = `700 ${this.inherited(node,"font-size","16")}px ${this.inherited(node,"font-family","Knopik Pixel, monospace")}`;
      paint.textAlign = this.inherited(node,"text-anchor","start") === "middle" ? "center" : "left";
      paint.textBaseline = "alphabetic"; paint.fillText(node.textContent, +(node.getAttribute("x") ?? 0), +(node.getAttribute("y") ?? 0));
    }
    for (const child of node.children) this.draw(child,paint,depth + (layer ? 1 : 0),allowTextures,layer ? 1 : paint.globalAlpha,viewport);
    if (layer) {
      context.save(); context.setTransform(1,0,0,1,0,0); context.globalAlpha = parentOpacity * opacity; context.drawImage(layer,0,0); context.restore();
      if (!allowTextures) layer.width = layer.height = 1;
    }
    for (const [key,value] of previousVariables) { if (value === undefined) this.variables.delete(key); else this.variables.set(key,value); }
    context.restore();
  }
  paint(pixelRatio: number) {
    const bounds = this.scene.getBoundingClientRect(), w = Math.max(1,Math.round(bounds.width*pixelRatio)), h = Math.max(1,Math.round(bounds.height*pixelRatio));
    if (this.frameSurface.width !== w || this.frameSurface.height !== h) { this.frameSurface.width = w; this.frameSurface.height = h; }
    const context = this.frameSurface.getContext("2d", RUNNER_CANVAS_CONTEXT)!;
    context.setTransform(1,0,0,1,0,0); context.globalAlpha = 1; context.fillStyle = "#23283b"; context.fillRect(0,0,w,h);
    const box = numbers(this.scene.getAttribute("viewBox") ?? "0 0 360 680"), scale = Math.min(w/box[2],h/box[3]);
    this.pixelRatio = pixelRatio; this.targetWidth = w; this.targetHeight = h; this.frame++;
    this.stats.paths = this.stats.sprites = this.stats.culled = 0;
    context.setTransform(scale,0,0,scale,(w-box[2]*scale)/2,(h-box[3]*scale)/2);
    context.fillStyle = "#000"; context.strokeStyle = "#000"; context.lineWidth = 1; context.lineJoin = "miter"; context.imageSmoothingEnabled = false;
    this.draw(this.scene,context,0,true,1);
    // Present exactly once, after all geometry, textures and alpha layers are
    // complete. Resize the visible buffer only now, so no empty intermediate
    // frame can escape while the new viewport is being prepared.
    if (this.surface.width !== w || this.surface.height !== h) { this.surface.width = w; this.surface.height = h; }
    const output = this.surface.getContext("2d", RUNNER_CANVAS_CONTEXT)!;
    output.setTransform(1,0,0,1,0,0); output.globalAlpha = 1;
    output.globalCompositeOperation = "copy"; output.imageSmoothingEnabled = false;
    output.drawImage(this.frameSurface,0,0);
    this.stats.textureBytes = this.textureBytes; this.stats.textures = this.textures.size;
  }
  dispose() {
    for (const texture of this.textures.values()) texture.surface.width = texture.surface.height = 1;
    for (const layer of this.layers) layer.width = layer.height = 1;
    this.frameSurface.width = this.frameSurface.height = 1;
    this.textures.clear(); this.layers.length = 0; this.textureBytes = 0;
  }
}

export class RunnerCanvasRenderer {
  private renderer: RunnerRenderer;
  private painter: RunnerCanvasPainter;
  readonly canvas: HTMLCanvasElement;
  constructor(svg: SVGSVGElement, canvas: HTMLCanvasElement, prefix: string, reducedMotion: boolean) {
    this.canvas = canvas;
    const scene = cloneRunnerScene(svg, () => canvas.getBoundingClientRect());
    this.renderer = new RunnerRenderer(scene as unknown as SVGSVGElement, prefix, reducedMotion);
    this.painter = new RunnerCanvasPainter(scene, canvas);
  }
  resize() { this.renderer.resize(); }
  render(engine: RunnerEngine) { this.renderer.render(engine); this.painter.paint(window.devicePixelRatio || 1); }
  fontsReady() { this.painter.dispose(); }
  dispose() { this.painter.dispose(); }
}
