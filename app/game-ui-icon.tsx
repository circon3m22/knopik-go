export function GameUiIcon({ kind }: { kind: "street" | "basement" | "bar" | "pause" | "map" | "goal" }) {
  const paths = {
    street: "M3 10h6V4h12v20H9v-6H3v-3h11l-4 4h4l7-7-7-7h-4l4 4H3Zm21-6h4v20h-4Z",
    basement: "M3 5h26v4H3Zm0 7h6v5h7v5h7v5h6v3H19v-5h-7v-5H5v-5H3Zm16 0h10v4H19Zm5 7h5v3h-5Z",
    bar: "M7 2h7v7h-2v3h4v16H5V12h4V9H7Zm11 12h11v4h-2v5h-3v5h-3v-5h-3v-5Zm2 2v4h5v-4Z",
    pause: "M7 5h6v22H7Zm12 0h6v22h-6Z",
    map: "M3 6h7l12-3 7 3v23h-7l-12 3-7-3Zm3 3v17l4 1V9Zm8 0v17l8-2V7Zm12-2v17h1V8Z",
    goal: "M6 3h3v26H6Zm5 1h16v4h-4v4h4v4H11Zm1 2v8h9v-3h-3V8h3V6Z",
  };
  return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><path d={paths[kind]} fill="currentColor"/></svg>;
}
