import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createDefaultSave,sanitizeSave} from "../app/game-logic.ts";
test("default progress resets street quests, collected items and visits",()=>{
 const p=createDefaultSave();const next=sanitizeSave({...p,neighborhood:{...p.neighborhood,quest:3,visits:9,pebble:true,secret:true}});
 assert.equal(next.neighborhood.quest,3);
 const reset=createDefaultSave();assert.equal(reset.neighborhood.quest,0);assert.equal(reset.neighborhood.visits,0);assert.equal(reset.neighborhood.pebble,false);assert.equal(reset.neighborhood.secret,false);
});
test("reset handler invalidates cached street engine and saves defaults",async()=>{
 const s=await readFile(new URL("../app/knopik-go.tsx",import.meta.url),"utf8");
 const reset=s.slice(s.indexOf("const resetProgress = useCallback"),s.indexOf("// A normal tap briefly",s.indexOf("const resetProgress = useCallback")));
 for(const call of ["setStreetEngine(undefined)","setNeighborhoodOpen(false)","setNeighborhood(defaults.neighborhood)","setHomeFromStreet(false)","setWorldResetEpoch(epoch=>epoch+1)","onSave(defaults)"])assert.ok(reset.includes(call),call);
});
test("bar counters are absolutely positioned relative to a fixed-height bottle",async()=>{
 const css=await readFile(new URL("../app/game-play-ui.css",import.meta.url),"utf8");
 assert.ok(css.includes("grid-template-rows:132px 40px;gap:8px"));
 assert.ok(css.includes(".adventure-bar .apartment-bar-row .inventory-item{"));
 assert.ok(css.includes("position:relative;min-height:132px;height:132px;"));
});
