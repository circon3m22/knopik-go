export type VisualAccessibility={cameraShake:boolean;contrastAim:boolean};
let current:VisualAccessibility={cameraShake:true,contrastAim:false};
export const getVisualAccessibility=()=>current;
export function setVisualAccessibility(value:VisualAccessibility){current=value;if(typeof document!=='undefined'){document.documentElement.dataset.knopikContrastAim=value.contrastAim?'on':'off';document.documentElement.dataset.knopikCameraShake=value.cameraShake?'on':'off';}}
