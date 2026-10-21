import {pixelMaterialLayers,type MaterialPalette,type PixelMaterial} from './ultra-pixel-material';
export function UltraMaterialPattern({id,kind,palette,seed=0}:{id:string;kind:PixelMaterial;palette:MaterialPalette;seed?:number}){
 return <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse" data-ultra-material={kind} shapeRendering="crispEdges">{pixelMaterialLayers(kind,palette,seed).map(l=><path key={l.fill} fill={l.fill} d={l.d}/>)}</pattern>;
}
