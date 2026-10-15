import test from "node:test";
import assert from "node:assert/strict";
import {observeJoystickRelease} from "../app/joystick-release.ts";
test("pointer released outside joystick resets motion; unrelated secondary fingers do not",()=>{
 const win=new EventTarget();let id=41,releases=0;
 const off=observeJoystickRelease(win,()=>id,()=>{id=null;releases++;});
 const pointer=(type,pointerId)=>win.dispatchEvent(Object.assign(new Event(type),{pointerId}));
 pointer("pointerup",58);assert.equal(releases,0);
 pointer("pointerup",41);assert.equal(releases,1);assert.equal(id,null);
 id=55;pointer("pointercancel",55);assert.equal(releases,2);
 off();id=56;pointer("pointerup",56);assert.equal(releases,2);
});
test("Safari touchend/touchcancel fallback clears a missing pointerup and preserves ongoing multitouch",()=>{
 const win=new EventTarget();let id=73,count=0;
 const off=observeJoystickRelease(win,()=>id,()=>{id=null;count++;});
 win.dispatchEvent(Object.assign(new Event("touchend"),{touches:[{identifier:1}]}));
 assert.equal(count,0);
 win.dispatchEvent(Object.assign(new Event("touchend"),{touches:[]}));
 assert.equal(count,1);
 id=74;win.dispatchEvent(Object.assign(new Event("touchcancel"),{touches:[]}));
 assert.equal(count,2);off();
});
