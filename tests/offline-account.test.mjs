import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOfflineAccount,rememberOfflineAccount,readOfflineAccount,forgetOfflineAccount,OFFLINE_ACCOUNT_KEY} from '../app/offline-account.ts';
import {chooseRecovery} from '../app/save-synchronization.ts';
import {createDefaultSave} from '../app/game-logic.ts';
const foma={userId:'14b063d8-1790-451b-a354-1f7dcaa41f13',username:'Foma',isAdmin:true};
const proclick={userId:'f53a06e6-f782-4969-935a-124a0ea9abe5',username:'Proclick',isAdmin:false};
test('only a previously downloaded verified account with a valid cloud revision can resume offline',()=>{
 const valid={...foma,revision:864,difficulty:34,verifiedAt:Date.now()};
 assert.equal(parseOfflineAccount(JSON.stringify(valid)).userId,foma.userId);
 for(const bad of [null,{}, {...valid,userId:'another-admin'},{...valid,revision:-1},{...valid,verifiedAt:0},{...valid,revision:1.2}])assert.equal(parseOfflineAccount(JSON.stringify(bad)),null);
});
test('the last account can switch without mixing identities, and signout removes offline access',()=>{
 const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 rememberOfflineAccount(foma,9,20);assert.equal(readOfflineAccount().userId,foma.userId);
 rememberOfflineAccount(proclick,0,20);assert.equal(readOfflineAccount().userId,proclick.userId);assert.equal(readOfflineAccount().isAdmin,false);
 assert.ok(!map.get(OFFLINE_ACCOUNT_KEY).includes('password'));
 forgetOfflineAccount();assert.equal(readOfflineAccount(),null);
 delete globalThis.localStorage;
});
test('an acknowledged write with a lost response can rebase newer offline changes, without accepting another writer',()=>{
 const base=createDefaultSave(),sent={...base,walletCoins:20},local={...base,walletCoins:33};
 const pending={save:local,baseRevision:8,savedAt:1,attempt:{save:sent,revision:8,sourceId:'phone-A'}};
 assert.equal(chooseRecovery(sent,9,pending,'phone-A'),'pending');
 assert.equal(chooseRecovery(sent,9,pending,'phone-B'),'conflict');
 assert.equal(chooseRecovery({...sent,walletCoins:21},9,pending,'phone-A'),'conflict');
 assert.equal(chooseRecovery(sent,10,pending,'phone-A'),'conflict');
});
