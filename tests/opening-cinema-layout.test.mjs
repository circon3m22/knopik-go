import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=async name=>readFile(new URL(`../app/${name}`,import.meta.url),"utf8");
test("cinematic renders as a full-dialog sibling of the game grid with no skip buttons",async()=>{
 const scene=await read("adventure-game.tsx"),film=await read("adventure-opening-cinema.tsx"),css=await read("home-rooms.css");
 assert.match(scene,/\{view\.cinematic && <AdventureOpeningCinema clock=\{engineRef\} theme=\{props\.theme\}\/>\}\s*<\/GameModal>/);
 assert.ok(scene.includes('view.cinematic?" cinematic-active":""'));
 assert.ok(!film.includes('opening-skip'));
 assert.ok(!film.includes('onSkip:'));
 assert.match(css,/\.cinematic-active>\.adventure-layout\{\s*visibility:hidden;pointer-events:none;/);
 assert.match(css,/\.cinematic-active>\.opening-cinema\{\s*position:absolute;inset:0;z-index:30;/);
 assert.match(css,/\.cinematic-active \.opening-caption\{[\s\S]*?bottom:calc\(22px \+ env\(safe-area-inset-bottom\)\)/);
});
test("training overlay is centred over the scene, not anchored to footer",async()=>{
 const css=await read("home-rooms.css");
 assert.match(css,/\.adventure-viewport>\.adventure-training-card\{[\s\S]*?left:50%;top:50%;bottom:auto;right:auto;/);
 assert.match(css,/transform:translate\(-50%,-50%\)/);
});
