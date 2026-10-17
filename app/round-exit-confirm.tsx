'use client';
import {GameModal} from './game-modal';
export function RoundExitConfirm({onConfirm,onCancel}:{onConfirm:()=>void;onCancel:()=>void}){
 return <GameModal className="round-exit-dialog pixel-game" label="Завершить раунд?" role="alertdialog" onDismiss={onCancel}>
  <small>АКТИВНАЯ ИГРА</small><h2>Завершить раунд?</h2>
  <p>Ставка и бутылка уже использованы. При выходе раунд завершится без выплаты.</p>
  <button type="button" autoFocus onClick={onCancel}>Продолжить игру</button>
  <button type="button" className="round-exit-leave" onClick={onConfirm}>Завершить и выйти</button>
 </GameModal>;
}
