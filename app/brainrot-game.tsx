"use client";
import {useArcadeQuote} from "./arcade-economy-context";
import {ignoreGameKey} from './game-input-guard';
import {getVisualFpsLimit} from "./graphics-quality";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BrainrotEngine, memeReward, type BrainrotSound } from "./brainrot-engine";
import { BrainrotScene, BrainrotCharacter } from "./brainrot-artwork";
import { DRINK_GAMES, type BrainrotKind } from "./drink-game-engine";
import { GameModal } from "./game-modal";
import { PotionArtwork } from "./cosmetic-artwork";
import {SkillBetPicker} from "./skill-bet-picker";
import {resolveSkillWager,skillWagerPayout} from "./skill-wager-engine";
import { CoinArtwork } from "./collectible-artwork";

const GUIDE = {
  tralalero: { title: "КРОССОВКИ В МОРЕ", lead: "Кроссовки тонут. Медузы не собираются уступать дорогу.", controls: "Веди акулу пальцем. Прыгай над минами, обходи медуз. Три пропущенных кроссовка отнимают жизнь.", action: "ПРЫЖОК", duration: "42 секунды · три морские зоны" },
  ballerina: { title: "КАППУЧИНО В РИТМ", lead: "Кофе покрепче. Темп быстрее. Иногда нужны две клавиши сразу.", controls: "Жми на светлой линии. Золотые ноты — синкопы и двойные удары. Длинные ноты удерживай до конца. Темп растёт, три ошибки — конец.", action: "", duration: "101 нота · аккорды и удержание" },
  bombardiro: { title: "АРБУЗНЫЙ НАЛЁТ", lead: "Сахуры надели броню и открыли ответный огонь.", controls: "Веди самолёт, целься с учётом ветра. Броня требует два попадания. Береги Каппучину, обходи выстрелы и следи за перегревом.", action: "СБРОСИТЬ АРБУЗ", duration: "36 секунд · командир волны" },
  verity: { title: "КОМНАТА ГЛИТЧА", lead: "It’s me, Verity! Улыбка заперта в заражённой коробке.", controls: "Веди платформу пальцем и отбивай Верити. Разбивай блоки. Глитч защищает от красных блоков и лазеров.", action: "ГЛИТЧ", duration: "46 секунд · комнаты и переключатели" },
} as const;
type Props = { onReplay?:()=>void;kind: BrainrotKind; best: number; balance?:number; canChooseBet?:boolean; onStart: (bet:number) => boolean; onResolve: (kind: BrainrotKind, reward: number, score: number) => number|void; onClose: () => void; onSound: (kind: BrainrotKind, sound: BrainrotSound, lane: number) => void };

export function BrainrotGame(props: Props) {
 const {quote}=useArcadeQuote();
  const [engine] = useState(() => new BrainrotEngine(props.kind));
  const [state, setState] = useState(() => engine.snapshot());
  const [reduced, setReduced] = useState(false);
  const [actualReward,setActualReward]=useState<number|null>(null);
  const [bet,setBet]=useState(0),[lockedBet,setLockedBet]=useState(0);
  const propsRef = useRef(props), settled = useRef(false), pressed = useRef(new Set<string>()), pointer = useRef<number | null>(null);
  const guide = GUIDE[props.kind], drink = DRINK_GAMES[props.kind];
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update);
  }, []);
  const publish = () => {
    if (engine.phase === "result" && !settled.current) {
      settled.current = true;
      const result = engine.finish();
      setActualReward(propsRef.current.onResolve(engine.kind,result.reward,result.score)??null);
    }
    for (const cue of engine.drainSounds()) propsRef.current.onSound(engine.kind, cue.sound, cue.lane);
    setState(engine.snapshot());
  };
  const publishRef = useRef(publish);
  useEffect(() => { publishRef.current = publish; });
  useEffect(() => {
    if (state.phase !== "playing") return;
    let frame = 0, previous = 0, paintAt = 0, carry = 0;
    const tick = (now: number) => {
      if (engine.phase !== "playing") return;
      if (previous) carry += Math.min(.08, (now - previous) / 1000);
      previous = now;
      while (carry >= 1 / 60 && engine.phase === "playing") {
        const direction = Number(pressed.current.has("ArrowRight") || pressed.current.has("d")) - Number(pressed.current.has("ArrowLeft") || pressed.current.has("a"));
        if (direction) engine.nudge(direction, 1 / 60);
        engine.update(1 / 60); carry -= 1 / 60;
      }
      if (now - paintAt >= 1000 / getVisualFpsLimit() || engine.lives <= 0 || engine.remaining <= 0) { paintAt = now; publishRef.current(); }
      if (engine.phase === "playing") frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [engine, state.phase]);
  useEffect(() => {
    const pause = () => { pressed.current.clear(); pointer.current = null; if (document.hidden && engine.pause()) publishRef.current(); };
    const down = (event: KeyboardEvent) => {
      if (engine.phase !== "playing"||ignoreGameKey(event)) return;
      const key = ({KeyA:"a",KeyD:"d",KeyP:"p",Digit1:"1",Digit2:"2",Digit3:"3",Numpad1:"1",Numpad2:"2",Numpad3:"3"} as Record<string,string>)[event.code]??(event.key.length === 1 ? event.key.toLowerCase() : event.key);
      if (["ArrowLeft","ArrowRight","a","d"].includes(key) && engine.kind !== "ballerina") { event.preventDefault(); pressed.current.add(key); }
      else if (["1","2","3"].includes(key) && engine.kind === "ballerina" && !event.repeat) { event.preventDefault(); engine.action(Number(key) - 1); publishRef.current(); }
      else if (key === "p" && !event.repeat) { event.preventDefault(); engine.pause(); pressed.current.clear(); publishRef.current(); }
      else if (event.code === "Space" && !(event.target instanceof HTMLButtonElement) && !event.repeat && engine.kind !== "ballerina") { event.preventDefault(); engine.action(); publishRef.current(); }
    };
    const up = (event: KeyboardEvent) => {pressed.current.delete(({KeyA:"a",KeyD:"d"} as Record<string,string>)[event.code]??(event.key.length === 1 ? event.key.toLowerCase() : event.key));if(engine.kind==="ballerina"&&/^(?:Digit|Numpad)[1-3]$/.test(event.code)){engine.release(Number(event.code.at(-1))-1);publishRef.current();}};
    const blur = () => { pressed.current.clear(); if (engine.pause()) publishRef.current(); };
    document.addEventListener("visibilitychange", pause); window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { document.removeEventListener("visibilitychange", pause); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [engine]);
  const start = () => {const selected=resolveSkillWager(props.balance??0,bet,!!props.canChooseBet);if (engine.phase === "ready" && props.onStart(selected)) { setLockedBet(selected); engine.start(); publish(); } };
  const close = () => { if (engine.phase === "ready" || engine.phase === "result") props.onClose(); else { engine.finish(); publish(); } };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId || engine.phase !== "playing" || engine.kind === "ballerina") return;
    const svg = event.currentTarget.querySelector("svg");
    const rect = svg?.getBoundingClientRect();
    if (!rect) return;
    // SVG meet may letterbox. Map the finger onto the actual centred 320:440 scene.
    const scale = Math.min(rect.width / 320, rect.height / 440);
    if (scale > 0) engine.steer((event.clientX - rect.left - (rect.width - 320 * scale) / 2) / scale);
  };
  const input = (lane = -1) => { engine.action(lane); publish(); };
  const ready = state.phase === "ready", result = state.phase === "result", paused = state.phase === "paused";
  const reward = memeReward(props.kind, state.score);
  const hitButton = (lane: number, label: string) => <button key={lane} type="button" className={`brainrot-key key-${lane} ${(state.hitLanes ?? []).includes(lane) ? "is-hit" : ""}`} aria-label={label} disabled={state.phase !== "playing"} onPointerDown={event => { if (event.button === 0) { event.preventDefault();try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}input(lane); } }} onPointerUp={()=>{engine.release(lane);publish();}} onPointerCancel={()=>{engine.release(lane);publish();}} onLostPointerCapture={()=>{engine.release(lane);publish();}} onKeyDown={event=>{if(!event.repeat&&(event.code==='Space'||event.key==='Enter')){event.preventDefault();input(lane);}}} onKeyUp={event=>{if(event.code==='Space'||event.key==='Enter'){event.preventDefault();engine.release(lane);publish();}}} onBlur={()=>{engine.release(lane);publish();}} onClick={event => { if (event.detail === 0) {input(lane);engine.release(lane);} }}><span aria-hidden="true">{["◀","◆","▶"][lane]}</span></button>;
  return <GameModal className={`brainrot-game brainrot-${props.kind} phase-${state.phase}`} label={`${drink.name} — ${drink.title}`} onDismiss={close}>
    <div className="brainrot-cabinet">
      <header className="brainrot-heading"><PotionArtwork kind={props.kind} /><div><small>{drink.name} / KNOPIK ARCADE</small><h2>{guide.title}</h2></div><button type="button" aria-label={ready || result ? "К напиткам" : "Завершить игру"} onClick={close}>×</button></header>
      <div className="brainrot-readout"><span>{ready ? "Рекорд" : "Добыча"}<strong>{ready ? `${props.best}/1000` : `${(actualReward??quote(reward+skillWagerPayout(lockedBet,state.score,1000),lockedBet)).toLocaleString("ru-RU")} KC`}</strong></span><span>{ready ? "Бутылка" : "Жизни"}<strong>{ready ? `${drink.price.toLocaleString("ru-RU")} KC` : "♥".repeat(state.lives) + "♡".repeat(3 - state.lives)}</strong></span><span>{ready ? "Максимум" : "Время"}<strong>{ready ? drink.maximumReward.toLocaleString("ru-RU") : `${Math.ceil(state.remaining)}с`}</strong></span></div>
      <div className="brainrot-playfield" role="group" aria-label={props.kind === "ballerina" ? "Три дорожки ритма. Клавиши 1, 2 и 3" : "Игровое поле. Веди пальцем или используй стрелки влево и вправо"} onPointerDown={event => { if (state.phase !== "playing" || engine.kind === "ballerina" || event.button !== 0 || pointer.current !== null) return; pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); move(event); }} onPointerMove={move} onPointerUp={event => { if (pointer.current === event.pointerId) pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }}>
        <BrainrotScene kind={props.kind} state={state} reduced={reduced} />
        {ready && <div className="brainrot-intro"><span className="brainrot-ticket">BRAINROT ARCADE</span><svg viewBox="0 0 64 64" shapeRendering="crispEdges" aria-hidden="true"><BrainrotCharacter kind={props.kind} /></svg><h3>{drink.name}</h3><p>{guide.lead}</p><b>{guide.duration}</b></div>}
        {paused && <div className="brainrot-overlay"><h3>ПАУЗА</h3><p>Время сохранено</p><button type="button" onClick={() => { engine.resume(); publish(); }}>ПРОДОЛЖИТЬ</button></div>}
        {result && <div className="brainrot-overlay brainrot-result"><svg viewBox="0 0 64 64" shapeRendering="crispEdges" aria-hidden="true"><BrainrotCharacter kind={props.kind} pose={1} /></svg><h3>{state.lives > 0 ? "МЕМ ЗАСЧИТАН!" : "БРЕЙНРОТ ПОБЕДИЛ"}</h3><div><CoinArtwork /><strong>+{(actualReward??(reward+skillWagerPayout(lockedBet,state.score,1000))).toLocaleString("ru-RU")}</strong></div><p>{state.score}/1000 · рекорд {Math.max(state.score, props.best)}</p><small>{reward ? "Монеты уже на активном балансе" : "Эта попытка без награды"}</small></div>}
        {!ready && !result && !paused && state.time < 2 && <div className="brainrot-count-in">{Math.ceil(2 - state.time)}<small>ПРИГОТОВЬСЯ</small></div>}
        {!ready && !result && !paused && props.kind === "bombardiro" && <span className="brainrot-wind">{state.wind < 0 ? "←" : "→"} ВЕТЕР {Math.round(Math.abs(state.wind))}</span>}
        {!ready && !result && !paused && props.kind === "bombardiro" && <span className={`brainrot-heat ${state.heat > .8 ? "is-hot" : ""}`}>НАГРЕВ {Math.round(state.heat*100)}%<span><i style={{width:`${Math.round(state.heat*100)}%`}} /></span></span>}
        {!ready && !result && !paused && props.kind === "tralalero" && <span className="brainrot-misses">ПРОПУСКИ <b>{"◆".repeat(state.misses)}{"◇".repeat(3-state.misses)}</b></span>}
      </div>
      <footer className="brainrot-footer">{ready&&<SkillBetPicker balance={props.balance??0} canChooseBet={!!props.canChooseBet} amount={bet} onChange={setBet}/>}{result&&props.onReplay&&<button className="brainrot-primary" type="button" onClick={props.onReplay}>ЕЩЁ РАЗ</button>}
        <p role="status">{ready ? guide.controls : paused ? "Продолжи, когда будешь готов" : result ? "Одна бутылка — одна игра" : state.combo >= 3 ? `КОМБО ×${state.combo}` : props.kind === "ballerina" ? "Длинный хвост — держи клавишу до конца" : props.kind === "tralalero" ? "Мины перепрыгивай · медуз обходи" : props.kind === "verity" ? "Отбивай шар · глитч спасает от лазера" : "Броня — два попадания · обходи выстрелы"}</p>
        {ready || result ? <button type="button" className="brainrot-primary" onClick={ready ? start : props.onClose}>{ready ? "ИГРАТЬ" : "К НАПИТКАМ"}</button> : <div className={`brainrot-controls ${props.kind === "ballerina" ? "is-rhythm" : ""}`}>
          {props.kind === "ballerina" ? [hitButton(0,"Левая дорожка"),hitButton(1,"Средняя дорожка"),hitButton(2,"Правая дорожка")] : <button type="button" className="brainrot-primary" disabled={state.phase !== "playing" || state.time < 2 || state.cooldown > 0} onPointerDown={event => { if (event.button === 0) { event.preventDefault(); input(); } }} onClick={event => { if (event.detail === 0) input(); }}>{state.cooldown > 0 && (props.kind === "tralalero" || props.kind === "verity") ? `${guide.action} · ${state.cooldown.toFixed(1)}с` : props.kind === "bombardiro" && state.cooldown > .3 ? "ОХЛАЖДЕНИЕ" : guide.action}</button>}
          <button type="button" className="brainrot-pause" aria-label={paused ? "Продолжить" : "Пауза"} onClick={() => { pressed.current.clear(); if (paused) engine.resume(); else engine.pause(); publish(); }}>{paused ? "▶" : "Ⅱ"}</button>
        </div>}
      </footer>
    </div>
  </GameModal>;
}
