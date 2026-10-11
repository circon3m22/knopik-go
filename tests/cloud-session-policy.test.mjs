import assert from 'node:assert/strict';
import test from 'node:test';
import {shouldLoadCloudGame} from '../app/cloud-session-policy.ts';
test('refresh and repeated sign-in for the loaded identity never reload the game',()=>{
  for(const event of ['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED']) {
    const renewed={id:'foma-id',token:event};
    assert.equal(shouldLoadCloudGame('foma-id',renewed.id),false,event);
  }
  assert.equal(shouldLoadCloudGame(null,'foma-id'),true);
  assert.equal(shouldLoadCloudGame('foma-id','proha-id'),true);
  assert.equal(shouldLoadCloudGame('foma-id',null),false);
  assert.equal(shouldLoadCloudGame(undefined,undefined),false);
});
