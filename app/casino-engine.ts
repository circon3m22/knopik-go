/** Pure rules for the six arcade tables. All multipliers include the returned stake. */
export const CASINO_KINDS = ['espresso','grape','whiteTea','ginger','peach','currant','hibiscus','tonic'] as const;
export type CasinoKind = typeof CASINO_KINDS[number];
export const CASINO_GAMES = {
 hibiscus:{name:'Каркаде',title:'Память руин',price:90,color:'#bf7596',maxMultiplier:1.9,rules:'Запомни четыре сигнала на каменных плитах и повтори их порядок. Точное повторение возвращает ставку ×1.9, ошибка завершает раунд. Одна бутылка на попытку.'},
 tonic:{name:'Тоник',title:'Путь реликвий',price:110,color:'#8fbdaf',maxMultiplier:2.5,rules:'В каждой из трёх комнат два безопасных прохода из трёх. Выбери дверь или забери находки: ×1.25 после первой комнаты, ×1.8 после второй, ×2.5 после третьей. Ловушка завершает раунд. Все ловушки выбираются до первого хода.'},
 espresso:{name:'Эспрессо',title:'Кнопик 21',price:120,color:'#b78667',maxMultiplier:3,rules:'Набери ближе к 21, чем дилер. Туз — 1 или 11. Дилер берёт до 17 и стоит на мягких 17. Победа ×2, натуральный блэкджек ×2.5, ничья возвращает ставку. Удвоение после двух карт: ещё одна ставка и одна карта. Разделения и страховки нет.'},
 grape:{name:'Виноградная газировка',title:'Пиксельная рулетка',price:160,color:'#b698d4',maxMultiplier:36,rules:'Европейское колесо: числа 0–36 равновероятны. Число ×36, цвет, чётность и половина ×2. Ноль проигрывает всем внешним ставкам. До вращения выбор можно менять.'},
 whiteTea:{name:'Белый чай',title:'Баккара',price:140,color:'#e6deba',maxMultiplier:9,rules:'Карты 2–9 по номиналу, 10 и картинки — 0, туз — 1. Счёт — последняя цифра суммы. Добор по правилам баккары. Игрок ×2, банкир ×1.95, ничья ×9. При ничьей ставки на игрока и банкира возвращаются.'},
 ginger:{name:'Имбирный эль',title:'Три кости',price:180,color:'#dfad64',maxMultiplier:31,rules:'Три независимые кости. Мало: 4–10, много: 11–17, тройка проигрывает этим ставкам; выплата ×2. Любая пара (ровно две одинаковые) ×2, любая тройка ×31, сумма 10 ×7. Все выплаты включают ставку.'},
 peach:{name:'Персиковый лимонад',title:'Плинко',price:100,color:'#eda997',maxMultiplier:26,rules:'Шар проходит 8 рядов; на каждом равный шанс идти влево или вправо. Карманы и выплаты показаны до старта. Риск меняет таблицу выплат. Анимация следует уже выбранному пути; нажатие на шар не меняет исход.'},
 currant:{name:'Смородиновый энергетик',title:'Разгон',price:200,color:'#9f8cc3',maxMultiplier:100,rules:'Множитель растёт до случайной остановки. Забери до неё или заранее задай автовывод. Возможен срыв сразу на ×1.00. Максимум ×100 с автоматическим выводом. Уход из окна не останавливает раунд.'},
} as const;
export const isCasinoKind=(kind:string):kind is CasinoKind=>CASINO_KINDS.some(k=>k===kind);
export type CasinoInventory=Record<CasinoKind,number>;
export type CasinoStats=Record<CasinoKind,{plays:number;wins:number;best:number}>;
export const createCasinoInventory=():CasinoInventory=>Object.fromEntries(CASINO_KINDS.map(k=>[k,0])) as CasinoInventory;
export const createCasinoStats=():CasinoStats=>Object.fromEntries(CASINO_KINDS.map(k=>[k,{plays:0,wins:0,best:0}])) as CasinoStats;
export function unit(random:()=>number=Math.random){const n=random();return Number.isFinite(n)?Math.max(0,Math.min(.999999999,n)):.5;}
export function payout(bet:number,multiplier:number){return Number.isSafeInteger(bet)&&bet>0&&Number.isFinite(multiplier)?Math.min(Number.MAX_SAFE_INTEGER,Math.floor(bet*Math.max(0,multiplier))):0;}
export type Card={rank:number;suit:number};
export function shuffledDeck(random:()=>number=Math.random):Card[]{
 const deck=Array.from({length:52},(_,i)=>({rank:i%13+1,suit:Math.floor(i/13)}));
 for(let i=51;i>0;i--){const j=Math.floor(unit(random)*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;
}
export function handValue(cards:readonly Card[]){let total=0,aces=0;for(const c of cards){total+=Math.min(10,c.rank);if(c.rank===1)aces++;}while(aces>0&&total+10<=21){total+=10;aces--;}return total;}
export const natural=(cards:readonly Card[])=>cards.length===2&&handValue(cards)===21;
export class BlackjackHand {
 readonly deck:Card[];player:Card[]=[];dealer:Card[]=[];done=false;multiplier=0;doubled=false;
 constructor(random:()=>number=Math.random){this.deck=shuffledDeck(random);this.player=[this.draw(),this.draw()];this.dealer=[this.draw(),this.draw()];if(natural(this.player)||natural(this.dealer))this.settle();}
 private draw(){return this.deck.pop()!;}
 hit(){if(this.done)return false;this.player.push(this.draw());if(handValue(this.player)>21){this.done=true;this.multiplier=0;}else if(handValue(this.player)===21)this.stand();return true;}
 stand(){if(this.done)return false;while(handValue(this.dealer)<17)this.dealer.push(this.draw());this.settle();return true;}
 double(){if(this.done||this.player.length!==2)return false;this.doubled=true;this.player.push(this.draw());this.stand();return true;}
 private settle(){const p=handValue(this.player),d=handValue(this.dealer);this.multiplier=p>21?0:natural(this.dealer)?(natural(this.player)?1:0):natural(this.player)?2.5:d>21||p>d?2:p===d?1:0;this.done=true;}
}
export const RED_NUMBERS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const ROULETTE_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export type RouletteBet='red'|'black'|'even'|'odd'|'low'|'high'|number;
export function rouletteMultiplier(number:number,bet:RouletteBet){if(typeof bet==='number')return number===bet?36:0;if(number===0)return 0;return (bet==='red'?RED_NUMBERS.has(number):bet==='black'?!RED_NUMBERS.has(number):bet==='even'?number%2===0:bet==='odd'?number%2===1:bet==='low'?number<=18:number>=19)?2:0;}
export type BaccaratBet='player'|'banker'|'tie';
export const baccaratValue=(cards:readonly Card[])=>cards.reduce((n,c)=>n+(c.rank<10?c.rank:0),0)%10;
export function dealBaccarat(random:()=>number=Math.random){
 const deck=shuffledDeck(random),draw=()=>deck.pop()!,player=[draw(),draw()],banker=[draw(),draw()];
 const p=baccaratValue(player),b=baccaratValue(banker);
 if(p<8&&b<8){let third:number|null=null;if(p<=5){const card=draw();player.push(card);third=card.rank<10?card.rank:0;}
 const take=third===null?b<=5:b<=2||b===3&&third!==8||b===4&&third>=2&&third<=7||b===5&&third>=4&&third<=7||b===6&&third>=6&&third<=7;
 if(take)banker.push(draw());}
 const pv=baccaratValue(player),bv=baccaratValue(banker),winner:BaccaratBet=pv===bv?'tie':pv>bv?'player':'banker';
 return {player,banker,winner,playerValue:pv,bankerValue:bv};
}
export function baccaratMultiplier(winner:BaccaratBet,bet:BaccaratBet){return winner==='tie'?(bet==='tie'?9:1):winner!==bet?0:bet==='banker'?1.95:2;}
export type DiceBet='low'|'high'|'pair'|'triple'|'ten';
export function diceMultiplier(dice:readonly number[],bet:DiceBet){const total=dice.reduce((n,d)=>n+d,0),unique=new Set(dice).size;return bet==='triple'?(unique===1?31:0):bet==='pair'?(unique===2?2:0):bet==='ten'?(total===10?7:0):unique===1?0:(bet==='low'?total>=4&&total<=10:total>=11&&total<=17)?2:0;}
export const PLINKO_TABLES={low:[5,2,1.2,.8,.6,.8,1.2,2,5],medium:[12,3,1.5,.5,.2,.5,1.5,3,12],high:[26,4,1,.2,0,.2,1,4,26]} as const;
export type PlinkoRisk=keyof typeof PLINKO_TABLES;
export function plinkoPath(random:()=>number=Math.random){return Array.from({length:8},()=>unit(random)<.5?0:1);}
export function crashPoint(random:()=>number=Math.random){return Math.min(100,Math.max(1,Math.floor(.96/(1-unit(random))*100)/100));}
export const crashMultiplier=(elapsedMs:number)=>Math.min(100,Math.exp(Math.max(0,elapsedMs)/6500));
export const crashTime=(point:number)=>6500*Math.log(point);
export function crashCashout(point:number,elapsedMs:number,auto:number|null){
 const current=crashMultiplier(elapsedMs);
 if(auto!==null&&auto>=1.01&&auto<=point&&auto<=current)return {done:true,multiplier:auto,crashed:false};
 if(elapsedMs>=crashTime(point))return {done:true,multiplier:point===100?100:0,crashed:point<100};
 return {done:false,multiplier:current,crashed:false};
}
/** Uniform fixed mine board, no outcome is chosen after the click. */
export function mineBoard(count:number,random:()=>number=Math.random){const cells=Array.from({length:25},(_,i)=>i);for(let i=24;i>0;i--){const j=Math.floor(unit(random)*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}return cells.slice(0,Math.max(1,Math.min(24,Math.floor(count))));}
export function boardMultiplier(mines:number,revealed:number){if(revealed<=0)return 1;let chance=1;for(let i=0;i<Math.min(revealed,25-mines);i++)chance*=(25-mines-i)/(25-i);return Math.floor(.96/chance*100)/100;}
export type CasinoLedger={kind:CasinoKind;phase:'ready'|'playing'|'settled';bet:number;doubled:boolean};
export function commitCasinoRound(ledger:CasinoLedger,stock:number,balance:number,bet:number){if(ledger.phase!=='ready'||!Number.isSafeInteger(stock)||stock<1||!Number.isSafeInteger(balance)||balance<1||!Number.isSafeInteger(bet)||bet<1||bet>balance)return false;ledger.phase='playing';ledger.bet=bet;return true;}
export function doubleCasinoRound(ledger:CasinoLedger,balance:number,bet:number){if(ledger.kind!=='espresso'||ledger.phase!=='playing'||!Number.isSafeInteger(balance)||ledger.doubled||bet!==ledger.bet||bet>balance||bet>Number.MAX_SAFE_INTEGER/2)return false;ledger.doubled=true;ledger.bet*=2;return true;}
export function settleCasinoRound(ledger:CasinoLedger,kind:CasinoKind,requested:number){if(ledger.phase!=='playing'||ledger.kind!==kind)return null;ledger.phase='settled';return Number.isFinite(requested)?Math.max(0,Math.min(payout(ledger.bet,CASINO_GAMES[kind].maxMultiplier),Math.floor(requested))):0;}
