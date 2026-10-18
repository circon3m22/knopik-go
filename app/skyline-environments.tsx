'use client';
import {useEffect,useRef} from 'react';
import type {ThemeId,ThemeMood} from './cosmetic-engine';
import {useGraphicsQuality} from './use-graphics-quality';
import {VISUAL_PROFILES} from './graphics-quality';
import {TapEnvironmentArt} from './tap-environment-art';
export {ENVIRONMENTS} from './tap-environment-art';

/** Only the live tapper subscribes; thumbnails never start background work. */
export function trackSceneVisibility(scene:Pick<SVGSVGElement,'dataset'>,source:Pick<Document,'hidden'|'addEventListener'|'removeEventListener'>){
 const sync=()=>{scene.dataset.sceneVisibility=source.hidden?'hidden':'visible';};
 source.addEventListener('visibilitychange',sync);sync();
 return ()=>{source.removeEventListener('visibilitychange',sync);delete scene.dataset.sceneVisibility;};
}
/** Original grid, stepped contours and flat light; no raster textures or filters. */
export function TapEnvironment({theme,mood='calm',className='',animate=false}:{theme:ThemeId;mood?:ThemeMood;className?:string;animate?:boolean}){
 const quality=useGraphicsQuality(),detail=VISUAL_PROFILES[quality].detail,scene=useRef<SVGSVGElement>(null);
 useEffect(()=>{if(animate&&scene.current)return trackSceneVisibility(scene.current,document);},[animate]);
 return <svg ref={scene} className={`pixel-art pixel-scene pixel-scene-${theme} ${className}`} data-environment={theme} data-detail={detail} data-pixel-grid="160" data-scene-animated={animate?'true':'false'} viewBox="0 0 160 320" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
  <TapEnvironmentArt theme={theme} detail={detail}/>
  {mood!=='calm'&&<rect width="160" height="320" fill={mood==='red'?'#b85149':mood==='yellow'?'#d6b456':'#377bd0'} opacity=".2"/>}
 </svg>;
}
