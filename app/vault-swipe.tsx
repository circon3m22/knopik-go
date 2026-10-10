"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

type Props = { vault: number; amount: number; disabled: boolean; depositing: boolean; onTransfer: () => void };

export function VaultSwipe({ vault, amount, disabled, depositing, onTransfer }: Props) {
  const dragRef = useRef<{ start: number; width: number; progress: number } | null>(null);
  const committedRef = useRef(false);
  const [progress, setProgress] = useState(0);

  const finish = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setProgress(0);
    if (!cancelled && drag && drag.progress >= .7 && !disabled && !committedRef.current) {
      committedRef.current = true;
      onTransfer();
    }
  };

  return <button className={`vault-swipe ${progress > 0 ? "is-swiping" : ""} ${depositing ? "is-depositing" : ""}`} type="button"
    disabled={disabled} style={{ "--vault-swipe-progress": progress } as CSSProperties}
    aria-label={`В сейфе ${vault.toLocaleString("ru-RU")} монет. Перенести ${amount.toLocaleString("ru-RU")} монет: свайп слева направо`}
    onPointerDown={event => {
      if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX > rect.left + rect.width * .35) return;
      committedRef.current = false;
      dragRef.current = { start: event.clientX, width: Math.max(1, rect.width * .7), progress: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const drag = dragRef.current;
      if (!drag) return;
      drag.progress = Math.min(1, Math.max(0, (event.clientX - drag.start) / drag.width));
      setProgress(drag.progress);
    }}
    onPointerUp={event => finish(event, false)} onPointerCancel={event => finish(event, true)}
    onLostPointerCapture={() => { dragRef.current = null; setProgress(0); }}
    onClick={event => { if (event.detail === 0 && !disabled) onTransfer(); }}>
    <span className="vault-swipe-fill" aria-hidden="true" />
    <span className="vault-swipe-handle" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></span>
    <span className="vault-swipe-copy"><small>{depositing ? `+${amount.toLocaleString("ru-RU")} В СЕЙФ` : "50% В СЕЙФ"}</small><strong>{vault.toLocaleString("ru-RU")}</strong></span>
    <span className="safe-icon" aria-hidden="true"><i /></span>
  </button>;
}
