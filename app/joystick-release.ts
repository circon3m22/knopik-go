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
  // Capturing at window level catches releases which miss the joystick button.
  // The watchdog in the game also prevents permanent walking if Safari drops
  // the entire event sequence during a home gesture or system interruption.
  target.addEventListener("pointerup",pointerEnded,{capture:true});
  target.addEventListener("pointercancel",pointerEnded,{capture:true});
  target.addEventListener("touchend",lastTouchEnded,{capture:true});
  target.addEventListener("touchcancel",lastTouchEnded,{capture:true});
  return ()=>{
    target.removeEventListener("pointerup",pointerEnded,{capture:true});
    target.removeEventListener("pointercancel",pointerEnded,{capture:true});
    target.removeEventListener("touchend",lastTouchEnded,{capture:true});
    target.removeEventListener("touchcancel",lastTouchEnded,{capture:true});
  };
}
