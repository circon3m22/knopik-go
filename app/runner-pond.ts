export type PondDeck = { lane: -1 | 0 | 1; z: number; depth: number; variant: number; height: number };
/** Adjacent landings, level decks and small real water gaps. Entry/exit have three wide landing pontoons. */
export function runnerPondPlan(start: number, random: () => number): PondDeck[] {
  const decks: PondDeck[] = [];
  for (const lane of [-1, 0, 1] as const) decks.push({lane,z:start+12,depth:32,variant:1,height:24});
  let lane: -1 | 0 | 1 = 0, end = start + 28, index = 0;
  while (end < start + 373) {
    const gap = 5 + random() * 5;
    const depth = 26 + random() * 8;
    const z = end + gap + depth/2;
    if (index%3===1) {
      const adjacent = ([-1,0,1] as const).filter(next=>Math.abs(next-lane)===1);
      lane = adjacent[Math.floor(random()*adjacent.length)];
    }
    const variant = Math.floor(random()*4);
    decks.push({lane,z,depth,variant,height:24});
    // Optional alternative landings make overshoots and sideways hops recoverable.
    if (index%3===0) for(const side of [-1,0,1] as const)if(side!==lane) decks.push({lane:side,z,depth,variant:(variant+1)%4,height:24});
    end = z+depth/2; index++;
  }
  for(const side of [-1,0,1] as const) decks.push({lane:side,z:start+404,depth:42,variant:1,height:24});
  return decks;
}
export function runnerPondFalling(water: boolean, support: number, height: number, flying: boolean) {
  return water && support < 0 && height < -8 && !flying;
}
