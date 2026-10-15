export type LevelRect = { x:number;y:number;w:number;h:number };
export type LevelCover = LevelRect & { kind:"pillar"|"rubble"|"pipe"|"tank"|"crate"|"barricade"|"breakwater"|"machine";breakable?:boolean };
export type AdventureWeapon = "fist"|"sabre"|"pistol"|"shotgun"|"launcher"|"arc";
export const WEAPON_ORDER:readonly AdventureWeapon[]=["fist","sabre","pistol","shotgun","launcher","arc"];
export const ADVENTURE_WEAPONS={
  fist:{name:"Кулак",range:64,cooldown:.29,damage:1,tier:0},
  sabre:{name:"Сабля",range:105,cooldown:.84,damage:2,tier:1},
  pistol:{name:"Пистолет",range:540,cooldown:.28,damage:1,tier:2},
  shotgun:{name:"Дробовик",range:330,cooldown:1.16,damage:2,tier:3},
  launcher:{name:"Гранатомёт",range:540,cooldown:2.46,damage:4,tier:4},
  arc:{name:"Дуговик",range:430,cooldown:1.2,damage:2,tier:5},
} as const;
export type DungeonPalette={wall:string;floor:string;light:string;dark:string;accent:string;water:string};
export const DUNGEON_ZONES=[
  {id:1,name:"Старые коллекторы",subtitle:"Кирпичные арки · протечки · завалы",weapon:"sabre",symbol:"arches",palette:{wall:"#586566",floor:"#77877d",light:"#a3b796",dark:"#2b3941",accent:"#d3bb85",water:"#294b4d"}},
  {id:2,name:"Медная котельная",subtitle:"Пар · поршни · раскалённые трубы",weapon:"pistol",symbol:"boiler",palette:{wall:"#7e6655",floor:"#8d8271",light:"#d7b78b",dark:"#343b44",accent:"#efac59",water:"#345459"}},
  {id:3,name:"Подземный арсенал",subtitle:"Мины · взрывчатка · засады",weapon:"shotgun",symbol:"arsenal",palette:{wall:"#655f62",floor:"#8c8580",light:"#bcb3a3",dark:"#2c3340",accent:"#eb8873",water:"#3d5059"}},
  {id:4,name:"Затопленные тоннели",subtitle:"Шлюзы · течение · электричество",weapon:"launcher",symbol:"sluice",palette:{wall:"#456f78",floor:"#779394",light:"#acd0ca",dark:"#233b4b",accent:"#82d3d4",water:"#31687f"}},
  {id:5,name:"Энергокомплекс",subtitle:"Лазеры · реакторы · сердце города",weapon:"arc",symbol:"reactor",palette:{wall:"#675b78",floor:"#878295",light:"#beb4d0",dark:"#292d43",accent:"#a4dedd",water:"#3d486b"}},
] as const;
export type DungeonZone=typeof DUNGEON_ZONES[number];
export type DungeonTask={kind:"valve"|"key"|"relay"|"charge"|"hold";room:number;label:string;goal:string;depends?:number[];duration?:number;breaks?:number; x:number;y:number};
export type DungeonHazard=LevelRect&{kind:"steam"|"spikes"|"laser"|"crusher"|"mine";room:number;offset:number;period:number;disabledBy?:number};
export type DungeonGate=LevelRect&{from:number;to:number;axis:"x"|"y";objective?:number};
export type DungeonSpawn={x:number;y:number;room:number;kind:"bat"|"gun";role?:"grunt"|"charger"|"armored"|"gunner"|"demolisher";boss?:boolean;wave?:number;trigger?:number};
export type AdventureLevel={
  id:number;zone:number;stage:number;name:string;feature:string;intro:string;mechanic:"sewer"|"steam"|"barrels"|"current"|"boss";
  rooms:LevelRect[];roomNames:string[];solids:LevelCover[];gates:DungeonGate[];floors:LevelRect[];enemies:DungeonSpawn[];
  jets:(LevelRect&{offset:number;room?:number;disabledBy?:number})[];barrels:{x:number;y:number;room:number}[];
  currents:(LevelRect&{dx:number;dy:number;disabledBy?:number})[];hazards:DungeonHazard[];tasks:DungeonTask[];
  spawn:{x:number;y:number};exit:{x:number;y:number;room:number};medkits:{x:number;y:number;room:number}[];
  height:number;bounds:{x:number;w:number};palette:DungeonPalette;
};
export type TaskSpec=Omit<DungeonTask,"x"|"y"|"breaks">;
export type DungeonPlan={name:string;intro:string;grid:[number,number][];links:[number,number][];rooms:string[];tasks:TaskSpec[];exit:number;lock?:number;boss?:boolean};
const task=(kind:TaskSpec["kind"],room:number,label:string,goal:string,depends?:number[],duration?:number):TaskSpec=>({kind,room,label,goal,depends,duration});
const PLANS:DungeonPlan[]=[
  {name:"Насосная под домом",intro:"Вода прорвала старый коллектор. Верни питание аварийному насосу и выберись на служебном подъёмнике.",grid:[[0,1],[0,0],[-1,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3],[1,4]],rooms:["Разбитый служебный спуск","Аварийная насосная","Резервный предохранитель","Напорный коллектор","Подъёмник к дому"],tasks:[task("key",2,"Забрать предохранитель","Найди резервный предохранитель"),task("valve",3,"Перекрыть напор","Перекрой напор в правом коллекторе"),task("hold",1,"Запустить аварийный насос","Верни питание насосной",[0,1],8.5)],exit:4,lock:2},
  {name:"Ключ дворника",intro:"Ключ остался в западном тупике. Вернись с ним к шлюзу: за правой решёткой есть путь дальше.",grid:[[0,1],[0,0],[-1,0],[1,0]],links:[[0,1],[1,2],[1,3]],rooms:["Трубы у лестницы","Распределитель","Комната дворника","Сухой шлюз"],tasks:[task("key",2,"Забрать ключ","Найди ключ в западной комнате"),task("relay",1,"Открыть шлюз","Вернись к замку шлюза",[0])],exit:3,lock:1},
  {name:"Холодные арки",intro:"Два вентиля под древними арками. Тоннель поворачивает направо, вверх, затем налево. Решётки в полу выдают шипы жёлтым светом.",grid:[[0,1],[1,1],[1,0],[0,0]],links:[[0,1],[1,2],[2,3],[3,0]],rooms:["Мокрая арка","Старый отвод","Зал двух труб","Обход к лестнице"],tasks:[task("valve",1,"Закрыть первый вентиль","Перекрой восточную трубу"),task("valve",2,"Закрыть второй вентиль","Перекрой северную трубу")],exit:3},
  {name:"Обрушенный переход",intro:"Заряды расчистят завал. Поставь их в двух ответвлениях и сразу отойди от мигающего круга. Взрыв заденет Сахуров и соседние бочки.",grid:[[0,1],[0,0],[-1,0],[1,0],[1,1]],links:[[0,1],[1,2],[1,3],[3,4],[4,0]],rooms:["Нижняя галерея","Завал у арки","Западный карман","Треснувшая опора","Обходная лестница"],tasks:[task("charge",2,"Заложить заряд","Заложи заряд в западном ответвлении"),task("charge",3,"Заложить заряд","Заложи заряд у треснувшей опоры")],exit:4},
  {name:"Страж слива",intro:"Закрой подачу в боковом зале и войди к Стражу. Он бьёт по кругу и вызывает подкрепление. Кольцо вокруг него предупреждает об ударе.",grid:[[0,1],[0,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3]],rooms:["Приёмная стража","Сливной узел","Боковой вентиль","Логово Стража"],tasks:[task("valve",2,"Отключить подачу","Закрой подачу в боковом зале")],exit:3,lock:0,boss:true},
  {name:"Котельная подача",intro:"Здесь твой пистолет. Держи дистанцию, перекрой две паровые магистрали и укрывайся за резервуарами.",grid:[[0,0],[1,0],[1,-1],[2,-1]],links:[[0,1],[1,2],[2,3]],rooms:["Медный вход","Паровая магистраль","Узел подачи","Лестница котельной"],tasks:[task("valve",1,"Закрыть магистраль","Перекрой первую паровую магистраль"),task("valve",2,"Снять давление","Сними давление в северном зале")],exit:3},
  {name:"Компрессорная петля",intro:"Найди предохранитель и вернись к компрессору. Через боковую галерею можно обойти пресс и зайти Сахурам с другой стороны.",grid:[[0,1],[1,1],[1,0],[0,0],[-1,0]],links:[[0,1],[1,2],[2,3],[3,0],[3,4]],rooms:["Компрессорный вход","Зал пресса","Кабельная ниша","Большой компрессор","Боковой подъёмник"],tasks:[task("key",2,"Забрать предохранитель","Найди предохранитель в кабельной нише"),task("relay",3,"Запустить компрессор","Верни предохранитель в компрессор",[0])],exit:4},
  {name:"Поршневой цех",intro:"Плиты пресса падают на отмеченные участки. Рывком проскочи между ударами, закрой обходной клапан и включи выходной привод.",grid:[[1,1],[0,1],[0,0],[-1,0]],links:[[0,1],[1,2],[2,3]],rooms:["Поршни у входа","Нижний пресс","Обходной клапан","Выходной привод"],tasks:[task("valve",2,"Закрыть клапан","Закрой обходной клапан"),task("relay",3,"Включить привод","Включи выходной привод",[0])],exit:3},
  {name:"Красное давление",intro:"Перезапуск насоса привлечёт две группы Сахуров. Держись рядом с узлом, пока он набирает обороты, затем перекрой аварийную трубу.",grid:[[0,1],[0,0],[-1,0],[-1,-1],[1,0]],links:[[0,1],[1,2],[2,3],[1,4]],rooms:["Аварийный вход","Главный насос","Выпуск пара","Лестница сброса","Пульт давления"],tasks:[task("hold",1,"Перезапустить насос","Удержи главный насос под атакой",undefined,12),task("valve",4,"Перекрыть аварийную трубу","Перекрой аварийную трубу")],exit:3},
  {name:"Кочегар",intro:"Два клапана откроют топочный зал. Кочегар бросает раскалённые заряды и стреляет веером. Пользуйся резервуарами и не стой на красных метках.",grid:[[0,1],[0,0],[-1,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3],[1,4]],rooms:["Остывшая лестница","Топочный предбанник","Левый клапан","Правый клапан","Зал Кочегара"],tasks:[task("valve",2,"Закрыть левый клапан","Закрой левый клапан"),task("valve",3,"Закрыть правый клапан","Закрой правый клапан")],exit:4,lock:1,boss:true},
  {name:"Оружейные ячейки",intro:"Новый дробовик сметает близких врагов. Взорви замок грузовой клетки и пройди через штабеля. Ящики можно разбить выстрелами.",grid:[[0,0],[1,0],[1,1],[2,1]],links:[[0,1],[1,2],[2,3]],rooms:["Приёмка оружия","Оружейные ячейки","Грузовая клетка","Складской выход"],tasks:[task("charge",2,"Взорвать замок клетки","Поставь заряд у грузовой клетки")],exit:3},
  {name:"Минный обход",intro:"Мины начинают мигать при приближении. Пройди по обходу, отключи провода и подорви дальний склад. Можно заманить преследователей под взрыв.",grid:[[0,1],[0,0],[1,0],[1,1],[-1,0]],links:[[0,1],[1,2],[2,3],[3,0],[1,4]],rooms:["Минная лестница","Провода охраны","Пульт сигнализации","Обходной выход","Дальний склад"],tasks:[task("relay",2,"Отключить провода","Отключи минные провода"),task("charge",4,"Подорвать склад","Подорви дальний склад")],exit:3},
  {name:"Грузовой лифт",intro:"Два аккумулятора лежат в разных рукавах склада. Собери оба, вернись к грузовому пульту и открой путь к лифту.",grid:[[0,1],[0,0],[-1,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3],[1,4]],rooms:["Нижняя разгрузка","Грузовой пульт","Западная батарея","Восточная батарея","Шахта лифта"],tasks:[task("key",2,"Забрать аккумулятор","Забери западный аккумулятор"),task("key",3,"Забрать аккумулятор","Забери восточный аккумулятор"),task("relay",1,"Запитать грузовой лифт","Вернись к грузовому пульту",[0,1])],exit:4,lock:2},
  {name:"Подрывной склад",intro:"Возьми детонатор в боковой кладовой, затем запусти подъёмник. Охрана прибежит на шум. Бочки помогут отбить засаду.",grid:[[0,1],[0,0],[-1,0],[1,0],[1,-1]],links:[[0,1],[1,2],[1,3],[3,4]],rooms:["Складской спуск","Подъёмный узел","Кладовая детонатора","Боеприпасы","Верхний выход"],tasks:[task("key",2,"Забрать детонатор","Найди детонатор в кладовой"),task("hold",1,"Запустить подъёмник","Удержи подъёмный узел под атакой",[0],13)],exit:4},
  {name:"Капитан арсенала",intro:"Взорви оба тайника, чтобы добраться до Капитана. Он швыряет гранаты и вызывает стрелков. Дробовик особенно хорош после его промаха.",grid:[[0,1],[0,0],[-1,0],[1,0],[1,-1]],links:[[0,1],[1,2],[1,3],[3,4]],rooms:["Складская лестница","Караульный пост","Левый тайник","Правый тайник","Командный арсенал"],tasks:[task("charge",2,"Подорвать тайник","Подорви левый тайник"),task("charge",3,"Подорвать тайник","Подорви правый тайник")],exit:4,lock:1,boss:true},
  {name:"Шлюзовая камера",intro:"Теперь у тебя гранатомёт. Взрыв задевает группу врагов и разбивает укрытия. Осуши два шлюза и найди западную лестницу.",grid:[[1,1],[1,0],[0,0],[0,-1]],links:[[0,1],[1,2],[2,3]],rooms:["Водяной вход","Первый шлюз","Второй шлюз","Западная лестница"],tasks:[task("valve",1,"Осушить первый шлюз","Осуши первый шлюз"),task("valve",2,"Осушить второй шлюз","Осуши второй шлюз")],exit:3},
  {name:"Течение в обход",intro:"Сухая петля идёт вокруг затопленного зала. Найди штурвал и перекрой поток, затем вернись к дальнему шлюзу.",grid:[[0,1],[1,1],[1,0],[0,0],[-1,0]],links:[[0,1],[1,2],[2,3],[3,0],[3,4]],rooms:["Нижний канал","Поток у волнореза","Штурвальный зал","Сухой обход","Дальний шлюз"],tasks:[task("valve",2,"Перекрыть поток","Перекрой течение штурвалом"),task("relay",4,"Открыть дальний шлюз","Включи дальний шлюз",[0])],exit:4},
  {name:"Кабельный мост",intro:"Оборванные провода пускают разряды поперёк прохода. Возьми батарею, вернись к пульту и запитай безопасный выход.",grid:[[0,1],[0,0],[1,0],[1,-1]],links:[[0,1],[1,2],[2,3]],rooms:["Кабельный спуск","Пульт моста","Затопленная батарея","Северный мост"],tasks:[task("key",2,"Забрать батарею","Найди батарею в затопленном ответвлении"),task("relay",1,"Запитать мост","Верни батарею в пульт моста",[0])],exit:3,lock:1},
  {name:"Сигнал из глубины",intro:"Передатчику нужно время. Запусти его и держись рядом, отбивая Сахуров. Затем отключи аварийное течение в западном рукаве.",grid:[[0,1],[0,0],[-1,0],[-1,-1],[1,0]],links:[[0,1],[1,2],[2,3],[1,4]],rooms:["Глубокий спуск","Подводный передатчик","Аварийный отвод","Сухая лестница","Резервный канал"],tasks:[task("hold",1,"Включить передатчик","Удержи передатчик под атакой",undefined,14),task("valve",2,"Остановить аварийный поток","Перекрой аварийный поток")],exit:3},
  {name:"Волнолом",intro:"Два затвора откроют арену Волнолома. Его удар расходится широким кольцом, а гранаты падают туда, где ты стоял. Постоянно меняй позицию.",grid:[[0,1],[0,0],[-1,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3],[1,4]],rooms:["Шлюзовой вход","Предбанник затворов","Западный затвор","Восточный затвор","Арена Волнолома"],tasks:[task("valve",2,"Закрыть западный затвор","Закрой западный затвор"),task("valve",3,"Закрыть восточный затвор","Закрой восточный затвор")],exit:4,lock:1,boss:true},
  {name:"Три контура",intro:"Дуговик передаёт разряд между близкими врагами. Отключи три контура в разных ответвлениях, чтобы разблокировать энергетический подъёмник.",grid:[[0,1],[0,0],[-1,0],[1,0],[0,-1]],links:[[0,1],[1,2],[1,3],[1,4]],rooms:["Энергетический вход","Разводка питания","Западный контур","Восточный контур","Северный контур"],tasks:[task("relay",2,"Отключить контур","Отключи западный контур"),task("relay",3,"Отключить контур","Отключи восточный контур"),task("relay",4,"Отключить контур","Отключи северный контур")],exit:4},
  {name:"Маятник камер",intro:"Движущиеся прессы и лазерные полосы оставляют короткие окна для рывка. Поставь заряд на обходе и перезапусти распределитель.",grid:[[0,1],[1,1],[1,0],[0,0],[-1,0]],links:[[0,1],[1,2],[2,3],[3,0],[3,4]],rooms:["Нижний маятник","Обходной завал","Распределитель","Лазерная петля","Западный выход"],tasks:[task("charge",1,"Расчистить обход","Поставь заряд на обходе"),task("hold",2,"Перезапустить распределитель","Удержи распределитель под атакой",undefined,13)],exit:4},
  {name:"Нулевой резерв",intro:"Две батареи запитают аварийный пульт. Бронированные Сахуры лучше защищены спереди: обходи их и используй цепной разряд.",grid:[[0,1],[0,0],[-1,0],[-1,-1],[1,0],[1,-1]],links:[[0,1],[1,2],[2,3],[1,4],[4,5]],rooms:["Резервный спуск","Аварийный пульт","Левая разводка","Западная батарея","Правая разводка","Восточная батарея"],tasks:[task("key",3,"Забрать батарею","Забери западную батарею"),task("key",5,"Забрать батарею","Забери восточную батарею"),task("relay",1,"Запитать аварийный пульт","Вернись к аварийному пульту",[0,1])],exit:4},
  {name:"Срыв цепи",intro:"Три заряда остановят силовую цепь. Не стой у взрыва: он уничтожает ящики, бочки и целые группы Сахуров. Охрана спешит к каждому узлу.",grid:[[0,1],[0,0],[1,0],[1,-1],[2,-1],[2,0]],links:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,2]],rooms:["Силовой спуск","Первый узел","Второй узел","Третий узел","Кабельный карман","Лестница реактора"],tasks:[task("charge",1,"Заложить заряд","Подорви первый силовой узел"),task("charge",2,"Заложить заряд","Подорви второй силовой узел"),task("charge",3,"Заложить заряд","Подорви третий силовой узел")],exit:5},
  {name:"Сердце под городом",intro:"Отключи боковые стабилизаторы и войди в сердце комплекса. Вожак чередует круговой удар, веер выстрелов и заряды. После половины здоровья он вызовет последнюю охрану.",grid:[[0,2],[0,1],[-1,1],[1,1],[0,0],[1,0]],links:[[0,1],[1,2],[1,3],[1,4],[3,5],[5,4]],rooms:["Спуск к сердцу","Главная разводка","Западный стабилизатор","Восточный стабилизатор","Сердце комплекса","Резервная галерея"],tasks:[task("relay",2,"Отключить стабилизатор","Отключи западный стабилизатор"),task("relay",3,"Отключить стабилизатор","Отключи восточный стабилизатор")],exit:4,lock:1,boss:true},
];
export function buildDungeonPlan(plan:DungeonPlan,index:number):AdventureLevel{
  const id=index+1,zone=Math.floor(index/5)+1,stage=index%5+1,z=DUNGEON_ZONES[zone-1];
  const minX=Math.min(...plan.grid.map(p=>p[0])),minY=Math.min(...plan.grid.map(p=>p[1]));
  const centers=plan.grid.map(([x,y])=>({x:440+(x-minX)*820,y:380+(y-minY)*680}));
  const rooms=centers.map((c,i)=>{const boss=plan.boss&&i===plan.exit,w=640+(i+stage)%3*32+(boss?96:0),h=500+(i*2+stage)%3*24+(boss?80:0);return {x:c.x-w/2,y:c.y-h/2,w,h};});
  const floors=[...rooms],gates:DungeonGate[]=[],solids:LevelCover[]=[],enemies:DungeonSpawn[]=[],barrels:AdventureLevel["barrels"]=[],currents:AdventureLevel["currents"]=[],hazards:DungeonHazard[]=[],jets:AdventureLevel["jets"]=[];
  for(const [from,to]of plan.links){const a=rooms[from],b=rooms[to],ca=centers[from],cb=centers[to],horizontal=ca.y===cb.y;
    if(Math.abs(plan.grid[from][0]-plan.grid[to][0])+Math.abs(plan.grid[from][1]-plan.grid[to][1])!==1)throw new Error(`Nonadjacent passage ${id}/${from}/${to}`);
    const corridor=horizontal?{x:Math.min(ca.x,cb.x),y:ca.y-80,w:Math.abs(ca.x-cb.x),h:160}:{x:ca.x-80,y:Math.min(ca.y,cb.y),w:160,h:Math.abs(ca.y-cb.y)};
    floors.push(corridor);
    const middle=horizontal?(ca.x<cb.x?(a.x+a.w+b.x)/2:(b.x+b.w+a.x)/2):(ca.y<cb.y?(a.y+a.h+b.y)/2:(b.y+b.h+a.y)/2);
    gates.push({...horizontal?{x:middle-6,y:ca.y-80,w:12,h:160}:{x:ca.x-80,y:middle-6,w:160,h:12},from,to,axis:horizontal?"x":"y",objective:to===plan.exit?plan.lock:undefined});
  }
  rooms.forEach((r,i)=>{
    const add=(kind:LevelCover["kind"],x:number,y:number,w:number,h:number,breakable=false)=>solids.push({kind,x:r.x+x,y:r.y+y,w,h,breakable});
    const f=(stage+i)%2===0;
    add("pillar",100,115,44,54);add("pillar",r.w-146,r.h-168,46,54);
    const kinds:LevelCover["kind"][]=[["rubble","pipe"],["tank","machine"],["crate","barricade"],["breakwater","pipe"],["machine","tank"]][zone-1] as LevelCover["kind"][];
    add(kinds[0],f?164:r.w-242,f?104:r.h-170,76,64,zone===1||zone===3);
    add(kinds[1],f?r.w-237:160,f?r.h-150:122,80,zone===3?36:48,zone===3);
    add(zone===3?"crate":"pipe",r.w-125,118,66,38,zone===3);
    if(stage>2)add(zone===5?"machine":"rubble",108,r.h-146,60,42,zone===1||zone===3);
    const count=id===1&&(i===0||i===1||i===2)?1:plan.boss&&i===plan.exit?1:Math.min(4,2+Number(stage>1)+Number(zone>=3));
    const positions=[[r.x+72,r.y+77],[r.x+r.w-72,r.y+76],[r.x+r.w/2,r.y+115],[r.x+66,r.y+r.h-80]];
    for(let n=0;n<count;n++){const [x,y]=positions[n],boss=!!plan.boss&&i===plan.exit;const role=boss?"grunt":zone>=3&&n===0?"armored":n===1?zone>=2&&stage>=3?"demolisher":"gunner":n===3?"charger":"grunt";enemies.push({x,y,room:i,kind:role==="gunner"||role==="demolisher"?"gun":"bat",role,boss,wave:0});}
    if(zone===3||stage===4||plan.boss){barrels.push({x:r.x+r.w-68,y:r.y+r.h-145,room:i});if(zone>=3)barrels.push({x:r.x+70,y:r.y+210,room:i});}
    const valve=plan.tasks.findIndex(t=>t.room===i&&(t.kind==="valve"||t.kind==="relay"));
    const disabledBy=valve>=0?valve:undefined;
    if(zone===4)currents.push({x:r.x+210,y:r.y+154,w:r.w-360,h:r.h-218,dx:i%2?-.7:.7,dy:i%2?.3:-.3,disabledBy});
    const kind:DungeonHazard["kind"]=zone===1?stage<=2?"steam":"spikes":zone===2?i%2?"crusher":"steam":zone===3?"mine":zone===4?i%2?"laser":"mine":i%2?"crusher":"laser";
    const area=kind==="laser"?{x:r.x+112,y:r.y+r.h*.64,w:r.w-224,h:12}:kind==="steam"?{x:r.x+245,y:r.y+196,w:152,h:26}:kind==="mine"?{x:r.x+178,y:r.y+r.h*.7,w:26,h:26}:{x:r.x+r.w*.48,y:r.y+r.h*.65,w:96,h:76};
    hazards.push({...area,room:i,kind,offset:(i*.87+stage*.3)%3,period:zone===5?4.1:5,disabledBy});
    if(kind==="steam")jets.push({...area,room:i,offset:(i*.87+stage*.3)%3,disabledBy});
    if(zone>=3&&stage>=3&&!plan.boss)hazards.push({x:r.x+175,y:r.y+235,w:100,h:14,kind:"laser",room:i,offset:i*.65+1.4,period:5.4,disabledBy});
  });
  const tasks:DungeonTask[]=plan.tasks.map((t,i)=>{const c=centers[t.room],r=rooms[t.room],breaks=t.kind==="charge"?solids.findIndex(s=>s.breakable&&s.x>r.x&&s.x<r.x+r.w&&s.y>r.y&&s.y<r.y+r.h):undefined;return {...t,x:c.x+(i%2?58:-58),y:c.y+24,breaks:breaks!==undefined&&breaks>=0?breaks:undefined};});
  tasks.forEach((t,index)=>{
    if(t.kind!=="hold"&&!(t.kind==="charge"&&zone===5))return;
    const r=rooms[t.room],training=id===1&&t.kind==="hold";
    for(let wave=1;wave<=(t.kind==="hold"?2:1);wave++)for(let n=0;n<(training?2:3);n++)enemies.push({room:t.room,x:n%2?r.x+r.w-44:r.x+48,y:r.y+76+n*95+(wave-1)*24,kind:!training&&n===1?"gun":"bat",role:training?"grunt":n===1?"gunner":n===2?"charger":"grunt",wave,trigger:index});
  });
  if(plan.boss){const r=rooms[plan.exit];for(let n=0;n<3;n++)enemies.push({room:plan.exit,x:r.x+70+n*(r.w-140)/2,y:r.y+80,kind:n===1?"gun":"bat",role:n===1?"gunner":"charger",wave:1,trigger:-1});}
  if(id===1){
    const pump=rooms[1],water=rooms[3];
    solids.push({kind:"machine",x:pump.x+48,y:pump.y+pump.h-170,w:126,h:99});
    barrels.push({x:pump.x+70,y:pump.y+210,room:1},{x:pump.x+pump.w-70,y:pump.y+pump.h-145,room:1});
    currents.push({x:water.x+200,y:water.y+140,w:water.w-345,h:water.h-190,dx:-.55,dy:.3,disabledBy:1});
    hazards.forEach(h=>{h.disabledBy=1;});jets.forEach(h=>{h.disabledBy=1;});
  }
  const exitRoom=rooms[plan.exit];const medRoom=plan.grid.length>3?2:1;
  return {id,zone,stage,name:plan.name,feature:plan.boss?"Босс зоны · боковые задачи":`${rooms.length} залов · ${tasks.length} ${tasks.length===1?"задача":"задачи"}`,intro:plan.intro,mechanic:(["sewer","steam","barrels","current","boss"] as const)[zone-1],rooms,roomNames:plan.rooms,solids,gates,floors,enemies,jets,barrels,currents,hazards,tasks,spawn:{x:centers[0].x,y:rooms[0].y+rooms[0].h-64},exit:{x:centers[plan.exit].x,y:exitRoom.y+exitRoom.h-78,room:plan.exit},medkits:[{x:rooms[medRoom].x+68,y:rooms[medRoom].y+rooms[medRoom].h-137,room:medRoom},...(id===1?[{x:rooms[3].x+70,y:rooms[3].y+rooms[3].h-137,room:3}]:[])],height:Math.max(...rooms.map(r=>r.y+r.h))+80,bounds:{x:Math.min(...rooms.map(r=>r.x))-48,w:Math.max(...rooms.map(r=>r.x+r.w))-Math.min(...rooms.map(r=>r.x))+96},palette:z.palette};
}
export const ADVENTURE_LEVELS:readonly AdventureLevel[]=PLANS.map(buildDungeonPlan);
export const DUNGEON_LEVEL_COUNT=25;
export function adventureLevel(id:number){return ADVENTURE_LEVELS[Math.max(0,Math.min(24,Math.floor(Number.isFinite(id)?id:1)-1))];}
export function dungeonZone(id:number){return DUNGEON_ZONES[Math.max(0,Math.min(4,Math.floor((id-1)/5)))];}
export function sanitizeCompletedLevel(value:unknown){return typeof value==="number"&&Number.isFinite(value)?Math.max(0,Math.min(25,Math.floor(value))):0;}
export function sanitizeWeaponTier(value:unknown){return typeof value==="number"&&Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0;}
