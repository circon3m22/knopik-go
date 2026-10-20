import type {AdventureLevel} from './adventure-levels';
import type {GraphicsQuality} from './graphics-quality';
/** Static material runs, not animated objects or invisible collision bodies.
 * Five room uses and seven materials share a bounded number of paint nodes. */
export function ExpeditionRoomArt({level,room,quality}:{level:AdventureLevel;room:number;quality:GraphicsQuality}){
 const r=level.rooms[room],p=level.palette,role=(level.id+room*3)%5,low=quality==='low',medium=quality==='medium',detail=quality==='ultra'?16:quality==='very-high'?12:8;
 const edge=(n:number)=>n%2?r.x+r.w-43:r.x+33;
 const floor=`M${r.x+37} ${r.y+r.h-41}h${r.w-74}v3h-${r.w-74}ZM${r.x+r.w/2-28} ${r.y+r.h-55}h56v3h-56Z`;
 const inlays=role===0?`M${r.x+42} ${r.y+190}h${r.w-84}v2h-${r.w-84}ZM${r.x+42} ${r.y+r.h-100}h${r.w-84}v2h-${r.w-84}Z`:role===1?`M${r.x+210} ${r.y+80}h4v70h-4ZM${r.x+r.w-214} ${r.y+r.h-150}h4v70h-4Z`:role===2?`M${r.x+42} ${r.y+75}h64v3h-61v65h-3ZM${r.x+r.w-106} ${r.y+r.h-78}h61v-65h3v68h-64Z`:role===3?`M${r.x+42} ${r.y+r.h-102}h96v5h-96ZM${r.x+r.w-138} ${r.y+96}h96v5h-96Z`:`M${r.x+r.w/2-98} ${r.y+82}h196v3h-196ZM${r.x+r.w/2-98} ${r.y+r.h-84}h196v3h-196Z`;
 let material='',glints='',objects='',trim='';
 if(!low&&!medium)for(let i=0;i<detail;i++){
  const x=edge(i)+(i%3-1)*5,y=r.y+90+Math.floor(i/2)*(r.h-170)/Math.ceil(detail/2);
  material+=level.zone===1?`M${x} ${y}h18v4h-18Zm6 6h24v3h-24Z`:level.zone===2?`M${x} ${y}h8v22h-8Zm-3 7h14v4h-14Z`:level.zone===3?`M${x} ${y}h20v10h-20Zm3 12h14v3h-14Z`:level.zone===4?`M${x} ${y}h22v3h-22Zm9 7h17v2h-17Z`:level.zone===5?`M${x} ${y}h4v20h15v3h-19Zm8 5h12v2h-12Z`:level.zone===6?`M${x} ${y}h9v4h9v5h-18Zm4 11h16v3h-16Z`:`M${x} ${y}h22v4h-22Zm4 7h14v8h-14Z`;
  if(quality==='ultra'||quality==='very-high')glints+=`M${x+2} ${y+1}h10v1h-10Zm2 3h4v1h-4Z`;
 }
 if(!low)for(let n=0;n<3;n++){
  const x=Math.round(r.x+72+n*(r.w-144)/2),y=r.y+r.h-25;
  objects+=level.zone===1?`M${x-24} ${y-12}h48v17h-48Zm6-4h36v4h-36Z`:level.zone===2?`M${x-22} ${y-19}h44v22h-44Zm6-5h32v5h-32Z`:level.zone===3?`M${x-26} ${y-17}h52v21h-52Z`:level.zone===4?`M${x-25} ${y-17}h50v20h-50Z`:level.zone===5?`M${x-20} ${y-22}h40v26h-40Zm-5 6h50v14h-50Z`:level.zone===6?`M${x-26} ${y}h9v-10h8v-13h7v13h8v-6h8v12h12v8h-52Z`:`M${x-22} ${y-23}h44v24h-7v6h-30v-6h-7Z`;
  trim+=level.zone===1?`M${x-19} ${y-10}h38v2h-38Zm3 4h4v8h-4Zm9 0h4v8h-4Zm9 0h4v8h-4Zm9 0h4v8h-4Z`:level.zone===2?`M${x-17} ${y-16}h34v3h-34Zm5 6h5v10h-5Zm9 0h5v10h-5Zm9 0h5v10h-5Z`:level.zone===3?`M${x-22} ${y-13}h44v3h-44Zm5 6h17v4h-17Zm22 0h12v4H${x+5}Z`:level.zone===4?`M${x-21} ${y-13}h42v2h-42Zm5 5h28v2h-28Zm9 5h22v2h-22Z`:level.zone===5?`M${x-15} ${y-17}h30v3h-30Zm6 6h4v9h-4Zm10 0h4v9h-4Zm10 0h4v9h-4Z`:level.zone===6?`M${x-14} ${y-8}h10v3h-10Zm10-11h4v13h-4Zm7 9h14v3h-14Z`:`M${x-16} ${y-18}h32v3h-32Zm12 5h8v13h-8Zm-8 5h24v3h-24Z`;
 }

 return <g data-expedition-room={`${level.id}.${room}`} data-room-detail={room} data-room-use={['gallery','workshop','archive','watchpost','sanctum'][role]} pointerEvents="none">
  <path d={floor} fill={p.dark} opacity=".6"/>{!low&&<path d={inlays} fill={p.light} opacity=".36"/>}
  {!low&&<><path d={objects} fill={p.dark}/><path d={trim} fill={p.light} opacity=".65"/></>}{material&&<path d={material} fill={level.zone===6?'#6b8c64':p.dark} opacity=".5"/>}{glints&&<path d={glints} fill={p.light} opacity=".55"/>}
 </g>;
}
