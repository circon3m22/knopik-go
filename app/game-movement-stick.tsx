import type { PointerEventHandler, Ref } from "react";

type Props = { disabled: boolean; nubRef: Ref<SVGSVGElement>; stickRef?: Ref<HTMLButtonElement>; onDown: PointerEventHandler<HTMLButtonElement>; onMove: PointerEventHandler<HTMLButtonElement>; onRelease: PointerEventHandler<HTMLButtonElement> };
export function GameMovementStick({ disabled, nubRef, stickRef, onDown, onMove, onRelease }: Props) {
  return <div className="adventure-stick-wrap"><button ref={stickRef} className="adventure-stick" type="button" aria-label="Джойстик движения. WASD или стрелки" disabled={disabled} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onRelease} onPointerCancel={onRelease} onLostPointerCapture={onRelease}>
    <svg className="adventure-stick-arrows" viewBox="0 0 100 100" aria-hidden="true"><path d="M45 8h10v25h12v10H55v12h12v10H55v27H45V65H33V55h12V43H33V33h12Z" fill="currentColor"/><path d="M8 45h25v10H8Zm59 0h25v10H67Z" fill="currentColor"/></svg>
    <svg className="adventure-stick-nub" ref={nubRef} width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h38v4h4v38h-4v4H4v-4H0V4h4Z" fill="#2f514b"/><path d="M4 4h38v38H4Z" fill="#537d75"/><path d="M4 4h38v4H8v30H4Z" fill="#9bc6af"/><path d="M8 38h34v4H8Zm30-30h4v30h-4Z" fill="#3a6359"/><path d="M14 19h18v3H14Zm0 6h18v3H14Z" fill="#b0d4bb"/></svg>
  </button><small>Движение · WASD</small></div>;
}
