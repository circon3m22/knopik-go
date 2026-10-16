import {CASINO_GAMES,CASINO_KINDS,type CasinoKind} from './casino-engine.ts';
import {DRINK_GAMES,type DrinkGameKind} from './drink-game-engine.ts';
export type ArcadeDrink=DrinkGameKind|CasinoKind|'pitbull'|'cocoa'|'bergamot';
export type ArcadeCategory='Казино'|'Реакция'|'Память'|'Аркады';
export const ARCADE_CATALOG:ReadonlyArray<{id:ArcadeDrink;title:string;category:ArcadeCategory;rules:string}>=[
 {id:'pitbull',title:'Колесо Питбуля',category:'Казино',rules:'Выбери вероятность победы. Чем ниже шанс, тем выше множитель. Расходуется бутылка и ставка из активных KC. Ирокез позволяет выбрать размер ставки.'},
 {id:'cocoa',title:'Какао-машина',category:'Казино',rules:'Три механических барабана. Пара ×1.35, тройка ×3.2, три семёрки ×4, три алмаза ×6. Выплаты включают ставку. Шансы зависят от сложности игры.'},
 {id:'bergamot',title:'Чайное поле',category:'Казино',rules:'Поле 5×5. Выбери 1, 3 или 5 мин до старта. Открывай безопасные плитки и забери выигрыш до мины. Показанная выплата включает ставку. Поле фиксируется до первого открытия.'},
 {id:'lime',title:DRINK_GAMES.lime.title,category:'Реакция',rules:'Одна бутылка — один точный бросок. Нажми, когда лайм над стаканом. Промах или истечение шести секунд заканчивает попытку. За точность — до 120 KC.'},
 {id:'matcha',title:DRINK_GAMES.matcha.title,category:'Память',rules:'Запомни мелодию девяти труб и повтори порядок. Начни с пяти сигналов. 25 уровней, до 160 KC. При ошибке увидишь ожидавшуюся трубу.'},
 ...(['tralalero','ballerina','bombardiro','verity'] as const).map(id=>({id,title:DRINK_GAMES[id].title,category:'Аркады' as const,rules:({tralalero:'Собирай кроссовки, перепрыгивай мины, обходи медуз. Три пропуска отнимают жизнь. Морские зоны меняются по ходу игры.',ballerina:'Три дорожки, синкопы, аккорды и длинные ноты. Нажми и удерживай длинную ноту до конца. Клавиши 1, 2, 3 или кнопки на экране.',bombardiro:'Управляй бомбардировщиком с учётом ветра и перегрева. Разбивай броню, уклоняйся от ответного огня. В конце — командир волны.',verity:'Отбивай Верити платформой. Несколько комнат, разные блоки и лазеры. Глитч даёт защиту; переключатели открывают слабые места.'})[id]})),
 ...CASINO_KINDS.map(id=>({id,title:CASINO_GAMES[id].title,category:'Казино' as const,rules:CASINO_GAMES[id].rules})),
];
export const ARCADE_DRINKS=ARCADE_CATALOG.map(g=>g.id);
