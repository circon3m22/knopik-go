import type { CSSProperties, RefObject } from "react";

type Props = { phase: string; target: { center: number; width: number }; trackRef?: RefObject<HTMLDivElement | null>; score?: number };
function LimeSlice() {
  return <svg className="pixel-art" viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true"><path d="M14 2h20v4h6v6h4v22h-4v6h-6v4H14v-4H8v-6H4V14h4V8h6Z" fill="#345843" /><path d="M16 5h16v4h6v6h3v18h-4v6h-5v3H16v-3h-6v-6H7V16h4v-5h5Z" fill="#b6d473" /><path d="M18 10h12v4h7v18h-7v6H18v-6h-7V18h7Z" fill="#7eab54" /><path d="M22 10h4v28h-4ZM11 22h26v4H11Zm5-8h4v5h-4Zm13 15h4v5h-4Z" fill="#f1e9ac" /><path d="M15 8h9v3h-9Zm-5 8h3v9h-3Z" fill="#e0eda2" /></svg>;
}
export function LimeMachine({ phase, target, trackRef, score }: Props) {
  return <div ref={trackRef} className={`lime-throw-stage phase-${phase} ${score === undefined ? "" : score > 0 ? "is-hit" : "is-miss"}`} style={{ "--target-center": `${target.center}%`, "--target-width": `${target.width}%` } as CSSProperties}>
    <svg className="lime-garden pixel-art" viewBox="0 0 320 360" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 0h320v360H0Z" fill="#e5d4aa" /><path d="M0 0h320v6H0ZM0 65h320v2H0Zm0 73h320v2H0Zm0 72h320v2H0Z" fill="#d2bc91" />
      <path d="M79 6h2v59h-2Zm158 0h2v59h-2ZM0 136h160v2H0Zm158-69h2v68h-2Zm-78 70h2v72h-2Zm158 0h2v72h-2Z" fill="#c9b18b" />
      <path d="M0 256h320v104H0Z" fill="#6b927c" /><path d="M0 257h320v7H0Z" fill="#afc398" /><path d="M0 280h320v4H0Zm51-16h4v58h-4Zm155 0h4v58h-4Z" fill="#456c5e" />
      <path d="M0 322h320v8H0Zm0 8h320v30H0Z" fill="#355247" /><path d="M8 344h100v3H8Zm162 0h104v3H170Z" fill="#496c56" />
      <path d="M0 8h8v12h13v9h12v13h-9V29H11V19H0ZM320 6h-9v13h-16v9h-12v15h9V29h17V19h11Z" fill="#628458" />
      <path d="M7 17h18v6h7v11H20v-5H7ZM26 31h17v7h8v12H37v-6H26ZM294 16h-20v7h-6v12h14v-6h12ZM273 32h-16v6h-9v13h15v-6h10Z" fill="#8cad68" />
      <path d="M9 17h12v3H9Zm20 16h10v3H29Zm252-15h10v3h-10Zm-21 16h10v3h-10Z" fill="#c1d58a" />
      <path d="M23 57h8v6h4v9H20V61h3Zm254-5h9v5h4v11h-17V58h4Z" fill="#b8ca67" /><path d="M23 59h6v3h-6Zm254-5h6v3h-6Z" fill="#edf0a4" />
      <path d="M23 291h28v5H23Zm245 0h31v5h-31Z" fill="#abbd8e" />
    </svg>
    <div className="lime-aim-line" aria-hidden="true" />
    <div className="lime-target-band" aria-hidden="true"><i /><i /></div>
    <div className="lime-catcher" aria-hidden="true"><svg viewBox="0 0 72 102" preserveAspectRatio="none" className="pixel-art" shapeRendering="crispEdges"><path d="M3 92h66v5H3Z" fill="#294b3f" /><path d="M13 12h46v4h6v72h-6v6H13v-6H7V16h6Z" fill="#476b5e" /><path d="M14 16h44v72H14Z" fill="#c6dbbc" /><path d="M18 22h36v60H18Z" fill="#9ec893" /><path d="M18 43h36v39H18Z" fill="#86b558" /><path d="M18 43h36v5H18Z" fill="#d1e298" /><path d="M14 18h5v64h-5Zm5 64h35v5H19ZM10 12h52v6H10Z" fill="#f2efd3" /><path d="M44 2h6v38h-6Zm-12 0h18v5H32Z" fill="#f2c773" /><path d="M44 9h6v5h-6Zm0 14h6v5h-6Z" fill="#d28a5a" /><path d="M27 53h18v4h6v14h-6v5H27v-5h-6V57h6Z" fill="#d8e696" /><path d="M30 58h12v12H30Z" fill="#8eaf55" /><path d="M34 57h4v16h-4Zm-8 7h20v3H26Z" fill="#f5efb6" /><path d="M23 28h5v7h-5Zm17 5h4v4h-4Z" fill="#e7eed0" /></svg></div>
    <span className="lime-fruit" aria-hidden="true"><LimeSlice /></span>
    {phase === "pressing" && score !== undefined && score > 0 && <div className="lime-juice-splash" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--splash-x": `${(i % 2 ? -1 : 1) * (14 + i * 5)}px`, "--splash-y": `${-22 - i % 4 * 13}px`, "--splash-delay": `${i % 3 * 18}ms` } as CSSProperties} />)}</div>}
  </div>;
}
