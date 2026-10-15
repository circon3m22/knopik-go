/**
 * iOS Safari can lose an element's pointer capture without delivering a local
 * pointerup/lostpointercapture. Watch the window in capture phase and provide
 * touchend/touchcancel as a fallback. Does not interfere with other fingers.
 */
export function observeJoystickRelease(
  target:Pick<Window,"addEventListener"|"removeEventListener">,
  activePointer:()=>number|null,
  release:()=>void
):()=>void{
  const pointerEnded=(event:Event)=>{
    const active=activePointer();
    if(active!==null&&(event as PointerEvent).pointerId===active)release();
  };
  const lastTouchEnded=(event:Event)=>{
    const active=activePointer(),touches=(event as TouchEvent).touches;
    if(active!==null&&touches?.length===0)release();
  };
  target.addEventListener("pointerup",pointerEnded,true);
  target.addEventListener("pointercancel",pointerEnded,true);
  target.addEventListener("touchend",lastTouchEnded,true);
  target.addEventListener("touchcancel",lastTouchEnded,true);
  return ()=>{
    target.removeEventListener("pointerup",pointerEnded,true);
    target.removeEventListener("pointercancel",pointerEnded,true);
    target.removeEventListener("touchend",lastTouchEnded,true);
    target.removeEventListener("touchcancel",lastTouchEnded,true);
  };
}
