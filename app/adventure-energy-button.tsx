import { forwardRef } from "react";

export function EnergyWaveIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><path d="M10 1h12v3h5v5h4v14h-4v5h-5v3H10v-3H5v-5H1V9h4V4h5Zm1 5v3H8v4H5v6h3v4h3v3h10v-3h3v-4h3v-6h-3V9h-3V6Z" fill="#6fc6d2"/><path d="M16 6h5l-4 8h7L13 27l2-11H9Z" fill="#fff1d1"/><path d="M1 1h4v4H1Zm26 0h4v4h-4ZM1 27h4v4H1Zm26 0h4v4h-4Z" fill="#e4cc9b"/></svg>;
}

export const AdventureEnergyButton = forwardRef<HTMLButtonElement, { disabled: boolean; onActivate: () => void }>(function AdventureEnergyButton({ disabled, onActivate }, ref) {
  return <button ref={ref} className="adventure-energy adventure-cooldown-button" type="button" disabled={disabled} aria-label="Энергетическая волна плаща · Q" title="Круговая волна · 4 урона · перезарядка 30 секунд · Q" onPointerDown={event => {
    if (disabled || event.button !== 0) return;
    event.preventDefault(); onActivate();
  }} onClick={event => { if (!disabled && event.detail === 0) onActivate(); }}>
    <span className="adventure-cooldown-fill" data-cooldown-fill="" aria-hidden="true"/>
    <EnergyWaveIcon/><small>Волна</small><b data-cooldown-time="">Готово</b>
  </button>;
});
