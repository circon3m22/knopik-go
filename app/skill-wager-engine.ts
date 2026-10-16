/** Optional risk/reward stakes in skill games. Only equipped Mohawk players may wager. */
export function resolveSkillWager(balance:number,requested:number,canChooseBet:boolean):number{
 if(!canChooseBet)return 0;
 const safeBalance=Number.isSafeInteger(balance)&&balance>0?balance:0;
 if(!Number.isSafeInteger(requested)||requested<0)return 0;
 return Math.min(safeBalance,requested);
}
/** A perfect performance doubles the stake; 50% returns the stake and a miss loses it. */
export function skillWagerPayout(stake:number,score:number,maxScore:number):number{
 if(!Number.isSafeInteger(stake)||stake<=0||!Number.isFinite(score)||!Number.isFinite(maxScore)||maxScore<=0)return 0;
 const fraction=Math.min(1,Math.max(0,score/maxScore));
 return Math.min(Number.MAX_SAFE_INTEGER,Math.floor(stake*fraction*2));
}
