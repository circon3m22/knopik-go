import { CoinArtwork } from "./collectible-artwork";

/** The live wallet, shared by home and adventures. Vault money is separate. */
export function ActiveBalance({ amount, atRisk = false, pulse = 0, compact = false }: { amount: number; atRisk?: boolean; pulse?: number; compact?:boolean }) {
  const value=compact&&amount>=1000000?new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:1}).format(amount):amount.toLocaleString('ru-RU');
  return <div className={`active-balance ${atRisk ? "is-at-risk" : ""}`} aria-label={`Активный баланс: ${amount.toLocaleString("ru-RU")} KC${atRisk ? ". Сгорит при гибели" : ""}`}>
    <CoinArtwork/>
    <span><small>Активный баланс</small><strong key={pulse} className={pulse ? "balance-earned" : undefined} title={`${amount.toLocaleString("ru-RU")} KC`}>{value} <em>KC</em></strong></span>
  </div>;
}
