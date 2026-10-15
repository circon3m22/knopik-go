import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
const source=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
async function worker({missing=false,badHash=false}={}){
 const resources=new Map([['/knopik-go/','home'],['/knopik-go/run/','run'],['/knopik-go/_next/static/chunks/unvisited.js','all-the-code'],['/knopik-go/audio/sahur.mp3','0123456789']]);
 const assets=[...resources].map(([url,data])=>({url,bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex')}));
 if(badHash)assets[2].sha256='0'.repeat(64);
 const pack={version:'test-pack',bytes:assets.reduce((n,a)=>n+a.bytes,0),assets};
 const stores=new Map([['knopik-go-pixel-old',new Map()]]),handlers={},messages=[];
 let offline=false,activated=false,claimed=false;
 const norm=k=>new URL(typeof k==='string'?k:k.url,'https://game.test').pathname;
 const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{if(!stores.has(key))stores.set(key,new Map());const map=stores.get(key);return {put:async(k,v)=>map.set(norm(k),v.clone()),match:async k=>map.get(norm(k))?.clone()};}};
 const self={location:{href:'https://game.test/knopik-go/sw.js',origin:'https://game.test'},clients:{matchAll:async()=>[{postMessage:m=>messages.push(m)}],claim:async()=>{claimed=true;}},skipWaiting:async()=>{activated=true;},addEventListener:(k,fn)=>{handlers[k]=fn;}};
 const fetch=async request=>{if(offline)throw new Error('network offline');const key=norm(request);if(key==='/knopik-go/offline-pack.json')return Response.json(pack);if(missing&&key.endsWith('unvisited.js'))return new Response('missing',{status:404});return new Response(resources.get(key)??'missing',{status:resources.has(key)?200:404,headers:{'Content-Type':key.endsWith('.mp3')?'audio/mpeg':'text/html'}});};
 vm.runInNewContext(source,{self,caches,fetch,URL,Response,Request,Blob,Uint8Array,crypto:webcrypto,AbortController,setTimeout,clearTimeout,console});
 const install=async()=>{let promise;handlers.install({waitUntil:p=>promise=p});return promise;};
 const activate=async()=>{let promise;handlers.activate({waitUntil:p=>promise=p});return promise;};
 const get=async(url,headers={},navigate=false)=>{let response;handlers.fetch({request:{url:'https://game.test'+url,method:'GET',mode:navigate?'navigate':'cors',headers:new Headers(headers)},respondWith:p=>response=p});return response?await response:null;};
 return {install,activate,get,stores,messages,setOnlineResource:(url,data)=>resources.set(url,data),setOffline:()=>{offline=true;},isActivated:()=>activated,isClaimed:()=>claimed};
}
test('a complete pack launches both pages and never-visited code offline; audio ranges work without network',async()=>{
 const w=await worker();await w.install();assert.ok(w.isActivated());await w.activate();assert.ok(w.isClaimed());assert.ok(!w.stores.has('knopik-go-pixel-old'));w.setOffline();
 assert.equal(await(await w.get('/knopik-go/?v=59',{},true)).text(),'home');assert.equal(await(await w.get('/knopik-go/run/',{},true)).text(),'run');
 assert.equal(await(await w.get('/knopik-go/_next/static/chunks/unvisited.js')).text(),'all-the-code');
 const range=await w.get('/knopik-go/audio/sahur.mp3',{range:'bytes=2-5'});assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),'bytes 2-5/10');assert.equal(await range.text(),'2345');
 const suffix=await w.get('/knopik-go/audio/sahur.mp3',{range:'bytes=-3'});assert.equal(await suffix.text(),'789');assert.equal((await w.get('/knopik-go/audio/sahur.mp3',{range:'bytes=11-12'})).status,416);
 assert.equal(w.messages.at(-1).state,'ready');
 assert.equal(await w.get('/unrelated-app/'),null);
});
for(const [name,option]of [['missing asset',{missing:true}],['changed build during download',{badHash:true}]])test(name+' keeps the last working game and does not claim offline readiness',async()=>{
 const w=await worker(option);await assert.rejects(w.install());assert.equal(w.isActivated(),false);assert.ok(w.stores.has('knopik-go-pixel-old'));assert.ok(!w.messages.some(m=>m.state==='ready'));
});

test("online navigation fetches new HTML instead of serving yesterday's cached root; offline falls back",async()=>{
 const w=await worker();await w.install();await w.activate();
 w.setOnlineResource("/knopik-go/","new-deployment-home");
 assert.equal(await(await w.get("/knopik-go/",{},true)).text(),"new-deployment-home");
 w.setOffline();
 assert.equal(await(await w.get("/knopik-go/",{},true)).text(),"home");
});
