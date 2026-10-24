/** Two small character-local shaders at most. No blur or full-scene filter.
 * The inner rim comes from opaque source pixels, excluding translucent shadows. */
export function UltraActorLightDefs({prefix,partner=false,night=false,theme='classic'}:{prefix:string;partner?:boolean;night?:boolean;theme?:string}){
 return <>{Array.from({length:partner?2:1},(_,i)=><filter key={i} id={`${prefix}-actor-surface-${i}`} data-ultra-actor-shader={i} data-actor-night={night?'1':'0'} data-actor-theme={theme} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="-112" y="-152" width="224" height="192" colorInterpolationFilters="sRGB">
  <feColorMatrix data-ultra-actor-matrix="" in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="surface"/>
  <feComponentTransfer in="SourceAlpha" result="opaque"><feFuncA type="discrete" tableValues="0 0 0 1"/></feComponentTransfer>
  <feOffset data-ultra-actor-offset="" in="opaque" dx="2" dy="2" result="shifted"/>
  <feComposite in="opaque" in2="shifted" operator="out" result="edge"/>
  <feFlood data-ultra-actor-rim="" floodColor="#ffe2ac" floodOpacity="0" result="tint"/>
  <feComposite in="tint" in2="edge" operator="in" result="lit-edge"/>
  <feComposite in="lit-edge" in2="surface" operator="atop"/>
 </filter>)}</>;
}
