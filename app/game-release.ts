import releases from "./game-releases.json" with {type:"json"};
export type GameRelease={version:string;title:string;date?:string;presentation?:string;changes:readonly string[]};
export const GAME_RELEASES:readonly GameRelease[]=releases;
export const GAME_VERSION=GAME_RELEASES[0].version;
export const GAME_RELEASE_TITLE=GAME_RELEASES[0].title;
export const GAME_RELEASE_STORAGE_KEY="knopik-go:last-announced-release:v1";
export type ReleaseKind="version"|"update"|"patch";
export function parseGameVersion(value:unknown):[number,number,number]|null{
 if(typeof value!=="string"||!/^\d+\.\d+\.\d+$/.test(value))return null;
 const parts=value.split(".").map(Number);return parts.every(Number.isSafeInteger)?parts as [number,number,number]:null;
}
export function compareGameVersions(a:string,b:string){
 const first=parseGameVersion(a),second=parseGameVersion(b);if(!first||!second)throw new Error("Неверный формат версии игры.");
 for(let i=0;i<3;i++)if(first[i]!==second[i])return first[i]>second[i]?1:-1;return 0;
}
export function nextGameVersion(current:string,kind:ReleaseKind){
 const parts=parseGameVersion(current);if(!parts)throw new Error("Неверный формат версии игры.");
 const index=({version:0,update:1,patch:2} as const)[kind];if(index===undefined||parts[index]===Number.MAX_SAFE_INTEGER)throw new Error("Неверный тип обновления.");
 parts[index]++;for(let i=index+1;i<3;i++)parts[i]=0;return parts.join(".");
}
/** The installed release, rather than a worker event or network response, owns this message. */
export function claimGameRelease(storage:Pick<Storage,"getItem"|"setItem">,version=GAME_VERSION){
 if(!parseGameVersion(version))return false;
 try{
  const previous=storage.getItem(GAME_RELEASE_STORAGE_KEY);
  if(parseGameVersion(previous)&&compareGameVersions(previous!,version)>=0)return false;
  storage.setItem(GAME_RELEASE_STORAGE_KEY,version);return true;
 }catch{return false;} // A blocked store must not produce the same notice on every launch.
}
