import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const {trackGameInputMode}=await import('../app/game-input-mode.tsx');
const key=(target,value)=>{const event=new Event('keydown');Object.defineProperty(event,'key',{value});target.dispatchEvent(event);};
test('opening menus with touch suppresses focus rings and Tab restores keyboard focus styling',()=>{
 const target=new EventTarget(),root={dataset:{}};const stop=trackGameInputMode(target,root);
 assert.equal(root.dataset.gameInput,'pointer');
 key(target,'Tab');assert.equal(root.dataset.gameInput,'keyboard');
 target.dispatchEvent(new Event('pointerdown'));assert.equal(root.dataset.gameInput,'pointer');
 key(target,'Shift');assert.equal(root.dataset.gameInput,'pointer');
 for(const value of ['Enter',' ','ArrowLeft','Home','End']){key(target,value);assert.equal(root.dataset.gameInput,'keyboard');target.dispatchEvent(new Event('pointerdown'));}
 stop();assert.equal(root.dataset.gameInput,undefined);
 key(target,'Tab');assert.equal(root.dataset.gameInput,undefined,'unmount removes the event listeners');
});
