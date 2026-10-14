/** Death clears the whole live wallet, including any tap streak; the vault and stock survive. */
export function burnActiveBalance<T extends { walletCoins: number; streakCoins: number }>(current: T): T {
  return { ...current, walletCoins: 0, streakCoins: 0 };
}
