import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureEngine, ADVENTURE_STEP } from '../app/adventure-engine.ts';
const { AdventureDodgeButton } = await import('../app/adventure-dodge-button.tsx');
function game() { return new AdventureEngine(3, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} }); }
function tick(e, seconds) { for (let i=0;i<Math.ceil(seconds*60);i++) e.advance(ADVENTURE_STEP); }

test('a secondary touch starts dodge immediately while joystick movement stays held',()=>{
  const e=game();e.player.x=150;e.player.y=435;e.setInput(1,0,false);tick(e,.05);
  const before=e.player.x;let prevented=0;
  const button=AdventureDodgeButton({disabled:false,ready:true,onDodge:()=>e.dodge()});
  button.props.onPointerDown({pointerId:12,pointerType:'touch',isPrimary:false,button:0,preventDefault(){prevented++;}});
  assert.ok(e.dodgeTime>0);assert.equal(prevented,1);assert.ok(e.invincible>0);
  tick(e,.2);assert.ok(e.player.x-before>80);assert.equal(e.player.y,435);
  tick(e,.06);const after=e.player.x;tick(e,.02);assert.ok(e.player.x>after);
});
test('a touch click cannot trigger another dash after recharge, while keyboard click remains supported',()=>{
  const e=game();e.player.x=150;e.player.y=435;e.setInput(1,0,false);
  const button=AdventureDodgeButton({disabled:false,ready:true,onDodge:()=>e.dodge()});
  button.props.onPointerDown({button:0,preventDefault(){}});tick(e,1);assert.equal(e.dodgeTime,0);
  button.props.onClick({detail:1});assert.equal(e.dodgeTime,0);
  button.props.onClick({detail:0});assert.ok(e.dodgeTime>0);
});
test('paused or recharging dodge controls ignore touch and keyboard activation',()=>{
  let uses=0;const button=AdventureDodgeButton({disabled:true,ready:false,onDodge:()=>uses++});
  button.props.onPointerDown({button:0,preventDefault(){}});button.props.onClick({detail:0});assert.equal(uses,0);
  const enabled=AdventureDodgeButton({disabled:false,ready:true,onDodge:()=>uses++});
  enabled.props.onPointerDown({button:2,preventDefault(){}});assert.equal(uses,0);
});
