export const RUNNER_MAGNET_SECONDS = 30;
export const RUNNER_FIREWORK_SECONDS = 7;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };

/** Flight time advances with the gameplay clock, so pausing freezes both boosts. */
export function runnerFlightHeight(age: number, launchHeight = 0, landingHeight = 0) {
  const cruise = 210;
  if (age < 0) return launchHeight;
  if (age < .75) return launchHeight + (cruise - launchHeight) * smooth(age / .75);
  if (age < 5.6) return cruise + Math.sin((age - .75) * 3) * 4 * smooth((age - .75) / .4) * (1 - smooth((age - 5.1) / .5));
  return cruise + (landingHeight - cruise) * smooth((age - 5.6) / 1.4);
}

type ChaserObstacle = { kind: string; x: number; z: number; height: number; depth: number };
/** Ground pursuit during flight: dodge tall objects, jump low ones, duck arches. */
export function runnerGroundChaser(objects: readonly ChaserObstacle[], distance: number, speed: number, lane: number) {
  const lookahead = Math.max(18, speed * .8);
  const near = objects.filter(o => o.z - distance > -Math.max(5, o.depth / 2) && o.z - distance < lookahead && Math.abs(o.x) < 150);
  const tall = (kind: string) => ["cargo", "truck", "sahur", "car", "platform", "hedge"].includes(kind);
  const current = Math.round(clamp(lane, -1, 1));
  let target = current;
  if (near.some(o => tall(o.kind) && Math.abs(o.x / 94 - current) < .4)) {
    const choices = [-1, 0, 1].map(candidate => ({ lane: candidate, cost: Math.abs(candidate - current) * 2 + near.filter(o => tall(o.kind) && Math.abs(o.x / 94 - candidate) < .4).length * 10 }));
    target = choices.sort((a, b) => a.cost - b.cost)[0].lane;
  }
  let height = 0, rollAge = -1;
  const decks=near.filter(o=>o.kind==="floating");
  if (decks.length) {
    const beneath=decks.find(o=>Math.abs(o.x/94-target)<.46&&Math.abs(o.z-distance)<o.depth/2);
    if (beneath) height=beneath.height;
    else {
      const next=decks.filter(o=>o.z>distance).sort((a,b)=>Math.abs(a.x/94-target)-Math.abs(b.x/94-target)||a.z-b.z)[0];
      if(next) { target=next.x/94; const time=(next.z-distance)/Math.max(1,speed);height=next.height+Math.max(0,100*Math.sin(Math.PI*Math.min(1,time/.8))); }
    }
  }
  for (const o of near) {
    if (Math.abs(o.x / 94 - target) > .4) continue;
    const time = (o.z - distance) / Math.max(1, speed);
    if (["fence", "barrier", "gap", "mower", "thorn"].includes(o.kind) && time < .6 && time > -.28) height = Math.max(height, 112 * Math.sin((.6 - time) / .88 * Math.PI));
    if (o.kind === "arch" && time < .28 && time > -.28) rollAge = .28 - time;
  }
  return { lane: target, height, rollAge };
}
