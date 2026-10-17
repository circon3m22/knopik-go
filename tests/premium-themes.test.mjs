import assert from 'node:assert/strict';
import test from 'node:test';
import {THEMES,sanitizeThemes,spendBalance} from '../app/cosmetic-engine.ts';
import {progressReward} from '../app/progress-engine.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
test('premium backgrounds unlock late; Observatory has the highest price and unlock level',()=>{
  assert.equal(progressReward(THEMES.bath.unlockLevel).kind,'bath');
  assert.equal(progressReward(THEMES.emerald.unlockLevel).kind,'emerald');
  for(const [id,theme] of Object.entries(THEMES))if(id!=='observatory') {
    assert.ok(theme.price<THEMES.observatory.price);assert.ok(theme.unlockLevel<THEMES.observatory.unlockLevel);
  }
  assert.equal(spendBalance(999999,249999,THEMES.emerald.price,'vault'),null);
  assert.deepEqual(spendBalance(40,250001,THEMES.emerald.price,'vault'),{walletCoins:40,vaultCoins:1});
});
test('both premium themes survive a save reload; corrupt or unowned themes cannot be equipped',()=>{
  const saved={...createDefaultSave(),ownedThemes:['classic','bath','emerald'],activeTheme:'emerald'};
  assert.equal(sanitizeSave(JSON.parse(JSON.stringify(saved))).activeTheme,'emerald');
  assert.deepEqual(sanitizeThemes(['bath','emerald','bad','bath','__proto__']),['classic','bath','emerald']);
  assert.equal(sanitizeSave({...saved,ownedThemes:['classic']}).activeTheme,'classic');
});
