/** Force a clean network load when an older service worker keeps serving stale HTML.
 * Never touch localStorage, IndexedDB, account sessions or the user save. */
export const GAME_OFFLINE_CACHE_PREFIX="knopik-go-pixel-";

type GameUpdateDependencies={
 basePath:string;
 fetcher:typeof fetch;
 serviceWorker?:Pick<ServiceWorkerContainer,"getRegistration">;
 cacheStorage?:Pick<CacheStorage,"keys"|"delete">;
 navigate:(url:string)=>void;
 now:()=>number;
};
export async function forceLatestGame({basePath,fetcher,serviceWorker,cacheStorage,navigate,now}:GameUpdateDependencies):Promise<void>{
 // The manifest is never stored in the offline pack. Request it directly, with a
 // unique URL, to establish a working connection BEFORE changing offline caches.
 const response=await fetcher(`${basePath}/offline-pack.json?check=${now()}`,{cache:"no-store"});
 if(!response.ok)throw new Error("Не удалось связаться с сервером игры.");
 const manifest:unknown=await response.json();
 if(!manifest||typeof manifest!=="object"||typeof (manifest as {version?:unknown}).version!=="string"
    ||!Array.isArray((manifest as {assets?:unknown}).assets)
    ||!(manifest as {assets:unknown[]}).assets.length)throw new Error("Версия на сервере ещё не готова.");
 // Unregister, then clear ONLY the game asset caches. This also defeats the
 // currently controlling (old) cache-first worker on the next navigation.
 const registration=await serviceWorker?.getRegistration(`${basePath}/`);
 if(registration){const removed=await registration.unregister();if(!removed)throw new Error("Не удалось отключить старую офлайн-версию.");}
 if(cacheStorage){const names=await cacheStorage.keys();await Promise.all(names.filter(n=>n.startsWith(GAME_OFFLINE_CACHE_PREFIX)).map(n=>cacheStorage.delete(n)));}
 // Newly loaded app registers and downloads its current worker automatically.
 navigate(`${basePath}/?knopik-update=${now()}`);
}
