"use client";

const CODES = [
  ["GOCOINS 10000", "Начислить активные монеты. Сумму можно менять."],
  ["GOSAFE 10000", "Начислить монеты прямо в сейф. Сумму можно менять."],
  ["GOD", "Включить или выключить бессмертие в погоне и защиту от укуса в кликере."],
  ["GOMAGNET", "Включить или выключить магнит на все три полосы в погоне."],
  ["GOTURBO", "Включить или выключить ускоренную погоню: скорость ×1,55."],
  ["GOBOOST", "Добавить минуту Живчика: зелёные глаза и тап ×4."],
  ["GOLOOT", "Добавить 5 обычных и 2 больших кейса. Заполнить все напитки и корм до 25."],
  ["GODRESS", "Получить всю одежду и оформления без покупки, добавить по 5 улучшений для головных уборов."],
  ["GOREST", "Снять усталость и вернуть спокойное настроение."],
  ["GOSPARK", "Закрыть настройки и запустить пиксельный салют на главном экране."],
  ["GOFXOFF", "Выключить бессмертие, магнит, турбо, Живчик и режим без усталости."],
  ["MEDOED 500", "Старый код: активные монеты. Без суммы начисляет 500."],
  ["BAOBAB", "Старый код защиты от укуса. Для админа также включает бессмертие в погоне."],
  ["YELLOW", "Включить или выключить режим без усталости."],
  ["HASBULA", "Одноразовый подарок: 1 000 активных монет."],
] as const;

export const ADMIN_COMMANDS = new Set(CODES.slice(0, 11).map(([code]) => code.split(" ")[0].toLowerCase()));

export function AdminCheatConsole({ code, message, modes, onChange, onSubmit }: { code: string; message: string; modes: string[]; onChange: (code: string) => void; onSubmit: () => void }) {
  return <details className="settings-fold admin-cheats">
    <summary>Чит-коды <span>АДМИН</span></summary>
    <div className="admin-cheat-content">
      <form className="admin-cheat-form" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
        <label htmlFor="admin-cheat-code">Код и сумма, если нужна</label>
        <div><input id="admin-cheat-code" value={code} placeholder="GOCOINS 10000" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={48} onChange={event => onChange(event.currentTarget.value)} /><button type="submit">Применить</button></div>
        {message && <p role="status">{message}</p>}
      </form>
      {modes.length > 0 && <p className="admin-cheat-modes">Включено: {modes.join(" · ")}</p>}
      <p className="admin-cheat-note">Регистр не важен. Магнит и турбо действуют до перезагрузки игры. Монеты и предметы сохраняются.</p>
      <dl className="admin-cheat-list">{CODES.map(([command, description]) => <div key={command}><dt><code>{command}</code></dt><dd>{description}</dd></div>)}</dl>
    </div>
  </details>;
}
