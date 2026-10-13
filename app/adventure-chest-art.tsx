/** Upright pixel furniture: feet stay on the same ground point as actors. */
export function AdventureChestArt({ room, x = 0, y = 0 }: { room: number; x?: number; y?: number }) {
  return <g data-chest={room} transform={`translate(${x} ${y})`}>
    <path d="M-29 7h58v11h-58Z" fill="#18232c66"/>
    <g data-chest-glow="" display="none"><path d="M-27-23h54V8h-54Z" fill="#f4d889" opacity=".13"/><path d="M-28-28h6v-5h4v5h6v4h-6v6h-4v-6h-6Zm41-5h4v-5h4v5h5v4h-5v5h-4v-5h-4Z" fill="#f4d889"/></g>
    <g data-chest-interior="" display="none"><path d="M-25-22h50v23h-50Z" fill="#343041"/><path d="M-21-18h42v14h-42Z" fill="#4e403b"/><path d="M-17-7h34v3h-34Z" fill="#775442"/></g>
    <path d="M-26-7h52v21h-52Z" fill="#343041"/><path d="M-23-4h46v15h-46Z" fill="#775442"/><path d="M-20-4h40v4h-40Z" fill="#ae8060"/><path d="M-16 1h12v2h-12Zm22 0h12v2H6Zm-24 6h13v2h-13Zm25 0h13v2H7Z" fill="#584a42"/>
    <path d="M-23-4h6v15h-6Zm40 0h6v15h-6Z" fill="#c49c62"/><path d="M-23-4h2v15h-2Zm40 0h2v15h-2Z" fill="#f4d889"/>
    <path d="M-5-7H5v12H-5Z" fill="#343041"/><path d="M-3-5H3v8H-3Z" fill="#e4cc89"/><path d="M-1-3H1v4H-1Z" fill="#775442"/>
    <g data-chest-lid=""><path d="M-23-28h46v4h4v17h-54v-17h4Z" fill="#343041"/><path d="M-21-25h42v4h3v11h-48v-11h3Z" fill="#ae8060"/><path d="M-18-23h36v3h-36Zm-4 4h44v3h-44Z" fill="#d1aa7a"/><path d="M-22-14h44v4h-44Z" fill="#775442"/><path d="M-17-24h5v14h-5Zm29 0h5v14h-5Z" fill="#e4cc89"/><path d="M-17-24h2v14h-2Zm29 0h2v14h-2Z" fill="#fff1d1"/><path d="M-5-13H5v7H-5Z" fill="#343041"/><path d="M-3-11H3v3H-3Z" fill="#e4cc89"/></g>
    <g data-chest-lock=""><path d="M-6-17H6V-6H-6Z" fill="#343041"/><path d="M-3-19H3v4H-3Z" fill="#343041"/><path d="M-4-15H4v7H-4Z" fill="#746875"/><path d="M-1-13H1v3H-1Z" fill="#343041"/></g>
    <g data-chest-ready="" display="none"><path d="M-3-44h6v9h-6Zm0 12h6v4h-6Z" fill="#f4d889"/><path d="M-3-44h3v9h-3Z" fill="#fff1d1"/></g>
  </g>;
}
