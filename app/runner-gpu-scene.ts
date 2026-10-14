import { RunnerCanvasPainter, runnerCanvasTransform } from "./runner-canvas.ts";
import { runnerPathBounds } from "./runner-path-bounds.ts";
import type { RunnerBounds, RunnerSceneNode } from "./runner-scene-model.ts";
import { GPU_IDENTITY, gpuContours, gpuHasHoles, gpuMultiply, gpuPoint, gpuStroke, gpuTriangulate, type GpuContour, type GpuMatrix, type GpuPoint } from "./runner-gpu-geometry.ts";
import { gpuCommandBounds, gpuQuad, type GpuCommand, type GpuFrame, type GpuTexture } from "./runner-gpu-batch.ts";

type Color=[number,number,number,number];
type Vertex=[number,number,number,number];
type State={matrix:GpuMatrix;fill:string;stroke:string;width:number;join:string;cap:string;alpha:number;fillAlpha:number;strokeAlpha:number;clips:GpuPoint[][];fontSize:number;fontFamily:string;anchor:string};
type Geometry={key:string;contours:GpuContour[]|null;triangles:GpuPoint[]|null;fillUnion:boolean};
const NUMERIC_ATTRIBUTES=[["stroke-width","width"],["fill-opacity","fillAlpha"],["stroke-opacity","strokeAlpha"],["font-size","fontSize"]] as const;
const STRING_ATTRIBUTES=[["stroke-linejoin","join"],["stroke-linecap","cap"],["font-family","fontFamily"],["text-anchor","anchor"]] as const;
const NO_VARIABLES: [string,string|undefined][]=[];
const visible=(n:RunnerSceneNode)=>n.tag!=="defs"&&n.tag!=="clipPath"&&n.getAttribute("display")!=="none"&&n.getAttribute("visibility")!=="hidden"&&+(n.getAttribute("opacity")??1)>0;
const values=(v:string)=>(v.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)??[]).map(Number);
export function runnerGpuColor(value:string):Color {
  const v=value.replace("#","");
  if(value.startsWith("#")&&(v.length===3||v.length===4)){const n=[...v].map(x=>parseInt(x+x,16)/255);return [n[0],n[1],n[2],n[3]??1];}
  if(value.startsWith("#")&&(v.length===6||v.length===8))return [parseInt(v.slice(0,2),16)/255,parseInt(v.slice(2,4),16)/255,parseInt(v.slice(4,6),16)/255,v.length===8?parseInt(v.slice(6,8),16)/255:1];
  if(value.startsWith("rgb")){const n=values(value);return [n[0]/255,n[1]/255,n[2]/255,n[3]??1];}
  if(value==="white")return [1,1,1,1];if(value==="transparent"||value==="none")return [0,0,0,0];return [0,0,0,1];
}

/** Compiles the existing virtual SVG in its original painter order. World
 * geometry goes into one reusable buffer; native SVG art is uploaded once. */
export class RunnerGpuScene {
  readonly stats={paths:0,sprites:0,culled:0,textureBytes:0,textures:0,rasterized:0};
  private scene:RunnerSceneNode;
  private createSurface:()=>HTMLCanvasElement;
  private raster:RunnerCanvasPainter;
  private release:(texture:GpuTexture)=>void;
  private maxTexture:number;
  private textures=new Map<string,GpuTexture>();
  private bytes=0;
  private frame=0;
  private vars=new Map<string,string>();
  private names=new WeakMap<RunnerSceneNode,string[]>();
  private geometry=new WeakMap<RunnerSceneNode,Geometry>();
  private states=new WeakMap<RunnerSceneNode,State>();
  private transforms=new WeakMap<RunnerSceneNode,{key:string;matrix:GpuMatrix}>();
  private colors=new Map<string,Color>();
  private textBounds=new WeakMap<RunnerSceneNode,{key:string;box:RunnerBounds}>();
  private measureSurface:HTMLCanvasElement;
  private buffer=new Float32Array(32768);
  private used=0;
  private usedTextures=new Set<GpuTexture>();
  private fallbackTextures=new WeakMap<RunnerSceneNode,GpuTexture>();
  private retiredTextures=new Set<GpuTexture>();
  private width=1;
  private height=1;
  private pixelRatio=1;
  constructor(scene:RunnerSceneNode,createSurface:()=>HTMLCanvasElement,release:(texture:GpuTexture)=>void,maxTexture=4096) {
    this.scene=scene;this.createSurface=createSurface;this.release=release;this.maxTexture=maxTexture;
    this.measureSurface=createSurface();
    this.raster=new RunnerCanvasPainter(scene,createSurface(),createSurface,32*1024*1024,null);
  }
  private resolve(value:string){if(!value.includes("var("))return value;return value.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,(_,name,fallback)=>this.vars.get(name)??fallback??"#343041");}
  private color(value:string,alpha:number):Color {let c=this.colors.get(value);if(!c){c=runnerGpuColor(value);if(this.colors.size>2048)this.colors.clear();this.colors.set(value,c);}return alpha===1?c:[c[0],c[1],c[2],c[3]*alpha];}
  private matrix(node:RunnerSceneNode) {
    const key=node.getAttribute("transform")??"";if(!key)return GPU_IDENTITY;
    let cached=this.transforms.get(node);if(!cached||cached.key!==key){cached={key,matrix:runnerCanvasTransform(key)};this.transforms.set(node,cached);}return cached.matrix;
  }
  private path(node:RunnerSceneNode) {
    let key=node.getAttribute("d")??"";
    if(node.tag==="rect"){const x=+(node.getAttribute("x")??0),y=+(node.getAttribute("y")??0),w=+(node.getAttribute("width")??0),h=+(node.getAttribute("height")??0);key=w>0&&h>0?`M${x} ${y}h${w}v${h}h${-w}Z`:"";}
    let geometry=this.geometry.get(node);
    if(!geometry||geometry.key!==key) {
      const contours=gpuContours(key);let triangles:GpuPoint[]|null=[];
      if(!contours||gpuHasHoles(contours,node.getAttribute("fill-rule")==="evenodd"))triangles=null;
      else for(const contour of contours){const t=gpuTriangulate(contour.points);if(t===null){triangles=null;break;}triangles.push(...t);}
      const boxes=(contours??[]).map(c=>({left:Math.min(...c.points.map(p=>p[0])),right:Math.max(...c.points.map(p=>p[0])),top:Math.min(...c.points.map(p=>p[1])),bottom:Math.max(...c.points.map(p=>p[1]))}));
      const fillUnion=boxes.some((a,i)=>boxes.some((b,j)=>i<j&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
      geometry={key,contours,triangles,fillUnion};this.geometry.set(node,geometry);
    }
    return geometry;
  }
  private clipVertices(input:Vertex[],clip:GpuPoint[]) {
    // All current scene clips are convex. Interpolate texture coordinates as
    // well as positions, including clipping at the screen edge.
    let area=0;for(let i=0,j=clip.length-1;i<clip.length;j=i++)area+=clip[j][0]*clip[i][1]-clip[i][0]*clip[j][1];const sign=area>=0?1:-1;
    let output=input;
    for(let i=0;i<clip.length&&output.length;i++) {
      const a=clip[i],b=clip[(i+1)%clip.length],old=output;output=[];
      const distance=(p:Vertex)=>((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*sign;
      for(let j=0;j<old.length;j++){const p=old[j],q=old[(j+1)%old.length],dp=distance(p),dq=distance(q);if(dp>=-1e-7)output.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);output.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t,p[3]+(q[3]-p[3])*t]);}}
    }
    return output;
  }
  private reserve(amount:number){if(this.used+amount<=this.buffer.length)return;const b=new Float32Array(2**Math.ceil(Math.log2(this.used+amount)));b.set(this.buffer);this.buffer=b;}
  private containsTriangle(clip:GpuPoint[],ax:number,ay:number,bx:number,by:number,cx:number,cy:number){
    let area=0;for(let i=0,j=clip.length-1;i<clip.length;j=i++)area+=clip[j][0]*clip[i][1]-clip[i][0]*clip[j][1];
    const sign=area>=0?1:-1;
    for(let i=0;i<clip.length;i++){const a=clip[i],b=clip[(i+1)%clip.length],dx=b[0]-a[0],dy=b[1]-a[1];if((dx*(ay-a[1])-dy*(ax-a[0]))*sign<0||(dx*(by-a[1])-dy*(bx-a[0]))*sign<0||(dx*(cy-a[1])-dy*(cx-a[0]))*sign<0)return false;}
    return true;
  }
  private vertex(x:number,y:number,u:number,v:number,color:Color){
    const b=this.buffer;let i=this.used;b[i++]=x;b[i++]=y;b[i++]=u;b[i++]=v;b[i++]=color[0];b[i++]=color[1];b[i++]=color[2];b[i++]=color[3];this.used=i;
  }
  private emit(points:GpuPoint[],state:State,color:Color,commands:GpuCommand[],texture:GpuTexture|null=null,uv?:GpuPoint[]) {
    const first=this.used/8;
    const m=state.matrix;
    for(let i=0;i<points.length;i+=3) {
      const a=points[i],b=points[i+1],c=points[i+2];
      const ax=m[0]*a[0]+m[2]*a[1]+m[4],ay=m[1]*a[0]+m[3]*a[1]+m[5];
      const bx=m[0]*b[0]+m[2]*b[1]+m[4],by=m[1]*b[0]+m[3]*b[1]+m[5];
      const cx=m[0]*c[0]+m[2]*c[1]+m[4],cy=m[1]*c[0]+m[3]*c[1]+m[5];
      if(Math.max(ax,bx,cx)<0||Math.min(ax,bx,cx)>this.width||Math.max(ay,by,cy)<0||Math.min(ay,by,cy)>this.height)continue;
      const inside=Math.min(ax,bx,cx)>=0&&Math.max(ax,bx,cx)<=this.width&&Math.min(ay,by,cy)>=0&&Math.max(ay,by,cy)<=this.height;
      // The common case writes straight to the retained typed buffer. Do not
      // allocate a triangle, UV pairs, clipping lists and color iterators for
      // each of the thousands of fully visible window/road/foliage triangles, including windows
      // contained entirely within their facade clip.
      let unclipped=inside;
      if(unclipped)for(let k=1;k<state.clips.length;k++)if(!this.containsTriangle(state.clips[k],ax,ay,bx,by,cx,cy)){unclipped=false;break;}
      if(unclipped) {
        this.reserve(24);
        this.vertex(ax,ay,uv?.[i][0]??0,uv?.[i][1]??0,color);
        this.vertex(bx,by,uv?.[i+1][0]??0,uv?.[i+1][1]??0,color);
        this.vertex(cx,cy,uv?.[i+2][0]??0,uv?.[i+2][1]??0,color);
        continue;
      }
      let triangle:Vertex[]=[[ax,ay,uv?.[i][0]??0,uv?.[i][1]??0],[bx,by,uv?.[i+1][0]??0,uv?.[i+1][1]??0],[cx,cy,uv?.[i+2][0]??0,uv?.[i+2][1]??0]];
      for(let k=inside?1:0;k<state.clips.length;k++)triangle=this.clipVertices(triangle,state.clips[k]);
      if(triangle.length<3)continue;
      this.reserve((triangle.length-2)*24);
      for(let j=1;j<triangle.length-1;j++){
        const a=triangle[0],b=triangle[j],c=triangle[j+1];
        this.vertex(a[0],a[1],a[2],a[3],color);this.vertex(b[0],b[1],b[2],b[3],color);this.vertex(c[0],c[1],c[2],c[3],color);
      }
    }
    const count=this.used/8-first;if(!count){this.stats.culled++;return;}
    const previous=commands.at(-1);
    if(previous?.type==="span"&&previous.texture===texture&&previous.first+previous.count===first)previous.count+=count;
    else commands.push({type:"span",first,count,texture});
  }
  private layer(children:GpuCommand[],alpha:number,commands:GpuCommand[]) {
    if(!children.length)return;
    const [l,t,r,b]=gpuCommandBounds(children,this.buffer),x=Math.max(0,Math.floor(l)-1),y=Math.max(0,Math.floor(t)-1),w=Math.min(this.width,Math.ceil(r)+1)-x,h=Math.min(this.height,Math.ceil(b)+1)-y;
    if(w<=0||h<=0)return;
    const first=this.used/8;this.reserve(48);
    const points=gpuQuad(x,y,w,h),uv:GpuPoint[]=[[0,1],[1,1],[1,0],[0,1],[1,0],[0,0]];
    for(let i=0;i<6;i++)for(const value of [points[i][0],points[i][1],uv[i][0],uv[i][1],1,1,1,alpha])this.buffer[this.used++]=value;
    commands.push({type:"layer",children,x,y,width:w,height:h,first,count:6});
  }
  private shape(points:GpuPoint[],state:State,color:Color,commands:GpuCommand[],needsUnion=true) {
    if(color[3]<=0)return;
    // A path is painted once, even if its contours/stroke triangles overlap.
    // Keep translucent union coverage in a small GPU target, not on the CPU.
    if(color[3]<1&&needsUnion){const children:GpuCommand[]=[];this.emit(points,state,[color[0],color[1],color[2],1],children);this.layer(children,color[3],commands);}
    else this.emit(points,state,color,commands);
  }
  private variables(art:RunnerSceneNode) {
    let names=this.names.get(art);
    if(!names){const used=new Set<string>(),visited=new Set<RunnerSceneNode>();const visit=(n:RunnerSceneNode)=>{if(visited.has(n))return;visited.add(n);for(const value of n.attrs.values())for(const match of value.matchAll(/var\((--[\w-]+)/g))used.add(match[1]);if(n.tag==="use"){const ref=this.scene.ownerDocument.ids.get((n.getAttribute("href")??"").slice(1));if(ref)visit(ref);}n.children.forEach(visit);};visit(art);names=[...used];this.names.set(art,names);}
    return names.map(n=>`${n}:${this.vars.get(n)??""}`).join(";");
  }
  private scale(state:State){return 2**Math.ceil(Math.log2(Math.max(.0625,Math.hypot(state.matrix[0],state.matrix[1]),Math.hypot(state.matrix[2],state.matrix[3]))));}
  private texture(key:string,box:RunnerBounds,scale:number,state:State,node:RunnerSceneNode,text=false):GpuTexture {
    let texture=this.textures.get(key);
    if(!texture) {
      const source=this.createSurface();source.width=Math.max(1,Math.ceil(box.width*scale));source.height=Math.max(1,Math.ceil(box.height*scale));
      const c=source.getContext("2d")!;c.setTransform(scale,0,0,scale,-box.x*scale,-box.y*scale);c.imageSmoothingEnabled=false;c.fillStyle=state.fill;c.strokeStyle=state.stroke;c.lineWidth=state.width;c.lineJoin=state.join as CanvasLineJoin;c.lineCap=state.cap as CanvasLineCap;
      if(text){c.font=`700 ${state.fontSize}px ${state.fontFamily}`;c.textAlign=state.anchor==="middle"?"center":"left";c.textBaseline="alphabetic";c.fillText(node.textContent,+(node.getAttribute("x")??0),+(node.getAttribute("y")??0));}
      else this.raster.rasterize(node,c,new Map(this.vars),this.pixelRatio);
      texture={key,handle:null,source,width:source.width,height:source.height,scale,bytes:source.width*source.height*4,used:this.frame};this.textures.set(key,texture);this.bytes+=texture.bytes;this.stats.rasterized++;
    } else {this.textures.delete(key);this.textures.set(key,texture);}
    texture.used=this.frame;this.usedTextures.add(texture);return texture;
  }
  private image(texture:GpuTexture,box:RunnerBounds,state:State,commands:GpuCommand[]) {
    this.emit(gpuQuad(box.x,box.y,texture.width/texture.scale,texture.height/texture.scale),state,[1,1,1,state.alpha],commands,texture,[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]);this.stats.sprites++;
  }
  private rasterPath(node:RunnerSceneNode,state:State,commands:GpuCommand[],key:string) {
    const bounds=runnerPathBounds(key);if(!bounds)throw Error("Unsupported runner path bounds");
    const pad=state.stroke==="none"?3:state.width*10+3,box={x:bounds.x-pad,y:bounds.y-pad,width:bounds.width+pad*2,height:bounds.height+pad*2},scale=this.scale(state);
    const corners:GpuPoint[]=[[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]].map(p=>gpuPoint(state.matrix,p as GpuPoint));
    // Reject invisible fallback paths before creating a Retina-sized surface
    // or texture. emit() clipping alone ran only after the expensive raster.
    if(Math.max(...corners.map(p=>p[0]))<0||Math.min(...corners.map(p=>p[0]))>this.width||Math.max(...corners.map(p=>p[1]))<0||Math.min(...corners.map(p=>p[1]))>this.height){this.stats.culled++;return;}
    if(box.width*scale>this.maxTexture||box.height*scale>this.maxTexture)throw Error("Runner raster fallback exceeds device texture limit");
    const clone=node.ownerDocument.createElementNS("",node.tag);for(const [k,v] of node.attrs)if(k!=="id")clone.setAttribute(k,v);clone.removeAttribute("transform");clone.removeAttribute("opacity");clone.setAttribute("fill",state.fill);clone.setAttribute("stroke",state.stroke);clone.setAttribute("stroke-width",String(state.width));
    const texture=this.texture(`path|${key}|${scale}|${state.fill}|${state.stroke}|${state.width}|${state.join}|${state.cap}`,box,scale,state,clone),previous=this.fallbackTextures.get(node);
    // A projected fallback can change coordinates every frame. Its old camera
    // versions are not reusable art: retire them after presentation instead of
    // letting them evict static sprites from the bounded cache.
    if(previous&&previous!==texture)this.retiredTextures.add(previous);
    this.fallbackTextures.set(node,texture);this.image(texture,box,state,commands);
  }
  private walk(node:RunnerSceneNode,parent:State,commands:GpuCommand[]) {
    if(!visible(node))return;
    const previous:[string,string|undefined][]=node.variables.size?[]:NO_VARIABLES;for(const [key,value] of node.variables){previous.push([key,this.vars.get(key)]);this.vars.set(key,value);}
    let state=this.states.get(node);
    if(!state){state={...parent};this.states.set(node,state);}else Object.assign(state,parent);
    const local=this.matrix(node);state.matrix=local===GPU_IDENTITY?parent.matrix:gpuMultiply(parent.matrix,local);
    const fill=node.getAttribute("fill"),stroke=node.getAttribute("stroke");if(fill!==null)state.fill=this.resolve(fill);if(stroke!==null)state.stroke=this.resolve(stroke);
    for(const [attribute,field] of NUMERIC_ATTRIBUTES){const value=node.getAttribute(attribute);if(value!==null)state[field]=+value;}
    for(const [attribute,field] of STRING_ATTRIBUTES){const value=node.getAttribute(attribute);if(value!==null)state[field]=value;}
    if(node.tag==="svg"&&node!==this.scene){const b=values(node.getAttribute("viewBox")??"0 0 128 128"),w=+(node.getAttribute("width")??b[2]),h=+(node.getAttribute("height")??b[3]),x=+(node.getAttribute("x")??0),y=+(node.getAttribute("y")??0);state.matrix=gpuMultiply(state.matrix,[1,0,0,1,x,y]);state.clips=[...state.clips,[[0,0],[w,0],[w,h],[0,h]].map(p=>gpuPoint(state.matrix,p as GpuPoint))];const s=Math.min(w/b[2],h/b[3]);state.matrix=gpuMultiply(state.matrix,[s,0,0,s,(w-b[2]*s)/2-b[0]*s,(h-b[3]*s)/2-b[1]*s]);}
    const clipId=node.getAttribute("clip-path")?.match(/url\(#([^)]+)\)/)?.[1];
    if(clipId){const clip=this.scene.ownerDocument.ids.get(clipId);for(const child of clip?.children??[]){const contours=this.path(child).contours;if(contours?.[0]?.points.length)state.clips=[...state.clips,contours[0].points.map(p=>gpuPoint(state.matrix,p))];}}
    const opacity=+(node.getAttribute("opacity")??1);let count=0,first:RunnerSceneNode|undefined;
    if(opacity<1)for(const child of node.children)if(visible(child)){count++;first??=child;}
    const isolate=opacity<1&&count>0&&(count>1||!["rect","path","use"].includes(first!.tag));
    const destination:GpuCommand[]=isolate?[]:commands;state.alpha=isolate?1:parent.alpha*opacity;
    if(node.tag==="use") {
      const art=this.scene.ownerDocument.ids.get((node.getAttribute("href")??node.getAttribute("xlink:href")??"").slice(1));
      state.matrix=gpuMultiply(state.matrix,[1,0,0,1,+(node.getAttribute("x")??0),+(node.getAttribute("y")??0)]);
      if(art){const box=art.bounds,scale=this.scale(state),compound=art.children.length>1&&art.children.every(c=>c.tag==="use");
        if(box&&!compound&&box.width*scale<=Math.min(2048,this.maxTexture)&&box.height*scale<=Math.min(2048,this.maxTexture)&&box.width*box.height*scale*scale*4<=8*1024*1024) {
          const corners=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(p=>gpuPoint(state.matrix,p as GpuPoint));
          if(Math.max(...corners.map(p=>p[0]))>=0&&Math.min(...corners.map(p=>p[0]))<=this.width&&Math.max(...corners.map(p=>p[1]))>=0&&Math.min(...corners.map(p=>p[1]))<=this.height){const key=`${art.id}|${scale}|${this.variables(art)}|${state.fill}|${state.stroke}|${state.width}`;this.image(this.texture(key,box,scale,state,art),box,state,destination);}else this.stats.culled++;
        } else this.walk(art,state,destination);
      }
    }
    if(node.tag==="path"||node.tag==="rect") {
      const geometry=this.path(node);this.stats.paths++;
      if(geometry.triangles===null||state.stroke!=="none"&&(state.cap!=="butt"||state.join!=="miter"))this.rasterPath(node,state,destination,geometry.key);
      else {
        if(state.fill!=="none")this.shape(geometry.triangles,state,this.color(state.fill,state.alpha*state.fillAlpha),destination,geometry.fillUnion);
        if(state.stroke!=="none"&&geometry.contours){const nonScaling=node.getAttribute("vector-effect")==="non-scaling-stroke",s=nonScaling?{...state,matrix:GPU_IDENTITY}:state,points:GpuPoint[]=[];for(const c of geometry.contours)points.push(...gpuStroke(nonScaling?{...c,points:c.points.map(p=>gpuPoint(state.matrix,p))}:c,state.width*(nonScaling?this.pixelRatio:1)));this.shape(points,s,this.color(state.stroke,state.alpha*state.strokeAlpha),destination);}
      }
    }
    if(node.tag==="text"&&node.textContent) {
      const x=+(node.getAttribute("x")??0),y=+(node.getAttribute("y")??0),boundsKey=`${node.textContent}|${state.fontSize}|${state.fontFamily}|${state.anchor}|${x}|${y}`;
      let cached=this.textBounds.get(node);if(!cached||cached.key!==boundsKey){const c=this.measureSurface.getContext("2d")!;c.font=`700 ${state.fontSize}px ${state.fontFamily}`;const m=c.measureText(node.textContent);cached={key:boundsKey,box:{x:x-(state.anchor==="middle"?m.width/2:0)-3,y:y-state.fontSize*1.3-3,width:m.width+6,height:state.fontSize*1.7+6}};this.textBounds.set(node,cached);}
      const box=cached.box,scale=this.scale(state),key=`text|${boundsKey}|${state.fill}|${scale}`;this.image(this.texture(key,box,scale,state,node,true),box,state,destination);
    }
    for(const child of node.children)this.walk(child,state,destination);
    if(isolate)this.layer(destination,parent.alpha*opacity,commands);
    for(const [key,value] of previous){if(value===undefined)this.vars.delete(key);else this.vars.set(key,value);}
  }
  prepare(pixelRatio:number):GpuFrame {
    const bounds=this.scene.getBoundingClientRect(),w=Math.max(1,Math.round(bounds.width*pixelRatio)),h=Math.max(1,Math.round(bounds.height*pixelRatio)),box=values(this.scene.getAttribute("viewBox")??"0 0 360 680"),s=Math.min(w/box[2],h/box[3]);
    this.width=w;this.height=h;this.pixelRatio=pixelRatio;this.frame++;this.used=0;this.usedTextures.clear();this.stats.paths=this.stats.sprites=this.stats.culled=this.stats.rasterized=0;
    const commands:GpuCommand[]=[],state:State={matrix:[s,0,0,s,(w-box[2]*s)/2,(h-box[3]*s)/2],fill:"#000",stroke:"none",width:1,join:"miter",cap:"butt",alpha:1,fillAlpha:1,strokeAlpha:1,clips:[[[0,0],[w,0],[w,h],[0,h]]],fontSize:16,fontFamily:"Knopik Pixel, monospace",anchor:"start"};
    this.walk(this.scene,state,commands);this.stats.textureBytes=this.bytes;this.stats.textures=this.textures.size;
    return {vertices:this.buffer.subarray(0,this.used),commands,width:w,height:h,textures:[...this.usedTextures]};
  }
  trim(){
    for(const texture of this.retiredTextures){if(this.usedTextures.has(texture))continue;if(this.textures.get(texture.key)===texture){this.textures.delete(texture.key);this.bytes-=texture.bytes;this.release(texture);}this.retiredTextures.delete(texture);}
    while(this.bytes>32*1024*1024&&this.textures.size>1){const key=this.textures.keys().next().value!,texture=this.textures.get(key)!;this.bytes-=texture.bytes;this.release(texture);this.textures.delete(key);this.retiredTextures.delete(texture);}this.stats.textureBytes=this.bytes;
  }
  clearTextures(){for(const texture of this.textures.values())this.release(texture);this.textures.clear();this.retiredTextures.clear();this.fallbackTextures=new WeakMap();this.textBounds=new WeakMap();this.bytes=0;this.raster.dispose();}
  dispose(){this.clearTextures();this.measureSurface.width=this.measureSurface.height=1;this.buffer=new Float32Array(0);}
}
