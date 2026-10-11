import type { RunnerObject } from "./runner-engine";
import type { WorldProject } from "./runner-architecture";

const NS = "http://www.w3.org/2000/svg";
type Mesh = {group:SVGGElement; paths:SVGPathElement[]};
type Vertex = [number,number,number];
const polygon = (points:{x:number;y:number}[])=>`M${points.map(p=>`${p.x} ${p.y}`).join("L")}Z`;

/** Pixel silhouettes retain their geometry as the camera passes, including tops and sides. */
export class RunnerObstacles {
  private meshes:Mesh[];
  private count=0;
  constructor(svg:SVGSVGElement) {
    svg.querySelectorAll('[data-runner-mesh="obstacle"]').forEach(node=>node.remove());
    const parent=svg.querySelector("[data-runner-obstacles]")!; parent.replaceChildren();
    this.meshes=Array.from({length:56},()=>{
      const group=document.createElementNS(NS,"g");
      group.setAttribute("data-runner-mesh","obstacle");
      const paths=Array.from({length:38},()=>document.createElementNS(NS,"path"));
      group.append(...paths); parent.append(group); group.setAttribute("display", "none");
      return {group,paths};
    });
  }
  begin(){this.count=0;}
  draw(object:RunnerObject,z:number,project:WorldProject) {
    const mesh=this.meshes[this.count++]; if(!mesh)return;
    mesh.group.setAttribute("display", "inline"); let index=0;
    const p=(x:number,d:number,h:number)=>project(object.x+x,z+d,h);
    const face=(vertices:Vertex[],fill:string)=>{
      const path=mesh.paths[index++]; if(!path)return;
      path.setAttribute("d",polygon(vertices.map(([x,d,h])=>p(x,d,h)))); path.setAttribute("fill",fill);path.setAttribute("visibility","visible");
    };
    const front=(x1:number,x2:number,d:number,bottom:number,top:number,fill:string)=>face([[x1,d,bottom],[x2,d,bottom],[x2,d,top],[x1,d,top]],fill);
    const box=(x1:number,x2:number,d1:number,d2:number,bottom:number,top:number,fill:string,side:string,roof:string)=>{
      face([[x1,d1,bottom],[x1,d2,bottom],[x1,d2,top],[x1,d1,top]],side);
      face([[x2,d1,bottom],[x2,d2,bottom],[x2,d2,top],[x2,d1,top]],side);
      front(x1,x2,d1,bottom,top,fill);
      face([[x1,d1,top],[x2,d1,top],[x2,d2,top],[x1,d2,top]],roof);
    };
    face([[-37,-6,1],[37,-6,1],[37,6,1],[-37,6,1]],"#262c3f55");
    const variant=object.variant;
    if(object.kind==="barrier") {
      if(variant===0) {
        // Two unmistakable road cones replace the bench-like early prototype.
        for(const x of [-18,18]) {
          box(x-13,x+13,-3,3,0,5,"#55575a","#303d45","#858c7c");
          box(x-10,x+10,-2.5,2.5,5,17,"#d69163","#9d654b","#e9b47a");
          box(x-6,x+6,-2,2,17,27,"#e8dab0","#b09a76","#fff0c1");
          box(x-3,x+3,-1.5,1.5,27,36,"#d69163","#9d654b","#e9b47a");
        }
      } else if(variant===1 || variant===7) {
        box(-26,-20,-2,2,0,26,"#8d8b7b","#5f6b6d","#c8c1a6");box(20,26,-2,2,0,26,"#8d8b7b","#5f6b6d","#c8c1a6");
        box(-32,32,-3,3,18,38,variant===7?"#8ea8a7":"#e5bf79","#657775",variant===7?"#c9d6b6":"#f7e0a0");
        for(let x=-30;x<30;x+=20) front(x,x+9,-3.1,20,36,"#7b5149");
      } else if(variant===2 || variant===5) {
        box(-33,33,-4,4,0,27,"#ab805a","#755848","#dfbb83");
        face([[-29,-3,28],[29,-3,28],[29,3,28],[-29,3,28]],"#62564a");
        for(const x of [-23,-9,7,23]) {
          box(x-4,x+4,-2,2,28,34,"#6f996d","#3d695f","#aac095");
          front(x-2,x+2,-2.2,32,39,variant===5?"#c9a5c6":x%3?"#da9890":"#ead38b");
        }
      } else if(variant===4 || variant===6) {
        // Produce counters only exist in the pedestrian market district.
        box(-28,-21,-3,3,0,39,"#a07952","#665348","#d4b37e");
        box(21,28,-3,3,0,39,"#a07952","#665348","#d4b37e");
        box(-35,35,-4,4,39,45,"#bf9669","#84634f","#efd0a0");
        for(const [i,x] of [-24,-8,8,24].entries()) {
          box(x-6,x+6,-2,2,45,54,variant===4?i%2?"#cc8363":"#cdbb70":"#7f9e6f","#668064",variant===4?"#efd09b":"#bace90");
        }
      }
    } else if(object.kind==="cargo") {
      if(variant===0) {
        box(-32,32,-4,4,0,7,"#795747","#493f42","#c49d6a");
        box(-28,28,-3,3,7,58,"#ae7c50","#71554b","#d1ab75");
        box(-21,23,-2,3,58,101,"#c59462","#89634d","#e3c18a");
        for(const y of [23,47,71,94])front(-26,26,-3.1,y,y+4,"#e2c293");
        front(-20,-15,-3.2,8,57,"#7c5b45"); front(15,20,-3.2,8,57,"#7c5b45");
      } else if(variant===2 || variant===6) {
        box(-31,31,-4,4,0,102,"#67858a","#42545f","#adc5b8");
        front(-26,26,-4.1,53,94,"#96c2c0");front(-23,-5,-4.2,57,90,"#c8d6bf");
        front(-21,0,-4.2,14,33,"#e4c797");front(12,21,-4.2,15,43,"#483f55");
        for(const y of [18,27,36]) front(14,19,-4.3,y,y+3,"#eabb7b");
        front(-27,27,-4.3,48,52,"#3c5360");
      } else if(variant===7) {
        box(-34,34,-4,4,0,102,"#759697","#465d71","#b2c5b1");
        for(const x of [-26,-14,-2,10,22])front(x,x+3,-4.1,7,97,"#a3b8ab");
        front(-31,31,-4.2,7,11,"#3c5363");front(-31,31,-4.2,93,98,"#d3cfac");
      } else if(variant===4 || variant===5) {
        front(-29,-18,-3,0,12,"#3a4550");front(18,29,-3,0,12,"#3a4550");
        box(-32,32,-4,4,12,49,"#ab7a58","#6d5550","#e2bb83");
        box(-29,29,-3,3,49,56,"#d1ab76","#9d7259","#f1d6a0");
        box(-25,5,-2,3,56,83,"#83a06b","#4e7160","#c3d58c");
        box(8,27,-2,3,56,102,"#bd8867","#805e4d","#ead1a0");
        for(const y of [26,40,65,78,92])front(-25,26,-4.1,y,y+3,"#dfc18b");
      } else {
        box(-32,32,-4,4,0,95,"#b48b6e","#805c54","#dfb286");
        for(const y of [0,26,53,80])front(-32,32,-4.1,y,y+4,"#e8c897");
        for(const [x,y]of [[-13,4],[9,30],[-13,57]])front(x,x+4,-4.2,y,y+20,"#815d50");
        box(-20,20,-2,3,95,102,"#87a082","#577662","#bad0a0");
      }
    }
    for(;index<mesh.paths.length;index++)mesh.paths[index].setAttribute("visibility","hidden");
    return mesh.group;
  }
  end(){for(let i=this.count;i<this.meshes.length;i++)this.meshes[i].group.setAttribute("display", "none");}
}
