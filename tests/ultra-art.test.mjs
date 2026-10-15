import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {RunnerFrameBudget,sanitizeRunnerGraphics} from "../app/runner-frame-budget.ts";
test("ultra runner mode and a mobile-friendly maximum 3x raster density",()=>{
 const b=new RunnerFrameBudget();assert.equal(sanitizeRunnerGraphics("ultra"),"ultra");
 assert.equal(b.pixelRatio(4,"ultra"),3);assert.equal(b.pixelRatio(2,"ultra"),2);
 assert.equal(b.pixelRatio(4,"fast"),1);
});
test("bar is full bleed and leaf has its own recognizable sprite",async()=>{
 const css=await readFile(new URL("../app/adventure.css",import.meta.url),"utf8");
 assert.match(css,/\.adventure-bar \.apartment-bar-cabinet\{[^}]*width:100%/);
 const leaf=await readFile(new URL("../app/dungeon-ingredient-art.tsx",import.meta.url),"utf8");
 assert.ok(leaf.includes('p.material==="leaf"?<svg'));
});
