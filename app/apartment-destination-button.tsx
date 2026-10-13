import type { ApartmentDestination } from "./apartment-interactions";
type Props = { destination: ApartmentDestination; label: string; disabled: boolean; onChoose: (destination: ApartmentDestination) => void };

export function ApartmentDestinationButton({ destination, label, disabled, onChoose }: Props) {
  return <button type="button" className="apartment-hotspot" data-apartment-destination={destination} aria-label={label} title={label} disabled={disabled}
    onPointerDown={event=>{if(disabled || event.button!==0)return;event.preventDefault();onChoose(destination);}}
    onClick={event=>{if(!disabled && event.detail===0)onChoose(destination);}}/>;
}
