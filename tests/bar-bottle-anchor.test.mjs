import test from "node:test";import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
test("bar bottle and its count share a positioned figure, unlike quick buff cards",async()=>{
 const src=await readFile(new URL("../app/buff-shelf-item.tsx",import.meta.url),"utf8");
 const css=await readFile(new URL("../app/game-play-ui.css",import.meta.url),"utf8");
 assert.match(src,/variant==="bar"\s*\? <span className="bar-bottle-figure">/);
 assert.match(src,/<b className="inventory-count" aria-hidden="true">\{status \|\| count\}<\/b><\/span>/);
 assert.match(src,/variant!=="bar"&&<b className="inventory-count"/);
 assert.match(css,/\.bar-bottle-figure>\.inventory-count\{/);
 assert.match(css,/position:absolute;inset:0 -7px auto auto/);
});
test("both world controls have an emergency release watchdog if the OS drops pointerup",async()=>{
 for(const path of ["adventure-game.tsx","neighborhood-game.tsx"]){
   const s=await readFile(new URL(`../app/${path}`,import.meta.url),"utf8");
   assert.ok(s.includes("Date.now()-stickLastActivity.current>12000"),path);
   assert.ok(s.includes("observeJoystickRelease(window"),path);
 }
});
