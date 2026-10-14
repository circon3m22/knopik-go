"use client";
import { CloudAccountGate } from "../cloud-account";
import { KnopikGoGame } from "../knopik-go";
/** Direct entry uses the same account and save; the runner mounts alone. */
export default function RunPage(){return <CloudAccountGate>{s=><KnopikGoGame runnerEntry key={s.gameKey} account={s.account} initialSave={s.initialSave} syncState={s.syncState} difficulty={s.difficulty} promoCodes={s.promoCodes} onSave={s.saveProgress} onRetrySave={s.retrySave} onRefreshPromoCodes={s.refreshPromoCodes} onUpdateDifficulty={s.updateDifficulty} onCreatePromoCode={s.createPromoCode} onRedeemPromoCode={s.redeemPromoCode} onGetDailyCase={s.getDailyCase} onClaimDailyCase={s.claimDailyCase} onSignOut={s.signOut}/>}</CloudAccountGate>;}
