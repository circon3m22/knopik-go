"use client";

import { useEffect,useRef, useState, type CSSProperties, type PointerEvent } from "react";

import {VaultGesture} from "./vault-gesture";

type Props = { vault: number; amount: number; disabled: boolean; depositing: boolean; onTransfer: () => void };

export function VaultSwipe({ vault, amount, disabled, depositing, onTransfer }: Props) {
  const gesture=useRef(new VaultGesture());
  const [progress, setProgress] = useState(0);
  useEffect(()=>{const stop=()=>{gesture.current.cancel();setProgress(0);};window.addEventListener('blur',stop);return()=>window.removeEventListener('blur',stop);},[]);

  const finish = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const commit=gesture.current.finish(event.pointerId,cancelled);
    if(commit===null)return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setProgress(0);
    if(commit&&!disabled)onTransfer();
  };

  return <button className={`vault-swipe ${progress > 0 ? "is-swiping" : ""} ${depositing ? "is-depositing" : ""}`} type="button"
    disabled={disabled} style={{ "--vault-swipe-progress": progress } as CSSProperties}
    aria-label={`В сейфе ${vault.toLocaleString("ru-RU")} монет. Перенести ${amount.toLocaleString("ru-RU")} монет: свайп слева направо`}
    onPointerDown={event => {
      if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if(!gesture.current.begin(event.pointerId,event.clientX,rect.left,rect.width))return;
      try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
    }}
    onPointerMove={event => {
      const next=gesture.current.move(event.pointerId,event.clientX);
      if(next!==null)setProgress(next);
    }}
    onPointerUp={event => finish(event, false)} onPointerCancel={event => finish(event, true)}
    onLostPointerCapture={event => { if(gesture.current.owns(event.pointerId)){gesture.current.cancel();setProgress(0);} }}
    onClick={event => { if (event.detail === 0 && !disabled) onTransfer(); }}>
    <span className="vault-swipe-fill" aria-hidden="true" />
    <span className="vault-swipe-handle" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></span>
    <span className="vault-swipe-copy"><small>{depositing ? `+${amount.toLocaleString("ru-RU")} В СЕЙФ` : "50% В СЕЙФ"}</small><strong>{vault.toLocaleString("ru-RU")}</strong></span>
    <span className="safe-icon" aria-hidden="true"><i /></span>
  </button>;
}
