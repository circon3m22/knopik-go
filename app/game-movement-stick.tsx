import type { PointerEventHandler, Ref } from "react";
import {GameControlSurface} from './game-control-surface';

type Props = { disabled: boolean; nubRef: Ref<SVGSVGElement>; stickRef?: Ref<HTMLButtonElement>; onDown: PointerEventHandler<HTMLButtonElement>; onMove: PointerEventHandler<HTMLButtonElement>; onRelease: PointerEventHandler<HTMLButtonElement> };
export function GameMovementStick({ disabled, nubRef, stickRef, onDown, onMove, onRelease }: Props) {
  return <div className="adventure-stick-wrap"><button ref={stickRef} data-game-control="stick" className="adventure-stick" type="button" aria-label="Джойстик движения. WASD или стрелки" disabled={disabled} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onRelease} onPointerCancel={onRelease} onLostPointerCapture={onRelease}>
    <GameControlSurface/>
    <svg className="adventure-stick-arrows" viewBox="0 0 100 100" aria-hidden="true" shapeRendering="crispEdges"><path d="M46 12h8v4h4v4h4v4H38v-4h4v-4h4ZM12 46h4v-4h4v-4h4v24h-4v-4h-4v-4h-4ZM46 88v-4h-4v-4h-4v-4h24v4h-4v4h-4v4ZM88 46v8h-4v4h-4v4h-4V38h4v4h4v4Z" fill="currentColor"/></svg>
    <svg className="adventure-stick-nub" ref={nubRef} width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h38v4h4v38h-4v4H4v-4H0V4h4Z" fill="#2f514b"/><path d="M4 4h38v38H4Z" fill="#537d75"/><path d="M4 4h38v4H8v30H4Z" fill="#9bc6af"/><path d="M8 38h34v4H8Zm30-30h4v30h-4Z" fill="#3a6359"/><path d="M14 19h18v3H14Zm0 6h18v3H14Z" fill="#b0d4bb"/></svg>
  </button></div>;
}
