"use client";
import { useEffect, useId, useRef, type RefObject } from "react";
import type { AdventureEngine } from "./adventure-engine";
import { AdventureScene } from "./adventure-artwork";
import { NeighborhoodScene } from "./neighborhood-artwork";
import { AdventureOpeningRenderer } from "./adventure-opening-renderer";
import type { ThemeId } from "./cosmetic-engine";

export function AdventureOpeningCinema({ clock, theme, onSkip }: { clock: RefObject<AdventureEngine | null>; theme: ThemeId; onSkip: () => void }) {
  const prefix = `opening-${useId().replaceAll(":", "")}`;
  const city = useRef<SVGSVGElement>(null), home = useRef<SVGSVGElement>(null), stairs = useRef<SVGSVGElement>(null), tunnel = useRef<SVGSVGElement>(null);
  const root = useRef<HTMLDivElement>(null), blackout = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !city.current || !home.current || !stairs.current || !tunnel.current) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer = new AdventureOpeningRenderer([city.current, home.current, stairs.current, tunnel.current], motion.matches);
    const resize = () => { const rect = root.current!.getBoundingClientRect(); renderer.resize(rect.width, rect.height); };
    const change = () => { renderer = new AdventureOpeningRenderer([city.current!, home.current!, stairs.current!, tunnel.current!], motion.matches); resize(); };
    const observer = new ResizeObserver(resize); observer.observe(root.current); motion.addEventListener("change", change); resize();
    let frame = 0;
    const tick = () => { if (!document.hidden) { const shot = renderer.paint(clock.current?.openingTime ?? 0); if (blackout.current) blackout.current.style.opacity = String(shot.fade); } frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", change); };
  }, [clock, theme]);
  return <div ref={root} className="opening-cinema" role="img" aria-label="Кинематографичное вступление: ночной дом, Кнопик, авария в подвале и спуск в тоннели">
    <NeighborhoodScene ref={city} prefix={prefix} night/>
    <AdventureScene ref={home} area="apartment" theme={theme}/>
    <AdventureScene ref={stairs} area="basement" theme={theme}/>
    <AdventureScene ref={tunnel} area="sewer" theme={theme} level={1}/>
    <div className="opening-vignette" aria-hidden="true"/><div ref={blackout} className="opening-blackout" aria-hidden="true"/>
    <button className="opening-skip" type="button" aria-label="Пропустить вступление" title="Пропустить вступление" onClick={onSkip}><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 3v18l11-9Zm12 0v18l11-9Zm12 0h3v18h-3Z" fill="currentColor"/></svg></button>
  </div>;
}
