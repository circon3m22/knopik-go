import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {CASINO_KINDS,CASINO_GAMES,BlackjackHand,shuffledDeck,handValue,natural,rouletteMultiplier,ROULETTE_ORDER,RED_NUMBERS,dealBaccarat,baccaratValue,baccaratMultiplier,diceMultiplier,plinkoPath,PLINKO_TABLES,crashPoint,crashMultiplier,crashTime,crashCashout,mineBoard,boardMultiplier,commitCasinoRound,doubleCasinoRound,settleCasinoRound,payout} from '../app/casino-engine.ts';
import {ARCADE_CATALOG} from '../app/arcade-catalog.ts';
import {LAB_RECIPES,defaultLaboratory,startLaboratoryBrew,claimLaboratoryBrew,canBuyLabDrink} from '../app/laboratory-engine.ts';
import {BUFF_CATALOG,emptyBuffStock,purchaseShelfBuff} from '../app/buff-shelf-engine.ts';
import {createDefaultSave,sanitizeSave,SAVE_VERSION} from '../app/game-logic.ts';
import {barDrinkBlock} from '../app/bar-drink-access.ts';
import {BrainrotEngine} from '../app/brainrot-engine.ts';
import {VerityField} from '../app/verity-engine.ts';
const {DetailedPotion}=await import('../app/drink-bottle-art.tsx');
const {CasinoGame}=await import('../app/casino-game.tsx');
const {ArcadeLibrary}=await import('../app/arcade-library.tsx');
const {TeaField}=await import('../app/tea-field.tsx');
const {BrainrotScene}=await import('../app/brainrot-artwork.tsx');
const rng=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const card=n=>({rank:n,suit:0});
const tick=(g,t)=>{while(g.phase==='playing'&&g.time<t-1e-9)g.update(Math.min(1/120,t-g.time));};
const ledger=kind=>({kind,phase:'ready',bet:0,doubled:false});

test('catalog contains fifteen unique playable games and every drink has a finite recipe and artwork',()=>{
 assert.equal(ARCADE_CATALOG.length,15);assert.equal(new Set(ARCADE_CATALOG.map(g=>g.id)).size,15);assert.equal(CASINO_KINDS.length,6);assert.equal(LAB_RECIPES.length,18);
 for(const recipe of LAB_RECIPES){assert.ok(BUFF_CATALOG[recipe.id]);assert.ok(Object.keys(emptyBuffStock()).includes(recipe.id));if(recipe.requires)assert.ok(LAB_RECIPES.some(r=>r.id===recipe.requires));const svg=renderToStaticMarkup(createElement(DetailedPotion,{kind:recipe.id}));assert.ok(svg.includes('viewBox="0 0 64 96"'));assert.ok(!svg.includes('undefined'));}
});
test('arcade drinks unlock after completed brewing, while utility buffs can be bought immediately',()=>{
 let lab={...defaultLaboratory(),materials:{citrus:99,leaf:99,pearl:99,spark:99}},now=1000;
 for(const r of LAB_RECIPES){const instant=['heal','pepsi','zhivchik'].includes(r.id);assert.equal(canBuyLabDrink(lab,r.id),instant);assert.equal(!!purchaseShelfBuff(r.id,0,999999,731,lab),instant);const brewing=startLaboratoryBrew(lab,r.id,now,0);assert.ok(brewing,r.id);assert.equal(canBuyLabDrink(brewing,r.id),instant);assert.equal(claimLaboratoryBrew(brewing,now+r.duration-1,0),null);const claimed=claimLaboratoryBrew(brewing,now+r.duration,0);assert.equal(claimed.stock,1);assert.equal(claimLaboratoryBrew(claimed.progress,now+r.duration,1),null);lab=claimed.progress;assert.deepEqual(purchaseShelfBuff(r.id,1,999999,731,lab),{walletCoins:999999-BUFF_CATALOG[r.id].price,vaultCoins:731,count:2});now+=r.duration+1;}
 assert.equal(lab.crafted,18);assert.deepEqual(purchaseShelfBuff('food',0,200,731,defaultLaboratory()),{walletCoins:50,vaultCoins:731,count:1});
});
test('healing/shield brews obey their three-bottle cap and leave a ready brew collectible after freeing stock',()=>{
 for(const id of ['heal','pepsi']){const p={...defaultLaboratory(),materials:{citrus:99,leaf:99,pearl:99,spark:99},unlocked:LAB_RECIPES.map(r=>r.id)};assert.equal(startLaboratoryBrew(p,id,1000,3),null);const b=startLaboratoryBrew(p,id,1000,2);assert.ok(b);assert.equal(claimLaboratoryBrew(b,50000,3),null);assert.equal(claimLaboratoryBrew(b,50000,2).stock,3);}
});
test('save33 migration preserves wallet, aura, skins, old bottles, records and unfinished brew; v34 roundtrips casino progress',()=>{
 const old={...createDefaultSave(),version:33,walletCoins:1234,vaultCoins:789,auraCoins:49,ownedSkins:['classic','shiba-black'],activeSkin:'shiba-black',colaCount:5,limeCount:3,brainrotInventory:{tralalero:2,ballerina:4,bombardiro:0,verity:1},laboratory:{...defaultLaboratory(),unlocked:['lime','matcha'],job:{recipe:'verity',startedAt:1000,careMask:3}}};
 const migrated=sanitizeSave(old);for(const key of ['walletCoins','vaultCoins','auraCoins','activeSkin','colaCount','limeCount','laboratory','brainrotInventory'])assert.deepEqual(migrated[key],old[key],key);assert.equal(migrated.version,SAVE_VERSION);
 const save={...migrated,casinoInventory:{...migrated.casinoInventory,espresso:4},casinoStats:{...migrated.casinoStats,espresso:{plays:3,wins:2,best:500}}};assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(save))),save);
 const hostile=sanitizeSave({...save,casinoInventory:{espresso:999,grape:-1,whiteTea:NaN},casinoStats:{espresso:{plays:2,wins:99,best:Infinity}}});assert.equal(hostile.casinoInventory.espresso,25);assert.equal(hostile.casinoInventory.grape,0);assert.deepEqual(hostile.casinoStats.espresso,{plays:2,wins:2,best:0});
});
test('casino ledger commits only one bottle/stake and rejects mismatched, duplicate, negative, nonfinite and overspending operations',()=>{
 for(const kind of CASINO_KINDS){const l=ledger(kind);assert.equal(settleCasinoRound(l,kind,100),null);for(const b of [-1,0,NaN,Infinity,1.5,101])assert.equal(commitCasinoRound(l,1,100,b),false);assert.equal(commitCasinoRound(l,0,100,20),false);assert.equal(commitCasinoRound(l,1,100,20),true);assert.equal(commitCasinoRound(l,1,100,20),false);assert.equal(settleCasinoRound(l,'wrong',100),null);assert.equal(settleCasinoRound(l,kind,Infinity),0);assert.equal(settleCasinoRound(l,kind,1000),null);}
 const l=ledger('espresso');commitCasinoRound(l,1,200,50);assert.equal(doubleCasinoRound(l,100,49),false);assert.equal(doubleCasinoRound(l,49,50),false);assert.equal(doubleCasinoRound(l,100,50),true);assert.equal(l.bet,100);assert.equal(doubleCasinoRound(l,100,100),false);assert.equal(settleCasinoRound(l,'espresso',999999),300);assert.equal(doubleCasinoRound(l,1000,100),false);
});
test('decks contain 52 unique cards; aces soften; blackjack beats 21 from three cards and dealer stands on soft 17',()=>{
 for(let seed=0;seed<100;seed++){const d=shuffledDeck(rng(seed));assert.equal(d.length,52);assert.equal(new Set(d.map(c=>c.rank+13*c.suit)).size,52);}
 assert.equal(handValue([card(1),card(1),card(9)]),21);assert.equal(handValue([card(1),card(13),card(7)]),18);assert.equal(natural([card(1),card(10)]),true);assert.equal(natural([card(7),card(7),card(7)]),false);
 const h=new BlackjackHand(rng(5));h.done=false;h.player=[card(10),card(9)];h.dealer=[card(1),card(6)];h.stand();assert.equal(h.dealer.length,2);assert.equal(h.multiplier,2);assert.equal(h.hit(),false);
 const bust=new BlackjackHand(rng(1));bust.done=false;bust.player=[card(10),card(10)];bust.deck.push(card(9));bust.hit();assert.equal(bust.done,true);assert.equal(bust.multiplier,0);
 for(let seed=1;seed<=1000;seed++){const hand=new BlackjackHand(rng(seed));if(!hand.done){if(seed%2)hand.double();else{while(!hand.done&&handValue(hand.player)<17)hand.hit();if(!hand.done)hand.stand();}}assert.ok(hand.done);assert.ok([0,1,2,2.5].includes(hand.multiplier));assert.ok(hand.player.length+hand.dealer.length<=52);}
});
test('European roulette zero loses outside bets and each number/color/parity has the advertised outcomes',()=>{
 assert.equal(new Set(ROULETTE_ORDER).size,37);assert.equal(RED_NUMBERS.size,18);
 for(const bet of ['red','black','even','odd','low','high']){assert.equal(rouletteMultiplier(0,bet),0);assert.equal(Array.from({length:37},(_,n)=>rouletteMultiplier(n,bet)).filter(Boolean).length,18);}
 for(let n=0;n<37;n++){assert.equal(rouletteMultiplier(n,n),36);assert.equal(rouletteMultiplier((n+1)%37,n),0);}
});
test('baccarat draws follow third-card rules and totals stay within 0–9; tie returns outside stakes',()=>{
 for(let seed=1;seed<=5000;seed++){const d=dealBaccarat(rng(seed)),p=baccaratValue(d.player.slice(0,2)),b=baccaratValue(d.banker.slice(0,2));assert.ok(d.playerValue>=0&&d.playerValue<=9);assert.ok(d.bankerValue>=0&&d.bankerValue<=9);if(p>=8||b>=8){assert.equal(d.player.length,2);assert.equal(d.banker.length,2);}else{assert.equal(d.player.length,p<=5?3:2);const t=d.player.length===3?Math.min(d.player[2].rank,10)%10:null,take=t===null?b<=5:b<=2||b===3&&t!==8||b===4&&t>=2&&t<=7||b===5&&t>=4&&t<=7||b===6&&t>=6&&t<=7;assert.equal(d.banker.length,take?3:2);}}
 assert.equal(baccaratMultiplier('tie','banker'),1);assert.equal(baccaratMultiplier('tie','tie'),9);assert.equal(baccaratMultiplier('banker','banker'),1.95);assert.equal(baccaratMultiplier('banker','player'),0);
});
test('dice outcomes enumerate all 216 possibilities and triple cannot win the low/high bets',()=>{
 const counts={low:0,high:0,pair:0,triple:0,ten:0};for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++)for(const key of Object.keys(counts))if(diceMultiplier([a,b,c],key)>0)counts[key]++;
 assert.deepEqual(counts,{low:105,high:105,pair:90,triple:6,ten:27});for(let n=1;n<=6;n++){assert.equal(diceMultiplier([n,n,n],'low'),0);assert.equal(diceMultiplier([n,n,n],'high'),0);assert.equal(diceMultiplier([n,n,n],'triple'),31);}
});
test('plinko all 256 routes agree with nine pockets; tables are symmetric and remain below a full-stake expected return',()=>{
 for(const table of Object.values(PLINKO_TABLES)){assert.equal(table.length,9);assert.deepEqual([...table].reverse(),table);let sum=0;for(let mask=0;mask<256;mask++){let step=0;const path=plinkoPath(()=>((mask>>step++)&1)?.9:.1);const slot=path.reduce((s,n)=>s+n,0);assert.equal(path.length,8);sum+=table[slot];}assert.ok(sum/256<1);assert.ok(sum/256>.65);}
});
test('crash cashout uses elapsed time, resolves auto before a throttled frame and never awards after the crash',()=>{
 assert.equal(crashPoint(()=>0),1);assert.equal(crashPoint(()=>1),100);assert.equal(crashMultiplier(0),1);const point=2.5,time=crashTime(point);assert.equal(crashCashout(point,time+1,null).multiplier,0);assert.equal(crashCashout(point,time-1,null).done,false);assert.deepEqual(crashCashout(point,time+60000,2),{done:true,multiplier:2,crashed:false});assert.equal(crashCashout(point,time+60000,3).multiplier,0);assert.equal(crashCashout(100,crashTime(100)+1,null).multiplier,100);assert.equal(payout(100,2.35),235);assert.equal(payout(100,NaN),0);assert.equal(payout(Number.MAX_SAFE_INTEGER,100),Number.MAX_SAFE_INTEGER);
});
test('mine board is fixed before picking, unique and bounded; exact cashout agrees with combinatorial survival probability',()=>{
 for(const mines of [1,3,5]){for(let seed=1;seed<=100;seed++){const board=mineBoard(mines,rng(seed));assert.equal(board.length,mines);assert.equal(new Set(board).size,mines);assert.ok(board.every(i=>i>=0&&i<25));}let probability=1;for(let n=1;n<=25-mines;n++){probability*=(26-mines-n)/(26-n);assert.ok(Math.abs(boardMultiplier(mines,n)-Math.floor(.96/probability*100)/100)<.001);}assert.equal(boardMultiplier(mines,0),1);}
});
test('long rhythm notes require a complete hold; early release costs exactly one life',()=>{
 const g=new BrainrotEngine('ballerina',()=>.5);g.start();const note=g.objects.find(n=>n.hold);g.objects=[note];tick(g,note.at);assert.equal(g.action(note.lane),true);assert.equal(note.holding,true);g.release(note.lane);assert.equal(g.lives,2);g.release(note.lane);assert.equal(g.lives,2);
 const full=new BrainrotEngine('ballerina',()=>.5);full.start();const n=full.objects.find(n=>n.hold);full.objects=[n];tick(full,n.at);full.action(n.lane);tick(full,n.at+n.hold+.001);assert.equal(full.lives,3);assert.ok(full.score>0);assert.equal(n.done,true);full.release(n.lane);assert.equal(full.lives,3);
});
test('Bombardiro final commander appears once and grants a larger reward after six hits',()=>{
 const g=new BrainrotEngine('bombardiro',()=>.5);g.start();g.time=28;g.objects=[];g.update(.01);const boss=g.objects.find(n=>n.boss);assert.ok(boss);assert.equal(boss.hp,6);for(let i=0;i<6;i++){g.objects.push({id:1000+i,type:'melon',x:boss.x,y:boss.y,age:0,vx:0});g.update(.001);}assert.equal(boss.done,true);assert.ok(g.score>=180);g.update(.05);assert.ok(!g.objects.some(n=>n.boss));
});
test('Verity switch exists in each room; later rooms include steel and a moving shutter without unbounded blocks',()=>{
 const g=new VerityField(()=>.5);assert.equal(g.blocks.filter(b=>b.switch).length,1);g.blocks=[];g.update(.01,3,160);assert.equal(g.stage,2);assert.ok(g.blocks.some(b=>b.steel));assert.equal(g.blocks.length,24);const sw=g.blocks.find(b=>b.switch);g.ball={x:sw.x+21,y:sw.y+32,vx:0,vy:-320};g.update(.02,3.1,160);assert.ok(g.power>2);assert.ok(g.blocks.every(b=>!b.steel));
});
test('all new screens and old scene variants render real SVG with buttons/rules and no invalid numeric geometry',()=>{
 const noop=()=>{};for(const kind of CASINO_KINDS){const html=renderToStaticMarkup(createElement(CasinoGame,{kind,balance:500,skin:'shiba-white',canChooseBet:true,stats:{plays:0,wins:0,best:0},onCommit:()=>true,onDouble:()=>true,onResolve:noop,onClose:noop,onReplay:noop,onSound:noop}));assert.ok(html.includes(CASINO_GAMES[kind].title));assert.ok(html.includes('<svg'));assert.ok(!/NaN|undefined/.test(html));}
 const p={stock:emptyBuffStock(),laboratory:defaultLaboratory(),balance:500,resting:false,busy:false,records:{},onPlay:noop,onBuy:noop,onBrew:noop,onUseBuff:noop,onClose:noop},library=renderToStaticMarkup(createElement(ArcadeLibrary,p));assert.equal((library.match(/class="arcade-library-card"/g)||[]).length,15);assert.equal((library.match(/Приготовить впервые/g)||[]).length,15);
 const tea=renderToStaticMarkup(createElement(TeaField,{balance:500,canChooseBet:true,stats:{minePlays:0,mineWins:0},onCommitBet:()=>true,onResolve:noop,onClose:noop,onTick:noop}));assert.equal((tea.match(/Плитка \d+:/g)||[]).length,25);
 for(const kind of ['tralalero','ballerina','bombardiro','verity']){const g=new BrainrotEngine(kind,()=>.5);g.start();tick(g,2.01);const svg=renderToStaticMarkup(createElement(BrainrotScene,{kind,state:g.snapshot(),reduced:false}));assert.ok(!/NaN|undefined/.test(svg));assert.ok(svg.includes('shape-rendering="crispEdges"'));}
});
test('computer, bar and laboratory route through shared live callbacks and preserve return origin',async()=>{
 const source=await readFile(new URL('../app/knopik-go.tsx',import.meta.url),'utf8');for(const marker of ['computer-arcade-shortcut','onBuy={buyShelfBuff}','initialRecipe={labSelection}','stock={barStock}','if(!arcadeOpen)setAdventureOpen(true)','commitCasinoRound(ledger','settleCasinoRound(ledger','setCraftedStock(result.recipe,result.stock)'])assert.ok(source.includes(marker),marker);
 for(const k of CASINO_KINDS){assert.equal(barDrinkBlock(k,0,1,false,false),'Нет в запасе');assert.equal(barDrinkBlock(k,1,0,false,false),'Нужны KC для игры');assert.equal(barDrinkBlock(k,1,1,false,false),undefined);}
});
