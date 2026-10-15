import test from "node:test";
import assert from "node:assert/strict";
import {FramePaintLimiter,sanitizeFpsLimit,sanitizeWorldGraphics} from "../app/render-preferences.ts";
import {createDefaultSave,sanitizeSave} from "../app/game-logic.ts";
test("world quality and FPS persist without resetting old saves",()=>{
 const old=createDefaultSave();delete old.settings.worldGraphics;delete old.settings.fpsLimit;delete old.settings.showFps;
 const restored=sanitizeSave(old);assert.equal(restored.settings.worldGraphics,"soft");assert.equal(restored.settings.fpsLimit,60);assert.equal(restored.settings.showFps,true);
 const next=sanitizeSave({...restored,settings:{...restored.settings,worldGraphics:"rich",fpsLimit:30,showFps:false}});
 assert.equal(next.settings.worldGraphics,"rich");assert.equal(next.settings.fpsLimit,30);assert.equal(next.settings.showFps,false);
 assert.equal(sanitizeFpsLimit(120),60);assert.equal(sanitizeWorldGraphics("unknown"),"soft");assert.equal(sanitizeWorldGraphics("ultra"),"ultra");
 const ultra=sanitizeSave({...next,settings:{...next.settings,worldGraphics:"ultra",graphics:"ultra"}});assert.equal(ultra.settings.worldGraphics,"ultra");assert.equal(ultra.settings.graphics,"ultra");
});
for(const [limit,min,max] of [[30,29,31],[45,44,46],[60,59,61]])test(`FPS limiter presents about ${limit} frames per second at 120Hz`,()=>{
 const cap=new FramePaintLimiter();let paints=0;for(let i=0;i<120;i++)if(cap.due(i*1000/120,limit))paints++;
 assert.ok(paints>=min&&paints<=max,`${limit} capped at ${paints}`);
 cap.reset();assert.equal(cap.due(10000,limit),true);
});
