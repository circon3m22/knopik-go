/** Shared single-source control for the global FPS overlay, including native dialogs. */
export const FRAME_RATE_VISIBILITY_EVENT="knopik-go-fps-visibility";
export function setFrameRateVisible(visible:boolean){
 if(typeof document==="undefined"||typeof window==="undefined")return;
 document.documentElement.dataset.knopikShowFps=visible?"on":"off";
 window.dispatchEvent(new CustomEvent<boolean>(FRAME_RATE_VISIBILITY_EVENT,{detail:visible}));
}
