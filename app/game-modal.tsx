"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { FrameRateMeter } from "./frame-rate-meter";

export function GameModal({ children, className, label, onDismiss }: { children: ReactNode; className: string; label: string; onDismiss?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`game-native-dialog ${className}`} aria-label={label} onCancel={event => { event.preventDefault(); onDismiss?.(); }} onPointerDown={event => { if (event.target === event.currentTarget) onDismiss?.(); }}>{children}<FrameRateMeter /></dialog>;
}
