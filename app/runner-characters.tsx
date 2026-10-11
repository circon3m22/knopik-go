export function SahurBack({ stride = 0, tucked = false }: { stride?: number; tucked?: boolean }) {
  if (tucked) return <g>
    <path d="M-18-49h36v6h10v33H18v8h-36v-8h-10v-33h10Z" fill="#573c2e"/>
    <path d="M-16-46h32v7h9v25h-9v9h-32v-9h-9v-25h9Z" fill="#b1804d"/>
    <path d="M-15-43h8v33h-8Zm17 0h6v33H2Zm14 6h5v19h-5Z" fill="#d5ac71"/>
    <path d="M-6-40h3v18h-3Zm17 9h3v18h-3Z" fill="#815735"/>
    <path d="M25-43h9v6h4v26h-5v10h-6v-19h-4v-22h2Z" fill="#7e5638"/>
  </g>;
  return <g>
    <path d={stride ? "M-17-28h10v24h-8v6h-14v-6h12ZM8-28h11v19h9v7H8Z" : "M-19-28h11v18h-9v7H-28v-7h9ZM7-28h10v25h10v6H9V-4H7Z"} fill="#72442e" />
    <path d="M-17-116h34v4h8v83h-6v9h-38v-9h-6v-83h8Z" fill="#51372b" />
    <path d="M-15-113h30v4h6v77h-6v8h-30v-8h-6v-77h6Z" fill="#a56d43" />
    <path d="M-12-109h7v74h-4v-29h-3Zm12 0h5v15H0ZM10-107h7v72h-7Z" fill="#c7975e" />
    <path d="M-16-104h3v15h3v19h-3v30h-3ZM-1-84h3v24h-3ZM7-98h3v33H7ZM12-58h3v20h-3Z" fill="#805038" />
    <path d="M-15-117h30v4h6v5H15v3h-30v-3h-6v-5h6Z" fill="#d0a46c" />
    <path d="M-11-115h22v3h4v3H-9v-2h17v-1h-19Z" fill="#8c5d3c" />
    <path d="M-21-88h-8v22h-7v20h8v-17h7Z" fill="#a56d43" transform={stride ? "translate(0 -5)" : undefined} />
    <g transform={stride ? "translate(22 -70) rotate(-23)" : "translate(22 -55) rotate(13)"}>
      <path d="M-3-11h8v26h-8Z" fill="#bb8954" /><path d="M7-64h11v5h4v34h-4V8h-8v-33H6v-34h1Z" fill="#583b2c" /><path d="M10-60h5v35h-2V4h-3Z" fill="#c7975e" /><path d="M17-50h3v18h-3Z" fill="#9c6a40" />
    </g>
    <path d="M-9-40h18v3H-9ZM-6-52h12v3H-6Z" fill="#bf8952" />
  </g>;
}

export function MarketCargo() {
  return <g>
    <path d="M-32-5h64v7h-64Z" fill="#272d4166" />
    <path d="M-30-90h50v88h-50Z" fill="#ae8060" /><path d="M20-90h13v88H20Z" fill="#78555a" /><path d="M-30-90h50l13-8h-50Z" fill="#d1aa7a" />
    <path d="M-25-83h40v5h-40Zm0 32h40v5h-40Zm0 32h40v5h-40Z" fill="#d8b27c" />
    <path d="M-22-80h5v28h-5Zm25 0h5v28H3Zm-25 32h5v28h-5Zm25 0h5v28H3Z" fill="#755657" />
    <path d="M-18-74h10v5h5v5h5v5h5v5H-3v-5h-5v-5h-5v-5h-5Z" fill="#bc905f" />
    <path d="M-21-17h10v12h-10Zm28 0h10v12H7Z" fill="#454253" />
  </g>;
}
