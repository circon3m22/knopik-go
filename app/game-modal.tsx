"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { FrameRateMeter } from "./frame-rate-meter";

export function GameModal({ children, className, label, onDismiss,style,role,hideFrameRate=false }: { children: ReactNode; className: string; label: string; onDismiss?: () => void;style?:CSSProperties;role?:'dialog'|'alertdialog';hideFrameRate?:boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if(previousFocus?.isConnected)previousFocus.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} style={style} role={role} className={`game-native-dialog ${className}`} aria-label={label} onCancel={event => { event.preventDefault();event.stopPropagation();onDismiss?.(); }} onPointerDown={event => { if (event.target === event.currentTarget) onDismiss?.(); }}>{children}{!hideFrameRate&&<FrameRateMeter />}</dialog>;
}
