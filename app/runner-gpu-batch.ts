import type { GpuPoint } from "./runner-gpu-geometry.ts";
export type GpuTexture = { key:string; handle:WebGLTexture|null; source:HTMLCanvasElement|null; width:number; height:number; scale:number; bytes:number; used:number };
export type GpuSpan = { type:"span"; first:number; count:number; texture:GpuTexture|null };
export type GpuLayer = { type:"layer"; children:GpuCommand[]; x:number; y:number; width:number; height:number; first:number; count:number };
export type GpuCommand = GpuSpan | GpuLayer;
export type GpuFrame = { vertices:Float32Array; commands:GpuCommand[]; width:number; height:number; textures:GpuTexture[] };
export const RUNNER_GPU_CONTEXT:Readonly<WebGLContextAttributes>=Object.freeze({alpha:false,depth:false,stencil:false,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:"high-performance",desynchronized:false});
export const RUNNER_GPU_VERTEX_SHADER=`
attribute vec2 a_position;
attribute vec2 a_uv;
attribute vec4 a_color;
uniform vec2 u_size;
uniform vec2 u_origin;
uniform vec2 u_uv_scale;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  vec2 p=(a_position-u_origin)/u_size;
  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
  v_uv=a_uv*u_uv_scale;v_color=a_color;
}`;
export const RUNNER_GPU_FRAGMENT_SHADER=`
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  vec4 t=texture2D(u_texture,v_uv);
  gl_FragColor=vec4(t.rgb*v_color.rgb*v_color.a,t.a*v_color.a);
}`;
type Target={texture:WebGLTexture;framebuffer:WebGLFramebuffer;width:number;height:number};

/** Ordered geometry and immutable SVG textures. Hundreds of differently
 * colored world paths share a vertex upload and consecutive draw spans. */
export class RunnerGpuBatch {
  readonly stats={draws:0,uploads:0,vertices:0,layerPixels:0,targetAllocations:0,targetBytes:0};
  private gl:WebGLRenderingContext;
  private program:WebGLProgram;
  private buffer:WebGLBuffer;
  private white:WebGLTexture;
  private size:WebGLUniformLocation;
  private origin:WebGLUniformLocation;
  private uv:WebGLUniformLocation;
  private uvX=0;
  private uvY=0;
  private required:{width:number;height:number}[]=[];
  private frameWidth=0;
  private frameHeight=0;
  private targets:Target[]=[];
  constructor(gl:WebGLRenderingContext) {
    this.gl=gl;
    const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(`Runner shader: ${message}`);}return shader;};
    const vertex=compile(gl.VERTEX_SHADER,RUNNER_GPU_VERTEX_SHADER),fragment=compile(gl.FRAGMENT_SHADER,RUNNER_GPU_FRAGMENT_SHADER),program=gl.createProgram()!;
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw Error(`Runner program: ${message}`);}
    this.program=program;this.buffer=gl.createBuffer()!;this.white=gl.createTexture()!;
    gl.useProgram(program);this.size=gl.getUniformLocation(program,"u_size")!;this.origin=gl.getUniformLocation(program,"u_origin")!;this.uv=gl.getUniformLocation(program,"u_uv_scale")!;
    gl.uniform1i(gl.getUniformLocation(program,"u_texture"),0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.white);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));this.parameters();
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const [name,count,offset] of [["a_position",2,0],["a_uv",2,8],["a_color",4,16]] as const){const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,count,gl.FLOAT,false,32,offset);}
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  }
  private parameters(){const gl=this.gl;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
  private upload(texture:GpuTexture) {
    if(texture.handle||!texture.source)return;
    const gl=this.gl;texture.handle=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture.handle);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture.source);this.parameters();
    texture.source.width=texture.source.height=1;texture.source=null;this.stats.uploads++;
  }
  private target(depth:number,width:number,height:number,limitWidth:number,limitHeight:number) {
    const gl=this.gl;let target=this.targets[depth];
    if(!target){target={texture:gl.createTexture()!,framebuffer:gl.createFramebuffer()!,width:0,height:0};this.targets[depth]=target;}
    if(target.width<width||target.height<height){
      width=Math.max(target.width,Math.min(limitWidth,Math.ceil(Math.max(width,target.width*1.25)/64)*64));
      height=Math.max(target.height,Math.min(limitHeight,Math.ceil(Math.max(height,target.height*1.25)/64)*64));
      gl.bindTexture(gl.TEXTURE_2D,target.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);this.parameters();gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error("Runner GPU framebuffer unavailable");
      this.stats.targetBytes+=(width*height-target.width*target.height)*4;this.stats.targetAllocations++;target.width=width;target.height=height;
    }
    return target;
  }
  private prepareTargets(commands:GpuCommand[],depth:number) {
    for(const command of commands)if(command.type==="layer"){
      const size=this.required[depth]??(this.required[depth]={width:0,height:0});size.width=Math.max(size.width,command.width);size.height=Math.max(size.height,command.height);this.prepareTargets(command.children,depth+1);
    }
  }
  private clearTargets(){const gl=this.gl;for(const target of this.targets){gl.deleteFramebuffer(target.framebuffer);gl.deleteTexture(target.texture);}this.targets=[];this.required=[];this.stats.targetBytes=0;}
  private uvScale(x:number,y:number){if(this.uvX!==x||this.uvY!==y){this.gl.uniform2f(this.uv,x,y);this.uvX=x;this.uvY=y;}}
  private bind(target:Target|null,width:number,height:number,x:number,y:number){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,target?.framebuffer??null);gl.viewport(0,0,width,height);gl.uniform2f(this.size,width,height);gl.uniform2f(this.origin,x,y);if(target){gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,width,height);}else gl.disable(gl.SCISSOR_TEST);}
  private draw(commands:GpuCommand[],target:Target|null,width:number,height:number,x:number,y:number,depth:number) {
    const gl=this.gl;
    for(const command of commands) {
      if(command.type==="layer") {
        const layer=this.targets[depth];this.bind(layer,command.width,command.height,command.x,command.y);
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);this.stats.layerPixels+=command.width*command.height;
        this.draw(command.children,layer,command.width,command.height,command.x,command.y,depth+1);
        this.bind(target,width,height,x,y);this.uvScale(command.width/layer.width,command.height/layer.height);gl.bindTexture(gl.TEXTURE_2D,layer.texture);gl.drawArrays(gl.TRIANGLES,command.first,command.count);this.stats.draws++;
      } else {
        this.uvScale(1,1);gl.bindTexture(gl.TEXTURE_2D,command.texture?.handle??this.white);gl.drawArrays(gl.TRIANGLES,command.first,command.count);this.stats.draws++;
      }
    }
  }
  present(frame:GpuFrame,canvas:HTMLCanvasElement) {
    const gl=this.gl;this.stats.draws=this.stats.uploads=this.stats.layerPixels=this.stats.targetAllocations=0;this.stats.vertices=frame.vertices.length/8;
    // Prepare/upload everything before touching the visible buffer. Presentation
    // uses the synchronized WebGL compositor, with no full-frame Canvas copy.
    for(const texture of frame.textures)this.upload(texture);
    if(this.frameWidth!==frame.width||this.frameHeight!==frame.height){this.clearTargets();this.frameWidth=frame.width;this.frameHeight=frame.height;}
    // Find the largest simultaneous layer at each nesting depth, then retain
    // its capacity. Changing content/crop does not reallocate or synchronously
    // revalidate GPU memory for every translucent object in every frame.
    for(const size of this.required)size.width=size.height=0;
    this.prepareTargets(frame.commands,0);
    for(let depth=0;depth<this.required.length;depth++){const size=this.required[depth];if(size.width&&size.height)this.target(depth,size.width,size.height,frame.width,frame.height);}
    if(canvas.width!==frame.width||canvas.height!==frame.height){canvas.width=frame.width;canvas.height=frame.height;}
    gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,frame.vertices,gl.STREAM_DRAW);
    this.bind(null,frame.width,frame.height,0,0);gl.clearColor(35/255,40/255,59/255,1);gl.clear(gl.COLOR_BUFFER_BIT);
    this.draw(frame.commands,null,frame.width,frame.height,0,0,0);
  }
  release(texture:GpuTexture){if(texture.handle)this.gl.deleteTexture(texture.handle);texture.handle=null;if(texture.source)texture.source.width=texture.source.height=1;texture.source=null;}
  dispose(){const gl=this.gl;this.clearTargets();gl.deleteTexture(this.white);gl.deleteBuffer(this.buffer);gl.deleteProgram(this.program);}
}

export function gpuCommandBounds(commands:GpuCommand[],vertices:Float32Array):[number,number,number,number] {
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  const include=(x:number,y:number)=>{left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);};
  for(const command of commands)if(command.type==="layer"){include(command.x,command.y);include(command.x+command.width,command.y+command.height);}else for(let i=command.first*8;i<(command.first+command.count)*8;i+=8)include(vertices[i],vertices[i+1]);
  return [left,top,right,bottom];
}
export function gpuQuad(x:number,y:number,w:number,h:number):GpuPoint[] {return [[x,y],[x+w,y],[x+w,y+h],[x,y],[x+w,y+h],[x,y+h]];}
