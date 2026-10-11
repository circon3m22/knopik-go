export const RUNNER_DAY_PHASES = ["ЗАКАТ", "НОЧЬ", "РАССВЕТ", "ДЕНЬ", "ГРОЗА", "ЛИВЕНЬ"] as const;
const durations = [40, 42, 26, 50, 22, 30];
const skies = ["#b57d91", "#202944", "#d8aca4", "#95c8cf", "#3b4b65", "#667e90"];
const clouds = ["#edb797", "#5b6584", "#ffe4b9", "#ecedcf", "#64738b", "#a2b2bb"];
const lights = [.92, .56, .86, 1, .64, .76];
const rain = [0, 0, 0, 0, .72, 1];
export function runnerMixColor(a: string, b: string, t: number) {
  const n = Math.max(0, Math.min(1, t));
  return "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - n) + parseInt(b.slice(i, i + 2), 16) * n).toString(16).padStart(2, "0")).join("");
}
/** Run clock, never wall clock: pause freezes weather and day transitions. */
export function runnerAtmosphere(elapsed: number, seed = 0) {
  let age = ((elapsed + 8 + seed % 17) % 210 + 210) % 210, phase = 0;
  while (age >= durations[phase]) { age -= durations[phase]; phase++; }
  const next = (phase + 1) % 6;
  const t = Math.max(0, (age - durations[phase] + 7) / 7);
  const blend = t * t * (3 - 2 * t);
  const illumination = lights[phase] * (1 - blend) + lights[next] * blend;
  const rainfall = rain[phase] * (1 - blend) + rain[next] * blend;
  const boltAge = phase === 4 ? age % 11.5 : 100;
  return { phase, sky: runnerMixColor(skies[phase], skies[next], blend), cloud: runnerMixColor(clouds[phase], clouds[next], blend), illumination, rain: rainfall, night: Math.max(0, (1 - illumination) / .44), lightning: boltAge > 3.1 && boltAge < 3.28 ? Math.sin((boltAge - 3.1) / .18 * Math.PI) * .16 : 0 };
}
export function runnerLitColor(color: string, illumination: number) { return runnerMixColor(color, "#26334b", Math.max(0, 1 - illumination) * .78); }
