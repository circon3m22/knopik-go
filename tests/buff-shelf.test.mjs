import assert from "node:assert/strict";
import test from "node:test";
import { BUFF_CATALOG, BUFF_STOCK_LIMIT, emptyBuffStock, purchaseShelfBuff } from "../app/buff-shelf-engine.ts";
import { createDefaultSave, sanitizeSave } from "../app/game-logic.ts";
import { commitDrinkRound, settleDrinkRound } from "../app/drink-game-engine.ts";

test("every shelf price buys one stored item using active money alone", () => {
  const stock = emptyBuffStock();
  assert.equal(Object.keys(stock).length, 12);
  for (const [kind, item] of Object.entries(BUFF_CATALOG)) {
    assert.deepEqual(purchaseShelfBuff(kind, stock[kind], item.price + 19, 80_000), { walletCoins:19, vaultCoins:80_000, count:1 });
    assert.equal(purchaseShelfBuff(kind, stock[kind], item.price - 1, 80_000), null);
    assert.equal(stock[kind], 0);
  }
});

test("rapid sequential purchases stop at the stock cap without taking an extra payment", () => {
  let count = 23, wallet = 50_000;
  for (let i = 0; i < 10; i++) {
    const purchase = purchaseShelfBuff("bombardiro", count, wallet, 888);
    if (purchase) { count = purchase.count; wallet = purchase.walletCoins; }
  }
  assert.equal(count, BUFF_STOCK_LIMIT);
  assert.equal(wallet, 42_000);
  for (const invalid of [NaN, Infinity, -1, 25, 26]) assert.equal(purchaseShelfBuff("food", invalid, 1000, 888), null);
  assert.equal(purchaseShelfBuff("food", 0, NaN, 888), null);
});

test("purchased stock survives reload without activating a buff or starting its game", () => {
  const saved = createDefaultSave(), purchase = purchaseShelfBuff("ballerina", 0, 10_000, 777);
  const reloaded = sanitizeSave(JSON.parse(JSON.stringify({
    ...saved, walletCoins:purchase.walletCoins, vaultCoins:purchase.vaultCoins,
    brainrotInventory:{...saved.brainrotInventory, ballerina:purchase.count},
  })));
  assert.equal(reloaded.brainrotInventory.ballerina, 1);
  assert.deepEqual(reloaded.brainrotStats, saved.brainrotStats);
  assert.equal(reloaded.boostUntil, saved.boostUntil);
  assert.equal(reloaded.vitaPowerShield, false);
  assert.equal(reloaded.vaultCoins, 777);
  const ledger = {kind:"ballerina", phase:"ready"};
  assert.equal(settleDrinkRound(ledger, "ballerina", 7500), null);
  assert.equal(commitDrinkRound(ledger, reloaded.brainrotInventory.ballerina), true);
  reloaded.brainrotInventory.ballerina--;
  assert.equal(commitDrinkRound(ledger, 1), false);
  assert.equal(reloaded.brainrotInventory.ballerina, 0);
});
