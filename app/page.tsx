"use client";

import { CloudAccountGate } from "./cloud-account";
import {GameReleaseNotice} from "./game-release-notice";
import { KnopikGoGame } from "./knopik-go";

export default function Home() {
  return <CloudAccountGate>{session => <><GameReleaseNotice/><KnopikGoGame key={session.gameKey}
    account={session.account} initialSave={session.initialSave} syncState={session.syncState}
    difficulty={session.difficulty} promoCodes={session.promoCodes} onSave={session.saveProgress} onRetrySave={session.retrySave}
    onRefreshPromoCodes={session.refreshPromoCodes} onUpdateDifficulty={session.updateDifficulty}
    onCreatePromoCode={session.createPromoCode} onRedeemPromoCode={session.redeemPromoCode}
    onGetDailyCase={session.getDailyCase} onClaimDailyCase={session.claimDailyCase}
    onSignOut={session.signOut} /></>}</CloudAccountGate>;
}
