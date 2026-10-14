import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {AdventureEngine, ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {burnActiveBalance} from '../app/adventure-economy.ts';
import {purchaseShelfBuff} from '../app/buff-shelf-engine.ts';
import {createDefaultSave, sanitizeSave} from '../app/game-logic.ts';
import {dungeonGame, quietEvents, tickDungeon} from './helpers/dungeon-fixtures.mjs';
const {AdventureSupplies} = await import('../app/adventure-supplies.tsx');
const {ActiveBalance} = await import('../app/active-balance.tsx');
const {AdventureWeaponPicker} = await import('../app/adventure-weapon-picker.tsx');
const {DungeonCampaignMenu} = await import('../app/dungeon-menu.tsx');
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {WEAPON_ORDER, ADVENTURE_WEAPONS} from '../app/adventure-levels.ts';

function economy(id=1, options={}) {
  let wallet = {walletCoins:12500, streakCoins:200, vaultCoins:777};
  const stock = {heal:0, pepsi:0}; let deaths = 0;
  const events = {
    death() { const lost=wallet.walletCoins; wallet=burnActiveBalance(wallet); deaths++; return lost; },
    buySupply(kind) { const result=purchaseShelfBuff(kind,stock[kind],wallet.walletCoins,wallet.vaultCoins); if(!result)return false; stock[kind]=result.count; wallet={...wallet,walletCoins:result.walletCoins}; return true; },
    collect(amount) { wallet={...wallet,walletCoins:wallet.walletCoins+amount}; },
    consumeHeal() { if(!stock.heal)return false; stock.heal--; return true; },
    activateShield() { if(!stock.pepsi)return false; stock.pepsi--; return true; },
  };
  const e=dungeonGame(id,options,events);
  return {e,stock,events,get wallet(){return wallet;},get deaths(){return deaths;}};
}
function hit(e) {
  Object.assign(e.bullets[0], {x:e.player.x,y:e.player.y,vx:0,vy:0,active:true,life:1,owner:'enemy',kind:'round'});
  e.advance(ADVENTURE_STEP);
}

test('all 25 levels allow live purchases at shelf prices; buying never auto-uses, vault money cannot pay',()=>{
  for(let id=1;id<=25;id++) {
    const g=economy(id); const before={...g.e.player};
    assert.equal(g.e.buySupply('heal'),true); assert.equal(g.e.buySupply('pepsi'),true);
    assert.deepEqual(g.stock,{heal:1,pepsi:1}); assert.equal(g.wallet.walletCoins,500); assert.equal(g.wallet.vaultCoins,777);
    assert.deepEqual(g.e.player,before); assert.equal(g.e.shieldReady,false);
    assert.equal(g.e.buySupply('heal'),false); assert.equal(g.wallet.walletCoins,500);
  }
});
test('rapid purchases and uses read the latest balance and stock, not an old rendered frame',()=>{
  const g=economy(); for(let i=0;i<20;i++)g.e.buySupply('heal');
  assert.equal(g.stock.heal,6); assert.equal(g.wallet.walletCoins,500);
  g.e.player.hp=1; assert.equal(g.e.heal(),true); assert.equal(g.e.heal(),true); assert.equal(g.e.heal(),false);
  assert.equal(g.stock.heal,4); assert.equal(g.wallet.walletCoins,500);
  g.stock.heal=25; g.events.collect(10000); assert.equal(g.e.buySupply('heal'),false); assert.equal(g.wallet.walletCoins,10500);
});
test('purchase is rejected during dialogue, pause, menus, death and at home; apartment encounter allows it',()=>{
  let calls=0; const buySupply=()=>{calls++;return true;};
  const e=dungeonGame(1,{}, {buySupply});
  for(const phase of ['title','dialogue','paused','levels','won','dead']) {e.phase=phase; assert.equal(e.buySupply('heal'),false);}
  e.phase='playing';e.player.hp=0;assert.equal(e.buySupply('heal'),false);e.player.hp=3;
  assert.equal(e.buySupply('unknown'),false);assert.equal(calls,0);
  const home=new AdventureEngine(3,{...quietEvents,buySupply});assert.equal(home.buySupply('heal'),false);
  const first=new AdventureEngine(0,{...quietEvents,buySupply});first.begin();while(first.phase==='dialogue')first.nextDialogue();
  first.interactDestination('basement');while(first.phase==='dialogue')first.nextDialogue();
  assert.equal(first.buySupply('heal'),true);assert.equal(calls,1);
});
test('a real lethal hit burns the entire live wallet exactly once, preserves vault and inventory, and records the loss',()=>{
  const g=economy();g.e.buySupply('heal');g.e.player.hp=1;
  hit(g.e); assert.equal(g.e.phase,'dead');assert.equal(g.e.player.hp,0);
  assert.equal(g.wallet.walletCoins,0);assert.equal(g.wallet.streakCoins,0);assert.equal(g.wallet.vaultCoins,777);
  assert.equal(g.stock.heal,1);assert.equal(g.e.view().lostCoins,10500);assert.equal(g.deaths,1);
  tickDungeon(g.e,10);g.e.explodeAt(g.e.player.x,g.e.player.y,100,3);assert.equal(g.deaths,1);
  assert.equal(g.e.buySupply('heal'),false);g.e.restart();assert.equal(g.e.view().lostCoins,0);
  g.events.collect(19);g.e.player.hp=1;hit(g.e);assert.equal(g.wallet.walletCoins,0);assert.equal(g.e.view().lostCoins,19);assert.equal(g.deaths,2);
});
test('armed shield revives on the spot without burning money; the next fatal hit burns it',()=>{
  const g=economy();g.e.buySupply('pepsi');assert.equal(g.e.activateShield(),true);const before={...g.e.player};
  g.e.player.hp=1;hit(g.e);assert.equal(g.e.phase,'playing');assert.equal(g.e.player.hp,3);assert.equal(g.e.shieldReady,false);
  assert.equal(g.wallet.walletCoins,2500);assert.equal(g.deaths,0);assert.equal(g.e.player.x,before.x);assert.equal(g.e.player.y,before.y);
  // Clear opponents only to isolate the second lethal impact after shield invulnerability.
  g.e.enemies.forEach(e=>e.hp=0);tickDungeon(g.e,2.5);g.e.player.hp=1;hit(g.e);
  assert.equal(g.e.phase,'dead');assert.equal(g.wallet.walletCoins,0);assert.equal(g.deaths,1);
});
test('immortality and a normal exit never burn money; the empty wallet survives saving with progress intact',()=>{
  const g=economy(1,{immortal:true});g.e.player.hp=1;hit(g.e);assert.equal(g.wallet.walletCoins,12500);assert.equal(g.deaths,0);
  g.e.pause();g.e.exitToApartment();assert.equal(g.wallet.walletCoins,12500);assert.equal(g.deaths,0);
  const save=burnActiveBalance({...createDefaultSave(),streakCoins:123,walletCoins:8000,vaultCoins:3200,healCount:4,vitaPowerCount:2,storyCompletedLevel:19,storyWeaponTier:4});
  const reloaded=sanitizeSave(JSON.parse(JSON.stringify(save)));
  assert.equal(reloaded.walletCoins,0);assert.equal(reloaded.vaultCoins,3200);assert.equal(reloaded.healCount,4);
  assert.equal(reloaded.vitaPowerCount,2);assert.equal(reloaded.storyCompletedLevel,19);assert.equal(reloaded.storyWeaponTier,4);
});

function controls(overrides={}) {
  const root=AdventureSupplies({phase:'playing',balance:12000,healCount:1,shieldCount:1,canHeal:true,shieldReady:false,onBuy(){},onHeal(){},onShield(){},...overrides});
  return root.props.children.flatMap(section=>section.props.children.map(node=>node.type(node.props)));
}
test('supply controls work with a second touch, suppress its synthetic click and keep keyboard activation',()=>{
  let buys=0,heals=0,prevented=0;
  const [heal,buy]=controls({onBuy:()=>buys++,onHeal:()=>heals++});
  const touch={button:0,pointerId:9,isPrimary:false,preventDefault(){prevented++;}};
  buy.props.onPointerDown(touch);buy.props.onClick({detail:1});assert.equal(buys,1);
  heal.props.onPointerDown(touch);heal.props.onClick({detail:1});assert.equal(heals,1);assert.equal(prevented,2);
  buy.props.onClick({detail:0});assert.equal(buys,2);
  buy.props.onPointerDown({...touch,button:2});assert.equal(buys,2);
});
test('supply controls distinguish empty stock, full health, active shield, insufficient wallet and a full stock',()=>{
  assert.deepEqual(controls({healCount:0,shieldCount:0}).map(b=>b.props.disabled),[true,false,true,false]);
  assert.deepEqual(controls({canHeal:false,shieldReady:true}).map(b=>b.props.disabled),[true,false,true,false]);
  assert.deepEqual(controls({balance:1999}).map(b=>b.props.disabled),[false,true,false,true]);
  assert.deepEqual(controls({healCount:25,shieldCount:25}).map(b=>b.props.disabled),[false,true,false,true]);
  for(const phase of ['paused','dialogue','dead','levels']) {
    let mutations=0;const buttons=controls({phase,onBuy:()=>mutations++,onHeal:()=>mutations++,onShield:()=>mutations++});
    for(const b of buttons){assert.equal(b.props.disabled,true);b.props.onPointerDown({button:0,preventDefault(){}});b.props.onClick({detail:0});}
    assert.equal(mutations,0);
  }
  const wallet=ActiveBalance({amount:12001,atRisk:true});assert.match(wallet.props['aria-label'],/12\s001 KC/);assert.match(wallet.props['aria-label'],/Сгорит/);
});
test('weapon picker shows only earned weapons at every tier, without future locked buttons',()=>{
  for(let tier=0;tier<=5;tier++) {
    const selected=WEAPON_ORDER[tier],chosen=[];
    const picker=AdventureWeaponPicker({phase:'playing',weapon:selected,weaponTier:tier,onSelect:w=>chosen.push(w)});
    assert.equal(picker.props.children.length,tier+1);
    for(const [i,b] of picker.props.children.entries()) {
      assert.equal(b.props.disabled,false);assert.equal(b.props['aria-pressed'],i===tier);
      assert.match(b.props['aria-label'],new RegExp(ADVENTURE_WEAPONS[WEAPON_ORDER[i]].name));b.props.onClick();
    }
    assert.deepEqual(chosen,WEAPON_ORDER.slice(0,tier+1));
    const paused=AdventureWeaponPicker({phase:'paused',weapon:selected,weaponTier:tier,onSelect(){}});
    assert.ok(paused.props.children.every(b=>b.props.disabled));
  }
});
test('zone menu hides weapon artwork until that weapon has been unlocked',()=>{
  const e=dungeonGame(1,{weaponTier:1});
  const locked=renderToStaticMarkup(React.createElement(DungeonCampaignMenu,{view:e.view(),zone:5,onZone(){},onLevel(){},onClose(){}}));
  assert.doesNotMatch(locked,/class="dungeon-zone-weapon"/);
  e.weaponTier=5;
  const unlocked=renderToStaticMarkup(React.createElement(DungeonCampaignMenu,{view:e.view(),zone:5,onZone(){},onLevel(){},onClose(){}}));
  assert.match(unlocked,/class="dungeon-zone-weapon"/);
});
