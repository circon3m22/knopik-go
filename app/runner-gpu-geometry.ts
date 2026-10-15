export type GpuPoint = [number, number];
export type GpuMatrix = [number, number, number, number, number, number];
export type GpuContour = { points: GpuPoint[]; closed: boolean };
export const GPU_IDENTITY: GpuMatrix = [1,0,0,1,0,0];
export function gpuMultiply(m: GpuMatrix, n: GpuMatrix): GpuMatrix {
  const [a,b,c,d,e,f]=m,[g,h,i,j,k,l]=n;
  return [a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f];
}
export function gpuPoint(m: GpuMatrix, [x,y]: GpuPoint): GpuPoint { return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]; }
const cross=(a:GpuPoint,b:GpuPoint,c:GpuPoint)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const same=(a:GpuPoint,b:GpuPoint)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])<1e-8;
export function gpuArea(points: GpuPoint[]) { let a=0;for(let i=0,j=points.length-1;i<points.length;j=i++)a+=points[j][0]*points[i][1]-points[i][0]*points[j][1];return a/2; }

/** The projected world uses straight polygons; curved source art stays in the
 * SVG raster cache. Returning null requests that exact raster fallback. */
export function gpuContours(source: string): GpuContour[] | null {
  // Projected polygons change every frame. Scan once instead of allocating a
  // regex token array and another command regex for each coordinate.
  const contours:GpuContour[]=[];let i=0,command="",x=0,y=0,contour:GpuContour|null=null;
  const skip=()=>{while(i<source.length&&(source.charCodeAt(i)<=32||source.charCodeAt(i)===44))i++;};
  const number=()=>{
    skip();const start=i;let c=source.charCodeAt(i);if(c===43||c===45)i++;
    let digits=0;while((c=source.charCodeAt(i))>=48&&c<=57){i++;digits++;}
    if(source.charCodeAt(i)===46){i++;while((c=source.charCodeAt(i))>=48&&c<=57){i++;digits++;}}
    if(!digits)return NaN;
    c=source.charCodeAt(i);if(c===69||c===101){i++;c=source.charCodeAt(i);if(c===43||c===45)i++;const exponent=i;while((c=source.charCodeAt(i))>=48&&c<=57)i++;if(exponent===i)return NaN;}
    return Number(source.slice(start,i));
  };
  while(i<source.length) {
    skip();if(i===source.length)break;
    const c=source.charCodeAt(i);if(c>=65&&c<=90||c>=97&&c<=122)command=source[i++];
    const upper=command.toUpperCase(),relative=upper!==command;
    if(upper==="Z") { if(contour){contour.closed=true;[x,y]=contour.points[0];}command="";continue; }
    const count=upper==="H"||upper==="V"?1:upper==="M"||upper==="L"?2:0;
    if(!count)return null;
    const first=number(),second=count===2?number():0;if(!Number.isFinite(first)||!Number.isFinite(second))return null;
    if(upper==="H")x=first+(relative?x:0);
    else if(upper==="V")y=first+(relative?y:0);
    else { x=first+(relative?x:0);y=second+(relative?y:0); }
    if(upper==="M") { contour={points:[],closed:false};contours.push(contour);command=relative?"l":"L"; }
    if(!contour)return null;
    const p:GpuPoint=[x,y];if(!contour.points.length||!same(p,contour.points.at(-1)!))contour.points.push(p);
  }
  for(const c of contours)if(c.points.length>1&&same(c.points[0],c.points.at(-1)!))c.points.pop();
  return contours;
}
function contains(p:GpuPoint,points:GpuPoint[]) {
  let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++)if((points[i][1]>p[1])!==(points[j][1]>p[1])&&p[0]<(points[j][0]-points[i][0])*(p[1]-points[i][1])/(points[j][1]-points[i][1])+points[i][0])inside=!inside;return inside;
}
export function gpuHasHoles(contours:GpuContour[], evenOdd=false) {
  if(contours.length<2)return false;
  const areas=evenOdd?null:contours.map(c=>gpuArea(c.points));
  return contours.some((a,i)=>contours.some((b,j)=>i!==j&&a.points.length>2&&b.points.length>2&&(evenOdd||areas![i]*areas![j]<0)&&contains(a.points[0],b.points)));
}
export function gpuTriangulate(points: GpuPoint[]): GpuPoint[] | null {
  // Road tiles, walls and windows are normally projected quads. Keep their
  // original vertex order without allocating a filtered polygon/ear list.
  if(points.length===4){const area=gpuArea(points),sign=area>=0?1:-1;if(Math.abs(area)>=1e-7&&points.every((v,i)=>!same(v,points[(i+1)%4])&&cross(points[(i+3)%4],v,points[(i+1)%4])*sign>1e-8))return [points[0],points[1],points[2],points[0],points[2],points[3]];}
  const p=points.filter((v,i)=>!same(v,points[(i+1)%points.length]));if(p.length<3)return [];
  // Projected stepped roofs contain zero-area collinear/retraced extensions.
  // They contribute nothing to SVG fill, but used to block every possible ear
  // and force a new raster texture whenever the camera moved. Stroke retains
  // the original contour; simplify only this fill triangulation.
  for(let i=0;i<p.length&&p.length>=3;){const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];if(Math.abs(cross(a,b,c))<1e-8){p.splice(i,1);i=0;}else i++;}
  if(p.length<3)return [];
  const sign=gpuArea(p)>=0?1:-1,out:GpuPoint[]=[];
  if(Math.abs(gpuArea(p))<1e-7)return [];
  if(p.every((v,i)=>cross(p[(i+p.length-1)%p.length],v,p[(i+1)%p.length])*sign>=-1e-8)) {
    for(let i=1;i<p.length-1;i++)out.push(p[0],p[i],p[i+1]);return out;
  }
  const remaining=p.map((_,i)=>i);let guard=p.length*p.length;
  while(remaining.length>3&&guard-->0) {
    let cut=false;
    for(let k=0;k<remaining.length;k++) {
      const a=p[remaining[(k+remaining.length-1)%remaining.length]],b=p[remaining[k]],c=p[remaining[(k+1)%remaining.length]];
      if(Math.abs(cross(a,b,c))<1e-8){remaining.splice(k,1);cut=true;break;}
      if(cross(a,b,c)*sign<=1e-8)continue;
      if(remaining.some((index,j)=>j!==k&&j!==(k+1)%remaining.length&&j!==(k+remaining.length-1)%remaining.length&&cross(a,b,p[index])*sign>=-1e-8&&cross(b,c,p[index])*sign>=-1e-8&&cross(c,a,p[index])*sign>=-1e-8))continue;
      out.push(a,b,c);remaining.splice(k,1);cut=true;break;
    }
    if(!cut)return null;
  }
  if(remaining.length===3)out.push(...remaining.map(i=>p[i]));return out;
}

/** Convex SVG clips (terrain rectangles and façade planes) retain painter order
 * while reducing the emitted geometry to pixels that can reach the viewport. */
export function gpuClip(points: GpuPoint[], clip: GpuPoint[]): GpuPoint[] {
  const sign=gpuArea(clip)>=0?1:-1;let output=points;
  for(let i=0;i<clip.length&&output.length;i++) {
    const a=clip[i],b=clip[(i+1)%clip.length],input=output;output=[];
    for(let j=0;j<input.length;j++) {
      const p=input[j],q=input[(j+1)%input.length],dp=cross(a,b,p)*sign,dq=cross(a,b,q)*sign;
      if(dp>=-1e-7)output.push(p);
      if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);output.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
    }
  }
  return output;
}

/** Butt caps and SVG miter joins, in local coordinates (or device coordinates
 * for non-scaling strokes). Shared edges meet without gaps between segments. */
export function gpuStroke(contour:GpuContour,width:number,miterLimit=10):GpuPoint[] {
  const p=contour.points,n=p.length;if(n<2||width<=0)return [];
  // Most façades contain rectangular windows. Their exact miter offsets need
  // neither normalized edge vectors nor a hypotenuse calculation per corner.
  if(n===4&&contour.closed&&miterLimit>=Math.SQRT2&&p.every((a,i)=>{const b=p[(i+1)%4],c=p[(i+2)%4];return (a[0]===b[0]&&a[1]!==b[1]||a[1]===b[1]&&a[0]!==b[0])&&(a[0]===b[0])!==(b[0]===c[0]);})){
    const sign=gpuArea(p)>=0?1:-1,r=width/2,left=Math.min(p[0][0],p[1][0],p[2][0],p[3][0]),top=Math.min(p[0][1],p[1][1],p[2][1],p[3][1]);
    const offsets=p.map(a=>[(a[0]===left?1:-1)*sign*r,(a[1]===top?1:-1)*sign*r]),out:GpuPoint[]=[];
    for(let i=0;i<4;i++){const j=(i+1)%4,a=p[i],b=p[j],u=offsets[i],v=offsets[j],al:GpuPoint=[a[0]+u[0],a[1]+u[1]],ar:GpuPoint=[a[0]-u[0],a[1]-u[1]],bl:GpuPoint=[b[0]+v[0],b[1]+v[1]],br:GpuPoint=[b[0]-v[0],b[1]-v[1]];out.push(al,ar,bl,bl,ar,br);}
    return out;
  }
  const count=contour.closed?n:n-1,normals:GpuPoint[]=[],r=width/2;
  for(let i=0;i<count;i++){const a=p[i],b=p[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;normals.push([-dy/length,dx/length]);}
  const offsets=p.map((_,i):GpuPoint=>{
    if(!contour.closed&&i===0)return [normals[0][0]*r,normals[0][1]*r];
    if(!contour.closed&&i===n-1)return [normals.at(-1)![0]*r,normals.at(-1)![1]*r];
    const a=normals[(i+count-1)%count],b=normals[i%count],x=a[0]+b[0],y=a[1]+b[1],den=x*b[0]+y*b[1];
    if(Math.abs(den)<1e-7)return [b[0]*r,b[1]*r];
    const f=r/den,limit=r*miterLimit,length=Math.hypot(x*f,y*f),scale=length>limit?limit/length:1;return [x*f*scale,y*f*scale];
  });
  const out:GpuPoint[]=[];
  for(let i=0;i<count;i++){const j=(i+1)%n,a=p[i],b=p[j],u=offsets[i],v=offsets[j],al:GpuPoint=[a[0]+u[0],a[1]+u[1]],ar:GpuPoint=[a[0]-u[0],a[1]-u[1]],bl:GpuPoint=[b[0]+v[0],b[1]+v[1]],br:GpuPoint=[b[0]-v[0],b[1]-v[1]];out.push(al,ar,bl,bl,ar,br);}
  return out;
}
