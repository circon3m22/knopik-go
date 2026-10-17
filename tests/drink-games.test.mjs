import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultSave, sanitizeSave } from '../app/game-logic.ts';
import { DRINK_GAMES, LIME_MAX_SCORE, LIME_ROUNDS, MEMORY_ROUNDS, commitDrinkRound, settleDrinkRound, createMemorySequence, memorySequenceLength, limePosition, limeReward, limeTarget, memoryReward, scoreLime } from '../app/drink-game-engine.ts';
import { spendBalance, cosmeticFatigueMultiplier, cosmeticUpgradePrice, themeMood, THEMES } from '../app/cosmetic-engine.ts';

test('theme colors follow emotions and keep owned theme identifiers compatible', () => {
  assert.equal(THEMES.soda.name, 'Небесный');
  assert.equal(THEMES.mint.name, 'Хамам');
  assert.equal(THEMES.night.name, 'Ночной');
  assert.equal(themeMood('calm', 'rest', false), 'calm');
  assert.equal(themeMood('tired', 'ultra', true), 'yellow');
  assert.equal(themeMood('warning', 'rest', false), 'yellow');
  assert.equal(themeMood('angry', 'bite', false), 'red');
  assert.equal(themeMood('recovering', 'bite', false), 'red');
  assert.equal(themeMood('recovering', 'ultra', true), 'yellow');
});

test('additive GO save preserves TAP, inventory, vault, equipment and old version compatibility', () => {
  const previous = { ...createDefaultSave(), walletCoins: 1234, vaultCoins: 5678, foodCount: 4, drinkCount: 3, colaCount: 2, teaCount: 1, totalTaps: 901, bestStreak: 71, hatOwned: true, hatEquipped: true, hatLevel: 4, commonCases: 2, settings: { sound: false, vibration: true, suliman: false, yellow: false } };
  for (const key of ['limeCount','matchaCount','limePlays','matchaPlays','limeBest','matchaBest','ownedCosmetics','equippedCosmetic','ownedThemes','activeTheme']) delete previous[key];
  const next = sanitizeSave(previous);
  for (const [key, value] of Object.entries(previous)) assert.deepEqual(next[key], key==='settings'?{...createDefaultSave().settings,...value}:value, key);
  assert.equal(next.limeCount, 0);
  assert.equal(next.matchaCount, 0);
  assert.equal(next.activeTheme, 'classic');
});

test('new inventory, records, owned outfits and backgrounds survive reloading', () => {
  const source = { ...createDefaultSave(), limeCount: 3, matchaCount: 2, limePlays: 7, matchaPlays: 4, limeBest: 429, matchaBest: 5, ownedCosmetics: ['charm'], equippedCosmetic: 'charm', ownedThemes: ['classic','night'], activeTheme: 'night' };
  assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(source))), source);
});

test('corrupted new fields cannot grant unowned buffs or themes', () => {
  const next = sanitizeSave({ ...createDefaultSave(), limeCount: Infinity, matchaCount: 1000, limeBest: 9999, matchaBest: -1, equippedCosmetic: 'charm', activeTheme: 'night', ownedThemes: ['fake','soda','soda'], ownedCosmetics: ['invalid'] });
  assert.equal(next.limeCount, 0);
  assert.equal(next.matchaCount, 25);
  assert.equal(next.limeBest, LIME_MAX_SCORE);
  assert.equal(next.matchaBest, 0);
  assert.equal(next.equippedCosmetic, null);
  assert.equal(next.activeTheme, 'classic');
  assert.deepEqual(next.ownedThemes, ['classic','soda']);
});

test('drinks use only active coins; outfits and themes use only the vault', () => {
  assert.equal(spendBalance(0, 10000, 40, 'active'), null);
  assert.equal(spendBalance(10000, 0, 500, 'vault'), null);
  assert.deepEqual(spendBalance(100, 700, 40, 'active'), { walletCoins: 60, vaultCoins: 700 });
  assert.deepEqual(spendBalance(100, 700, 500, 'vault'), { walletCoins: 100, vaultCoins: 200 });
  assert.equal(spendBalance(100, 700, -1, 'active'), null);
});

test('one bottle commits only once; abandoned instructions consume nothing', () => {
  const ledger = { kind: 'lime', phase: 'ready' };
  assert.equal(settleDrinkRound(ledger, 'lime', 100), null);
  assert.equal(commitDrinkRound(ledger, 0), false);
  assert.equal(commitDrinkRound(ledger, 1), true);
  assert.equal(commitDrinkRound(ledger, 1), false);
  assert.equal(settleDrinkRound(ledger, 'matcha', 100), null);
  assert.equal(settleDrinkRound(ledger, 'lime', 99999), 120);
  assert.equal(settleDrinkRound(ledger, 'lime', 120), null);
});

test('zero reward is still settled, so a loss cannot be reclaimed', () => {
  const ledger = { kind: 'matcha', phase: 'ready' };
  commitDrinkRound(ledger, 1);
  assert.equal(settleDrinkRound(ledger, 'matcha', NaN), 0);
  assert.equal(settleDrinkRound(ledger, 'matcha', 160), null);
});

test('legacy Lime cursor bounds and difficulty stay safe for compatible saves', () => {
  for (let round=0; round<5; round++) for (let elapsed=0; elapsed<10000; elapsed+=37) {
    const position = limePosition(elapsed, round);
    assert.ok(position >= 0 && position <= 100);
  }
  assert.deepEqual(limeTarget(0, () => 0), { center: 24, width: 14 });
  assert.equal(limeTarget(4).width, 12.8);
  assert.equal(scoreLime(50, 50, 30), 100);
  assert.equal(scoreLime(65, 50, 30), 25);
  assert.equal(scoreLime(66, 50, 30), 0);
  assert.equal(scoreLime(NaN, 50, 30), 0);
});

test('legacy Lime reward clamps its old score scale; current one-throw game is tested separately', () => {
  assert.equal(limeReward(Array(LIME_ROUNDS).fill(100)), DRINK_GAMES.lime.maximumReward);
  assert.equal(limeReward(Array(LIME_ROUNDS+1).fill(100)), 120);
  assert.equal(limeReward([100,0]), 4);
  assert.equal(limeReward([Infinity,-100,NaN]), 0);
});

test('memory has nine positions, starts with five flashes and rewards completed stages', () => {
  for (const roll of [0,.2,.5,.999999]) {
    const sequence = createMemorySequence(() => roll);
    assert.equal(sequence.length, memorySequenceLength(MEMORY_ROUNDS-1));
    sequence.forEach((pad, index) => { assert.ok(pad >= 0 && pad < 9); if(index)assert.notEqual(pad,sequence[index-1]); });
  }
  assert.equal(memoryReward(0),0);
  for(let i=1;i<=MEMORY_ROUNDS;i++)assert.ok(memoryReward(i)>memoryReward(i-1));
  assert.equal(memoryReward(999),160);
});

test('new outfits apply their distinct effects only when equipped', () => {
  assert.equal(cosmeticFatigueMultiplier(null), 1);
  assert.equal(cosmeticFatigueMultiplier('bandana'), .8);
  assert.equal(cosmeticFatigueMultiplier('charm'), 1);
  assert.ok(Math.abs(cosmeticFatigueMultiplier('bandana',5)-.48)<1e-9);
  assert.equal(cosmeticUpgradePrice(1),2500);
  assert.equal(cosmeticUpgradePrice(4),10000);
  assert.equal(cosmeticUpgradePrice(5),0);
});

import {resolveSkillWager,skillWagerPayout} from '../app/skill-wager-engine.ts';
test('Mohawk gives optional exact stakes to six skill games without changing ordinary rounds',()=>{
 assert.equal(resolveSkillWager(1000,500,false),0);
 assert.equal(resolveSkillWager(1000,500,true),500);
 assert.equal(resolveSkillWager(1000,5000,true),1000);
 assert.equal(resolveSkillWager(0,400,true),0);
 for(const invalid of [-1,NaN,Infinity,1.5])assert.equal(resolveSkillWager(1000,invalid,true),0);
 assert.equal(skillWagerPayout(500,0,100),0);
 assert.equal(skillWagerPayout(500,25,100),250);
 assert.equal(skillWagerPayout(500,50,100),500);
 assert.equal(skillWagerPayout(500,100,100),1000);
 assert.equal(skillWagerPayout(500,1000,100),1000);
 assert.equal(skillWagerPayout(500,NaN,100),0);
 assert.equal(skillWagerPayout(0,100,100),0);
 const regular={kind:'matcha',phase:'ready'};assert.equal(commitDrinkRound(regular,1),true);assert.equal(settleDrinkRound(regular,'matcha',20),20);
});
