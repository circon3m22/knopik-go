/** The blue shield has a pixel staircase, not a rotated rectangle or smooth gradient. */
export function TapPixelShield(){
 return <svg className="pixel-shield-border" viewBox="0 0 96 96" shapeRendering="crispEdges" aria-hidden="true">
 <path className="shield-pixel-deep" fillRule="evenodd" d="M32 0h32v4h12v4h8v8h4v8h4v8h4v32h-4v12h-4v8h-8v4H64v4H32v-4H20v-4h-8v-8H4V64H0V32h4V20h8v-8h8V4h12Z M32 11h32v3h10v7h7v11h4v32h-4v10h-7v7H64v4H32v-4H22v-7h-7V64h-4V32h4V22h7v-8h10Z"/>
 <path className="shield-pixel-body" fillRule="evenodd" d="M32 3h32v4h11v4h8v8h4v9h4v40h-4v9h-8v8h-9v5H27v-5h-9v-8h-8v-9H6V28h4v-9h8v-8h9V7h5Z M32 10h32v4h10v7h7v11h4v32h-4v10h-7v7H64v4H32v-4H22v-7h-7V64h-4V32h4V22h7v-8h10Z"/>
 <path className="shield-pixel-glint" d="M32 3h25v4H32Zm-12 8h8v4h-8Zm-8 9h4v8h-4Zm-6 12h4v18H6Zm11 49h9v4h-9Zm15 9h22v3H32Zm49-9h5v-8h-5Zm10-17h4V42h-4Z"/>
 </svg>;
}