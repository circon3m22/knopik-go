export const OPENING_DURATION = 23;
export const OPENING_CUTS = [0, 4, 12, 18.5, OPENING_DURATION] as const;
export const OPENING_CAPTIONS = [
  "Липовый квартал. Поздний вечер…",
  "Из подвала доносится стук. Кнопик идёт проверить.",
  "За стеллажами — пролом в стене. Оттуда и слышен шум.",
  "За стеной тянется старый тоннель. Кнопик входит внутрь…",
] as const;
export const OPENING_CUES = [
  { at: 3.0, sound: "knock" }, { at: 4.8, sound: "knock" },
  { at: 8.4, sound: "door" }, { at: 11.4, sound: "door" },
  { at: 15.0, sound: "knock" },
] as const;
export function openingFrame(time: number) {
  const t = Math.max(0, Math.min(OPENING_DURATION, Number.isFinite(time) ? time : 0));
  const shot = Math.min(3, OPENING_CUTS.slice(1).filter(cut => t >= cut).length);
  const local = t - OPENING_CUTS[shot], duration = OPENING_CUTS[shot + 1] - OPENING_CUTS[shot];
  const fadeOut=shot===3?1.25:.4;
  const fade = Math.max(0, 1 - local / .65, 1 - (duration - local) / fadeOut);
  return { shot, local, progress: local / duration, fade: Math.min(1, fade) };
}
