import assert from 'node:assert/strict';
import test from 'node:test';
import { LimeEngine, LIME_ATTEMPT_MS } from '../app/lime-engine.ts';
import { LIME_MAX_SCORE, MEMORY_ROUNDS, commitDrinkRound, settleDrinkRound, createMemorySequence, memorySequenceLength, memoryReward } from '../app/drink-game-engine.ts';

test('one missed throw ends Lime and cannot accept a second attempt', () => {
  const game = new LimeEngine();
  assert.equal(game.start(0, () => .5), true);
  game.sample(0);
  assert.equal(game.press(30), 0);
  assert.equal(game.press(350), null);
  assert.deepEqual(game.finish(), { score: 0, reward: 0 });
  assert.equal(game.start(400), false);
});

test('Lime scores the painted fruit, pays accuracy once and preserves saved record scale', () => {
  const game = new LimeEngine(), ledger = { kind: 'lime', phase: 'ready' };
  assert.equal(commitDrinkRound(ledger, 1), true);
  assert.equal(game.start(0, () => .5), true);
  assert.equal(game.start(0), false);
  assert.equal(game.sample(350).cursor, 50);
  // The finger arrives after the painted frame; don't shift the target under it.
  assert.equal(game.press(370), 100);
  const result = game.finish();
  assert.deepEqual(result, { score: LIME_MAX_SCORE, reward: 120 });
  assert.equal(settleDrinkRound(ledger, 'lime', result.reward), 120);
  assert.equal(settleDrinkRound(ledger, 'lime', result.reward), null);
});

test('Lime pause preserves both remaining time and cursor through a long tab absence', () => {
  const game = new LimeEngine();
  game.start(100, () => .5);
  const before = game.sample(450);
  assert.equal(game.pause(450), true);
  assert.equal(game.press(60_000), null);
  assert.deepEqual(game.sample(60_000), before);
  assert.equal(game.resume(60_000), true);
  assert.deepEqual(game.sample(60_000), before);
  assert.equal(game.press(60_010), 100);
});

test('Lime deadline beats a stale successful frame, and exiting without a throw pays zero', () => {
  const expired = new LimeEngine(); expired.start(0, () => .5); expired.sample(350);
  assert.equal(expired.press(LIME_ATTEMPT_MS), 0);
  assert.deepEqual(expired.finish(), { score: 0, reward: 0 });
  const abandoned = new LimeEngine(); abandoned.start(0);
  assert.deepEqual(abandoned.finish(), { score: 0, reward: 0 });
});

test('Matcha starts with five flashes and extends the same valid sequence each level', () => {
  for (const random of [0,.2,.5,.999999]) {
    const sequence = createMemorySequence(() => random);
    assert.equal(sequence.length, memorySequenceLength(MEMORY_ROUNDS - 1));
    assert.equal(memorySequenceLength(0), 5);
    for (let level = 0; level < MEMORY_ROUNDS; level++) assert.equal(memorySequenceLength(level), 5 + level);
    sequence.forEach((pad, index) => { assert.ok(pad >= 0 && pad < 9); if (index) assert.notEqual(pad, sequence[index - 1]); });
  }
  assert.equal(memoryReward(0), 0);
  assert.equal(memoryReward(MEMORY_ROUNDS), 160);
});

test('empty inventory never commits a drink, and a zero reward settles only once', () => {
  const ledger = { kind: 'matcha', phase: 'ready' };
  assert.equal(commitDrinkRound(ledger, 0), false);
  assert.equal(ledger.phase, 'ready');
  assert.equal(commitDrinkRound(ledger, 1), true);
  assert.equal(commitDrinkRound(ledger, 1), false);
  assert.equal(settleDrinkRound(ledger, 'lime', 120), null);
  assert.equal(settleDrinkRound(ledger, 'matcha', 0), 0);
  assert.equal(settleDrinkRound(ledger, 'matcha', 160), null);
});
