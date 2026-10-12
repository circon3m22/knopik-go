import assert from 'node:assert/strict';
import test from 'node:test';
import {canAccessKnopikGo,isKnopikGoLogin} from '../app/go-access.ts';

test('only the verified Foma identity may load GO, including restored sessions',()=>{
  assert.equal(canAccessKnopikGo('14b063d8-1790-451b-a354-1f7dcaa41f13'),true);
  for(const id of ['8af40a74-bd79-4638-801e-5e6420702099','another-admin','Foma','foma','',null,undefined]) assert.equal(canAccessKnopikGo(id),false);
});

test('login accepts Foma with normal casing and spaces, rejects Proha and other logins',()=>{
  for(const login of ['Foma','foma',' FOMA ']) assert.equal(isKnopikGoLogin(login),true);
  for(const login of ['Proha','proha','Проха','Foma2','foma@knopik.local','']) assert.equal(isKnopikGoLogin(login),false);
});
