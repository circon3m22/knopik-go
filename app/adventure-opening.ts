export const OPENING_DURATION = 13.2;
export const OPENING_CUTS = [0, 3.2, 7.6, 10.4, OPENING_DURATION] as const;
export const OPENING_CAPTIONS = [
  "Липовый квартал. Обычный вечер…",
  "Кнопика будит странный шум под домом.",
  "В подвале погас свет. Из пролома слышно: «тун-тун».",
  "Старые механизмы снова работают. Нужно добраться до насосной.",
] as const;
export const OPENING_CUES = [
  { at: 1.8, sound: "knock" }, { at: 4.1, sound: "knock" },
  { at: 5.0, sound: "door" }, { at: 8.1, sound: "door" },
  { at: 10.8, sound: "blast" },
] as const;
export function openingFrame(time: number) {
  const t = Math.max(0, Math.min(OPENING_DURATION, Number.isFinite(time) ? time : 0));
  const shot = Math.min(3, OPENING_CUTS.slice(1).filter(cut => t >= cut).length);
  const local = t - OPENING_CUTS[shot], duration = OPENING_CUTS[shot + 1] - OPENING_CUTS[shot];
  const fade = Math.max(0, 1 - local / .28, 1 - (duration - local) / .28);
  return { shot, local, progress: local / duration, fade: Math.min(1, fade) };
}
