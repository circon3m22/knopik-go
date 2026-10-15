import test from "node:test";import assert from "node:assert/strict";
import {createDefaultSave,sanitizeSave,SAVE_VERSION} from "../app/game-logic.ts";
import {createCaseRewards} from "../app/case-engine.ts";
import {rollAdventureLoot} from "../app/adventure-loot.ts";
test("AURA is persisted and migrates to zero for older saves",()=>{const old=createDefaultSave();old.version=31;old.auraCoins=500;assert.equal(sanitizeSave(old).auraCoins,0);const cur=createDefaultSave();cur.auraCoins=14;assert.equal(sanitizeSave(cur).auraCoins,14);assert.equal(sanitizeSave({...cur,auraCoins:-1}).auraCoins,0);assert.equal(SAVE_VERSION,32);});
test("rare cases award one AURA at most per case",()=>{for(const kind of ["common","big"]){const one=createCaseRewards(kind,()=>0);assert.equal(one.filter(x=>x.type==="aura").length,1);assert.equal(one.find(x=>x.type==="aura").amount,1);assert.equal(createCaseRewards(kind,()=>.5).filter(x=>x.type==="aura").length,0);}});
test("chest rolls award single AURA at rare probability",()=>{assert.deepEqual(rollAdventureLoot(4,.999),{kind:"aura",amount:1});assert.equal(rollAdventureLoot(4,.5).kind,"coins");});
