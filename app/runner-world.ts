import { RUNNER_NEAR_DISTANCE, runnerRouteElevation } from "./runner-engine.ts";
export type RunnerCamera = { height: number; horizon: number; distance: number; elevation: number; flight?: number; seed?: number };
const round = (value: number) => Math.round(value * 2) / 2;

/** Horizontal bend only. Real street elevation is shared by every world vertex. */
export function projectRunnerPoint(camera: RunnerCamera, x: number, z: number, height = 0, floor?: number) {
  const perspective = 30 / (30 + Math.max(RUNNER_NEAR_DISTANCE, z));
  const flight = camera.flight ?? 0;
  const scale = perspective * 1.35 * (1 - flight * .15);
  const ground = floor ?? runnerRouteElevation(camera.distance + z, camera.seed);
  const far = Math.max(0, z), bend = (far / (far + 180)) ** 2;
  const curveX = Math.sin(camera.distance / 650 + far / 330) * 150 * bend;
  return { x: round(180 + (x + curveX) * scale), y: round(camera.horizon + camera.height * (.58 + flight * .055) * perspective - (ground + height - camera.elevation) * scale), scale };
}

/** Terrain in front of a sprite clips its lower portion, instead of shining through a ramp. */
export function runnerTerrainCrests(camera: RunnerCamera, distance = 600) {
  const samples: number[] = [];
  let crest = Infinity;
  for (let z = 6; z <= distance; z += 8) {
    crest = Math.min(crest, projectRunnerPoint(camera, 0, z).y);
    samples.push(crest);
  }
  return samples;
}
