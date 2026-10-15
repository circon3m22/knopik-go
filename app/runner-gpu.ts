import { RunnerRenderer } from "./runner-renderer.ts";
import { cloneRunnerScene, type RunnerBounds, type RunnerSceneNode } from "./runner-scene-model.ts";
import { RunnerGpuBatch, RUNNER_GPU_CONTEXT } from "./runner-gpu-batch.ts";
import { RunnerGpuScene } from "./runner-gpu-scene.ts";
import type { RunnerEngine } from "./runner-engine";

/** GPU presentation of the unchanged SVG model. Engine and coin ledger stay on
 * their existing fixed clock; losing a graphics context pauses that clock. */
export class RunnerGpuRenderer {
  readonly canvas:HTMLCanvasElement;
  private gl:WebGLRenderingContext;
  private bounds:RunnerBounds;
  private model:RunnerSceneNode;
  private renderer:RunnerRenderer;
  private batch:RunnerGpuBatch;
  private compiler:RunnerGpuScene;
  private lost=false;
  private lastEngine:RunnerEngine|null=null;
  private lastPixelRatio=1;
  private lostContext=(event:Event)=>{event.preventDefault();this.lost=true;this.lastEngine?.pause();};
  private restoredContext=()=>{
    this.compiler.dispose();this.batch.dispose();
    try { this.batch=new RunnerGpuBatch(this.gl);this.compiler=this.makeCompiler();this.lost=false;if(this.lastEngine)this.render(this.lastEngine,this.lastPixelRatio); }
    catch { this.lost=true; }
  };
  constructor(svg:SVGSVGElement,canvas:HTMLCanvasElement,prefix:string,reducedMotion:boolean) {
    this.canvas=canvas;
    const gl=canvas.getContext("webgl",RUNNER_GPU_CONTEXT);if(!gl)throw Error("Runner WebGL unavailable");this.gl=gl;
    this.bounds=canvas.getBoundingClientRect();this.model=cloneRunnerScene(svg,()=>this.bounds);
    this.renderer=new RunnerRenderer(this.model as unknown as SVGSVGElement,prefix,reducedMotion);
    this.batch=new RunnerGpuBatch(gl);this.compiler=this.makeCompiler();
    canvas.addEventListener("webglcontextlost",this.lostContext);canvas.addEventListener("webglcontextrestored",this.restoredContext);
  }
  private makeCompiler(){return new RunnerGpuScene(this.model,()=>document.createElement("canvas"),texture=>this.batch.release(texture),this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number);}
  resize(){this.bounds=this.canvas.getBoundingClientRect();this.renderer.resize();}
  render(engine:RunnerEngine, pixelRatio=window.devicePixelRatio||1) {
    this.lastPixelRatio=pixelRatio;
    this.lastEngine=engine;if(this.lost){engine.pause();return false;}
    this.renderer.render(engine);const frame=this.compiler.prepare(pixelRatio);
    this.batch.present(frame,this.canvas);this.compiler.trim();return true;
  }
  fontsReady(){this.compiler.clearTextures();}
  dispose(){this.canvas.removeEventListener("webglcontextlost",this.lostContext);this.canvas.removeEventListener("webglcontextrestored",this.restoredContext);this.compiler.dispose();this.batch.dispose();this.canvas.width=this.canvas.height=1;}
}
