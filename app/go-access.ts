// Verified profile identities. Display names and admin flags do not grant access.
const GO_USER_IDS = new Set([
  "14b063d8-1790-451b-a354-1f7dcaa41f13",
  "f53a06e6-f782-4969-935a-124a0ea9abe5",
]);
export const GO_ACCESS_DENIED = "Вход в Knopik GO доступен Фоме и Proclick.";

export function canAccessKnopikGo(userId: string | null | undefined) {
  return typeof userId === "string" && GO_USER_IDS.has(userId);
}

export function isKnopikGoLogin(username: string) {
  return ["foma", "proclick"].includes(username.trim().toLowerCase());
}
