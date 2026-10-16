import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {defaultLaboratory,sanitizeLaboratory,LAB_RECIPES,LAB_SOURCES,LAB_RESPAWN_MS,canBuyLabDrink,unlockAllLabRecipes,recipeAvailable,startLaboratoryBrew,brewPose,careForBrew,claimLaboratoryBrew,harvestLaboratory,canHarvest,collectLaboratoryChest} from '../app/laboratory-engine.ts';
import {createDefaultSave,sanitizeSave,SAVE_VERSION} from '../app/game-logic.ts';
import {purchaseShelfBuff} from '../app/buff-shelf-engine.ts';
import {commitDrinkRound} from '../app/drink-game-engine.ts';
import {sameSave,acknowledgedSave} from '../app/save-synchronization.ts';
const stocked=()=>({...defaultLaboratory(),materials:{citrus:30,leaf:30,pearl:30,spark:30}});
test('arcade drinks need first brew, but utility buffs are available immediately and gifts remain usable',()=>{
 const p=defaultLaboratory();for(const k of ['pitbull','cocoa','bergamot'])assert.equal(purchaseShelfBuff(k,0,1000,999,p),null);
 for(const r of LAB_RECIPES){const instant=['heal','pepsi','zhivchik'].includes(r.id);assert.equal(canBuyLabDrink(p,r.id),instant);assert.equal(!!purchaseShelfBuff(r.id,0,999999,0,p),instant);const ledger={kind:r.id,phase:'ready'};assert.equal(commitDrinkRound(ledger,4),true);assert.deepEqual(p.unlocked,[]);}
 const old=sanitizeSave({...createDefaultSave(),version:29,limeCount:4,brainrotInventory:{verity:2},walletCoins:123,vaultCoins:987});assert.equal(old.limeCount,4);assert.equal(old.brainrotInventory.verity,2);assert.deepEqual(old.laboratory.unlocked,[]);assert.equal(old.walletCoins,123);assert.equal(old.vaultCoins,987);
});
test('recipes open gradually and cannot consume ingredients while locked, already brewing or at full bottle stock',()=>{
 const p=stocked(),before=structuredClone(p);assert.equal(recipeAvailable(p,'lime'),true);assert.equal(recipeAvailable(p,'matcha'),false);assert.equal(startLaboratoryBrew(p,'matcha',1000,0),null);assert.equal(startLaboratoryBrew(p,'lime',1000,25),null);assert.equal(startLaboratoryBrew(p,'lime',1000,NaN),null);assert.equal(startLaboratoryBrew(defaultLaboratory(),'lime',1000,0),null);assert.deepEqual(p,before);
 const job=startLaboratoryBrew(p,'lime',1000,0);assert.equal(job.materials.citrus,28);assert.equal(job.materials.leaf,28);assert.equal(startLaboratoryBrew(job,'lime',2000,0),null);assert.equal(p.materials.citrus,30);
});
test('a brew survives reload and leaving the lab; claiming grants one bottle and its recipe exactly once',()=>{
 const p=startLaboratoryBrew(stocked(),'lime',1000,0),saved=sanitizeSave({...createDefaultSave(),laboratory:p,walletCoins:1234,vaultCoins:5678}),restored=sanitizeSave(JSON.parse(JSON.stringify(saved)));
 assert.deepEqual(restored,saved);assert.equal(restored.version,SAVE_VERSION);assert.equal(brewPose(restored.laboratory.job,8000).ready,false);assert.equal(claimLaboratoryBrew(restored.laboratory,8000,0),null);
 const result=claimLaboratoryBrew(restored.laboratory,13000,0);assert.equal(result.stock,1);assert.deepEqual(result.progress.unlocked,['lime']);assert.equal(result.progress.crafted,1);assert.equal(claimLaboratoryBrew(result.progress,14000,1),null);assert.equal(recipeAvailable(result.progress,'matcha'),true);assert.equal(recipeAvailable(result.progress,'tralalero'),false);
 assert.deepEqual(purchaseShelfBuff('lime',result.stock,1000,5678,result.progress),{walletCoins:960,vaultCoins:5678,count:2});assert.equal(saved.walletCoins,1234);
});
test('full stock delays collection without losing the brew, opening a recipe or spending ingredients twice',()=>{
 const p=startLaboratoryBrew(stocked(),'lime',1000,24),before=structuredClone(p);assert.equal(claimLaboratoryBrew(p,20000,25),null);assert.deepEqual(p,before);assert.equal(claimLaboratoryBrew(p,20000,24).stock,25);assert.equal(claimLaboratoryBrew(p,20000,-1),null);
});
test('three precise actions refund one ingredient; missed and repeated actions cannot create extra refunds',()=>{
 let p=startLaboratoryBrew(stocked(),'lime',1000,0);assert.equal(careForBrew(p,1500),null);for(const now of [3000,7000,11000]){const next=careForBrew(p,now);assert.ok(next);assert.equal(careForBrew(next,now),null);p=next;}
 assert.equal(p.job.careMask,7);assert.equal(careForBrew(p,13000),null);const result=claimLaboratoryBrew(p,13000,0);assert.equal(result.perfect,true);assert.equal(result.progress.materials.citrus,29);assert.equal(result.progress.materials.leaf,28);assert.equal(result.stock,1);assert.equal(claimLaboratoryBrew(result.progress,13001,1),null);
});
test('all four street sources renew after three minutes, are bounded and cannot be harvested twice by rapid clicks',()=>{
 let p=defaultLaboratory();for(const s of LAB_SOURCES){const now=1000000;assert.equal(canHarvest(p,s.id,now),true);const next=harvestLaboratory(p,s.id,now);assert.ok(next);assert.equal(next.materials[s.material],s.amount);p=next;assert.equal(harvestLaboratory(p,s.id,now),null);assert.equal(harvestLaboratory(p,s.id,now+LAB_RESPAWN_MS-1),null);assert.ok(harvestLaboratory(p,s.id,now+LAB_RESPAWN_MS));}
 p.materials.leaf=99;assert.equal(canHarvest(p,'linden-leaves',2000000),false);assert.equal(harvestLaboratory(p,'linden-leaves',NaN),null);assert.deepEqual(sanitizeLaboratory(JSON.parse(JSON.stringify(p))),p);
});
test('dungeon ingredients use a persistent chest ledger across death and reload, without changing its normal reward',()=>{
 let p=defaultLaboratory();p=collectLaboratoryChest(p,1,0);assert.equal(p.materials.spark,1);assert.equal(collectLaboratoryChest(p,1,0),null);p=sanitizeLaboratory(JSON.parse(JSON.stringify(p)));assert.equal(collectLaboratoryChest(p,1,0),null);p=collectLaboratoryChest(p,1,1);assert.equal(p.materials.pearl,1);assert.equal(collectLaboratoryChest(p,0,0),null);assert.equal(collectLaboratoryChest(p,2,-1),null);
});
test('every recipe remains obtainable using renewable street ingredients after all twenty-five dungeon levels close',()=>{
 let p=defaultLaboratory(),now=1000000;for(let round=0;round<30;round++){for(const s of LAB_SOURCES)p=harvestLaboratory(p,s.id,now);now+=LAB_RESPAWN_MS;}
 for(const r of LAB_RECIPES){p=startLaboratoryBrew(p,r.id,now,0);assert.ok(p,r.id+' can be prepared');now+=r.duration;const result=claimLaboratoryBrew(p,now,0);assert.equal(result.stock,1);p=result.progress;now++;}
 assert.deepEqual(p.unlocked,LAB_RECIPES.map(r=>r.id));assert.equal(p.crafted,LAB_RECIPES.length);assert.ok(Object.values(p.materials).every(n=>n>=0));
});
test('cloud save comparisons preserve materials, active brews and recipes as real progress',()=>{
 const a=createDefaultSave(),b={...a,laboratory:startLaboratoryBrew(stocked(),'lime',1000,0)};assert.equal(sameSave(a,b),false);assert.equal(acknowledgedSave({revision:5,source_id:'lab',save:JSON.parse(JSON.stringify(b))},4,'lab',b),true);assert.equal(acknowledgedSave({revision:5,source_id:'lab',save:a},4,'lab',b),false);
});
test('malformed lab saves cannot introduce unknown recipes, materials, duplicate ledgers or unbounded stock',()=>{
 const p=sanitizeLaboratory({materials:{leaf:Infinity,citrus:-1,spark:1234,pearl:'4',evil:99},unlocked:['lime','evil','lime'],job:{recipe:'evil',startedAt:4},crafted:NaN,chests:['1:0','1:0','bad'],harvested:{'linden-leaves':-1}});assert.deepEqual(p.materials,{citrus:0,leaf:0,pearl:0,spark:99});assert.deepEqual(p.unlocked,['lime']);assert.equal(p.job,null);assert.deepEqual(p.chests,['1:0']);
});

test('BULB grants every recipe without changing ingredients or a running brew and remains idempotent',()=>{
 const inProgress=startLaboratoryBrew(stocked(),'lime',1000,0);const unlocked=unlockAllLabRecipes(inProgress);
 assert.deepEqual(unlocked.unlocked,LAB_RECIPES.map(r=>r.id));assert.deepEqual(unlocked.materials,inProgress.materials);assert.deepEqual(unlocked.job,inProgress.job);
 assert.deepEqual(unlockAllLabRecipes(unlocked),unlocked);assert.deepEqual(sanitizeLaboratory(JSON.parse(JSON.stringify(unlocked))),unlocked);
 for(const recipe of LAB_RECIPES)assert.equal(canBuyLabDrink(unlocked,recipe.id),true);
});
