import {GAME_RELEASES,GAME_VERSION} from "./game-release";
export function GameReleaseHistory(){
 return <details className="settings-fold game-release-history"><summary>История обновлений <span>{GAME_VERSION}</span></summary><div className="game-release-history-body"><p className="game-version-format">Версия · Обновление · Патч</p><ol>{GAME_RELEASES.map(release=><li key={release.version}><article><header><strong>{release.version}</strong><div><h4>{release.title}</h4>{release.date&&<time dateTime={release.date}>{release.date.split("-").reverse().join(".")}</time>}</div></header><ul>{release.changes.map(change=><li key={change}>{change}</li>)}</ul></article></li>)}</ol></div></details>;
}
