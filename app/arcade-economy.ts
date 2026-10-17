/** Profit is progressive across all arcade games and Ultra Tap. Stakes are
 * returned unchanged on a push; probabilities are never altered after input. */
export const ARCADE_PROFIT_HORIZON=50_000;
const safe=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(n))):0;
export function arcadeProfitFactor(wealth:number,lifetimeProfit:number){
 return Math.pow(Math.max(0,1-safe(lifetimeProfit)/ARCADE_PROFIT_HORIZON),3)/(1+Math.pow(safe(wealth)/10_000,3));
}
export function arcadeSettlement(requested:number,stake:number,wealth:number,lifetimeProfit:number){
 const gross=safe(requested),principal=Math.min(gross,safe(stake)),profit=Math.max(0,gross-principal);
 // Cap the base per attempt as well: a giant wager cannot bypass progression.
 const earned=Math.floor(Math.min(2_000,profit)*arcadeProfitFactor(wealth,lifetimeProfit));
 return {payout:Math.min(Number.MAX_SAFE_INTEGER,principal+earned),profit:earned};
}
