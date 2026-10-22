/** One quality tier drives every scene. Simulation, collision and rewards never depend on it. */
export type GraphicsQuality='low'|'medium'|'high'|'very-high'|'ultra';
export type FpsPosition='bottom'|'top';
export const GRAPHICS_QUALITIES=[
 {id:'low',title:'Низкая',detail:'Минимум деталей, плоский свет, меньше частиц. Максимальная скорость.'},
 {id:'medium',title:'Средняя',detail:'Быстрый режим: адаптивное разрешение, простой свет, минимум эффектов.'},
 {id:'high',title:'Высокая',detail:'Прежняя Ультра: плотная картинка, свет, отражения и атмосфера.'},
 {id:'very-high',title:'Очень высокая',detail:'Дополнительные тени, объёмный свет, отражения и микродетали.'},
 {id:'ultra',title:'Ультра',detail:'Свет от источников, тени за препятствиями, объёмная листва, рельеф фасадов и отражения. Для мощных устройств.'},
] as const;
export const sanitizeGraphicsQuality=(value:unknown):GraphicsQuality=>value==='low'||value==='high'||value==='very-high'||value==='ultra'?value:'medium';
export const sanitizeFpsPosition=(value:unknown):FpsPosition=>value==='top'?'top':'bottom';
export function migrateGraphicsQuality(value:unknown,world:unknown,runner:unknown):GraphicsQuality{
 if(GRAPHICS_QUALITIES.some(q=>q.id===value))return value as GraphicsQuality;
 if(world==='extreme'||runner==='extreme')return 'ultra';
 if(world==='cinematic'||runner==='cinematic')return 'very-high';
 if(world==='ultra'||runner==='ultra')return 'high';
 if(world==='fast'||runner==='fast')return 'low';
 return 'medium';
}
export function graphicsModes(quality:GraphicsQuality){
 return quality==='ultra'?{world:'extreme' as const,runner:'extreme' as const}:quality==='very-high'?{world:'cinematic' as const,runner:'cinematic' as const}:quality==='high'?{world:'ultra' as const,runner:'ultra' as const}:quality==='low'?{world:'fast' as const,runner:'fast' as const}:{world:'soft' as const,runner:'auto' as const};
}
export const VISUAL_PROFILES={
 low:{detail:0,particles:.15,lighting:false,premium:false,runnerDistance:330,pixelRatio:.65},
 medium:{detail:1,particles:.25,lighting:false,premium:false,runnerDistance:440,pixelRatio:1},
 high:{detail:2,particles:1,lighting:true,premium:false,runnerDistance:600,pixelRatio:3},
 'very-high':{detail:3,particles:1,lighting:true,premium:true,runnerDistance:600,pixelRatio:3.5},
 ultra:{detail:4,particles:1,lighting:true,premium:true,runnerDistance:650,pixelRatio:4},
} as const;
let current:GraphicsQuality='medium';
let fpsLimit:30|45|60|120=60;
export const getVisualFpsLimit=()=>fpsLimit;
export function setVisualFpsLimit(value:30|45|60|120){fpsLimit=value===30||value===45||value===120?value:60;}
const listeners=new Set<()=>void>();
export const getGraphicsQuality=()=>current;
export const getVisualProfile=()=>VISUAL_PROFILES[current];
export const subscribeGraphicsQuality=(change:()=>void)=>{listeners.add(change);return()=>{listeners.delete(change);};};
export function setGraphicsQuality(value:GraphicsQuality){
 const next=sanitizeGraphicsQuality(value);
 if(typeof document!=='undefined')document.documentElement.dataset.knopikGraphics=next;
 if(next===current)return;
 current=next;for(const change of listeners)change();
}
