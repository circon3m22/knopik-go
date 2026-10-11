export const RUNNER_DISTRICT_LENGTH = 420;
export const RUNNER_ZONES = ["ГОРОДСКАЯ УЛИЦА", "ПЕШЕХОДНЫЙ БАЗАР", "ПОРТОВЫЕ ДОКИ", "НЕОНОВЫЙ КВАРТАЛ", "МОРСКОЙ МОСТ", "СВЕТОВОЙ ТОННЕЛЬ", "КИТАЙСКИЙ РЫНОК", "ЗЕЛЁНЫЙ ПАРК", "ВИШНЁВЫЙ ПРУД", "ДЕЛОВОЙ ЦЕНТР"];
export const RUNNER_WORLD_CYCLE = RUNNER_DISTRICT_LENGTH * RUNNER_ZONES.length;
const routeCache = new Map<string, readonly number[]>();
/** Seed zero is the canonical route for isolated geometry checks. Real runs use a random nonzero seed. */
export function runnerDistrictRoute(seed: number, cycle = 0): readonly number[] {
  if (!seed) return RUNNER_ZONES.map((_, i) => i);
  const key = `${seed}:${cycle}`;
  const cached = routeCache.get(key); if (cached) return cached;
  let state = (seed ^ Math.imul(cycle + 1, 0x9e3779b9)) >>> 0;
  const random = () => { state += 0x6d2b79f5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  const route = RUNNER_ZONES.slice(1).map((_, i) => i + 1);
  for (let i = route.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [route[i], route[j]] = [route[j], route[i]]; }
  const result = Object.freeze([0, ...route]);
  if (routeCache.size >= 64) routeCache.delete(routeCache.keys().next().value!);
  routeCache.set(key, result); return result;
}
export function runnerDistrictIndex(distance: number, seed = 0) {
  const segment = Math.floor(Math.max(0, distance) / RUNNER_DISTRICT_LENGTH);
  return runnerDistrictRoute(seed, Math.floor(segment / RUNNER_ZONES.length))[segment % RUNNER_ZONES.length];
}
export function runnerPondWater(distance: number, seed = 0) {
  const position = Math.max(0, distance) % RUNNER_DISTRICT_LENGTH;
  return runnerDistrictIndex(distance, seed) === 8 && position > 20 && position < 400;
}
export function runnerWeatherExposure(district: number) { return district === 5 ? 0 : 1; }
export function runnerDistrictLight(district: number, illumination: number) { return district === 5 ? .8 + illumination * .2 : illumination; }
