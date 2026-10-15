import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
const read=p=>readFile(new URL(`../app/${p}`,import.meta.url),"utf8");
test("settings reuses original bottom navigation, no close X or pinned page title",async()=>{
 const src=await read("knopik-go.tsx"),css=await read("game-settings.css");
 assert.match(src,/<div className="settings-page-layout">[\s\S]*?<BottomNavigation computer activeIndex=\{2\}/);
 assert.ok(!src.includes('aria-label="Закрыть настройки"'));
 assert.ok(!src.includes('<h2 id="settings-title">'));
 assert.ok(css.includes("grid-template-rows:minmax(0,1fr) max-content"));
 assert.ok(css.includes(".settings-page-layout>.bottom-bar"));
});
test("the requested earlier stepped blue shield and its stylesheet are restored",async()=>{
 const game=await read("knopik-go.tsx"),css=await read("computer-ux.css");
 assert.ok(game.includes('<TapPixelShield/>'));
 assert.ok(css.includes('shield-pixel-body'));
 assert.ok(css.includes('has-vita-shield::before'));
});
