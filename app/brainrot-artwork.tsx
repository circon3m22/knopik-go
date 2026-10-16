import {useGraphicsQuality} from "./use-graphics-quality";
import {CharacterDetails,SeaReef,RhythmStageDetails,PlazaDetails} from "./arcade-scene-details";
import type { BrainrotKind } from "./drink-game-engine";
import type { BrainrotSnapshot, MemeObject } from "./brainrot-engine";

function BaseBrainrotCharacter({ kind, pose = 0 }: { kind: BrainrotKind; pose?: number }) {
  if (kind === "verity") return <g>
    <path d="M22 5h20v4h8v5h6v8h4v20h-4v8h-6v5h-8v4H22v-4h-8v-5H8v-8H4V22h4v-8h6V9h8Z" fill="#72562f" />
    <path d="M23 8h18v4h8v5h5v7h3v16h-3v8h-6v4h-7v4H23v-4h-7v-4h-5v-8H7V24h4v-7h5v-5h7Z" fill="#f5d44f" />
    <path d="M19 12h23v4H19Zm-6 7h14v5H13Zm-3 8h8v13h-8Z" fill="#fff08b" />
    <path d="M51 26h6v14h-3v8h-6v4h-7v4H23v-4h22v-5h5v-7h1Z" fill="#d6a63a" />
    <path d="M19 23h6v10h-6Zm20 0h6v10h-6Z" fill="#302b37" />
    <path d="M14 35h4v6h4v4h20v-4h4v-6h4v10h-4v4h-5v3H23v-3h-5v-4h-4Z" fill="#302b37" />
    <path d="M21 37h22v3H21Z" fill="#ffe36a" />
  </g>;
  if (kind === "tralalero") return <g>
    <path d="M5 27V11h5v4h5v6h10V9h5V4h5v14h12v4h11v4h5v17h-7v6H22v-5H12V33H5Z" fill="#253b57" />
    <path d="M9 27V18h3v5h12v-3h11v-7h2v9h13v4h9v13h-5v6H25v-5H15V29Z" fill="#769fab" />
    <path d="M22 29h16v-4h16v3h5v10h-6v5H29v-5h-7Z" fill="#aed0c8" />
    <path d="M25 34h32v4h-5v5H29v-5h-4Z" fill="#edf0d6" />
    <path d="M42 26h9v7h-9Z" fill="#203045" /><rect x="46" y="27" width="3" height="3" fill="#fff0cb" />
    <path d="M48 36h11v3H48Z" fill="#343041" /><path d="M49 36h2v2h-2Zm5 0h2v2h-2Z" fill="#fff1d1" />
    <path d="M24 31h6v9h-3v5h-5V34h2Z" fill="#4a788d" />
    {[18,34,49].map((x,i) => <g key={x} transform={`translate(${x} ${i === pose % 3 ? -2 : 0})`}><path d="M0 43h6v8h5v7H-3v-7h3Z" fill="#233952" /><path d="M1 44h4v7h5v4H-1v-3h2Z" fill="#469fe1" /><path d="M-1 55h11v3H-1ZM4 51h4v2H4Z" fill="#fff3cf" /></g>)}
  </g>;
  if (kind === "ballerina") return <g>
    <path d="M20 32h24v5h5v9H15v-9h5Z" fill="#543653" /><path d="M22 33h20v6h5v4H17v-4h5Z" fill="#dd87b1" />
    <path d="M15 43h34v4h6v5H9v-5h6Z" fill="#d889b3" /><path d="M18 44h28v4h-5v4H23v-4h-5Z" fill="#f7bfd6" />
    <path d={pose % 2 ? "M25 52h5v9h-7v-4h2ZM36 52h5v5h9v4H35v-5h1Z" : "M25 52h5v5h-10v4h-6v-6h11ZM36 52h5v9h-7v-4h2Z"} fill="#fff0d3" />
    <path d="M18 33h-6v5H6v-5h5v-6h8ZM45 33h5v-5h7v6h-6v5h-6Z" fill="#e4bba0" />
    <path d="M17 10h31v18h-4v4H22v-4h-5Z" fill="#5a3c47" /><path d="M20 13h25v13h-4v3H24v-3h-4Z" fill="#f6e4c4" />
    <path d="M44 12h10v4h3v9h-4v3H44v-4h7v-8h-7Z" fill="#d9bea0" />
    <path d="M14 9h37v5H14Z" fill="#ddc5a2" /><path d="M18 7h28v6H18Z" fill="#7f4c37" /><path d="M22 6h20v2h4v3H18V8h4Z" fill="#e8c794" />
    <path d="M27 5h10v3h-4v3h-5V8h-1Z" fill="#fff0ce" /><path d="M28 1h4v2h-4Zm9 2h3v2h-3Z" fill="#f9e5c7" />
    <path d="M24 17h5v5h-5ZM36 17h5v5h-5Z" fill="#392c35" /><path d="M25 16h5v2h-5ZM36 16h5v2h-5Z" fill="#74545a" />
    <path d="M22 23h5v2h-5ZM38 23h5v2h-5ZM30 25h5v2h-5Z" fill="#d3828b" />
    <path d="M27 36h4v4h-4Zm8 0h4v4h-4Z" fill="#ffe8c7" />
  </g>;
  return <BombardiroCrocodilo pose={pose} />;
}

export function BrainrotCharacter({kind,pose=0}:{kind:BrainrotKind;pose?:number}){return <g data-detail-grid="128"><BaseBrainrotCharacter kind={kind} pose={pose}/><CharacterDetails kind={kind}/></g>;}

/** Side silhouette: crocodile head fused into a twin-engine propeller bomber. */
export function BombardiroCrocodilo({ pose = 0 }: { pose?: number }) { return <g>
  <path d="M33 32V26h3v-4h3v-4h4v-4h4v-4h5V7h6v8h-3v8h-4v7h-7v5Z" fill="#363f40" />
  <path d="M37 30v-5h4v-5h4v-4h5v-4h6v3h-3v8h-4v7Z" fill="#7b806b" />
  <path d="M43 24h3v-4h4v-4h4v2h-3v5h-4v4h-4Z" fill="#b9b396" />
  <path d="M40 22h7v3h3v7h-3v2h-7v-3h-2v-6h2Z" fill="#39474b" /><path d="M42 23h4v10h-4Z" fill="#adb4a4" />
  <g data-croc-propeller data-croc-origin="39 28" transform={`translate(39 28) rotate(${pose % 2 ? -25 : 25})`}><path d="M0-9h2v7H0ZM-1 2h2v7h-2Z" fill="#354954" /><rect x="-1" y="-1" width="3" height="3" fill="#e1cc9f" /></g>
  <path d="M52 34V25h3v-6h4v-3h3v22Zm2 3h10v4H53Z" fill="#485250" />
  <path d="M55 33v-8h3v-6h2v15Zm1 5h8v2h-8Z" fill="#aaa993" />
  <path d="M25 29h25v3h8v4h5v7h-5v4H34v-3H24Z" fill="#343e3e" />
  <path d="M27 31h23v3h8v4h3v4h-5v3H34v-3h-7Z" fill="#8d9380" />
  <path d="M29 31h19v3H29Zm14 4h12v3H43Z" fill="#d4d2b6" />
  <path d="M35 41h23v3H35Zm4-4h1v4h-1Zm7 0h1v5h-1Zm8 1h1v4h-1Z" fill="#626c63" />
  <path d="M27 29v-6h3v-3h10v3h3v7Z" fill="#343c40" />
  <path d="M29 27v-4h3v-1h6v2h3v3Z" fill="#b7cccb" />
  <path d="M33 22h2v6h-2Zm5 1h2v5h-2Z" fill="#4f5e63" />
  <path d="M8 30h8v-4h10v2h5v5h3v10h-4v5H17v-2H8v-2H2v-3H0v-6h3v-3h5Z" fill="#293e3b" />
  <path d="M8 32h10v-4h7v2h5v5h2v6h-4v4H17v-2H7v-2H2v-5h3v-2h3Z" fill="#849784" />
  <path d="M5 34h11v-2h6v-2h5v3h-4v2H11v2H5Z" fill="#c1c6a6" />
  <path d="M4 35h3v2H4Zm11-2h3v2h-3Zm6-6h4v2h-4Z" fill="#344942" />
  <path d="M19 30h7v4h-7Z" fill="#e5ddba" /><path d="M21 30h2v3h-2Z" fill="#233334" />
  <path d="M8 38h17v-2h6v6h-6v3H15v-2H7v-2H3v-3Z" fill="#263238" />
  <path d="M4 38h3v3H5Zm5 0h2v4H9Zm5 0h2v3h-2Zm5-1h2v4h-2Zm5-1h2v3h-2Zm5 0h2v3h-2ZM11 42h2v-2h2v4h-4Zm7 2v-3h2v3Zm7-1v-3h2v2Z" fill="#fff0cb" />
  <path d="M10 44h6v2h11v-2h3v3h-4v2H16v-2h-6Z" fill="#617761" />
  <path d="M27 34h3v2h-3Zm0 8h3v2h-3Zm-4 4h2v2h-2ZM9 31h2v2H9Z" fill="#526d5a" />
  <path d="M33 38h9v3h4v5h4v6h3v7H42v-4h-3v-6h-3v-5h-3Z" fill="#343e40" />
  <path d="M36 40h5v4h3v4h4v6h3v3h-7v-4h-3v-6h-3v-4h-2Z" fill="#898b70" />
  <path d="M38 41h2v5h3v5h3v4h-2v-3h-3v-5h-3Z" fill="#c6bea0" />
  <path d="M29 33h8v3h3v8h-3v3h-8v-3h-2v-8h2Z" fill="#313d40" />
  <path d="M31 34h5v3h2v6h-3v2h-5v-2h-1v-7h2Z" fill="#a7aca0" />
  <path d="M30 37h4v6h-4Z" fill="#4b5554" /><path d="M34 35h2v8h-2Z" fill="#d5d6bc" />
  <g data-croc-propeller data-croc-origin="29 40" transform={`translate(29 40) rotate(${pose % 2 ? 25 : -25})`}>
    <path d="M-1-13h3v9H0Zm-1 17h3v9h-3Z" fill="#263943" /><path d="M0-12h1v6H0Zm-1 18h1v6h-1Z" fill="#6d8285" />
    <rect x="-2" y="-2" width="4" height="4" fill="#d9c6a1" />
  </g>
  <path d="M43 38h6v4h-6Z" fill="#47758a" /><path d="M44 39h1v2h-1Zm3 0h1v2h-1Z" fill="#dee5d0" />
</g>; }

function Shoe() { return <g><path d="M-9-7h10v5h8v4h3v8h-24V2h3Z" fill="#243b59" /><path d="M-6-5h5v5h8v4h3v3H-10V2h4Z" fill="#72b8e1" /><path d="M-10 7h20v3h-20ZM-1 0h5v2h-5Z" fill="#fff2d1" /><path d="M0 3h6v2H0Z" fill="#327ab5" /></g>; }
function Mine() { return <g fill="#304954"><path d="M-13-9h26v18h-26ZM-9-13H9v26H-9Z" /><path d="M-2-20h4v7h-4Zm0 33h4v7h-4ZM-20-2h7v4h-7Zm33 0h7v4h-7Z" /><path d="M-10-10h16v5h4V6H-6V2h-4Z" fill="#638f94" /><path d="M-4-4h8v8h-8Z" fill="#f9b171" /><rect x="-2" y="-2" width="4" height="4" fill="#ffead0" /></g>; }
function Jelly({ time }: { time:number }) { const wave=Math.floor(Math.sin(time*7)*3); return <g>
  <path d="M-9-17H9v4h6v6h4V3h-38V-7h4v-6h6Z" fill="#81486c" /><path d="M-8-14H8v4h6v9h-28v-9h6Z" fill="#eab0d3" /><path d="M-4-12H7v3H-4Zm-9 6h4v4h-4Z" fill="#fff0da" />
  <path d={`M-13 3h4v13h${wave}v8h-4v-8h${-wave}Zm10 0h4v21h-4Zm10 0h4v13h${-wave}v8h-4v-8h${wave}Z`} fill="#ca78b7" />
  <path d="M-7-3h4v5h-4Zm10 0h4v5H3Z" fill="#593d62" /><path d="M-2 7h4v5h-4Z" fill="#fff2d1" />
</g>; }
function SahurSprite() { return <g><path d="M-13-32h26v4h4v34h-4v5H-13V6h-4v-34h4Z" fill="#70452f" /><path d="M-10-30h20v37h-20Z" fill="#c18c50" /><path d="M-7-28h4V3h-4ZM6-28h3V3H6Z" fill="#edbc77" /><path d="M-9-22h7v8h-7ZM3-22h7v8H3Z" fill="#fff0ce" /><path d="M-6-21h3v6h-3ZM4-21h3v6H4Z" fill="#332c34" /><path d="M-6-7H7v4H-6Z" fill="#4b3029" /><path d="M-11 9h6v9h-9v-4h3ZM5 9h6v5h4v4H5ZM-17-14h-7v18h8ZM17-14h6v17h-7Z" fill="#966038" /><path d="M22-26h7v31h-7Z" fill="#63412f" /><rect x="24" y="-23" width="3" height="23" fill="#c69b66" /></g>; }
function Melon() { return <g><path d="M-6-10H6v3h4V7H6v3H-6V7h-4V-7h4Z" fill="#406f55" /><path d="M-4-8h8v16h-8Z" fill="#a8cb71" /><path d="M-8-5h3v10h-3ZM5-5h3v10H5Z" fill="#6b9b61" /></g>; }

function SceneObject({ item, time }: { item: MemeObject; time: number }) {
  return <g transform={`translate(${Math.round(item.x)} ${Math.round(item.y)})`}>
    {item.type === "shoe" ? <Shoe /> : item.type === "mine" ? <Mine /> : item.type === "jelly" ? <Jelly time={time} /> : item.type === "spark" ? <g><path d="M-4-12h8v5h4V7H4v5h-8V7h-4V-7h4Z" fill="#f48578" /><path d="M-2-8h4V8h-4Z" fill="#fff0af" /><path d="M-1 14h2v10h-2Z" fill="#d4a868" /></g> : item.type === "sahur" ? <g opacity={(item.flash ?? 0)>0 ? .55 : 1}><path d="M-20 14h40v5h-40Z" fill="#29394b55" /><g transform={`rotate(${Math.sin(time * 6 + item.id) * 4})`}><g transform={item.boss?"scale(1.6)":""}><SahurSprite /></g>{item.boss&&<><path d="M-14-56h6v-5h7v5h7v-5h7v15h-27Z" fill="#e8be72"/><text y="-65" textAnchor="middle" fill="#fff0b5" fontSize="13">{item.hp}/6</text></>}{item.armor && <><path d="M-17-34h34v11h-34Z" fill="#425965" /><path d="M-13-34h26v4h-26Z" fill="#a1c4c4" /><path d="M-12-9h24v14h-24Z" fill={(item.hp ?? 2)>1?"#708a91":"#b28666"} /><path d="M-8-6h16v3H-8Zm6 0h3v8h-3Z" fill="#ddd9b5" /></>}</g></g> : item.type === "guest" ? <g transform="translate(-22 -32) scale(.7)"><BrainrotCharacter kind="ballerina" pose={Math.floor(time * 3)} /></g> : item.type === "melon" ? <g transform={`rotate(${item.age * 240})`}><Melon /></g> : <g><path d="M-14-11h28v4h4V7h-4v4h-28V7h-4V-7h4Z" fill={item.accent?"#e8c275":"#51364e"} /><path d="M-12-8h24v16h-24Z" fill={["#f2b67f","#f4a9cb","#a8d5c6"][item.lane ?? 0]} /><path d="M-3-5h8v2H-1v6h-5v-4h3Z" fill="#fff1d1" />{item.accent && <path d="M-7 12h14v3H-7Z" fill="#ffe89f" />}</g>}
  </g>;
}

export function BrainrotScene({ kind, state, reduced }: { kind: BrainrotKind; state: BrainrotSnapshot; reduced: boolean }) {
  const low=useGraphicsQuality()==="low";
  reduced=reduced||low;
  const t = reduced ? 0 : state.time, scroll = Math.floor(t * 28) % 48;
  const visible = state.objects.filter(item => !item.done && item.y > -40 && item.y < 455);
  return <svg viewBox="0 0 320 440" className={`brainrot-world world-${kind}`} shapeRendering="crispEdges" aria-hidden="true">
    {kind === "verity" && state.verity ? <VerityRoom state={state} reduced={reduced} /> : kind === "tralalero" ? <>
      <rect width="320" height="440" fill="#346e85" /><path d="M0 0h33v440H0ZM288 0h32v440h-32Z" fill="#244e65" />
      {Array.from({length:low?0:11},(_,i) => <g key={i} transform={`translate(0 ${i * 48 + scroll - 48})`}><path d="M34 0h58v3H34Zm96 9h46v3h-46Zm89 20h67v3h-67Z" fill="#71b7bb" opacity=".5" /><path d="M45 5h19v3H45Zm144 28h22v3h-22Z" fill="#b8ddd0" opacity=".6" /><path d="M0 14h16v14H0Zm304 0h16v28h-16Z" fill="#89ac91" /></g>)}
      <path d="M0 0h320v24H0Z" fill="#dab889" /><path d="M0 20h320v8H0Z" fill="#f6dfad" />
      {!low&&<SeaReef zone={Math.min(2,Math.floor(state.time/14))} scroll={scroll}/>}
      <g transform={`translate(${Math.round(state.x) - 43} ${329 - Math.round(state.jump * 38)}) scale(1.35)`} opacity={state.invincible > 0 && Math.floor(state.time * 14) % 2 ? .4 : 1}><BrainrotCharacter kind="tralalero" pose={state.pose} /></g>
    </> : kind === "ballerina" ? <>
      <rect width="320" height="440" fill="#46394e" /><path d="M0 0h320v152H0Z" fill="#725363" />
      <path d="M0 0h36v160H0Zm284 0h36v160h-36Z" fill="#aa6b73" /><path d="M8 0h10v140H8Zm292 0h10v140h-10Z" fill="#d89c9b" />
      <path d="M52 18h216v82H52Z" fill="#3c354b" /><path d="M56 22h208v74H56Z" fill="#91717d" />
      <text x="160" y="47" textAnchor="middle" fill="#ffe0b0" fontSize="22">CAPPUCCINA</text>
      {[0,1,2,3,4].map(i => <g key={i} transform={`translate(${64+i*43} 61)`}><path d="M0 0h19v17H0Z" fill="#e1bd9b" /><path d="M3 4h13v3H3Z" fill="#8e5e52" /><path d="M19 3h5v10h-5Z" fill="#e1bd9b" /></g>)}
      {!low&&<RhythmStageDetails/>}
      <path d="M32 142h256v12H32ZM48 132h224v10H48Z" fill="#bf9290" />
      <g transform={`translate(129 78) rotate(${reduced ? 0 : [0,-5,0,5][state.pose]} 32 48)`}><BrainrotCharacter kind="ballerina" pose={state.pose} /></g>
      {[0,1,2].map(lane => <g key={lane}><path d={`M${24+lane*96} 160h80v280h-80Z`} fill={(state.hitLanes ?? []).includes(lane) ? "#896879" : lane % 2 ? "#594253" : "#634b5c"} /><path d={`M${24+lane*96} 160h3v280h-3Z`} fill="#9c7885" /><path d={`M${32+lane*96} 326h64v18h-64Z`} fill={["#e3ab7a","#dc8eb1","#8db8a8"][lane]} /><path d={`M${36+lane*96} 330h56v10h-56Z`} fill="#ffe8c7" /></g>)}
      {visible.filter(n=>n.type==="note"&&n.hold).map(n=><g key={`tail-${n.id}`}><rect x={n.x-7} y={Math.max(160,n.y-n.hold!*(255+Math.min(55,t*2)))} width="14" height={n.hold!*(255+Math.min(55,t*2))} fill={n.holding?"#ffe7ac":"#cda6c3"}/><path d={`M${n.x-3} ${n.y-n.hold!*(255+Math.min(55,t*2))+3}h6v14h-6Z`} fill="#fff0d0"/></g>)}
      <path d="M0 351h320v89H0Z" fill="#352c43" /><path d="M0 355h320v3H0Z" fill="#a58089" />
      <text x="160" y="405" textAnchor="middle" fill="#d6b9bb" fontSize="18">ТУН · ТУН · ТАП</text>
    </> : <>
      <rect width="320" height="440" fill="#7a9190" /><path d="M0 0h320v155H0Z" fill="#bfd3bd" />
      {Array.from({length:low?0:7},(_,i) => <g key={i} transform={`translate(${i*52 - 14} ${i%2*23+12})`}><path d="M0 0h36v6h9v6H-8V6h8Z" fill="#edf0cd" /><path d="M0 6h36v5H0Z" fill="#d2dfc2" /></g>)}
      <path d="M0 156h320v284H0Z" fill="#bda982" />
      {Array.from({length:low?0:7},(_,i) => <g key={i} transform={`translate(0 ${155+i*48+scroll-48})`}><path d="M26 0h268v3H26Zm0 47h268v2H26Z" fill="#8b8a72" /><path d="M80 0h3v48h-3ZM237 0h3v48h-3Z" fill="#998e71" /><path d="M28 5h48v8H28Zm216 24h45v8h-45Z" fill="#d4c394" /></g>)}
      <path d="M0 153h22v287H0Zm298 0h22v287h-22Z" fill="#687f6b" /><path d="M2 160h16v14H2Zm302 16h16v15h-16Z" fill="#a1b37e" />
      {!low&&<PlazaDetails wave={state.remaining<=8?3:state.time<14?1:2}/>}
      <path d={`M${Math.round(state.x+state.wind*.75)-17} 322h34v3h-34Zm15-14h3v32h-3Z`} fill="#ffedbc" opacity=".7" />
      <path d={`M${Math.round(state.x)-1} 122v173h2V122Z`} fill="#48635d" opacity=".35" stroke="#ecedbd" strokeDasharray="5 8" />
      <g transform={`translate(${Math.round(state.x)-48} ${48 + Math.floor(Math.sin(t*3)*3)}) scale(1.5)`} opacity={state.invincible>0 && Math.floor(t*12)%2 ? .45 : 1}><BrainrotCharacter kind="bombardiro" pose={Math.floor(t*15)} /></g>
    </>}
    {visible.sort((a,b) => a.y-b.y).map(item => <SceneObject key={item.id} item={item} time={t} />)}
    {state.particles.map(p => <rect key={p.id} x={Math.round(p.x)} y={Math.round(p.y)} width={p.life > .3 ? 5 : 3} height={p.life > .3 ? 5 : 3} fill={p.color} opacity={Math.min(1,p.life*3)} />)}
    {state.feedback > 0 && <g><rect x="8" y="410" width="304" height="24" fill="#302c43" opacity=".95" /><text x="160" y="429" textAnchor="middle" fill="#ffe9b1" fontSize="16">{state.message}</text></g>}
  </svg>;
}

function VerityRoom({state,reduced}:{state:BrainrotSnapshot;reduced:boolean}){
  const room=state.verity!;
  const t=reduced?0:state.time,ball=room.ball,width=Math.round(room.paddleWidth);
  return <g>
    <rect width="320" height="440" fill="#252b44" />
    <path d="M0 0h320v28H0ZM0 28h10v412H0Zm310 0h10v412h-10Z" fill="#536073" />
    <path d="M12 28h296v8H12ZM12 30h5v374h-5Zm291 0h5v374h-5Z" fill="#86a298" />
    {Array.from({length:12},(_,i)=><g key={i} opacity=".4"><path d={`M20 ${39+i*31}h280v2H20Z`} fill="#4b6570" /><path d={`M${30+i%6*49} 30h2v376h-2Z`} fill="#435563" /></g>)}
    {Array.from({length:18},(_,i)=><g key={`circuit-${i}`}><path d={`M${20+i%3*100} ${180+Math.floor(i/3)*30}h11v5h6v1h-7v-5H${20+i%3*100}Z`} fill="#456174"/><rect x={38+i%3*100} y={184+Math.floor(i/3)*30} width="3" height="3" fill="#859f9f"/></g>)}
    <text x="17" y="20" fill="#f8e185" fontSize="15">VERITY.EXE</text><text x="303" y="20" textAnchor="end" fill="#bbd9c3" fontSize="13">КОМНАТА {String(room.stage).padStart(2,"0")}</text>
    {room.blocks.map(block=><g key={block.id} transform={`translate(${block.x} ${block.y})`}>
      <path d="M2 0h38v2h2v16h-2v2H2v-2H0V2h2Z" fill={block.hit>0?"#fff0bd":block.cursed?"#9b506e":"#53768a"} />
      <path d="M3 3h36v13H3Z" fill={block.steel?"#78889b":block.switch?"#97d4bc":block.cursed?"#d77382":block.hp>1?"#bb9ba0":"#a0c9b3"} />
      <path d="M5 4h32v2H5ZM5 8h2v6H5Z" fill={block.cursed?"#f8b39b":"#e3efd2"} />
      {block.switch?<path d="M18 6h6v9h-6Zm-5 3h16v3H13Z" fill="#315e64"/>:block.steel?<path d="M8 5h3v10H8Zm23 0h3v10h-3ZM14 9h14v2H14Z" fill="#d8e1d7"/>:block.cursed?<path d="M13 8h4v4h-4Zm12 0h4v4h-4ZM17 13h8v3h-8Z" fill="#432d48" />:<path d={block.hp>1?"M15 8h4v6h-4Zm8 0h4v6h-4Z":"M16 8h10v2h-4v4h-2v-4h-4Z"} fill="#486e71" />}
    </g>)}
    {room.stage>=2&&<g transform={`translate(${Math.round(160+Math.sin(state.time*1.4)*80)} 208)`}><path d="M-32-3h64v6h-64Z" fill="#d8b879"/><path d="M-29-2h58v1h-58Z" fill="#fff1bf"/></g>}
    {room.lasers.map(laser=>{const warning=state.time<laser.at,left=Math.round(laser.x-laser.width/2),right=Math.round(laser.x+laser.width/2);return <g key={laser.id}>
      <path d={`M10 245H${left}M${right} 245H310`} fill="none" stroke={warning?"#b86986":"#fff0bf"} strokeWidth={warning?3:8} strokeDasharray={warning?"5 5":undefined} />
      {!warning&&<path d={`M10 239H${left}M${right} 239H310M10 251H${left}M${right} 251H310`} stroke="#eb7594" strokeWidth="3" />}
      <path d={`M${left} 226h4v38h-4Zm${right-left-4} 0h4v38h-4Z`} fill="#b7dca8" />
      {warning&&<text x={laser.x} y="232" textAnchor="middle" fontSize="14" fill="#ceecc2">ПРОСВЕТ</text>}
    </g>;})}
    <path d={`M${Math.round(state.x-width/2)} 395h${width}v10h-${width}Z`} fill="#6fbbbc" /><path d={`M${Math.round(state.x-width/2)+3} 395h${width-6}v3h-${width-6}Z`} fill="#d4f1d9" />
    <path d={`M${Math.round(state.x-width/2)+5} 400h10v3h-10Zm${width-20} 0h10v3h-10Z`} fill="#3e666e" />
    {Array.from({length:4},(_,i)=><rect key={i} x={Math.round(ball.x-ball.vx*(i+1)*.012)-3} y={Math.round(ball.y-ball.vy*(i+1)*.012)-3} width={6-i} height={6-i} fill={room.power>0?"#95e6d3":"#f1cf67"} opacity={.55-i*.1} />)}
    {room.power>0 && <g transform={`translate(${Math.round(ball.x)} ${Math.round(ball.y)})`}><path d="M-19-8h3v-8h8v-3H8v3h8v8h3V8h-3v8H8v3H-8v-3h-8V8h-3Z" fill="none" stroke="#8ce6d5" strokeWidth="3" /><path d="M-24-2h4v4h-4Zm44 0h4v4h-4Z" fill="#f0ffcd" /></g>}
    <g transform={`translate(${Math.round(ball.x)-14.72} ${Math.round(ball.y)-14.72}) scale(.46)`} opacity={room.grace>0&&!reduced&&Math.floor(t*12)%2?.55:1}><BrainrotCharacter kind="verity" /></g>
  </g>;
}
