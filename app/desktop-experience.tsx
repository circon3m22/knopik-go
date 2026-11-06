"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {useGraphicsQuality} from "./use-graphics-quality";
import {DESKTOP_QUERY} from "./desktop-layout";

export {DESKTOP_QUERY} from "./desktop-layout";
const KEY = "knopik-go-pc-graphics";
const EVENT = "knopik-graphics-change";
export function selectDesktopUltra(enabled:boolean){
  fallbackPreference=enabled?"ultra":"standard";
  try{localStorage.setItem(KEY,fallbackPreference);}catch{/* Local preference remains usable without storage. */}
  window.dispatchEvent(new Event(EVENT));
}
let fallbackPreference = "ultra";
function subscribe(listener: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", listener);
  window.addEventListener(EVENT, listener); window.addEventListener("storage", listener);
  return () => { media.removeEventListener("change", listener); window.removeEventListener(EVENT, listener); window.removeEventListener("storage", listener); };
}
function snapshot() {
  if (!window.matchMedia(DESKTOP_QUERY).matches) return "mobile";
  try { return localStorage.getItem(KEY) === "standard" ? "standard" : "ultra"; } catch { return fallbackPreference; }
}
export function useDesktopMode() {
  const mode = useSyncExternalStore(subscribe, snapshot, () => "mobile");
  return { desktop: mode !== "mobile", ultra: mode === "ultra" };
}
export function DesktopExperience() {
  const { desktop, ultra } = useDesktopMode(), quality=useGraphicsQuality();
  useEffect(() => {
    document.body.dataset.desktop = String(desktop);
    document.body.dataset.graphics = ultra && quality==="ultra" ? "ultra" : "standard";
  }, [desktop, ultra, quality]);
  return null;
}
export function DesktopControlGuide({aim=true}:{aim?:boolean}={}){
  const [open,setOpen]=useState(false),root=useRef<HTMLElement>(null);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.code!=="F1"||event.repeat)return;
      const dialog=root.current?.closest("dialog"),dialogs=document.querySelectorAll("dialog[open]");
      if(!dialog||dialogs[dialogs.length-1]!==dialog)return;
      event.preventDefault();setOpen(value=>!value);
    };
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[]);
  return <aside ref={root} className="desktop-control-guide" aria-label="Управление ПК">
    <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><kbd>F1</kbd> Управление</button>
    <span className="desktop-primary-keys"><kbd>WASD</kbd> Движение <kbd>ПРОБЕЛ</kbd> Кувырок</span>
    {open&&<div className="desktop-key-panel"><span><kbd>W A S D</kbd> Движение</span>{aim&&<span><kbd>МЫШЬ</kbd> Прицел · ЛКМ / J — атака</span>}<span><kbd>ПРОБЕЛ</kbd> Кувырок</span><span><kbd>E</kbd> Действие</span>{aim&&<><span><kbd>1–8</kbd> Оружие</span><span><kbd>H / L / Q</kbd> Предметы</span></>}<span><kbd>M</kbd> Карта</span><span><kbd>ESC</kbd> Пауза</span></div>}
  </aside>;
}
export function DesktopQualitySummary({quality,title}:{quality:string;title?:string}){const {desktop,ultra}=useDesktopMode();return <>{desktop&&ultra&&quality==='ultra'?'Ultra · ПК':title}</>;}
export function DesktopGraphicsSettings({children}:{children:ReactNode}){const {desktop}=useDesktopMode();return <details className="settings-fold graphics-settings" open={desktop}>{children}</details>;}
