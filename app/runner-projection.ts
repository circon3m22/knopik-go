import { RUNNER_NEAR_DISTANCE, runnerRouteElevation } from "./runner-engine.ts";
import type { RunnerCamera } from "./runner-world.ts";

type Slice = { perspective: number; scale: number; curve: number; ground: number };
const round = (value: number) => Math.round(value * 2) / 2;

/** Exact projection, sharing depth calculations across every vertex of a face.
 * Reset before each paint: a camera move, flight or new seed cannot reuse an
 * earlier frame's terrain. No depth quantization or reduction in world detail.
 */
export class RunnerProjection {
  private slices = new Map<number, Slice>();
  private pool: Slice[] = [];
  private used = 0;
  private camera: RunnerCamera = { height: 680, horizon: 204, distance: 0, elevation: 0 };
  reset(camera: RunnerCamera) { this.camera = camera; this.slices.clear(); this.used = 0; }

  readonly project = (x: number, z: number, height = 0, floor?: number) => {
    const camera = this.camera, flight = camera.flight ?? 0;
    let slice = this.slices.get(z);
    if (!slice) {
      const perspective = 30 / (30 + Math.max(RUNNER_NEAR_DISTANCE, z));
      const far = Math.max(0, z), bend = (far / (far + 180)) ** 2;
      slice = this.pool[this.used];
      if (!slice) { slice = { perspective: 0, scale: 0, curve: 0, ground: 0 }; this.pool.push(slice); }
      this.used++;
      slice.perspective = perspective;
      slice.scale = perspective * 1.35 * (1 - flight * .15);
      slice.curve = Math.sin(camera.distance / 650 + far / 330) * 150 * bend;
      slice.ground = runnerRouteElevation(camera.distance + z, camera.seed);
      this.slices.set(z, slice);
    }
    const ground = floor ?? slice.ground;
    return {
      x: round(180 + (x + slice.curve) * slice.scale),
      y: round(camera.horizon + camera.height * (.58 + flight * .055) * slice.perspective - (ground + height - camera.elevation) * slice.scale),
      scale: slice.scale,
    };
  };

  terrainCrests(distance = 600, samples: number[] = []) {
    samples.length = 0;
    let crest = Infinity;
    for (let z = 6; z <= distance; z += 8) {
      crest = Math.min(crest, this.project(0, z).y);
      samples.push(crest);
    }
    return samples;
  }
}
