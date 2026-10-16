import test from 'node:test';
import assert from 'node:assert/strict';
import {CoopSession} from '../app/coop-session.ts';
import {COOP_PROTOCOL} from '../app/coop-protocol.ts';
const host='14b063d8-1790-451b-a354-1f7dcaa41f13',guest='f53a06e6-f782-4969-935a-124a0ea9abe5';
function browser(){
 const previous={document:globalThis.document,sessionStorage:globalThis.sessionStorage};
 const document=new EventTarget();document.hidden=false;globalThis.document=document;
 const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 return()=>{globalThis.document=previous.document;globalThis.sessionStorage=previous.sessionStorage;};
}
function room(){return {mode:'campaign',level_id:1,host_protocol:COOP_PROTOCOL,guest_protocol:COOP_PROTOCOL,host_equipment:{hat:false,mohawk:false,accessory:null},guest_equipment:{hat:false,mohawk:false,accessory:null},id:'01234567-0123-4123-8123-0123456789ab',code:'ABC234',host_id:host,guest_id:guest,host_name:'Foma',guest_name:'Proclick',host_ready:false,guest_ready:false,status:'waiting',seed:123,round:0,expires_at:'2099-01-01T00:00:00Z'};}
function network(){
 const channels=[],removed=[],calls=[];let r=room();
 const client={auth:{getSession:async()=>({data:{session:{user:{id:host},access_token:'test-only-session'}}})},realtime:{setAuth:async()=>{}},
  rpc:async(name,args)=>{calls.push({name,...args});if(name==='knopik_go_coop_setup')r={...r,mode:args.p_mode??r.mode,level_id:args.p_level??r.level_id,host_equipment:args.p_equipment,host_ready:false,guest_ready:false};if(args.p_action==='ready')r={...r,host_ready:!r.host_ready};if(args.p_action==='start')r={...r,status:'playing',round:1};if(args.p_action==='leave')r={...r,status:'closed'};return {data:{...r},error:null};},
  channel:(topic,options)=>{const c={topic,options,sent:[],on(_type,_filter,fn){this.receive=fn;return this;},subscribe(fn){this.status=fn;return this;},async track(payload){this.presence=payload;},async send(payload){this.sent.push(payload);return 'ok';}};channels.push(c);return c;},removeChannel:async c=>{removed.push(c);}};
 return {client,channels,removed,calls,getRoom:()=>r,setRoom:value=>{r=value;}};
}
test('private role-separated channels reject local echoes and clean up on exit',async()=>{
 const restore=browser(),n=network(),s=new CoopSession(n.client,host);let messages=0;
 try{
  s.onPacket(()=>messages++);await s.enter('create');assert.equal(n.channels.length,2);assert.ok(n.channels.every(c=>c.options.config.private));
  assert.ok(n.channels[0].topic.endsWith(':host'));assert.ok(n.channels[1].topic.endsWith(':guest'));
  n.channels.forEach(c=>c.status('SUBSCRIBED'));assert.equal(s.snapshot().connected,true);
  const payload={v:COOP_PROTOCOL,type:'hello',round:0,visible:true};n.channels[0].receive({payload});assert.equal(messages,0);
  n.channels[1].receive({payload});assert.equal(messages,1);assert.equal(s.snapshot().peerOnline,true);
  s.send({type:'state',world:{}});assert.equal(n.channels[1].sent.length,0);assert.equal(n.channels[0].sent.at(-1).payload.type,'state');
  n.channels[1].status('CHANNEL_ERROR');assert.equal(s.snapshot().connected,false);
  n.channels[1].status('SUBSCRIBED');assert.equal(s.snapshot().connected,true);
  await s.leave();assert.equal(n.removed.length,2);assert.ok(n.calls.some(c=>c.p_action==='leave'));assert.equal(s.snapshot().room.status,'closed');
 }finally{s.dispose();restore();}
});
test('room actions are serialized so delayed heartbeat responses cannot roll back ready/start',async()=>{
 const restore=browser(),n=network(),s=new CoopSession(n.client,host);
 try{await s.enter('create');await s.act('ready');assert.equal(s.snapshot().room.host_ready,true);await s.act('start');assert.equal(s.snapshot().room.status,'playing');assert.equal(s.snapshot().room.round,1);assert.deepEqual(n.calls.map(c=>c.p_action),['create','ready','start']);}
 finally{s.dispose();restore();}
});
test('an expired login does not open channels or call the room RPC',async()=>{
 const restore=browser(),n=network();n.client.auth.getSession=async()=>({data:{session:null}});const s=new CoopSession(n.client,host);
 try{await s.enter('create');assert.match(s.snapshot().error,/вход/);assert.equal(n.channels.length,0);assert.equal(n.calls.length,0);assert.equal(s.snapshot().busy,false);}
 finally{s.dispose();restore();}
});
test('closing while admission is in flight cannot attach orphan channels or notify unmounted UI',async()=>{
 const restore=browser(),n=network();let finish;const original=n.client.rpc;n.client.rpc=(...args)=>new Promise(resolve=>{finish=async()=>resolve(await original(...args));});const s=new CoopSession(n.client,host);
 try{const entering=s.enter('create');for(let i=0;i<6;i++)await Promise.resolve();assert.equal(typeof finish,'function');s.dispose();await finish();await entering;assert.equal(n.channels.length,0);}
 finally{s.dispose();restore();}
});

test('late callbacks from a replaced connection cannot disconnect the new room channels',async()=>{
 const restore=browser(),n=network(),s=new CoopSession(n.client,host);
 try{
  await s.enter('create');n.channels.forEach(c=>c.status('SUBSCRIBED'));const old=n.channels.slice();
  await s.enter('join','ABC234');n.channels.slice(2).forEach(c=>c.status('SUBSCRIBED'));assert.equal(s.snapshot().connected,true);
  old.forEach(c=>c.status('CLOSED'));assert.equal(s.snapshot().connected,true);
  old[1].receive({payload:{v:COOP_PROTOCOL,type:'hello',round:0,visible:true}});assert.equal(s.snapshot().peerOnline,false);
 }finally{s.dispose();restore();}
});

test('a revoked device session stops publishing instead of competing with a reconnected host',async()=>{
 const restore=browser(),n=network(),s=new CoopSession(n.client,host);
 try{
  await s.enter('create');n.channels.forEach(c=>c.status('SUBSCRIBED'));
  n.client.rpc=async()=>({data:null,error:{code:'42501',message:'Комната открыта в другой вкладке. Подключись заново.'}});
  await s.act('ready');assert.equal(s.snapshot().connected,false);assert.equal(n.removed.length,2);
  const sent=n.channels.reduce((sum,c)=>sum+c.sent.length,0);s.send({type:'state',world:{}});assert.equal(n.channels.reduce((sum,c)=>sum+c.sent.length,0),sent);
 }finally{s.dispose();restore();}
});

test('route and outfit configuration shares the command queue and resets readiness before start',async()=>{
 const restore=browser(),n=network(),s=new CoopSession(n.client,host);
 try{
  await s.enter('create');await s.act('ready');
  await s.configure({hat:true,mohawk:false,accessory:'bandana'},'campaign',25);
  assert.equal(s.snapshot().room.level_id,25);assert.equal(s.snapshot().room.host_ready,false);assert.equal(s.snapshot().room.host_equipment.accessory,'bandana');
  const call=n.calls.at(-1);assert.equal(call.name,'knopik_go_coop_setup');assert.equal(call.p_mode,'campaign');assert.equal(call.p_level,25);assert.ok(call.p_token);
  await s.configure({hat:false,mohawk:true,accessory:'cape'});
  assert.equal(s.snapshot().room.level_id,25,'outfit sync preserves the host route');assert.equal(n.calls.at(-1).p_mode,null);
 }finally{s.dispose();restore();}
});


test('both clients enter the next round directly, keeping their clothes and recovering a lost transition broadcast',async()=>{
 const restore=browser(),n=network();
 n.setRoom({...room(),status:'playing',round:7,host_ready:true,guest_ready:true,host_equipment:{skin:'shiba-white',hat:true,mohawk:false,accessory:'bandana'},guest_equipment:{skin:'shiba-black',hat:false,mohawk:true,accessory:'cape'}});
 const original=n.client.rpc;n.client.rpc=async(name,args)=>{
  if(name!=='knopik_go_coop_advance')return original(name,args);
  n.calls.push({name,...args});const r=n.getRoom();if(r.round===args.p_round)n.setRoom({...r,round:r.round+1,level_id:r.level_id+1,seed:r.seed+1});return {data:n.getRoom(),error:null};
 };
 const guestClient={...n.client,auth:{getSession:async()=>({data:{session:{user:{id:guest},access_token:'guest-test'}}})}};
 const h=new CoopSession(n.client,host),g=new CoopSession(guestClient,guest);
 try{
  await h.enter('join','ABC234');await g.enter('join','ABC234');n.channels.forEach(c=>c.status('SUBSCRIBED'));
  const before=structuredClone(h.snapshot().room);assert.equal(await g.advance(7),false);
  const advancing=h.advance(7);assert.equal(await h.advance(7),false,'no parallel request');assert.equal(await advancing,true);
  assert.equal(h.snapshot().room.status,'playing');assert.equal(h.snapshot().room.round,8);assert.equal(h.snapshot().room.level_id,2);
  assert.deepEqual(h.snapshot().room.host_equipment,before.host_equipment);assert.deepEqual(h.snapshot().room.guest_equipment,before.guest_equipment);
  assert.equal(await h.advance(7),false,'stale round cannot skip level');
  // Deliberately lose room-updated: new-round world packets trigger an RPC refresh.
  n.channels[2].receive({payload:{v:COOP_PROTOCOL,type:'state',round:8,world:{}}});
  for(let i=0;i<15;i++)await Promise.resolve();
  assert.equal(g.snapshot().room.round,8);assert.deepEqual(g.snapshot().room,h.snapshot().room);
  assert.equal(n.calls.filter(c=>c.name==='knopik_go_coop_advance').length,1);
  assert.ok(!n.calls.some(c=>['lobby','ready','start'].includes(c.p_action)));
 }finally{h.dispose();g.dispose();restore();}
});

test('an unconfirmed server transition can be retried using the original round',async()=>{
 const restore=browser(),n=network();n.setRoom({...room(),status:'playing',round:2});
 let lost=true;const original=n.client.rpc;n.client.rpc=async(name,args)=>{
  if(name!=='knopik_go_coop_advance')return original(name,args);
  if(n.getRoom().round===args.p_round)n.setRoom({...n.getRoom(),round:3,level_id:2});
  if(lost){lost=false;return {data:null,error:{message:'network response lost'}};}return {data:n.getRoom(),error:null};
 };
 const s=new CoopSession(n.client,host);try{await s.enter('join','ABC234');assert.equal(await s.advance(2),false);assert.equal(s.snapshot().room.round,2);assert.equal(await s.advance(2),true);assert.equal(s.snapshot().room.round,3);assert.equal(s.snapshot().room.level_id,2);}finally{s.dispose();restore();}
});
