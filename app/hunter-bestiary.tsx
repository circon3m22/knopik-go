const ENTRIES=[
 ['grunt','Сахур с битой','Подходит вплотную. Отходи после замаха.'],
 ['gunner','Стрелок','Держит дистанцию. Используй укрытия.'],
 ['charger','Таран','Красная дорожка показывает направление рывка.'],
 ['armored','Броненосец','Броня держит фронтальный удар. Обходи со спины.'],
 ['demolisher','Подрывник','Заряд взрывается по метке. Сразу смени позицию.'],
 ['stalker','Следопыт','Быстро сближается и делает короткий рывок. Уходи поперёк дорожки.'],
 ['marksman','Дальний стрелок','Долго готовит быстрый выстрел. Спрячься после появления визира.'],
 ['boss','Вожак','Чередует атаки и вызывает подкрепление на половине здоровья.'],
] as const;
export function HunterBestiary(){return <details className="hunter-bestiary"><summary>Полевой справочник · 8 видов Сахуров <span>＋</span></summary><div>{ENTRIES.map(([id,name,copy])=><article key={id}><svg viewBox="0 0 48 58" shapeRendering="crispEdges" aria-hidden="true"><path d="M12 3h24v38H12Z M14 41h8v14h-8Zm12 0h8v14h-8Z" fill="#b8844e"/><path d="M15 6h5v30h-5Zm13 1h4v22h-4Z" fill="#e0b477"/><path d="M15 13h7v7h-7Zm11 0h7v7h-7Z" fill="#f2e6c2"/><path d="M18 15h3v5h-3Zm9 0h3v5h-3Z" fill="#273d32"/><path d="M19 29h10v3H19Z" fill="#49392a"/>{id!=='grunt'&&<><path d="M9 3h30v6H9Z M11 31h26v11H11Z" fill={id==='stalker'?'#648050':id==='marksman'?'#769a9d':id==='boss'?'#916e4c':'#596f70'}/><path d="M15 33h18v3H15Z" fill="#d6c48a"/></>}{id==='marksman'&&<path d="M26 11h12v5H26Z" fill="#dfb56e"/>}{id==='boss'&&<path d="M10 3V0h7v3h4V0h6v3h5V0h7v7H10Z" fill="#dfbd6f"/>}</svg><div><h4>{name}</h4><p>{copy}</p></div></article>)}</div></details>;}
