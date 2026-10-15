import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {AdventureEngine} from "../app/adventure-engine.ts";
import {APARTMENT_DESTINATIONS} from "../app/apartment-interactions.ts";
const read=async path=>readFile(new URL(`../app/${path}`,import.meta.url),"utf8");
test("computer is a living-room destination, opens tapper and returns next to desk",()=>{
 const computer=APARTMENT_DESTINATIONS.find(p=>p.id==="computer");
 assert.equal(computer?.room,"living");
 assert.equal(computer?.label,"Зайти в компьютер");
 let launched=0;
 const engine=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){},computer(){launched++;}},{completedLevel:4});
 engine.player.x=742;engine.player.y=488;
 assert.equal(engine.interactDestination("computer"),true);
 assert.equal(launched,1);
 assert.equal(engine.phase,"paused");
 const resumed=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}},{completedLevel:4});
 resumed.enterHomeFromComputer();
 assert.deepEqual([resumed.player.x,resumed.player.y],[734,518]);
 assert.equal(resumed.canStand(734,518),true);
});
test("shield renders a nonrotating blue rim, menu computer has a red exit and two buttons",async()=>{
 const game=await read("knopik-go.tsx"),css=await read("computer-ux.css"),apt=await read("adventure-game.tsx");
 assert.ok(!game.includes('{<PixelShield />}'));
 assert.ok(css.includes(".dog-button.has-vita-shield .vita-shield-ring{"));
 assert.ok(css.includes("conic-gradient(from 0deg"));
 assert.ok(css.includes("has-vita-shield::before{display:none"));
 for(const part of ["computer-exit","leaveComputer","computer-bottom-navigation","Магазин","Настройки","fromComputer={fromComputer}","onComputer={openComputer}"])assert.ok(game.includes(part),part);
 assert.ok(!apt.includes('<div className="adventure-navigation">'));
});
test("the former book is replaced with a rendered pixel desktop computer",async()=>{
 const art=await read("apartment-furniture.tsx");
 assert.ok(art.includes('data-home-computer="interactive"'));
 assert.ok(art.includes("<ApartmentDeskComputer/>"));
 const old=await read("apartment-interactions.ts");
 assert.ok(old.includes('label:"Зайти в компьютер"'));
});
