/** A renewed JWT or repeated SIGNED_IN event is the same game identity. */
export function shouldLoadCloudGame(loadedUserId: string | null | undefined, nextUserId: string | null | undefined) {
  return Boolean(nextUserId && loadedUserId !== nextUserId);
}
