import assert from 'node:assert/strict';
import test from 'node:test';
import {RunnerEngine} from '../app/runner-engine.ts';
const noop=()=>{},events={phase:noop,coins:noop,finish:noop,sound:noop,zone:noop,route:noop};
const options={collar:false,immortal:false,magnet:false,turbo:false,homeShield:true};
test('the main-screen shield absorbs one runner collision and is consumed exactly once',()=>{
 let used=0;const game=new RunnerEngine({...events,homeShieldUsed:()=>used++},options);game.start();game.phase='running';
 assert.equal(game.shieldCount,1);assert.equal(game.absorbCollision(),true);assert.equal(used,1);assert.equal(game.shieldCount,0);
 game.setOptions({...options});game.elapsed+=1;assert.equal(game.absorbCollision(),false);assert.equal(used,1);
 game.restart();game.phase='running';assert.equal(game.shieldCount,0);assert.equal(game.absorbCollision(),false);
 game.setOptions({...options,homeShield:false});game.setOptions(options);assert.equal(game.shieldCount,1);
});
test('immortality does not spend an activated item; the home shield and collar charges are independent',()=>{
 let used=0;const game=new RunnerEngine({...events,homeShieldUsed:()=>used++},{...options,collar:true,collarLevel:5,immortal:true});game.phase='running';
 assert.equal(game.shieldCount,4);assert.equal(game.absorbCollision(),true);assert.equal(used,0);assert.equal(game.shieldCount,4);
 game.setOptions({...options,collar:true,collarLevel:5});assert.equal(game.absorbCollision(),true);assert.equal(used,1);assert.equal(game.shieldCharges,3);
 game.elapsed+=1;assert.equal(game.absorbCollision(),true);assert.equal(game.shieldCharges,2);assert.equal(used,1);
});
