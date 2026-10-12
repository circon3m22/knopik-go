type Surface = { kind: string; x: number; z: number; depth: number; height: number };
export function runnerSupportHeight(object: Surface, distance: number, lane: number) {
  if (object.kind!=='platform' && object.kind!=='car' && object.kind!=='hedge' && object.kind!=='floating' || Math.abs(object.z - distance - 6) >= object.depth / 2 || Math.abs(object.x / 94 - lane) >= .46) return -1;
  return object.height;
}
export function runnerJumpObstacle(kind: string) { return kind === 'barrier' || kind === 'fence' || kind === 'mower' || kind === 'thorn'; }
