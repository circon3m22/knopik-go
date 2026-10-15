"use client";
import { createContext, useContext } from "react";
export const GameSettingsAccess=createContext({active:false,open:()=>{}});
export const useGameSettingsAccess=()=>useContext(GameSettingsAccess);
export function PauseSettingsButton({className=""}:{className?:string}){const settings=useGameSettingsAccess();return <button type="button" className={`pause-settings-button ${className}`.trim()} onClick={settings.open}><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M8 1h8v4h4v4h3v6h-3v4h-4v4H8v-4H4v-4H1V9h3V5h4Zm1 7v2H7v4h2v2h6v-2h2v-4h-2V8Z" fill="currentColor"/></svg><span>Настройки</span></button>;}
