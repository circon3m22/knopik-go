import type { ReactNode } from "react";
import { AdventureHeart } from "./adventure-artwork";
import { ActiveBalance } from "./active-balance";
import { GameUiIcon } from "./game-ui-icon";

export function GamePlayHud({ place, eyebrow, hp, balance, atRisk = false, objective, progress, children }: { place: string; eyebrow: string; hp: number; balance: number; atRisk?: boolean; objective?: ReactNode; progress?: string; children: ReactNode }) {
  return <header className="adventure-hud">
    <div className="adventure-topline">
      <div className="adventure-location"><small>{eyebrow}</small><strong>{place}</strong></div>
      <div className="adventure-header-actions">{children}</div>
    </div>
    <div className="adventure-vitals">
      <div className="adventure-life"><div className="adventure-health" role="img" aria-label={`Здоровье: ${hp} из 3`}><AdventureHeart filled={hp > 0}/><AdventureHeart filled={hp > 1}/><AdventureHeart filled={hp > 2}/></div></div>
      <ActiveBalance amount={balance} atRisk={atRisk}/>
    </div>
    {objective && <div className="adventure-mission-line"><GameUiIcon kind="goal"/><div className="adventure-objective" role="status">{objective}</div>{progress && <small>{progress}</small>}</div>}
  </header>;
}
