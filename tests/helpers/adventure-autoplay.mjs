import { AdventureEngine, ADVENTURE_STEP } from '../../app/adventure-engine.ts';

// Uses only the public controls: no grants, invulnerability, enemy deletion or teleports.
export function playFirstChapter() {
  const checkpoints = [], sounds = {};
  const e = new AdventureEngine(0, { change() {}, checkpoint: n => checkpoints.push(n), sound: n => sounds[n] = (sounds[n] ?? 0) + 1, run() {}, bar() {} });
  let frames = 0, path = [], pathFrames = 0, bestHp = 3;
  function advance() { e.advance(ADVENTURE_STEP); frames++; bestHp = Math.min(bestHp, e.player.hp); if (e.phase === 'dead') throw new Error(`Autoplay died in ${e.area}, room ${e.room + 1}, at ${e.player.x}, ${e.player.y}`); }
  function dialogue() { while (e.phase === 'dialogue') e.nextDialogue(); }
  function plan(goal, radius = 28) {
    const w = 30, h = e.area === 'sewer' ? 89 : 38;
    const xy = id => ({ x: 8 + id % w * 16, y: 8 + Math.floor(id / w) * 16 });
    const valid = id => id >= 0 && id < w * h && e.canStand(xy(id).x, xy(id).y);
    let start = -1, min = Infinity;
    for (let i = 0; i < w * h; i++) { const p = xy(i), d = Math.hypot(p.x - e.player.x, p.y - e.player.y); if (d < min && valid(i)) { min = d; start = i; } }
    const parents = new Int32Array(w * h).fill(-2), queue = [start]; parents[start] = -1;
    let found = -1;
    for (let q = 0; q < queue.length; q++) {
      const id = queue[q], p = xy(id);
      if (Math.hypot(p.x - goal.x, p.y - goal.y) < radius) { found = id; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const x = id % w + dx, y = Math.floor(id / w) + dy, next = y * w + x;
        if (x < 0 || x >= w || y < 0 || y >= h || parents[next] !== -2 || !valid(next)) continue;
        if (!e.canStand(p.x + dx * 8, p.y + dy * 8)) continue;
        parents[next] = id; queue.push(next);
      }
    }
    if (found < 0) throw new Error(`No route in ${e.area} to ${JSON.stringify(goal)}`);
    const result = []; for (let id = found; id >= 0; id = parents[id]) result.unshift(xy(id));
    return result;
  }
  function steer(goal, attack = false, radius = 28) {
    if (!path.length || pathFrames-- <= 0) { path = plan(goal, radius); pathFrames = 10; }
    while (path.length && Math.hypot(path[0].x - e.player.x, path[0].y - e.player.y) < 5) path.shift();
    const p = path[0] ?? goal, dx = p.x - e.player.x, dy = p.y - e.player.y, d = Math.hypot(dx, dy);
    e.setInput(d > 2 ? dx / d : 0, d > 2 ? dy / d : 0, attack);
  }
  function navigate(goal, radius = 42) {
    path = []; const limit = frames + 3000;
    while (Math.hypot(goal.x - e.player.x, goal.y - e.player.y) > radius && frames < limit) { steer(goal, false, 15); advance(); }
    if (frames >= limit) throw new Error('Navigation timed out'); e.setInput(0, 0, false);
  }
  function fight(limit = 9000) {
    path = []; let counter = 0;
    while (e.phase === 'playing' && e.enemies.some(enemy => enemy.room === e.room && enemy.hp > 0) && counter++ < limit) {
      const live = e.enemies.filter(enemy => enemy.room === e.room && enemy.hp > 0).sort((a, b) => Math.hypot(a.x - e.player.x, a.y - e.player.y) - Math.hypot(b.x - e.player.x, b.y - e.player.y));
      const goal = live[0], d = Math.hypot(goal.x - e.player.x, goal.y - e.player.y);
      if (d < 43) e.setInput(0, 0, true); else steer(goal, true, 25);
      const danger = live.find(enemy => enemy.mode === 'windup' && enemy.timer < .16 && Math.hypot(enemy.x - e.player.x, enemy.y - e.player.y) < 85);
      const bullet = e.bullets.find(b => b.active && Math.hypot(b.x - e.player.x, b.y - e.player.y) < 50);
      if ((danger || bullet) && e.dodgeCooldown <= 0) {
        const angle = danger ? danger.attackAngle : Math.atan2(bullet.vy, bullet.vx);
        e.setInput(Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2), true); e.dodge(); path = [];
      }
      advance();
    }
    if (counter >= limit) throw new Error(`Combat stalled in ${e.area}, room ${e.room + 1}`);
  }
  e.begin(); dialogue(); navigate({ x: 371, y: 128 }); e.interact(); dialogue();
  e.setInput(-1, 0, false); e.dodge(); for (let i = 0; i < 15; i++) advance();
  fight(); dialogue(); navigate({ x: 371, y: 128 }); e.interact(); dialogue();
  navigate({ x: 240, y: 118 }); e.interact(); dialogue();
  for (let room = 0; room < 3; room++) { fight(); if (room < 2) navigate({ x: 240, y: room === 0 ? 820 : 380 }, 18); }
  e.setInput(0, 0, false); for (let i = 0; i < 90 && e.phase === 'playing'; i++) advance();
  if (e.phase !== 'won') throw new Error(`Expected victory, got ${e.phase}`);
  const summary = { checkpoints, frames, seconds: frames / 60, heartsAtVictory: e.player.hp, minimumHearts: bestHp, enemiesDefeated: e.enemies.filter(enemy => enemy.hp === 0).length, sounds };
  e.returnHome(); dialogue(); return { ...summary, returnArea: e.area, phase: e.phase };
}
if (process.argv[1]?.endsWith('adventure-autoplay.mjs')) console.log(JSON.stringify(playFirstChapter(), null, 2));
