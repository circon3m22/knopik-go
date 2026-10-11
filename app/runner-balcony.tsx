/** The opening terrace is part of a building, with a visible façade below it. */
export function BalconyBack() {
  return <g data-runner-balcony-back>
    <path d="M-200-650h89V0h-89Z" fill="#9c7971"/>
    <path d="M-122-650h15V3h-15Z" fill="#715867"/>
    <path d="M-198-148h80v9h-80Zm0 145h86v10h-86Z" fill="#e2b99a"/>
    <path d="M-178-124h51V-7h-51Z" fill="#503e4b"/>
    <path d="M-173-119h42V-7h-42Z" fill="#826250"/>
    <g data-runner-balcony-door>
      <path d="M-171-117h40V-7h-40Z" fill="#b38459"/>
      <path d="M-168-113h16v36h-16Zm20 0h14v36h-14Zm-20 42h16v56h-16Zm20 0h14v56h-14Z" fill="#8c614b"/>
      <path d="M-170-116h3V-8h-3Zm0 0h38v3h-38Z" fill="#dbb27b"/>
      <path d="M-139-66h4v8h-4Z" fill="#edc77e"/>
    </g>
    {[-280, -440].map(y => <g key={y}><path d={`M-186 ${y}h51v78h-51Z`} fill="#624b58"/><path d={`M-179 ${y+7}h37v62h-37Z`} fill="#b6c6bd"/><path d={`M-163 ${y+7}h5v62h-5Zm-16 29h37v5h-37Z`} fill="#9b7767"/><path d={`M-190 ${y+75}h58v7h-58Z`} fill="#e3bc95"/></g>)}
    <path d="M-110-30l256-3 16 55H-178Z" fill="#e2c4a1"/>
    <path d="M-178 15h340v7h-340Z" fill="#f4dcb6"/>
    <path d="M-101-26l1 45h5l-1-45Zm66 0 2 45h5l-2-45Zm66 0 4 45h5l-4-45Zm66 0 6 45h5l-6-45Z" fill="#c4a485"/>
    <path d="M-142-6h292v3h-292Z" fill="#c4a485"/>
    <path d="M117-44h19v13h-19Z" fill="#bb8064"/><path d="M112-52h29v10h-29Z" fill="#d4a176"/>
    <path d="M115-52v-13h5v-7h6v20Zm12 0v-24h6v7h5v17Z" fill="#557c61"/><path d="M118-65h5v11h-5Zm13-8h4v17h-4Z" fill="#a2ba7d"/>
  </g>;
}

export function BalconyFront() {
  return <g data-runner-balcony>
    <path d="M-180 24h344V850h-344Z" fill="#a47b6d"/>
    <path d="M149 24h15V850h-15Z" fill="#705363"/>
    <path d="M-180 24h344v12h-344Zm0 29h329v5h-329Zm0 104h329v9h-329Zm0 134h329v9h-329Zm0 134h329v9h-329Z" fill="#d2a589"/>
    {Array.from({ length: 9 }, (_, i) => {
      const x = -143 + i % 3 * 98, y = 79 + Math.floor(i / 3) * 134;
      return <g key={i}><path d={`M${x-5} ${y-5}h58v75h-58Z`} fill="#8a6563"/><path d={`M${x} ${y}h48v64h-48Z`} fill="#524652"/><path d={`M${x+5} ${y+5}h38v53h-38Z`} fill="#9cabaa"/><path d={`M${x+21} ${y+5}h5v54h-5Zm-16 23h38v5h-38Z`} fill="#b38a72"/><path d={`M${x-7} ${y+62}h62v8h-62Z`} fill="#e2ba91"/></g>;
    })}
    <path d="M-180 16h344v11h-344Z" fill="#f2d2a6"/>
    <path d="M-170-27h326v7h-326Z" fill="#5a4857"/>
    <path d="M-170-28h326v3h-326Z" fill="#e9c49a"/>
    {Array.from({ length: 10 }, (_, i) => <g key={i}><path d={`M${-162+i*34}-20h5v35h-5Z`} fill="#4d4352"/><path d={`M${-161+i*34}-20h2v35h-2Z`} fill="#a88979"/></g>)}
    <path d="M-172-31h7v48h-7Zm323 0h8v48h-8Z" fill="#695265"/>
    <path d="M-174-32h11v5h-11Zm324 0h11v5h-11Z" fill="#e9c9a0"/>
  </g>;
}
