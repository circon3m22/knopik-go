"use client";
import { useEffect, useId, useRef, type RefObject } from "react";
import type { AdventureEngine } from "./adventure-engine";
import { AdventureScene } from "./adventure-artwork";
import { NeighborhoodScene } from "./neighborhood-artwork";
import { AdventureOpeningRenderer } from "./adventure-opening-renderer";
import type { ThemeId } from "./cosmetic-engine";
import { OPENING_CAPTIONS } from "./adventure-opening";

export function AdventureOpeningCinema({ clock }: { clock: RefObject<AdventureEngine | null>; theme: ThemeId }) {
  // The story begins after sunset, independently of the player's apartment skin.
  const theme="night";
  const prefix = `opening-${useId().replaceAll(":", "")}`;
  const city = useRef<SVGSVGElement>(null), home = useRef<SVGSVGElement>(null), stairs = useRef<SVGSVGElement>(null), tunnel = useRef<SVGSVGElement>(null);
  const root = useRef<HTMLDivElement>(null), blackout = useRef<HTMLDivElement>(null);
  const caption=useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!root.current || !city.current || !home.current || !stairs.current || !tunnel.current) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer = new AdventureOpeningRenderer([city.current, home.current, stairs.current, tunnel.current], motion.matches);
    const resize = () => { const rect = root.current!.getBoundingClientRect(); renderer.resize(rect.width, rect.height); };
    const change = () => { renderer = new AdventureOpeningRenderer([city.current!, home.current!, stairs.current!, tunnel.current!], motion.matches); resize(); };
    const observer = new ResizeObserver(resize); observer.observe(root.current); motion.addEventListener("change", change); resize();
    let frame = 0;
    const tick = () => { if (!document.hidden) { const shot = renderer.paint(clock.current?.openingTime ?? 0); if (blackout.current) blackout.current.style.opacity = String(shot.fade);const line=OPENING_CAPTIONS[shot.shot];if(caption.current){if(caption.current.textContent!==line)caption.current.textContent=line;caption.current.style.opacity=String(1-shot.fade);} } frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", change); };
  }, [clock, theme]);
  return <div ref={root} className="opening-cinema" role="group" aria-label="Кнопик слышит стук из подвала, спускается, находит пролом в стене и входит в тёмный тоннель">
    <NeighborhoodScene ref={city} prefix={prefix} night/>
    <AdventureScene ref={home} area="apartment" theme={theme}/>
    <AdventureScene ref={stairs} area="basement" theme={theme}/>
    <AdventureScene ref={tunnel} area="basement" theme={theme}/>
    <div className="opening-vignette" aria-hidden="true"/><div ref={blackout} className="opening-blackout" aria-hidden="true"/>
    <p className="opening-caption" ref={caption} aria-live="polite" aria-atomic="true">{OPENING_CAPTIONS[0]}</p>
  </div>;
}
