"use client";
import type { CSSProperties } from "react";
import { GameModal } from "./game-modal";
import { CaseArtwork, CoinArtwork } from "./collectible-artwork";
import { PotionArtwork, ClothingArtwork } from "./cosmetic-artwork";
import { PixelBurst, PixelMark } from "./pixel-effects";
import type { CaseKind, CaseReward } from "./case-engine";

export type CaseSequence = {
  kind: CaseKind;
  rewards: CaseReward[];
  phase: "ready" | "charging" | "burst" | "reward";
  rewardIndex: number;
};

function RewardArtwork({ reward }: { reward: CaseReward }) {
  if (reward.type === "coins") return <CoinArtwork />;
  if (reward.type === "buff") return <PotionArtwork kind={({ food: "food", drink: "zhivchik", pitbull: "pitbull", cola: "cocoa", tea: "bergamot", shield: "pepsi" } as const)[reward.kind]} className="" />;
  return <span className={reward.type === "upgrade" ? "case-clothing is-upgrade" : "case-clothing"}><ClothingArtwork kind={reward.kind} />{reward.type === "upgrade" && <i>↑</i>}</span>;
}

export function CaseOpening({ sequence, onHold, onCancelHold, onAdvance, onClose }: { sequence: CaseSequence; onHold: () => void; onCancelHold: () => void; onAdvance: () => void; onClose: () => void }) {
  const { kind, phase, rewardIndex, rewards } = sequence;
  const reward = rewards[rewardIndex];
  return <GameModal className={`case-opening case-${kind} phase-${phase}`} label="Открытие кейса" onDismiss={phase === "ready" || phase === "reward" ? onClose : undefined}>
    <div className="case-constellation" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ left: `${i * 31 % 100}%`, top: `${i * 43 % 100}%`, "--spark-delay": `${i % 7 * -.4}s`, "--spark-size": `${4 + i % 3 * 3}px` } as CSSProperties}><PixelMark kind="spark" /></i>)}</div>
    {(phase === "ready" || phase === "reward") && <button type="button" className="case-close icon-button" aria-label="Закрыть открытие кейса" onClick={onClose}>×</button>}
    {phase === "reward" && reward ? <button key={rewardIndex} className={`case-reward-screen reward-${reward.type}`} type="button" onClick={onAdvance}>
      <small>НАГРАДА {rewardIndex + 1} / {rewards.length}</small>
      <span className="case-reward-pedestal" aria-hidden="true">
        <span className="case-reward-sun"><svg viewBox="0 0 96 96" className="pixel-art" shapeRendering="crispEdges">{Array.from({ length: 12 }, (_, i) => <path key={i} d="M45 2h6v20h-6Z" transform={`rotate(${i * 30} 48 48)`} fill="currentColor" />)}</svg></span>
        <span className="case-reward-icon"><RewardArtwork reward={reward} /></span>
        <PixelBurst kind="gold" seed={rewardIndex + 3} count={72} className="case-reveal-burst" />
      </span>
      <h2>{reward.label}</h2>
      <span className="case-reward-dots" aria-hidden="true">{rewards.map((_, i) => <i key={i} className={i <= rewardIndex ? "is-seen" : ""} />)}</span>
      <p>{rewardIndex < rewards.length - 1 ? "Следующая награда" : "Забрать всё"}</p>
    </button> : <div className="case-opening-stage">
      <span className="case-opening-eyebrow">{kind === "big" ? "БОЛЬШОЙ КЕЙС" : "ОБЫЧНЫЙ КЕЙС"}</span>
      <p>{phase === "ready" ? "Зажми, чтобы открыть" : phase === "charging" ? "Заряжаем…" : "ОТКРЫТО!"}</p>
      <div className="case-stage-platform">
        <span className="case-energy-column" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--beam": i } as CSSProperties} />)}</span>
        <button className="case-crate" type="button" aria-label="Удерживай, чтобы открыть кейс" disabled={phase === "burst"} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); onHold(); }} onPointerUp={onCancelHold} onPointerCancel={onCancelHold} onLostPointerCapture={onCancelHold} onKeyDown={event => { if (!event.repeat && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onHold(); } }} onKeyUp={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onCancelHold(); } }} onContextMenu={event => event.preventDefault()}>
          <CaseArtwork kind={kind} />
          <span className="case-charge-pips" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--pip": i } as CSSProperties} />)}</span>
        </button>
        <span className="case-floor-shadow" aria-hidden="true" />
      </div>
      <small>{kind === "big" ? "5 наград" : "3 награды"}</small>
    </div>}
    {phase === "burst" && <>
      <span className="case-pixel-flash" aria-hidden="true" />
      <span className="case-shock-rings" aria-hidden="true">{[0,1,2].map(i => <svg key={i} viewBox="0 0 64 64" className="pixel-art" style={{ "--ring": i } as CSSProperties} shapeRendering="crispEdges"><path d="M20 2h24v4h10v8h6v10h2v16h-2v10h-6v8H44v4H20v-4H10v-8H4V40H2V24h2V14h6V6h10Z M22 7v4H14v7H9v8H7v12h2v8h5v7h8v4h20v-4h8v-7h5v-8h2V26h-2v-8h-5v-7h-8V7Z" fill="currentColor" fillRule="evenodd" /></svg>)}</span>
      <PixelBurst kind="case" count={128} className="case-pixel-burst" />
      <div className="case-flung-stars" aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{ "--fling-x": `${Math.round(Math.cos(i * 2.4) * (100 + i % 7 * 38))}px`, "--fling-y": `${Math.round(Math.sin(i * 2.4) * (100 + i % 5 * 34) - 120)}px`, "--fling-delay": `${i % 5 * 20}ms`, "--fling-turn": `${i * 27}deg`, "--fling-size": `${8 + i % 4 * 4}px` } as CSSProperties}>{i % 5 === 0 ? <CoinArtwork /> : <PixelMark kind="spark" />}</i>)}</div>
    </>}
  </GameModal>;
}
