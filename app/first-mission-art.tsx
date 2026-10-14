import type { AdventureLevel } from "./adventure-levels";

/** Authored machinery and flooding for the opening mission, aligned with its cover. */
export function FirstMissionArt({ level }: { level: AdventureLevel }) {
  if (level.id !== 1) return null;
  const pump = level.rooms[1], collector = level.rooms[3], entrance = level.rooms[0];
  const x = pump.x + 48, y = pump.y + pump.h - 170;
  return <g data-first-mission="">
    <g data-first-water="" opacity=".8">
      {[pump, collector].map((r, i) => <g key={i}><path d={`M${r.x + 215} ${r.y + 100}h${r.w - 350}v${r.h - 210}h-${r.w - 350}Z`} fill="#376571" opacity=".4"/>
        {Array.from({ length: 8 }, (_, n) => <path key={n} d={`M${r.x + 230 + n % 3 * 36} ${r.y + 125 + n * 26}h${54 + n % 2 * 23}v2h-${54 + n % 2 * 23}Z`} fill="#a5ccca" opacity=".46"/>)}</g>)}
    </g>
    <path d={`M${x - 12} ${y + 17}h12v9h-12v53h12v9h-21V17Z M${x + 126} ${y + 21}h32v9h-23v44h-9Z`} fill="#2b3941"/>
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0h126v99H0Z" fill="#22333d"/><path d="M5 5h116v89H5Z" fill="#58777b"/><path d="M5 5h116v6H11v77H5Z" fill="#a1bbb5"/>
      <path d="M9 86h108v8H9Zm98-72h12v62h-12Z" fill="#304e56"/>
      <circle cx="43" cy="47" r="32" fill="#233b4b" stroke="#b0c2b5" strokeWidth="4"/>
      <g transform="translate(43 47)"><g data-first-pump-blade=""><path d="M-4-25h9v17h12v9H8v17h-9V8h-17V-1h10v-12h4Z" fill="#86a6a4"/><path d="M-1-24h4v15h-4Zm13 16h6v4h-6Z" fill="#d6e0cb"/></g><circle r="6" fill="#d3bb85"/></g>
      <path d="M88 15h22v28H88Z" fill="#263949"/><path d="M91 19h16v18H91Z" fill="#597e78"/>
      <g data-first-warning=""><path d="M92 21h6v5h-6Zm0 9h12v3H92Z" fill="#ec9576"/></g>
      <g data-first-power="" display="none"><path d="M92 22h4v8h-4Zm5 5h7v3h-7Z" fill="#b4df9d"/></g>
      <path d="M86 53h24v16H86Z" fill="#263949"/><path d="M90 57h16v5H90Z" fill="#d3bb85"/>
      {[9, 112].map(a => <g key={a}><path d={`M${a} 13h4v4h-4Zm0 64h4v4h-4Z`} fill="#d5d5bb"/></g>)}
    </g>
    <g data-first-power="" display="none"><path d={`M${pump.x + pump.w / 2} ${pump.y + 70}v-200`} fill="none" stroke="#a6d4b1" strokeWidth="5"/>
      <ellipse cx={level.exit.x} cy={level.exit.y - 42} rx="70" ry="28" fill="#9dd6ad" opacity=".2"/></g>
    <g transform={`translate(${entrance.x + entrance.w / 2 - 70} ${entrance.y + 12})`}>
      <path d="M0 0h140v78H0Z" fill="#22333d"/><path d="M7 7h126v66H7Z" fill="#6d817f"/><path d="M14 12h49v53H14Zm59 0h49v53H73Z" fill="#2b3941"/>
      <path d="M4 79h45v5h-8v7H12v-4H4Zm67 2h28v5H71Zm37-7h32v4h-32Z" fill="#ad9d80"/>
      <path d="M61 7h12v65H61Z" fill="#d3bb85"/><path d="M12 16h10v4H12Zm70 0h12v4H82Z" fill="#a4ccbf"/>
    </g>
  </g>;
}
