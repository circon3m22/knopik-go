export function DungeonAimArtwork() {
  return <g data-firearm-aim="" display="none" pointerEvents="none">
    <g data-aim-rays="" fill="none" stroke="#ffe5a3" strokeWidth="2" strokeDasharray="7 6" opacity=".65">{Array.from({ length: 5 }, (_, i) => <path key={i} data-aim-ray={i}/>)}</g>
    <g data-aim-impact="" fill="none" stroke="#fff1d1" strokeWidth="2"><circle r="7"/><path d="M-13 0h5m16 0h5M0-13v5m0 16v5"/></g>
    <ellipse data-aim-blast="" rx="116" ry="95.12" fill="#ed987a" fillOpacity=".07" stroke="#edb29b" strokeWidth="2" strokeDasharray="5 7" display="none"/>
  </g>;
}
