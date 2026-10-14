type Props = { disabled: boolean; ready: boolean; onDodge: () => void };

export function AdventureDodgeButton({ disabled, ready, onDodge }: Props) {
  return <button className="adventure-dodge" type="button" disabled={disabled} aria-label={ready ? "Кувырок · Shift или K" : "Кувырок перезаряжается"} title={ready ? "Кувырок · Shift или K" : "Перезарядка"} onPointerDown={event => {
    // A second touch must work while the joystick holds the first pointer.
    // Mobile browsers may omit click for multi-touch gestures, so act on contact.
    if (disabled || event.button !== 0) return;
    event.preventDefault(); onDodge();
  }} onClick={event => {
    // Keyboard and assistive clicks still work, without replaying a touch action.
    if (!disabled && event.detail === 0) onDodge();
  }}><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M8 2h14v3h5v5h3v8h-5v-5h-3V8h-4V6h-7v3H6V4h2ZM5 10v6h4v3h8v-3h5v6H9v-3H4v-4H1v-5Zm6 0h9v3h3v6h-5v-3h-7Z" fill="currentColor"/></svg><small>Кувырок</small></button>;
}
