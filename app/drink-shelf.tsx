"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent } from "react";

export function DrinkShelf({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      for (const card of Array.from(track.children) as HTMLElement[]) {
        const offset = (card.offsetLeft + card.offsetWidth / 2 - center) / 190;
        const arc = Math.min(1.5, Math.max(-1.5, offset));
        card.style.setProperty("--shelf-turn", `${-arc * 7}deg`);
        card.style.setProperty("--shelf-depth", `${8 - Math.abs(arc) * 8}px`);
        card.style.setProperty("--shelf-drop", `${Math.abs(arc) * 2}px`);
        const proximity = Math.exp(-Math.pow(offset * 1.5, 2));
        card.style.setProperty("--shelf-scale", `${.98 + proximity * .09}`);
        card.style.setProperty("--shelf-lift", `${-proximity * 3}px`);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    track.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); track.removeEventListener("scroll", schedule); };
  }, []);

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    suppressClickRef.current = dragRef.current.moved;
    dragRef.current = null;
    event.currentTarget.style.scrollSnapType = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <section className="drink-shelf" aria-label="Полка напитков и предметов">
    <div ref={trackRef} className="boost-row shelf-track"
      onPointerDown={event => {
        suppressClickRef.current = false;
        if (event.pointerType === "mouse" && event.button === 0) dragRef.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={event => {
        const drag = dragRef.current;
        if (!drag) return;
        const distance = event.clientX - drag.x;
        if (!drag.moved && Math.abs(distance) < 8) return;
        drag.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = "none";
        event.currentTarget.scrollLeft = drag.scroll - distance;
      }} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={event => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) endDrag(event);
      }}
      onClickCapture={event => { if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false; } }}>
      {children}
    </div>
  </section>;
}
