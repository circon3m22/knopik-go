/* eslint-disable @next/next/no-img-element -- A shared, versioned SVG is cached with the game; it needs no raster image service. */
import type {CSSProperties} from 'react';
import {GAME_PRESENTATION} from './release-presentation';
export const releaseStyle={
 '--release-background':GAME_PRESENTATION.background,
 '--release-surface':GAME_PRESENTATION.surface,
 '--release-accent':GAME_PRESENTATION.accent,
 '--release-highlight':GAME_PRESENTATION.highlight,
} as CSSProperties;
export function ReleasePoster({className=''}:{className?:string}){
 const src=`${process.env.NEXT_PUBLIC_BASE_PATH??''}${GAME_PRESENTATION.artwork}`;
 return <figure className={`release-poster ${className}`} data-presentation={GAME_PRESENTATION.id}>
  <img src={src} width={1080} height={1080} loading="eager" fetchPriority="high" decoding="async" alt={GAME_PRESENTATION.alt}/>
 </figure>;
}
