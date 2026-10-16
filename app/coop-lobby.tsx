"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import {GameModal} from "./game-modal";
import {getSupabaseClient} from "./supabase-client";
import {CoopSession,coopSessionKey} from "./coop-session";
import {COOP_CODE_PATTERN,normalizeCoopCode,coopInvite} from "./coop-protocol";
import {CoopGame} from "./coop-game";
import type {CloudAccount} from "./cloud-account";
import type {ThemeId} from "./cosmetic-engine";
import type {AdventureSound} from "./adventure-engine";
import type {FpsLimit,WorldGraphicsMode} from "./render-preferences";

type Props={account:CloudAccount;theme:ThemeId;fpsLimit:FpsLimit;worldGraphics:WorldGraphicsMode;onClose:()=>void;onSound:(kind:AdventureSound)=>void};
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
 const leave=async()=>{if(closing)return;setClosing(true);await session.leave();const url=new URL(window.location.href);url.searchParams.delete("coop");window.history.replaceState(null,"",url.pathname+url.search+url.hash);props.onClose();};
 const invitation=room&&typeof window!=="undefined"?coopInvite(room.code,window.location.origin,process.env.NEXT_PUBLIC_BASE_PATH??""):"";
 const copy=async()=>{try{await navigator.clipboard.writeText(invitation);setShareMessage("Ссылка скопирована. Отправь её напарнику.");}catch{setShareMessage("Скопируй ссылку из поля ниже или передай код комнаты.");}};
 if(room?.status==="playing")return <CoopGame key={`${room.id}:${room.round}:${room.seed}`} session={session} room={room} theme={props.theme} fpsLimit={props.fpsLimit} worldGraphics={props.worldGraphics} busyLeaving={closing} onLeave={()=>void leave()} onSound={props.onSound}/>;
 return <GameModal className={`coop-modal pixel-game theme-${props.theme}`} label="Игра вдвоём" onDismiss={()=>{if(!room)void leave();}}>
  <section className="coop-lobby-card"><header className="coop-lobby-heading"><div><small>KNOPIK GO · ОНЛАЙН</small><h1>Вдвоём под город</h1></div><button className="adventure-pause" type="button" aria-label="Закрыть игру вдвоём" disabled={closing||connection.busy} onClick={()=>void leave()}><span aria-hidden="true">×</span></button></header>
   <p className="coop-lobby-intro">Два Кнопика, восемь залов и один выход. Прикрой напарника и помоги ему подняться, если он ранен.</p>
   {!room&&<div className="coop-entry"><button type="button" className="adventure-primary" disabled={connection.busy} onClick={()=>void session.enter("create")}>{connection.busy?"Подключаемся…":"Создать комнату"}</button><form onSubmit={e=>{e.preventDefault();if(COOP_CODE_PATTERN.test(code))void session.enter("join",code);}}><label htmlFor="coop-code">Есть код приглашения?</label><div className="coop-code-entry"><input id="coop-code" value={code} maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABC234" onChange={e=>setCode(normalizeCoopCode(e.target.value).slice(0,6))}/><button className="adventure-secondary" type="submit" disabled={connection.busy||!COOP_CODE_PATTERN.test(code)}>Войти</button></div></form></div>}
   {room?.status==="closed"&&<div className="coop-room-closed"><h2>Комната закрыта</h2><p>Ведущий или напарник вышел из игры.</p><button type="button" className="adventure-primary" onClick={()=>void leave()}>Вернуться в игру</button></div>}
   {room?.status==="waiting"&&<>
    <div className="coop-invitation"><span>Код комнаты</span><strong>{room.code}</strong><button type="button" className="adventure-secondary" onClick={()=>void copy()}>Скопировать приглашение</button><input aria-label="Ссылка приглашения" readOnly value={invitation} onFocus={e=>e.target.select()}/>{shareMessage&&<small role="status">{shareMessage}</small>}</div>
    <ol className="coop-members">{[0,1].map(i=>{const name=i===0?room.host_name:room.guest_name,ready=i===0?room.host_ready:room.guest_ready,online=i===slot?connection.connected:connection.peerOnline;return <li key={i} className={`coop-player-${i}`}><span className="coop-member-number">{i+1}</span><div><strong>{name??"Ждём второго игрока"}{i===slot?" · ты":""}</strong><small>{name?`${i===0?"Ведущий · ":""}${online?ready?"Готов":"В комнате":"Подключается…"}`:"Отправь код или ссылку напарнику"}</small></div><span className={`coop-member-status ${online?"online":""}`} aria-label={online?"Подключён":"Не подключён"}/></li>;})}</ol>
    <div className="coop-room-actions"><button type="button" className="adventure-secondary" disabled={connection.busy||!connection.connected} onClick={()=>void session.act("ready")}>{(slot===0?room.host_ready:room.guest_ready)?"Отменить готовность":"Я готов"}</button>{slot===0?<button type="button" className="adventure-primary" disabled={connection.busy||!connection.connected||!connection.peerOnline||!room.host_ready||!room.guest_ready} onClick={()=>void session.act("start")}>Начать вылазку</button>:<p>Когда оба будут готовы, ведущий начнёт вылазку.</p>}</div>
    <p className="coop-link-status" role="status">{connection.connected?connection.peerOnline?"Оба устройства на связи":"Ждём подключения напарника":"Подключаем закрытую комнату…"}</p>
   </>}
   {connection.error&&<div className="coop-error" role="alert">{connection.error}{!room&&<button type="button" onClick={()=>void session.enter("join",code||new URLSearchParams(window.location.search).get("coop")||"")}>Повторить подключение</button>}</div>}
   {closing&&<p role="status">Выходим из комнаты…</p>}
   <p className="coop-rules">Нужны интернет и два разных аккаунта с доступом к GO. В этой вылазке доступны кулаки, сабля и пистолет. Личные монеты, припасы и сюжетный прогресс не расходуются; наград за тренировочную вылазку нет.</p>
  </section>
 </GameModal>;
}
