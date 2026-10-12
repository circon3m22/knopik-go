type Props = { disabled: boolean; ready: boolean; onDodge: () => void };

export function AdventureDodgeButton({ disabled, ready, onDodge }: Props) {
  return <button className="adventure-dodge" type="button" disabled={disabled} onPointerDown={event => {
    // A second touch must work while the joystick holds the first pointer.
    // Mobile browsers may omit click for multi-touch gestures, so act on contact.
    if (disabled || event.button !== 0) return;
    event.preventDefault(); onDodge();
  }} onClick={event => {
    // Keyboard and assistive clicks still work, without replaying a touch action.
    if (!disabled && event.detail === 0) onDodge();
  }}><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 3h6v4h4v4h4v2h-4v4H8v4H2v-4h4v-4h4v-2H6V7H2Zm14 0h6v4h4v4h4v2h-4v4h-4v4h-6v-4h4v-4h4v-2h-4V7h-4Z" fill="currentColor"/></svg><small>{ready ? "Рывок" : "Зарядка…"}</small></button>;
}
