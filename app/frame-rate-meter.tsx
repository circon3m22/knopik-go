"use client";
import { useEffect, useRef } from "react";
import { subscribeFrameRate } from "./frame-rate";

export function FrameRateMeter() {
  const ref = useRef<HTMLOutputElement>(null);
  useEffect(() => subscribeFrameRate(sample => {
    if (!ref.current) return;
    ref.current.textContent = `${sample.fps} FPS`;
    ref.current.title = sample.runner ? `Отрисованные кадры · JS ${sample.meanMs.toFixed(1)} мс · максимальный интервал ${Math.round(sample.maxGapMs)} мс` : "Частота кадров интерфейса";
  }), []);
  return <output ref={ref} className="game-frame-rate" aria-label="Частота кадров" aria-live="off">— FPS</output>;
}
