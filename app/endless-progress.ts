export type EndlessPerk="none"|"power"|"flow";
export type EndlessExpedition={seed:number;floor:number;hp:number;perk:EndlessPerk};
export type EndlessProgress={bestFloor:number;floorsCleared:number;runs:number;expedition:EndlessExpedition|null};
const integer=(value:unknown,max=Number.MAX_SAFE_INTEGER-26)=>typeof value==="number"&&Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
export function defaultEndlessProgress():EndlessProgress {return {bestFloor:0,floorsCleared:0,runs:0,expedition:null};}
export function sanitizeEndlessProgress(value:unknown,unlocked:boolean):EndlessProgress {
 if(!value||typeof value!=="object"||!unlocked)return defaultEndlessProgress();
 const v=value as Partial<EndlessProgress>,run=v.expedition;
 return {bestFloor:integer(v.bestFloor),floorsCleared:integer(v.floorsCleared),runs:integer(v.runs),expedition:run&&integer(run.seed,0xffffffff)>0&&integer(run.floor)>0?{seed:integer(run.seed,0xffffffff),floor:integer(run.floor),hp:Math.max(1,integer(run.hp,3)),perk:run.perk==="power"||run.perk==="flow"?run.perk:"none"}:null};
}
