import { CoinArtwork } from "./collectible-artwork";

/** The live wallet, shared by home and adventures. Vault money is separate. */
export function ActiveBalance({ amount, atRisk = false, pulse = 0 }: { amount: number; atRisk?: boolean; pulse?: number }) {
  return <div className={`active-balance ${atRisk ? "is-at-risk" : ""}`} aria-label={`Активный баланс: ${amount.toLocaleString("ru-RU")} KC${atRisk ? ". Сгорит при гибели" : ""}`}>
    <CoinArtwork/>
    <span><small>Активный баланс</small><strong key={pulse} className={pulse ? "balance-earned" : undefined} title={`${amount.toLocaleString("ru-RU")} KC`}>{amount.toLocaleString("ru-RU")} <em>KC</em></strong></span>
  </div>;
}
