import { useId, type RefObject } from "react";
import { NEIGHBORHOOD_BUILDINGS, NEIGHBORHOOD_OBJECTS } from "./neighborhood-map";

export function DistrictMap({playerRef,player,night,goal}:{playerRef?:RefObject<SVGCircleElement|null>;player?:{x:number;y:number};night:boolean;goal:{x:number;y:number}|null}) {
  const id=`district-${useId().replaceAll(":","")}`;
  return <svg className="neighborhood-map atlas-map" viewBox="0 0 2400 2050" role="img" aria-label="Липовый квартал: ваш дом, парк, дворы, набережная и вход в Knopik Run">
    <defs><pattern id={id} width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0v100" stroke="#9aafa8" strokeOpacity=".1" fill="none" strokeWidth="3"/></pattern><pattern id={`${id}-water`} width="170" height="90" patternUnits="userSpaceOnUse"><path d="M20 40h65m25 30h35" stroke="#7ba8b8" strokeOpacity=".35" strokeWidth="5" fill="none"/></pattern></defs>
    <rect width="2400" height="2050" fill={night?"#263d43":"#b8c5af"}/><rect width="2400" height="2050" fill={`url(#${id})`}/>
    <rect x="1165" y="245" width="1000" height="570" rx="40" fill={night?"#305a50":"#739c79"} stroke={night?"#528171":"#9abc8c"} strokeWidth="14"/>
    <path d="M340 575h140v1080H340Zm1720 230h110v855h-110ZM320 1540h1880v140H320ZM0 790h2400v240H0Z" fill={night?"#6e7a7d":"#ddd5bc"}/>
    <path d="M520 1050h85v435h-85Zm535-15h85v505h-85Zm490-2h95v495h-95ZM320 1465h1880v77H320Z" fill={night?"#617377":"#bdc4af"}/>
    <g transform="translate(1810 1080)"><ellipse rx="73" ry="36" fill="#acbdb5" stroke="#486673" strokeWidth="8"/><ellipse rx="49" ry="22" fill="#6597a8"/><circle r="12" fill="#bdd5d7"/></g>
    <path d="M0 850h2400v120H0Z" fill="#414c5c"/><path d="M0 910h2400" stroke="#c2ba9d" strokeDasharray="70 60" strokeWidth="6"/>
    {[360,2080].map(x=><g key={x}>{Array.from({length:6},(_,i)=><rect key={i} x={x+i*17} y="860" width="9" height="100" fill="#e7dfc8"/>)}</g>)}
    <path d="M1400 800V625h85v-70h110V480h330v250h-100V625h-270v70h-85v105" fill="none" stroke={night?"#abaf93":"#ded7ae"} strokeWidth="56" strokeLinejoin="round"/>
    <circle cx="1595" cy="555" r="74" fill="#405f65" stroke="#b1c8b3" strokeWidth="13"/><circle cx="1595" cy="555" r="40" fill="#7dabb5"/><circle cx="1595" cy="555" r="12" fill="#cee0d7"/>
    <path d="M0 1715h2400v335H0Z" fill={night?"#264c66":"#527f98"}/><rect y="1730" width="2400" height="320" fill={`url(#${id}-water)`}/>
    <path d="M0 1697h2400" stroke="#adc0b7" strokeWidth="22"/><path d="M0 1715h2400" stroke="#243c50" strokeWidth="8"/>
    <rect x="1870" y="1665" width="220" height="150" fill="#a99071" stroke="#665c53" strokeWidth="9"/>{Array.from({length:8},(_,i)=><path key={i} d={`M1878 ${1678+i*18}h204`} stroke="#6d655a" strokeWidth="3"/>)}
    <path d="M1790 1770h-70v16h90v-16Z" fill="#e5d2a8"/>
    {NEIGHBORHOOD_BUILDINGS.map(b=><g key={b.id} data-map-building={b.id}>
      <rect x={b.x+17} y={b.y-b.h!+22} width={b.w} height={b.h} rx="9" fill="#152835" opacity=".4"/>
      <rect x={b.x} y={b.y-b.h!} width={b.w} height={b.h} rx="9" fill={b.home?"#b6937b":night?"#667980":"#839391"} stroke={b.home?"#f1d99b":"#3b5867"} strokeWidth={b.home?12:8}/>
      <rect x={b.x+20} y={b.y-b.h!+20} width={b.w!-40} height={b.h!-40} fill={b.home?"#98715e":night?"#4a626d":"#677f84"}/>
      <path d={`M${b.x+24} ${b.y-b.h!/2}h${b.w!-48}`} stroke="#bfd0ca" strokeOpacity=".35" strokeWidth="8"/>
      {Array.from({length:Math.floor(b.w!/65)},(_,i)=><g key={i}><rect x={b.x+35+i*64} y={b.y-b.h!+35} width="26" height="20" fill={night?"#dac58c":"#b2c9d0"}/><rect x={b.x+35+i*64} y={b.y-55} width="26" height="20" fill={night?"#b4a982":"#b2c9d0"}/></g>)}
      <path d={`M${b.x+b.w!/2-22} ${b.y}h44v20h-44Z`} fill="#d6c5a3"/>
      {b.home&&<g transform={`translate(${b.x+b.w!/2} ${b.y-b.h!/2})`}><circle r="59" fill="#223443"/><path d="M-34 4 0-28 34 4M-22-5v36h44V-5M-6 31V12H8v19" fill="none" stroke="#f1d99b" strokeWidth="8"/></g>}
    </g>)}
    {NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="tree").map(o=><g key={o.id}><circle cx={o.x+10} cy={o.y-5} r="41" fill="#173b36" opacity=".35"/><circle cx={o.x} cy={o.y-18} r="40" fill={night?"#3d6c5b":"#568460"} stroke={night?"#517e65":"#86a873"} strokeWidth="5"/><circle cx={o.x-12} cy={o.y-29} r="14" fill={night?"#57816b":"#8bac77"}/></g>)}
    {NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="lamp").map(o=><g key={o.id}><circle cx={o.x} cy={o.y} r={night?38:13} fill="#edda9b" opacity={night?.18:.8}/><circle cx={o.x} cy={o.y} r="8" fill="#f6e7b5"/></g>)}
    <g stroke="#cedac8" strokeWidth="4" fill="#5c896a">{[1165,1245,1325].map(y=><rect key={y} x="1740" y={y} width="275" height="42"/>)}</g>
    <g fontSize="65" fill={night?"#e0e8da":"#283e48"} textAnchor="middle" fontFamily="Knopik Pixel, Tiny5, monospace">
      <text x="420" y="738">ВАШ ДОМ</text><text x="1770" y="425" fill="#e1ebd6">ЛИПОВЫЙ ПАРК</text><text x="1220" y="1635">НАБЕРЕЖНАЯ</text><text x="1240" y="1920" fill="#c0dde3" letterSpacing="12">РЕКА</text>
    </g>
    <g transform="translate(2230 785)"><rect x="-100" y="-55" width="190" height="70" rx="12" fill="#223443" stroke="#83b3b4" strokeWidth="5"/><text textAnchor="middle" y="-4" fontSize="56" fill="#d8edf0">RUN →</text></g>
    <g transform="translate(2230 135)"><path d="M0-40-20 20 0 7 20 20Z" fill="#e9e2bb"/><text y="66" textAnchor="middle" fontSize="52" fill="#c9d7cc">С</text></g>
    {goal&&<g transform={`translate(${goal.x} ${goal.y})`} data-map-goal=""><circle r="69" fill="#f1d99b" fillOpacity=".18"/><path d="M0-42 34 0 0 42-34 0Z" fill="#f1d99b" stroke="#6a503c" strokeWidth="7"/><circle r="8" fill="#584633"/></g>}
    <circle ref={playerRef} data-map-player="" cx={player?.x??410} cy={player?.y??655} r="29" fill="#e0f8fc" stroke="#24516b" strokeWidth="12"/>
  </svg>;
}
