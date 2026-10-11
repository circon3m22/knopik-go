export type VerityBlock = { id:number; x:number; y:number; hp:number; cursed:boolean; hit:number };
export type VerityLaser = { id:number; x:number; at:number; width:number };
export type VeritySnapshot = { ball:{x:number;y:number;vx:number;vy:number}; blocks:VerityBlock[]; lasers:VerityLaser[]; power:number; grace:number; paddleWidth:number; stage:number };
type Event = { type:"collect"|"hurt"|"bounce"; x:number; y:number; points:number; message:string };
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const RADIUS=11, PADDLE_Y=395;

/** Bounded arcade physics: swept steps prevent a fast ball tunnelling through bricks. */
export class VerityField {
  ball={x:160,y:286,vx:142,vy:-285};
  blocks:VerityBlock[]=[];
  lasers:VerityLaser[]=[];
  power=0;
  grace=0;
  paddleWidth=78;
  stage=1;
  private nextLaser=7;
  private resetDelay=0;
  private id=0;
  private random:()=>number;
  constructor(random:()=>number=Math.random){this.random=random;this.makeBlocks();}
  private roll(){const n=this.random();return clamp(Number.isFinite(n)?n:.5,0,.999999);}
  private makeBlocks(){
    const curseOffset=Math.floor(this.roll()*6);
    for(let row=0;row<4;row++) for(let col=0;col<6;col++)
      this.blocks.push({id:++this.id,x:23+col*46,y:55+row*29,hp:row===0?2:1,cursed:row===2 && (col===curseOffset || col===(curseOffset+3)%6),hit:0});
  }
  activate(){this.power=.9;}
  private speed(time:number){return Math.min(470,320+Math.max(0,time-2)*3.2+(this.stage-1)*12);}
  private normalize(time:number){
    const speed=this.speed(time),length=Math.hypot(this.ball.vx,this.ball.vy)||1;
    this.ball.vx=this.ball.vx/length*speed;this.ball.vy=this.ball.vy/length*speed;
    if(Math.abs(this.ball.vy)<speed*.35){this.ball.vy=Math.sign(this.ball.vy||-1)*speed*.35;this.ball.vx=Math.sign(this.ball.vx||1)*Math.sqrt(speed*speed-this.ball.vy*this.ball.vy);}
  }
  update(delta:number,time:number,paddleX:number):Event[]{
    if(time<2 || !Number.isFinite(delta) || delta<=0) return [];
    const dt=Math.min(.05,delta),events:Event[]=[];
    this.power=Math.max(0,this.power-dt);this.grace=Math.max(0,this.grace-dt);
    this.paddleWidth=Math.max(54,78-(time-2)*.55);
    for(const block of this.blocks)block.hit=Math.max(0,block.hit-dt);
    if(time>=this.nextLaser){
      this.lasers.push({id:++this.id,x:70+this.roll()*180,at:time+1,width:Math.max(82,110-(time-2)*.6)});
      this.nextLaser+=Math.max(3.8,5.2-time*.025);
    }
    this.lasers=this.lasers.filter(laser=>time<laser.at+.65);
    if(this.resetDelay>0){
      this.resetDelay-=dt;this.ball.x=paddleX;this.ball.y=370;
      return events;
    }
    if(this.blocks.length===0){this.stage++;this.makeBlocks();this.power=Math.max(this.power,.8);}
    this.normalize(time);
    const steps=Math.ceil(dt*120),step=dt/steps;
    let hitBrick=false;
    for(let i=0;i<steps;i++){
      const previous={x:this.ball.x,y:this.ball.y};
      this.ball.x+=this.ball.vx*step;this.ball.y+=this.ball.vy*step;
      if(this.ball.x<RADIUS+8){this.ball.x=RADIUS+8;this.ball.vx=Math.abs(this.ball.vx);}
      if(this.ball.x>312-RADIUS){this.ball.x=312-RADIUS;this.ball.vx=-Math.abs(this.ball.vx);}
      if(this.ball.y<RADIUS+22){this.ball.y=RADIUS+22;this.ball.vy=Math.abs(this.ball.vy);}
      if(this.ball.vy>0 && previous.y+RADIUS<=PADDLE_Y && this.ball.y+RADIUS>=PADDLE_Y && Math.abs(this.ball.x-paddleX)<this.paddleWidth/2+RADIUS){
        const angle=clamp((this.ball.x-paddleX)/(this.paddleWidth/2),-.92,.92)*1.12,speed=this.speed(time);
        this.ball.vx=Math.sin(angle)*speed;this.ball.vy=-Math.cos(angle)*speed;
        if(Math.abs(this.ball.vx)<38)this.ball.vx=Math.sign(this.ball.vx||previous.x-160||1)*38;
        this.ball.y=PADDLE_Y-RADIUS;
        events.push({type:"bounce",x:this.ball.x,y:PADDLE_Y,points:0,message:""});
      }
      const block=this.blocks.find(item=>Math.abs(this.ball.x-item.x-21)<21+RADIUS && Math.abs(this.ball.y-item.y-10)<10+RADIUS);
      if(block&&!hitBrick){
        hitBrick=true;
        if(previous.y+RADIUS<=block.y || previous.y-RADIUS>=block.y+20){
          this.ball.vy=-this.ball.vy;
          this.ball.y=this.ball.vy<0?block.y-RADIUS-.1:block.y+20+RADIUS+.1;
        }else{
          this.ball.vx=-this.ball.vx;
          this.ball.x=this.ball.vx<0?block.x-RADIUS-.1:block.x+42+RADIUS+.1;
        }
        block.hp--;block.hit=.2;
        if(block.cursed && this.power<=0 && this.grace<=0){this.grace=.85;events.push({type:"hurt",x:this.ball.x,y:this.ball.y,points:0,message:"ЗАРАЖЁННЫЙ БЛОК!"});}
        if(block.hp<=0){this.blocks=this.blocks.filter(item=>item!==block);events.push({type:"collect",x:block.x+21,y:block.y+10,points:block.cursed?45:35,message:block.cursed?"ГЛИТЧ УДАЛЁН":"IT’S ME, VERITY!"});}
      }
      for(const laser of this.lasers){
        if(time>=laser.at && this.power<=0 && this.grace<=0 && Math.abs(this.ball.y-245)<RADIUS+6 && Math.abs(this.ball.x-laser.x)>laser.width/2-RADIUS){
          this.grace=.85;events.push({type:"hurt",x:this.ball.x,y:245,points:0,message:"ЛАЗЕР! ИЩИ ПРОСВЕТ"});
        }
      }
      if(this.ball.y>455){
        events.push({type:"hurt",x:this.ball.x,y:426,points:0,message:"УЛЫБКА УСКОЛЬЗНУЛА"});
        this.resetDelay=.65;this.ball={x:paddleX,y:370,vx:Math.sign(this.ball.vx||1)*142,vy:-285};this.grace=.85;
        break;
      }
    }
    return events;
  }
  snapshot():VeritySnapshot{return{ball:{...this.ball},blocks:this.blocks.map(x=>({...x})),lasers:this.lasers.map(x=>({...x})),power:this.power,grace:this.grace,paddleWidth:this.paddleWidth,stage:this.stage};}
}
