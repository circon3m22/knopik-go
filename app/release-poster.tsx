/* eslint-disable @next/next/no-img-element -- A shared, versioned SVG is cached with the game; it needs no raster image service. */
import type {CSSProperties} from 'react';
import {GAME_PRESENTATION} from './release-presentation';
export const releaseStyle={
 '--release-foreground':GAME_PRESENTATION.foreground??'#f5e9d0',
 '--release-muted':GAME_PRESENTATION.muted??'#c1c3d9',
 '--release-button-text':GAME_PRESENTATION.buttonText??'#23304a',
 '--release-border':GAME_PRESENTATION.border??'#6f739a',
 '--release-background':GAME_PRESENTATION.background,
 '--release-surface':GAME_PRESENTATION.surface,
 '--release-accent':GAME_PRESENTATION.accent,
 '--release-highlight':GAME_PRESENTATION.highlight,
} as CSSProperties;
export function ReleasePoster({className='',format='square'}:{className?:string;format?:'square'|'portrait'}){
 const base=process.env.NEXT_PUBLIC_BASE_PATH??'',portrait=format==='portrait'&&!!GAME_PRESENTATION.portraitArtwork;
 const src=`${base}${portrait?GAME_PRESENTATION.portraitArtwork:GAME_PRESENTATION.artwork}`;
 const illustration=<img src={src} width={1080} height={portrait?1920:1080} loading="eager" fetchPriority="high" decoding="async" alt={portrait?GAME_PRESENTATION.portraitAlt??GAME_PRESENTATION.alt:GAME_PRESENTATION.alt}/>;
 return <figure className={`release-poster ${portrait?'release-poster-portrait':''} ${className}`} data-presentation={GAME_PRESENTATION.id}>
  {portrait?<picture><source media="(orientation: landscape)" srcSet={`${base}${GAME_PRESENTATION.artwork}`}/>{illustration}</picture>:illustration}
 </figure>;
}
