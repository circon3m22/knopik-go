import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const get=async p=>readFile(new URL(`../app/${p}`,import.meta.url),"utf8");
test("case reward has viewport-wide rotated rays, pixel debris and an illustrated pedestal",async()=>{
 const art=await get("case-cinematic-art.tsx"),ui=await get("case-opening.tsx"),css=await get("case-cinematic.css");
 assert.ok(art.includes("const RAYS=28,SPARKS=50,DEBRIS=64"));
 assert.ok(art.includes('phase==="burst"||phase==="reward"'));
 assert.ok(ui.includes("<CaseCinematicArt kind={kind} phase={phase} rewardIndex={rewardIndex}/>"));
 assert.ok(ui.includes('case-film-pedestal'));
 assert.ok(ui.includes('case-film-orbit'));
 assert.ok(css.includes("height:135vmax"));
 assert.ok(css.includes("@keyframes case-film-turn"));
 assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
});
