export const SAHUR_ATLAS_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sprites/sahur-standard-v1.webp`;
export const SAHUR_GUN_ATLAS_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sprites/sahur-gun-v1.webp`;
export const SAHUR_CELL = { width: 224, height: 192, anchorX: 112, anchorY: 180 };

export function StandardSahurSprite({ gun = false }: { gun?: boolean }) {
  const width=gun?320:224;
  return <g data-standard-sahur={gun?"gun":"bat"}>
    <path d="M-19-3h38v2h5v5h-5v2h-38V4h-5v-5h5Z" fill="#20232e55"/>
    <svg data-sahur-frame="" x={-width/4} y="-90" width={width/2} height="96" viewBox={`0 768 ${width} 192`} preserveAspectRatio="none" overflow="hidden" style={{imageRendering:"pixelated"}} aria-hidden="true">
      <image href={gun?SAHUR_GUN_ATLAS_URL:SAHUR_ATLAS_URL} width={width*6} height="3072" preserveAspectRatio="none"/>
    </svg>
  </g>;
}
