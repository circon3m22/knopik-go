const CACHE_PREFIX = "knopik-go-pixel-";
const CACHE_NAME = `${CACHE_PREFIX}__KNOPIK_OFFLINE_PACK_VERSION__`;
const BASE_PATH = new URL("./", self.location.href).pathname.replace(/\/$/, "");
const asset = path => `${BASE_PATH}${path}`;
const READY_KEY = asset("/offline-ready");
let status = {type:"KNOPIK_OFFLINE",state:"checking",completed:0,total:0,bytes:0,totalBytes:0};
async function report(update) {
  status = {...status,...update};
  const clients = await self.clients.matchAll({type:"window",includeUncontrolled:true});
  clients.forEach(client=>client.postMessage(status));
}
async function installPack() {
  const response = await fetch(asset("/offline-pack.json"),{cache:"no-store"});
  if(!response.ok)throw new Error("Offline manifest unavailable");
  const pack = await response.json();
  if(!Array.isArray(pack.assets)||!pack.assets.length||!pack.version)throw new Error("Invalid offline manifest");
  const cache = await caches.open(CACHE_NAME);
  await report({state:"downloading",completed:0,total:pack.assets.length,bytes:0,totalBytes:pack.bytes});
  let cursor=0,completed=0,bytes=0;
  const worker=async()=>{
    while(cursor<pack.assets.length){
      const entry=pack.assets[cursor++],url=new URL(entry.url,self.location.origin);
      if(url.origin!==self.location.origin||!(url.pathname===asset("/")||url.pathname.startsWith(asset("/"))))throw new Error("Invalid pack asset");
      const downloaded=await fetch(url.href,{cache:"reload"});
      if(!downloaded.ok)throw new Error("Incomplete offline download");
      const body=await downloaded.clone().arrayBuffer();
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",body)),v=>v.toString(16).padStart(2,"0")).join("");
      if(digest!==entry.sha256)throw new Error("Offline download version changed");
      await cache.put(url.pathname,downloaded);
      completed++;bytes+=entry.bytes;
      await report({completed,bytes});
    }
  };
  await Promise.all(Array.from({length:3},worker));
  const ready={...status,state:"ready",version:pack.version};
  await cache.put(READY_KEY,new Response(JSON.stringify(ready),{headers:{"Content-Type":"application/json"}}));
  await report(ready);
  await self.skipWaiting();
}
self.addEventListener("install",event=>event.waitUntil(installPack().catch(async error=>{
  await report({state:"error"});
  throw error; // The last complete version stays active until the entire pack is ready.
})));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener("message",event=>{
  if(event.data?.type!=="KNOPIK_OFFLINE_STATUS")return;
  event.waitUntil((async()=>{
    const saved=await(await caches.open(CACHE_NAME)).match(READY_KEY);
    event.source?.postMessage(saved?await saved.json():status);
  })());
});
async function cachedRange(request,cached) {
  const blob=await cached.blob(),size=blob.size;
  const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range")??"");
  let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):size-1;
  if(match&&!match[1]&&match[2]){start=Math.max(0,size-end);end=size-1;}
  end=Math.min(end,size-1);
  if(!match||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return new Response(null,{status:416,headers:{"Content-Range":`bytes */${size}`}});
  return new Response(blob.slice(start,end+1),{status:206,headers:{"Content-Type":cached.headers.get("Content-Type")??"application/octet-stream","Content-Range":`bytes ${start}-${end}/${size}`,"Content-Length":String(end-start+1),"Accept-Ranges":"bytes"}});
}
async function navigation(request,cache,path) {
  const cached=await cache.match(path)??await cache.match(asset("/"));
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4000);
  try {
    // Use the latest HTML whenever online. Next.js assets are content-addressed,
    // so an updated document can load matching chunks even with an old worker.
    const response=await fetch(request,{signal:controller.signal,cache:"no-store"});
    if(response.ok)return response;
    if(cached)return cached;
    return response;
  }catch(error){if(cached)return cached;throw error;}
  finally{clearTimeout(timeout);}
}
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin||!url.pathname.startsWith(asset("/"))||url.pathname.startsWith(asset("/api/")))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME),cached=await cache.match(url.pathname);
    if(request.mode==="navigate")return navigation(request,cache,url.pathname);
    if(cached)return request.headers.has("range")?cachedRange(request,cached):cached;
    return fetch(request); // Authentication and Supabase never enter the app cache.
  })());
});
