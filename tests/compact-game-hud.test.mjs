import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
const read=async x=>readFile(new URL(`../app/${x}`,import.meta.url),"utf8");
test("one primary bar contains health, balance and pause, with independent mission overlay",async()=>{
 const s=await read("game-play-hud.tsx");
 assert.match(s,/className="adventure-hud-primary"/);assert.match(s,/className="adventure-health"/);
 assert.match(s,/<ActiveBalance amount=\{balance\}/);assert.match(s,/className="adventure-mission-line"/);
 assert.match(s,/secondaryActions/);
 const css=await read("gameplay-compact-hud.css");
 assert.match(css,/\.adventure-hud \.adventure-mission-line\{[\s\S]*?position:absolute/);
 assert.match(css,/grid-template-columns:max-content minmax\(0,1fr\) max-content/);
});
test("weapon and buffs overlay viewport rather than enlarge controller footer",async()=>{
 const s=await read("adventure-game.tsx"),f=s.indexOf('<footer data-training-step='),v=s.indexOf('<div className="adventure-viewport">'),t=s.indexOf('<div className="adventure-toolbelt"');
 assert.ok(v<t&&t<f);assert.equal(s.slice(f).includes('className="adventure-toolbelt"'),false);
 const css=await read("gameplay-compact-hud.css");assert.ok(css.includes(".adventure-viewport>.adventure-toolbelt{"));assert.ok(css.includes("flex-flow:row wrap"));
});
test("street map and journal are in mission actions, pause alone in primary strip",async()=>{
 const s=await read("neighborhood-game.tsx");assert.match(s,/secondaryActions=\{<>/);
 assert.match(s,/Открыть карту района/);assert.match(s,/Открыть журнал заданий/);
 const l=await read("layout.tsx");assert.ok(l.includes('import "./gameplay-compact-hud.css";'));
});
