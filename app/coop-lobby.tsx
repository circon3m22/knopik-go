"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import {GameModal} from "./game-modal";
import {getSupabaseClient} from "./supabase-client";
import {CoopSession,coopSessionKey} from "./coop-session";
import {ADVENTURE_LEVELS} from "./adventure-levels";
import {KNOPIK_SKINS} from "./knopik-skins";
import {COSMETICS} from "./cosmetic-engine";
import type {KnopikEquipment} from "./knopik-equipment-state";
import {COOP_PROTOCOL,COOP_CODE_PATTERN,normalizeCoopCode,coopInvite} from "./coop-protocol";
import {CoopGame} from "./coop-game";
import type {CloudAccount} from "./cloud-account";
import type {ThemeId} from "./cosmetic-engine";
import type {AdventureSound} from "./adventure-engine";
import type {FpsLimit,WorldGraphicsMode} from "./render-preferences";

type Props={equipment:KnopikEquipment;account:CloudAccount;theme:ThemeId;fpsLimit:FpsLimit;worldGraphics:WorldGraphicsMode;onClose:()=>void;onSound:(kind:AdventureSound)=>void};
export function CoopLobby(props:Props){
 const [session,setSession]=useState<CoopSession|null>(null);
 useEffect(()=>{
  const controller=new CoopSession(getSupabaseClient(),props.account.userId);
  setSession(controller); // eslint-disable-line react-hooks/set-state-in-effect -- external room lifecycle is owned by this effect
  const invite=normalizeCoopCode(new URLSearchParams(window.location.search).get("coop")??"");
  let restore="";try{restore=JSON.parse(sessionStorage.getItem(coopSessionKey(props.account.userId))??"null")?.code??"";}catch{}
  if(COOP_CODE_PATTERN.test(invite||restore))void controller.enter("join",invite||restore);
  return()=>controller.dispose();
 },[props.account.userId]);
 if(!session)return <GameModal className={`coop-modal pixel-game theme-${props.theme}`} label="Игра вдвоём"><p role="status">Готовим комнату…</p></GameModal>;
 return <CoopRoomPanel {...props} session={session}/>;
}
function CoopRoomPanel({session,...props}:Props&{session:CoopSession}){
 const connection=useSyncExternalStore(session.subscribe,session.snapshot,session.snapshot);
 const [code,setCode]=useState(""),[shareMessage,setShareMessage]=useState(""),[closing,setClosing]=useState(false);
 const room=connection.room,slot=session.slot;
 useEffect(()=>{if(room&&room.status!=="closed"){const url=new URL(window.location.href);url.searchParams.set("coop",room.code);window.history.replaceState(null,"",url.pathname+url.search+url.hash);}},[room?.code,room?.status]); // eslint-disable-line react-hooks/exhaustive-deps -- only invitation identity changes the URL
 const {skin="classic",hat,mohawk,accessory}=props.equipment;
 useEffect(()=>{const own=slot===0?room?.host_equipment:room?.guest_equipment;const version=slot===0?room?.host_protocol:room?.guest_protocol;if(room?.status==="waiting"&&!connection.busy&&!connection.error&&(version!==COOP_PROTOCOL||(own?.skin??"classic")!==skin||own?.hat!==hat||own?.mohawk!==mohawk||own?.accessory!==accessory))void session.configure({skin,hat,mohawk,accessory});},[session,room?.id,room?.status,room?.host_equipment,room?.guest_equipment,room?.host_protocol,room?.guest_protocol,slot,connection.busy,skin,hat,mohawk,accessory]); // eslint-disable-line react-hooks/exhaustive-deps -- sync on entering a lobby, not on each heartbeat
 const leave=async()=>{if(closing)return;setClosing(true);await session.leave();const url=new URL(window.location.href);url.searchParams.delete("coop");window.history.replaceState(null,"",url.pathname+url.search+url.hash);props.onClose();};
 const invitation=room&&typeof window!=="undefined"?coopInvite(room.code,window.location.origin,process.env.NEXT_PUBLIC_BASE_PATH??""):"";
 const copy=async()=>{try{await navigator.clipboard.writeText(invitation);setShareMessage("Ссылка скопирована. Отправь её напарнику.");}catch{setShareMessage("Скопируй ссылку из поля ниже или передай код комнаты.");}};
 if(room?.status==="playing")return <CoopGame key={`${room.id}:${room.round}:${room.seed}`} session={session} room={room} theme={props.theme} fpsLimit={props.fpsLimit} worldGraphics={props.worldGraphics} busyLeaving={closing} onLeave={()=>void leave()} onSound={props.onSound}/>;
 return <GameModal className={`coop-modal pixel-game theme-${props.theme}`} label="Игра вдвоём" onDismiss={()=>{if(!room)void leave();}}>
  <section className="coop-lobby-card"><header className="coop-lobby-heading"><div><small>KNOPIK GO · ОНЛАЙН</small><h1>Вдвоём под город</h1></div><button className="adventure-pause" type="button" aria-label="Закрыть игру вдвоём" disabled={closing||connection.busy} onClick={()=>void leave()}><span aria-hidden="true">×</span></button></header>
   <p className="coop-lobby-intro">Два Кнопика, общие задачи и один выход. Прикрой напарника и помоги ему подняться, если он ранен.</p>
   {!room&&<div className="coop-entry"><button type="button" className="adventure-primary" disabled={connection.busy} onClick={()=>void session.enter("create")}>{connection.busy?"Подключаемся…":"Создать комнату"}</button><form onSubmit={e=>{e.preventDefault();if(COOP_CODE_PATTERN.test(code))void session.enter("join",code);}}><label htmlFor="coop-code">Есть код приглашения?</label><div className="coop-code-entry"><input id="coop-code" value={code} maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABC234" onChange={e=>setCode(normalizeCoopCode(e.target.value).slice(0,6))}/><button className="adventure-secondary" type="submit" disabled={connection.busy||!COOP_CODE_PATTERN.test(code)}>Войти</button></div></form></div>}
   {room?.status==="closed"&&<div className="coop-room-closed"><h2>Комната закрыта</h2><p>Ведущий или напарник вышел из игры.</p><button type="button" className="adventure-primary" onClick={()=>void leave()}>Вернуться в игру</button></div>}
   {room?.status==="waiting"&&<>
    <div className="coop-invitation"><span>Код комнаты</span><strong>{room.code}</strong><button type="button" className="adventure-secondary" onClick={()=>void copy()}>Скопировать приглашение</button><input aria-label="Ссылка приглашения" readOnly value={invitation} onFocus={e=>e.target.select()}/>{shareMessage&&<small role="status">{shareMessage}</small>}</div>
    <div className="coop-level-picker"><label htmlFor="coop-mode">Маршрут{slot===0?" · выбирает ведущий":" · выбор ведущего"}</label><select id="coop-mode" value={room.mode} disabled={slot!==0||connection.busy} onChange={e=>void session.configure(props.equipment,e.target.value as typeof room.mode,1)}><option value="campaign">Кампания · 35 уровней</option><option value="arcade">Аркада</option><option value="abyss">Бездна</option></select>{room.mode==="campaign"?<select aria-label="Уровень кампании" disabled={slot!==0||connection.busy} value={room.level_id} onChange={e=>void session.configure(props.equipment,room.mode,Number(e.target.value))}>{ADVENTURE_LEVELS.map((level,i)=><option key={level.id} value={level.id}>{i+1}. {level.name}</option>)}</select>:<label>{room.mode==="abyss"?"Этаж Бездны":"Сектор Аркады"}<input type="number" min={1} max={9999} key={`${room.mode}:${room.level_id}`} defaultValue={room.level_id} disabled={slot!==0||connection.busy} onBlur={e=>{const n=Math.max(1,Math.min(9999,Math.floor(Number(e.target.value)||1)));e.target.value=String(n);if(n!==room.level_id)void session.configure(props.equipment,room.mode,n);}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}/></label>}<small>При смене маршрута оба игрока подтверждают готовность заново.</small></div>
    <ol className="coop-members">{[0,1].map(i=>{const name=i===0?room.host_name:room.guest_name,ready=i===0?room.host_ready:room.guest_ready,online=i===slot?connection.connected:connection.peerOnline;return <li key={i} className={`coop-player-${i}`}><span className="coop-member-number">{i+1}</span><div><strong>{name??"Ждём второго игрока"}{i===slot?" · ты":""}</strong><small>{name?`${i===0?"Ведущий · ":""}${online?ready?"Готов":"В комнате":"Подключается…"}`:"Отправь код или ссылку напарнику"}</small>{name&&<small>{KNOPIK_SKINS[(i===0?room.host_equipment:room.guest_equipment).skin??"classic"].name} · {[...(i===0?room.host_equipment:room.guest_equipment).hat?["Шляпа"]:[],...(i===0?room.host_equipment:room.guest_equipment).mohawk?["Ирокез"]:[],...((i===0?room.host_equipment:room.guest_equipment).accessory?[COSMETICS[(i===0?room.host_equipment:room.guest_equipment).accessory!].name]:[])].join(" · ")||"Без одежды"}</small>}</div><span className={`coop-member-status ${online?"online":""}`} aria-label={online?"Подключён":"Не подключён"}/></li>;})}</ol>
    <div className="coop-room-actions"><button type="button" className="adventure-secondary" disabled={connection.busy||!connection.connected||(slot===0?room.host_protocol:room.guest_protocol)!==COOP_PROTOCOL} onClick={()=>void session.act("ready")}>{(slot===0?room.host_ready:room.guest_ready)?"Отменить готовность":"Я готов"}</button>{slot===0?<button type="button" className="adventure-primary" disabled={connection.busy||!connection.connected||!connection.peerOnline||!room.host_ready||!room.guest_ready} onClick={()=>void session.act("start")}>Начать вылазку</button>:<p>Когда оба будут готовы, ведущий начнёт вылазку.</p>}</div>
    <p className="coop-link-status" role="status">{connection.connected?connection.peerOnline?"Оба устройства на связи":"Ждём подключения напарника":"Подключаем закрытую комнату…"}</p>
   </>}
   {connection.error&&<div className="coop-error" role="alert">{connection.error}{room?.status==="waiting"&&<button type="button" disabled={connection.busy} onClick={()=>void session.configure(props.equipment)}>Повторить синхронизацию</button>}{!room&&<button type="button" onClick={()=>void session.enter("join",code||new URLSearchParams(window.location.search).get("coop")||"")}>Повторить подключение</button>}</div>}
   {closing&&<p role="status">Выходим из комнаты…</p>}
   <p className="coop-rules">Нужны интернет и два разных аккаунта с доступом к GO. Одежда берётся из твоего гардероба, оружие соответствует выбранному уровню. Личные монеты, припасы и сюжетный прогресс не расходуются; наград за тренировочную вылазку нет.</p>
  </section>
 </GameModal>;
}
