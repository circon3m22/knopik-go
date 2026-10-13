import assert from "node:assert/strict";
import test from "node:test";
import { SAVE_VERSION } from "../app/game-logic.ts";
import { acknowledgedSave, chooseRecovery, hasUnsupportedSaveVersion, sameSave } from "../app/save-synchronization.ts";

const cloud = { version: SAVE_VERSION, totalTaps: 1865, walletCoins: 1130, runnerBest: 6715, storyCheckpoint: 3, ownedThemes: ["classic"] };
const unsent = { ...cloud, walletCoins: 2240, totalTaps: 1900, storyCheckpoint: 4 };

test("GO login uses authoritative cloud save if local is clean", () => {
  assert.equal(chooseRecovery(cloud, 3, null), "cloud");
  assert.equal(chooseRecovery(cloud, 3, { save: cloud, baseRevision: 2, savedAt: Date.now() }), "cloud");
});

test("GO recovers offline progress from the same remote revision", () => {
  assert.equal(chooseRecovery(cloud, 3, { save: unsent, baseRevision: 3, savedAt: Date.now() }), "pending");
});

test("older local copy cannot replace newer GO progression", () => {
  assert.equal(chooseRecovery(cloud, 4, { save: unsent, baseRevision: 3, savedAt: Date.now() }), "conflict");
});

test("RPC success must acknowledge the exact revision, writer and content", () => {
  const ok = { revision: 4, source_id: "tab-A", save: unsent };
  assert.equal(acknowledgedSave(ok, 3, "tab-A", unsent), true);
  assert.equal(acknowledgedSave({ ...ok, revision: 3 }, 3, "tab-A", unsent), false);
  assert.equal(acknowledgedSave({ ...ok, source_id: "tab-B" }, 3, "tab-A", unsent), false);
  assert.equal(acknowledgedSave({ ...ok, save: cloud }, 3, "tab-A", unsent), false);
});

test("save schema that is newer than the client is rejected, not reset", () => {
  assert.equal(hasUnsupportedSaveVersion({ version: SAVE_VERSION + 1 }), true);
  assert.equal(hasUnsupportedSaveVersion(cloud), false);
  assert.equal(hasUnsupportedSaveVersion(null), true);
  assert.equal(sameSave(cloud, { ...cloud }), true);
});

test("lost RPC response can be checked against its committed revision", () => {
  assert.equal(acknowledgedSave({ revision: 9, source_id: "device-1", save: unsent }, 8, "device-1", unsent), true);
});
