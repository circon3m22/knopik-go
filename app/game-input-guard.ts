/** Game shortcuts must leave text entry and browser/assistive shortcuts alone. */
export function ignoreGameKey(event:Pick<KeyboardEvent,'target'|'ctrlKey'|'metaKey'|'altKey'>){
 const target=event.target as Element|null;
 return event.ctrlKey||event.metaKey||event.altKey||!!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
}
