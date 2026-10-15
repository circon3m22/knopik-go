import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
import {ADVENTURE_WEAPONS} from "../app/dungeon-campaign.ts";
const read=async name=>readFile(new URL(`../app/${name}`,import.meta.url),"utf8");
test("apartment nav has independent row and full height",async()=>{
 const css=await read("gameplay-compact-hud.css");
 assert.ok(css.includes("grid-template-rows:auto minmax(0,1fr) auto max-content;"));
 assert.ok(css.includes("width:100%;height:auto;min-height:72px;"));
 assert.ok(!css.includes(".adventure-navigation .bottom-bar{height:44px"));
 assert.ok(css.includes("min-height:58px;height:auto;"));
});
test("main room trophy shelves and objects enlarge together",async()=>{
 const art=await read("apartment-room-furniture.tsx");
 assert.ok(art.includes('data-home-keepsakes-placement="" transform="translate(-174 -42) scale(.74)"'));
});
test("FPS visibility persists; hiding stops its independent RAF sampler",async()=>{
 const settings=await read("game-preferences.tsx"),meter=await read("frame-rate-meter.tsx"),bridge=await read("frame-rate-visibility.ts"),game=await read("knopik-go.tsx");
 assert.ok(settings.includes('aria-label="Показывать FPS"'));
 assert.ok(settings.includes("showFps:!s.showFps"));
 assert.ok(meter.includes("if(!visible)return;"));
 assert.ok(meter.includes("return visible?<output"));
 assert.ok(bridge.includes('document.documentElement.dataset.knopikShowFps=visible?"on":"off"'));
 assert.ok(game.includes("setFrameRateVisible(settings.showFps)"));
});
test("fist and pistol cooldown are doubled without changing other guns",()=>{
 assert.equal(ADVENTURE_WEAPONS.fist.cooldown,.58);
 assert.equal(ADVENTURE_WEAPONS.pistol.cooldown,.56);
 assert.equal(ADVENTURE_WEAPONS.sabre.cooldown,.84);
 assert.equal(ADVENTURE_WEAPONS.shotgun.cooldown,1.16);
 assert.equal(ADVENTURE_WEAPONS.launcher.cooldown,2.46);
 assert.equal(ADVENTURE_WEAPONS.arc.cooldown,1.2);
});
