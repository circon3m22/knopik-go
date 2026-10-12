// Verified profile identity; display names and admin flags do not grant access.
const FOMA_USER_ID = "14b063d8-1790-451b-a354-1f7dcaa41f13";
export const GO_ACCESS_DENIED = "Knopik GO доступен только Фоме.";

export function canAccessKnopikGo(userId: string | null | undefined) {
  return userId === FOMA_USER_ID;
}

export function isKnopikGoLogin(username: string) {
  return username.trim().toLowerCase() === "foma";
}
