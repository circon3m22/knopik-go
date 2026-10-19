/** The first network snapshot is a baseline; healing, repeats and invalid data
 * must never look like damage. Each player has their own tracker. */
export class DamageHealthTracker{
 private previous:number|null=null;
 sample(hp:number){
  if(!Number.isFinite(hp)||hp<0)return false;
  const damaged=this.previous!==null&&hp<this.previous;
  this.previous=hp;return damaged;
 }
}
export function playDamagePulse(node:HTMLElement|null){
 if(!node)return;
 node.setAttribute('data-damage-pulse',node.getAttribute('data-damage-pulse')==='a'?'b':'a');
}
