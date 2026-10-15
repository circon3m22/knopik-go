import { KnopikAnimator } from "./knopik-adventure-animation.ts";
import type { KnopikEquipment } from "./knopik-equipment-state.ts";

/** The animator needs the complete avatar: clothing sits outside individual rigs. */
export function paintWardrobePreview(root: Element, equipment: KnopikEquipment, angle: number) {
  const animator = new KnopikAnimator(root);
  animator.paint({ equipment, player: { x: 0, y: 0, angle, hp: 3 }, area: "apartment", weapon: "fist", punchTime: 0, punchSerial: 0, walkDistance: 0, moving: false, dodgeTime: 0, checkpoint: 3, tutorialOpened: true, time: 0, surgeTime: 0 }, true);
  return animator;
}
