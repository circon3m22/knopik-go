import assert from 'node:assert/strict';
import test from 'node:test';
import {COLLECTION_CHEATS,BUFF_SAVE_FIELDS,grantCollectionCheat} from '../app/collection-cheats.ts';
import {THEMES,COSMETICS} from '../app/cosmetic-engine.ts';
import {BUFF_CATALOG,buffStockLimit} from '../app/buff-shelf-engine.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';

test('every collectible has a unique opaque code, including both premium backgrounds',()=>{
  assert.equal(new Set(COLLECTION_CHEATS.map(x=>x.code)).size,COLLECTION_CHEATS.length);
  for(const item of COLLECTION_CHEATS){
    assert.match(item.code,/^[A-Z0-9]{4}$/);
    assert.notEqual(item.code.toLowerCase(),item.kind);
    assert.notEqual(item.code.toLowerCase(),item.label.toLowerCase());
  }
  for(const [type,kinds] of [['theme',Object.keys(THEMES)],['clothing',['hat','mohawk',...Object.keys(COSMETICS)]],['buff',Object.keys(BUFF_CATALOG)],['case',['common','big']],['upgrade',['hat','mohawk']]])
    for(const kind of kinds)assert.equal(COLLECTION_CHEATS.filter(x=>x.type===type&&x.kind===kind).length,1,`${type}/${kind}`);
});

test('all individual codes grant and persist inventory without spending, equipping or raising levels',()=>{
  for(const entry of COLLECTION_CHEATS){
    const original={...createDefaultSave(),walletCoins:123,vaultCoins:456};
    const patch=grantCollectionCheat(`  ${entry.code.toLowerCase()}  `,true,original);
    assert.ok(patch);
    const next=sanitizeSave(JSON.parse(JSON.stringify({...original,...patch})));
    assert.equal(next.walletCoins,123);assert.equal(next.vaultCoins,456);assert.equal(next.level,original.level);
    assert.equal(next.activeTheme,'classic');assert.equal(next.hatEquipped,false);assert.equal(next.equippedCosmetic,null);
    if(entry.type==='theme')assert.ok(next.ownedThemes.includes(entry.kind));
    else if(entry.type==='clothing')assert.ok(entry.kind==='hat'?next.hatOwned:entry.kind==='mohawk'?next.mohawkOwned:next.ownedCosmetics.includes(entry.kind));
    else if(entry.type==='buff')assert.equal(entry.kind in BUFF_SAVE_FIELDS?next[BUFF_SAVE_FIELDS[entry.kind]]:next.brainrotInventory[entry.kind],1);
    else if(entry.type==='case')assert.equal(next[entry.kind==='common'?'commonCases':'bigCases'],1);
    else assert.equal(next[entry.kind==='hat'?'hatUpgradeTokens':'mohawkUpgradeTokens'],1);
    assert.deepEqual(original.ownedCosmetics,[]);
    assert.equal(grantCollectionCheat(entry.code,false,original),null);
    assert.equal(grantCollectionCheat(entry.code+' 20',true,original),null);
  }
  assert.equal(grantCollectionCheat('not-a-code',true,createDefaultSave()),null);
});

test('repeat grants keep collections unique and respect stock limits',()=>{
  let saved=createDefaultSave();
  for(let n=0;n<110;n++)for(const entry of COLLECTION_CHEATS)saved={...saved,...grantCollectionCheat(entry.code,true,saved)};
  assert.equal(saved.ownedThemes.length,Object.keys(THEMES).length);
  assert.equal(saved.ownedCosmetics.length,Object.keys(COSMETICS).length);
  for(const kind of Object.keys(BUFF_CATALOG))assert.equal(kind in BUFF_SAVE_FIELDS?saved[BUFF_SAVE_FIELDS[kind]]:saved.brainrotInventory[kind],buffStockLimit(kind));
  for(const field of ['commonCases','bigCases','hatUpgradeTokens','mohawkUpgradeTokens'])assert.equal(saved[field],99);
});
