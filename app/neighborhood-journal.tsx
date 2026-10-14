import type { MissionCard, NeighborhoodMissionId } from "./neighborhood-missions";
import { MissionIcon } from "./neighborhood-mission-art";
export function NeighborhoodJournal({missions,badgeQuest,onTrack,onBadge,onClose}:{missions:MissionCard[];badgeQuest:number;onTrack:(id:NeighborhoodMissionId)=>void;onBadge?:()=>void;onClose:()=>void}){
  const completed=missions.filter(m=>m.status===2).length+Number(badgeQuest===3);
  return <section className="neighborhood-journal" aria-label="Журнал заданий квартала">
    <header><div><small>ИСТОРИИ НАШЕГО КВАРТАЛА</small><h2>Маленькие добрые дела</h2></div><strong aria-label={`Завершено ${completed} из 7`}>{completed}<span>/7</span></strong></header>
    <div className="neighborhood-journal-scroll">
      <article className={`neighborhood-mission-card ${badgeQuest===3?"is-done":""}`}><MissionIcon kind="plant"/><div><small>Миша · двор Кнопика</small><h3>Медный лист</h3><p>{badgeQuest===0?"Поговори с Мишей у лавочки перед домом.":badgeQuest===1?"Найди медный значок возле старой лавочки в парке.":badgeQuest===2?"Верни найденный значок Мише.":"Значок возвращён. Открытка стоит на домашней полке."}</p><span className="neighborhood-mission-reward">{badgeQuest===3?"✓ Получено":"Награда"}: открытка с набережной</span>{badgeQuest<3&&onBadge&&<button type="button" onClick={onBadge}>{badgeQuest===0?"Найти Мишу":"Продолжить задание"} →</button>}</div></article>
      {missions.every(m=>m.status===2)&&<div className="neighborhood-quiet-day"><p>{completed===7?"Все знакомые истории завершены. Квартал остаётся местом для прогулок.":"Сегодня новых просьб нет. Просто погуляй — в другие прогулки появятся новые истории."}</p></div>}
      {missions.map(m=><article key={m.id} className={`neighborhood-mission-card ${m.status===2?"is-done":""} ${m.tracked?"is-tracked":""}`}>
        <MissionIcon kind={m.icon}/><div><small>{m.person} · {m.status===2?"Завершено":m.status===1?"В работе":"Можно начать"}</small><h3>{m.title}</h3><p>{m.status===0?m.description:m.objective}</p>
          {m.status!==0&&<div className="neighborhood-mission-steps" aria-label={`Выполнено ${m.count} из ${m.total}`}><span>{Array.from({length:m.total},(_,i)=><i key={i} className={i<m.count?"is-filled":""}/>)}</span><b>{m.count}/{m.total}</b></div>}
          <span className="neighborhood-mission-reward">{m.status===2?"✓ Получено":"Награда"}: {m.reward}</span>
          {m.status!==2&&<button type="button" onClick={()=>onTrack(m.id)}>{m.status===0?`Найти: ${m.person}`:m.count===m.total?"Вернуться за наградой":m.tracked?"Продолжить задание":"Следить за заданием"} <span aria-hidden="true">→</span></button>}
        </div>
      </article>)}
    </div>
    <footer><p>Новые просьбы появляются в разные прогулки. Начатые дела остаются в журнале.</p><button type="button" className="neighborhood-primary" onClick={onClose}>Вернуться к прогулке</button></footer>
  </section>;
}
