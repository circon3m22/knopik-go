import { DetailedPotion } from "./drink-bottle-art";
export function QuickBuffArtwork({kind}:{kind:"food"|"zhivchik"|"pepsi"|"heal"}){return <DetailedPotion kind={kind} className="quick-buff-art"/>;}
