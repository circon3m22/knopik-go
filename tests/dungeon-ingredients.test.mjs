import "./helpers/tsx-loader.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {adventureLevel} from "../app/adventure-levels.ts";
import {dungeonIngredientPositions} from "../app/dungeon-ingredients.ts";
import {AdventureEngine,ADVENTURE_STEP} from "../app/adventure-engine.ts";
import {defaultLaboratory,collectLaboratoryIngredient,sanitizeLaboratory} from "../app/laboratory-engine.ts";
import {parseAdventureSvg} from "./helpers/adventure-svg-dom.mjs";
const {AdventureScene,AdventureRenderer}=await import("../app/adventure-artwork.tsx");
const silent={change(){},checkpoint(){},sound(){},run(){},bar(){}};
test("all 25 campaign levels contain 1-3 deterministic, nonblocking, different ingredient locations",()=>{
 for(let level=1;level<=25;level++){
  const layout=adventureLevel(level),items=dungeonIngredientPositions(layout);
  assert.equal(items.length,1+level%3,`level ${level}`);
  assert.equal(new Set(items.map(i=>i.room)).size,items.length);
  assert.deepEqual(items,dungeonIngredientPositions(layout));
  for(const p of items){const room=layout.rooms[p.room];assert.ok(p.x>room.x+20&&p.x<room.x+room.w-20&&p.y>room.y+20&&p.y<room.y+room.h-20);
   assert.ok(!layout.solids.some(s=>p.x>s.x-15&&p.x<s.x+s.w+15&&p.y>s.y-15&&p.y<s.y+s.h+15),`blocked ${level}:${p.room}`);}
 }
});
test("ingredient pickups show on the floor, grant once and persist through cloud save reload",()=>{
 let lab=defaultLaboratory();const gain=(l,r,k)=>{const next=collectLaboratoryIngredient(lab,l,r,k);if(!next)return false;lab=next;return true};
 const e=new AdventureEngine(2,{...silent,laboratoryIngredient:gain},{claimedIngredients:lab.chests});
 const p=e.ingredientPickups[0];assert.ok(p);
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:"sewer",layout:e.levelData})));
 const renderer=new AdventureRenderer(svg,false);renderer.paint(e,true);const pickup=svg.querySelector('[data-dungeon-ingredient="'+p.key+'"]');assert.ok(pickup);assert.notEqual(pickup.getAttribute("display"),"none");
 Object.assign(e.player,{x:p.x,y:p.y});e.advance(ADVENTURE_STEP);assert.equal(p.collected,true);assert.equal(lab.materials[p.material],1);renderer.paint(e);assert.equal(pickup.getAttribute("display"),"none");
 const snapshot=sanitizeLaboratory(JSON.parse(JSON.stringify(lab)));assert.equal(collectLaboratoryIngredient(snapshot,p.level,p.room,p.material),null);
 const returning=new AdventureEngine(2,silent,{claimedIngredients:snapshot.chests});assert.equal(returning.ingredientPickups[0].collected,true);
});
