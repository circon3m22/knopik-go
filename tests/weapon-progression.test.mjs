import './helpers/tsx-loader.mjs';
import test from'node:test';import assert from'node:assert/strict';
import{WEAPON_ORDER,ADVENTURE_WEAPONS}from'../app/adventure-levels.ts';
import{emptyWeaponUpgrades,purchaseWeaponUpgrade,sanitizeWeaponUpgrades,readWeaponUpgrades,weaponUpgradeStats,weaponUpgradePrice}from'../app/weapon-progression.ts';
import{createDefaultSave,sanitizeSave,SAVE_VERSION}from'../app/game-logic.ts';
import{readCoopEquipment,COOP_PROTOCOL}from'../app/coop-protocol.ts';
import{CoopEngine}from'../app/coop-engine.ts';import{packCoopSnapshot,unpackCoopSnapshot}from'../app/coop-wire.ts';
import{dungeonGame}from'./helpers/dungeon-fixtures.mjs';

test('every weapon has exactly three payable upgrades; stale double clicks, locked weapons and invalid balances spend nothing',()=>{
 for(const weapon of WEAPON_ORDER){let state=emptyWeaponUpgrades(),wallet=100000;const paid=[];
  for(let n=0;n<3;n++){const before=state,coins=wallet,price=weaponUpgradePrice(weapon,n),result=purchaseWeaponUpgrade(state,wallet,7,weapon,n);assert.ok(result);assert.equal(result.wallet,wallet-price);assert.equal(result.upgrades[weapon],n+1);assert.equal(before[weapon],n);state=result.upgrades;wallet=result.wallet;paid.push(price);assert.equal(purchaseWeaponUpgrade(state,wallet,7,weapon,n),null,'stale event must not buy the next tier');assert.equal(purchaseWeaponUpgrade(before,price-1,7,weapon,n),null);assert.equal(coins-wallet,price);}
  assert.ok(paid[0]<paid[1]&&paid[1]<paid[2]);assert.equal(purchaseWeaponUpgrade(state,wallet,7,weapon,3),null);assert.equal(weaponUpgradeStats(state,weapon).damageMultiplier,1.45);
 }
 assert.equal(purchaseWeaponUpgrade(emptyWeaponUpgrades(),100000,0,'rifle',0),null);
 for(const value of[-1,NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1])assert.equal(purchaseWeaponUpgrade(emptyWeaponUpgrades(),value,7,'fist',0),null);
});

test('new saves round-trip paid upgrades atomically with the balance while legacy saves keep their progress and start at zero',()=>{
 const base={...createDefaultSave(),storyCompletedLevel:34,storyWeaponTier:7,walletCoins:5000};const purchase=purchaseWeaponUpgrade(base.weaponUpgrades,base.walletCoins,7,'rifle',0);
 const restored=sanitizeSave(JSON.parse(JSON.stringify({...base,weaponUpgrades:purchase.upgrades,walletCoins:purchase.wallet})));
 assert.equal(restored.version,SAVE_VERSION);assert.equal(restored.weaponUpgrades.rifle,1);assert.equal(restored.walletCoins,purchase.wallet);assert.equal(restored.storyCompletedLevel,34);
 const legacy=sanitizeSave({...base,version:36,weaponUpgrades:{rifle:3}});assert.deepEqual(legacy.weaponUpgrades,emptyWeaponUpgrades());assert.equal(legacy.walletCoins,5000);
 assert.deepEqual(sanitizeWeaponUpgrades({fist:88,rifle:2,arc:-5,other:3},0),{...emptyWeaponUpgrades(),fist:3});
 assert.equal(readWeaponUpgrades({rifle:99}),null);assert.equal(readWeaponUpgrades({rifle:1.1}),null);assert.equal(readWeaponUpgrades({rifle:'1'}),null);assert.equal(readWeaponUpgrades({unknown:1}),null);
});

test('upgrade rate applies to the current weapon in real combat without changing base damage for unupgraded players',()=>{
 for(const weapon of WEAPON_ORDER){const e=dungeonGame(35,{weaponTier:7,immortal:true});e.enemies.forEach(n=>n.hp=0);e.selectWeapon(weapon);e.setEquipment({hat:false,mohawk:false,accessory:null,weaponUpgrades:{...emptyWeaponUpgrades(),[weapon]:3}});e.setInput(0,0,true);e.advance(1/60);
  assert.ok(e.punchSerial>0);assert.ok(Math.abs(e.punchCooldownDuration-ADVENTURE_WEAPONS[weapon].cooldown*.88)<1e-8,weapon);
  if(!['fist','sabre','arc'].includes(weapon)){const b=e.bullets.find(b=>b.active&&b.owner==='player');assert.ok(b,weapon+' must fire a real bullet');assert.ok(Math.abs(b.damage-ADVENTURE_WEAPONS[weapon].damage*1.45)<1e-8,weapon);}
 }
});

test('online metadata and snapshots retain different bounded upgrades for host and guest',()=>{
 const host={hat:false,mohawk:false,accessory:null,weaponUpgrades:{...emptyWeaponUpgrades(),sabre:3}},guest={hat:false,mohawk:false,accessory:null,weaponUpgrades:{...emptyWeaponUpgrades(),rifle:2}};
 assert.deepEqual(readCoopEquipment(host),host);assert.equal(readCoopEquipment({...host,weaponUpgrades:{sabre:4}}),null);
 const setup={mode:'campaign',level_id:35,host_equipment:host,guest_equipment:guest},a=new CoopEngine(87,1,()=>{},setup),b=new CoopEngine(87,1,()=>{},setup),wire=JSON.parse(JSON.stringify(packCoopSnapshot(a.snapshot()))),state=unpackCoopSnapshot(wire,b);
 assert.equal(state.v,COOP_PROTOCOL);b.applySnapshot(state);assert.deepEqual(b.actors.map(a=>a.equipment.weaponUpgrades),[host.weaponUpgrades,guest.weaponUpgrades]);
 a.forPlayer(0,()=>{a.selectWeapon('sabre');a.setInput(0,0,true);});a.forPlayer(1,()=>{a.selectWeapon('rifle');a.setInput(0,0,true);});a.advance(1/60);
 assert.ok(Math.abs(a.actors[0].punchCooldownDuration-.84*.88)<1e-8);assert.ok(Math.abs(a.actors[1].punchCooldownDuration-1.5*.92)<1e-8);
});


test('fractional upgrade damage reaches zero cleanly instead of leaving a one-hit sliver',()=>{const e=dungeonGame(35,{immortal:true}),enemy=e.enemies[0];Object.assign(enemy,{hp:23,maxHp:23,awake:true});for(let n=0;n<20;n++)e.hitEnemy(enemy,1.15,0,true);assert.equal(enemy.hp,0);});

test('an upgraded launcher keeps its damage when a wall blocks its muzzle',()=>{
 for(const surged of[false,true]){const e=dungeonGame(35,{weaponTier:7,immortal:true});e.enemies.forEach(n=>n.hp=0);e.selectWeapon('launcher');e.setEquipment({hat:false,mohawk:false,accessory:null,weaponUpgrades:{...emptyWeaponUpgrades(),launcher:3}});e.canStand=()=>false;e.surgeTime=surged?10:0;
  let damage;e.explodeAt=(_x,_y,_radius,hit)=>{damage=hit;};e.setInput(0,0,true);e.advance(1/60);assert.equal(damage,4*1.45*(surged?2:1));assert.ok(!e.bullets.some(b=>b.active&&b.owner==='player'));
 }
});
