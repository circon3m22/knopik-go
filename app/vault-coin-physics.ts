export function vaultCoinPose(index:number,time:number,width:number,target:{x:number;y:number}){
 const delay=(index*73%420)/1000,t=Math.max(0,time-delay),startX=width*(.08+(index*37%84)/100),duration=.8+(index*19%33)/100,top=-28-index%4*14,g=2*(target.y-top)/(duration*duration),hit=t>=duration;
 const fall=Math.min(t,duration),after=Math.max(0,t-duration),bounce=index%5===0?Math.max(0,Math.sin(Math.min(1,after/.22)*Math.PI)*10):0;
 return {x:startX+(target.x-startX)*(fall/duration)+(hit?(index%3-1)*after*8:0),y:top+.5*g*fall*fall-bounce,rotation:(index%2?1:-1)*t*(110+index%7*35),flip:.13+Math.abs(Math.cos(t*(6+index%4)+index))*.87,opacity:time<delay?0:hit?Math.max(0,1-after/.2):1,visible:time>=delay&&after<.23};
}
