export type ApartmentDestination = "street" | "bar" | "basement";

// These world-space hit areas follow the same SVG projection and camera as
// the furniture. Adjacent objects have separate, generous touch targets.
export const APARTMENT_DESTINATIONS = [
  { id: "street", label: "Выйти на улицу · район Кнопика", x: 54, y: 44, w: 105, h: 100 },
  { id: "bar", label: "Мини-бар · сны", x: 35, y: 145, w: 105, h: 137 },
  { id: "basement", label: "Подвал · уровни", x: 326, y: 44, w: 103, h: 103 },
] as const;
