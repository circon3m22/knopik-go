"use client";
import { useEffect, useSyncExternalStore } from "react";
import {useGraphicsQuality} from "./use-graphics-quality";

export const DESKTOP_QUERY = "(min-width: 960px) and (hover: hover) and (pointer: fine)";
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
export function DesktopControlGuide({aim=true}:{aim?:boolean}={}){return <aside className="desktop-control-guide" aria-label="Управление ПК"><span><kbd>W A S D</kbd> Движение</span><span><kbd>МЫШЬ</kbd> {aim?"Прицел · ЛКМ / J — атака":"ЛКМ / J — атака"}</span><span><kbd>ПРОБЕЛ</kbd> Кувырок</span><span><kbd>E</kbd> Действие</span><span><kbd>1–8</kbd> Оружие</span><span><kbd>M</kbd> Карта</span><span><kbd>ESC</kbd> Пауза</span></aside>;}
export function DesktopQualitySummary({quality,title}:{quality:string;title?:string}){const {desktop,ultra}=useDesktopMode();return <>{desktop&&ultra&&quality==='ultra'?'Ultra · ПК':title}</>;}
