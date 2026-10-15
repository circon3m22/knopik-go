import test from "node:test";
import assert from "node:assert/strict";
import {forceLatestGame} from "../app/game-update-engine.ts";
const manifest={version:"new-version",assets:[{url:"/knopik-go/"}]};
test("manual update checks live manifest before removing only the game's offline cache",async()=>{
 const order=[],deleted=[],navigated=[];
 await forceLatestGame({
   basePath:"/knopik-go",
   now:()=>123,
   fetcher:async(url,options)=>{order.push(["fetch",url,options.cache]);return Response.json(manifest);},
   serviceWorker:{getRegistration:async()=>({unregister:async()=>{order.push(["unregister"]);return true;}})},
   cacheStorage:{keys:async()=>["knopik-go-pixel-v1","other-app-cache","knopik-go-pixel-v2"],delete:async n=>{deleted.push(n);return true;}},
   navigate:url=>navigated.push(url),
 });
 assert.deepEqual(order,[["fetch","/knopik-go/offline-pack.json?check=123","no-store"],["unregister"]]);
 assert.deepEqual(deleted,["knopik-go-pixel-v1","knopik-go-pixel-v2"]);
 assert.deepEqual(navigated,["/knopik-go/?knopik-update=123"]);
});
test("bad connection keeps caches, worker and save untouched",async()=>{
 let mutated=false;
 await assert.rejects(forceLatestGame({basePath:"/knopik-go",now:()=>1,fetcher:async()=>new Response("offline",{status:503}),serviceWorker:{getRegistration:async()=>{mutated=true;}},cacheStorage:{keys:async()=>{mutated=true;return []},delete:async()=>{mutated=true;}},navigate:()=>{mutated=true;}}));
 assert.equal(mutated,false);
});
