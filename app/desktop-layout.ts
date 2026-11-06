/** Input capability and window geometry are independent: resizing a PC window
 * must never bring back the touch controller or remove mouse aiming. */
export const DESKTOP_QUERY = "(any-hover: hover) and (any-pointer: fine)";

export function desktopCamera(width: number, height: number) {
  const safeWidth = Math.max(1, width), safeHeight = Math.max(1, height);
  const worldHeight = Math.max(440, Math.min(640, safeHeight * .84));
  return { width: worldHeight * safeWidth / safeHeight, height: worldHeight };
}
