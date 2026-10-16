import "./helpers/tsx-loader.mjs";
import test from "node:test";import assert from "node:assert/strict";
import React from "react";import {renderToStaticMarkup} from "react-dom/server";
import {AdventureEngine} from "../app/adventure-engine.ts";
import {APARTMENT_DESTINATIONS} from "../app/apartment-interactions.ts";
import {AURA_MACHINE} from "../app/aura-machine.ts";
import {HOME_SOLIDS} from "../app/apartment-world.ts";
import {parseAdventureSvg} from "./helpers/adventure-svg-dom.mjs";
const {AdventureScene,AdventureRenderer}=await import("../app/adventure-artwork.tsx");
test("AURA machine is bounded furniture, not a room-wide nested SVG",()=>{
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:"apartment",theme:"classic"})));
 const machines=svg.querySelectorAll('[data-vault-aura-machine]');
 assert.equal(machines.length,1);
 const sprite=machines[0].querySelector("[data-aura-world-sprite]");
 assert.ok(sprite,"small world machine must be rendered as a single SVG group");
 assert.match(sprite.getAttribute("transform"),/scale\(\.5\)/);
 assert.equal(machines[0].querySelector("svg"),null,"no viewport-sized nested SVG in the apartment scene");
 const collision=HOME_SOLIDS.find(r=>r===AURA_MACHINE.body);
 assert.ok(collision);
 const e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}});
 assert.equal(e.canStand(AURA_MACHINE.x,AURA_MACHINE.y-16),false);
 assert.equal(e.canStand(1015,774),true);
});
test("AURA exchanger and safe are separate, machine is usable when nearby",()=>{
 const machine=APARTMENT_DESTINATIONS.find(d=>d.id==="aura"),safe=APARTMENT_DESTINATIONS.find(d=>d.id==="vault");
 assert.equal(machine?.room,"vault");
 assert.equal(machine?.label,"Обменять на AURA");
 assert.ok(safe&&safe.id!=="aura");
 let opened=null;
 const callbacks={change(){},checkpoint(){},sound(){},run(){},bar(){},homePanel:p=>opened=p};
 const e=new AdventureEngine(3,callbacks);
 Object.assign(e.player,AURA_MACHINE.approach);
 assert.equal(e.view().interaction,"Обменять на AURA");
 assert.equal(e.interactDestination("aura"),true);assert.equal(opened,"aura");assert.equal(e.phase,"paused");
 const other=new AdventureEngine(3,callbacks);
 other.player.x=692;other.player.y=900;
 assert.equal(other.interactDestination("aura"),false);
});
test("dedicated exchange modal charges 1000 active KC per AURA, without touching vault funds",async()=>{
 const {readFile}=await import("node:fs/promises");
 const read=path=>readFile(new URL(`../app/${path}`,import.meta.url),"utf8");
 const game=await read("knopik-go.tsx"),ui=await read("home-room-panels.tsx");
 assert.ok(game.includes('homePanel==="aura"&&<AuraExchangeRoom'));
 assert.ok(game.includes('homePanel==="vault"&&<VaultRoom'));
 assert.ok(ui.includes('disabled={wallet<1000}'));
 assert.ok(game.includes('walletCoins:v.walletCoins-1000'));
 assert.ok(game.includes('updateAuraCoins(v=>Math.min(Number.MAX_SAFE_INTEGER,v+1))'));
});

test("the machine and safe have separate nearest actions and the sprite sorts at its real feet",()=>{
 const e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}});
 Object.assign(e.player,{x:1134,y:875});assert.equal(e.view().interaction,"Открыть сейф");
 Object.assign(e.player,AURA_MACHINE.approach);assert.ok(e.canStand(e.player.x,e.player.y));assert.equal(e.view().interaction,"Обменять на AURA");
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:"apartment"})));
 const object=svg.querySelector('[data-vault-aura-machine]').parent;
 assert.equal(Number(object.getAttribute('data-home-prop-y')),AURA_MACHINE.body.y+AURA_MACHINE.body.h/2);
 assert.match(object.getAttribute('transform'),new RegExp('translate\\('+AURA_MACHINE.x+' '));
});

test("the machine footprint aligns with its floor shadow and Knopik is painted on the correct side",()=>{
 const e=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}});
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:"apartment"})));
 const machine=svg.querySelector('[data-vault-aura-machine]').parent,shadow=svg.querySelector('[data-aura-footprint]'),player=svg.querySelector('[data-player]');
 assert.equal(Number(shadow.getAttribute('x'))+AURA_MACHINE.x,AURA_MACHINE.body.x);assert.equal(Number(shadow.getAttribute('y'))+AURA_MACHINE.y,AURA_MACHINE.body.y);
 assert.equal(Number(shadow.getAttribute('height')),AURA_MACHINE.body.h);assert.equal(AURA_MACHINE.body.y+AURA_MACHINE.body.h,AURA_MACHINE.y);
 const renderer=new AdventureRenderer(svg,false);renderer.resize(390,450);
 for(const [y,front]of [[AURA_MACHINE.body.y-15,false],[AURA_MACHINE.body.y+AURA_MACHINE.body.h+15,true]]){
  Object.assign(e.player,{x:AURA_MACHINE.x,y});assert.ok(e.canStand(e.player.x,y));renderer.paint(e,true);
  const order=svg.querySelector('[data-actors]').children;assert.equal(order.indexOf(player)>order.indexOf(machine),front);
 }
});
