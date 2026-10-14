import { KNOPIK_FUR as P } from "./knopik-fur";
/** Curled silhouette: muzzle tucked into the chest, paws holding the knees. */
export function KnopikRollArt(){
  return <g data-knopik-roll="" display="none">
    <g data-roll-dust="" fill="#c4b591"><path d="M-46-6h8v4h-8Zm-12 1h6v4h-6Zm21 5h5v3h-5Z"/><path d="M-53-12h5v4h-5Zm-15 8h4v3h-4Z" opacity=".55"/></g>
    <g data-roll-spin="">
      <path d="M-14-26h27v4h9v7h5V4h-5v11h-8v7h-27v-5h-9V8h-6V-9h5v-10h9Z" fill={P.edge}/>
      <path d="M-12-23h24v4h8v7h4V3h-5v10h-7v6h-23v-4h-8V7h-5V-7h5v-10h7Z" fill={P.fur}/>
      <path d="M-9-21h19v4h7v7h-8v-4H-6v5h-8v8h-6v-9h5v-6h6Z" fill={P.light}/>
      <path d="M-17-6h9v-7H4v7h6v13h-6v9H-8v-5h-9Z" fill={P.cream}/>
      <path d="M-14-3h8v-7h8v7h5v9H1v7h-7V8h-8Z" fill={P.ivory}/>
      <path d="M5-11h11v4h5V4h-5v6H8V5h5v-7H5Z" fill={P.dark}/>
      <path d="M-17 0h5v10h10v5h-11v-4h-8V4h4Z" fill={P.shade}/>
      <g><path d="M-4-16h7v7h6v10H1v6h-11V1h-6V-9h5v-12h4Z" fill={P.edge}/><path d="M-4-13h5v7h6v6H0v5h-8V0h-6v-7h6v-10h2Z" fill={P.warm}/><path d="M-10-4h7v3h6v4h-7v-2h-6Z" fill={P.ivory}/><path d="M2-2h5v4H2Z" fill={P.eye}/><path d="M-8-7h5v2h-5Z" fill={P.eye}/><path d="M-6-16h2v5h-2Z" fill={P.cream}/></g>
      <path d="M-5 5h10v3h4v6H2v-3h-7Zm13 4h9v3h3v5H9Z" fill={P.edge}/><path d="M-3 6h7v3h3v3H2V9h-5Zm13 4h6v3h2v2h-8Z" fill={P.cream}/>
      <path d="M13-20h7v4h5v10h-5v5h-7v-4h6v-4h-5v-4h-6v-4h5Z" fill={P.cream}/><path d="M16-18h3v4h4v6h-4v-5h-6v-3h3Z" fill={P.ivory}/>
    </g>
  </g>;
}
