export const TRAINING_LENGTH=6;
export type CombatTraining={step:number;kit:boolean};
export const defaultCombatTraining=():CombatTraining=>({step:0,kit:false});
export function sanitizeCombatTraining(value:unknown,completedLevel=0):CombatTraining {
  if(completedLevel>=1)return {step:TRAINING_LENGTH,kit:true};
  if(!value||typeof value!=="object")return defaultCombatTraining();const v=value as Partial<CombatTraining>;
  return {step:typeof v.step==="number"&&Number.isFinite(v.step)?Math.max(0,Math.min(TRAINING_LENGTH,Math.floor(v.step))):0,kit:v.kit===true};
}
export function grantCombatTrainingKit(training:CombatTraining,stock:{heal:number;pepsi:number;zhivchik:number}) {
  if(training.kit)return null;
  return {training:{...training,kit:true},stock:{heal:Math.min(3,stock.heal+1),pepsi:Math.min(3,stock.pepsi+1),zhivchik:Math.min(25,stock.zhivchik+1)}};
}
export function advanceCombatTraining(training:CombatTraining,step:number):CombatTraining {
  if(!Number.isFinite(step))return training;
  return {...training,step:Math.max(training.step,Math.max(0,Math.min(TRAINING_LENGTH,Math.floor(step))))};
}
export const TRAINING_CARDS=[
  {title:"Сделай пару шагов",copy:"Потяни джойстик слева. На клавиатуре — WASD или стрелки.",target:"stick"},
  {title:"Попробуй удар",copy:"Нажми или зажми большую кнопку «Удар». Выбор оружия — слева над джойстиком.",target:"attack"},
  {title:"Уйди кувырком",copy:"Нажми «Кувырок» рядом с ударом. Джойстик задаёт направление.",target:"dodge"},
  {title:"Восстанови сердце",copy:"Это учебный урон. Нажми хилку справа над кнопками управления — она из стартового набора.",target:"heal"},
  {title:"Подготовь щит",copy:"Нажми Пепси в бафах справа. Щит спасёт Кнопика при смертельном ударе.",target:"pepsi"},
  {title:"Включи Живчик",copy:"Нажми зелёную бутылку справа. На 7 секунд Кнопик станет быстрее и сильнее. После этого начинаем!",target:"zhivchik"},
] as const;
