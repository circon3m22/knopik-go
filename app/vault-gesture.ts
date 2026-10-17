/** A transfer is owned by one contact; another finger cannot move or commit it. */
export class VaultGesture {
 private drag:{id:number;start:number;width:number;progress:number}|null=null;
 begin(id:number,x:number,left:number,width:number){
  if(this.drag||width<=0||x>left+width*.35)return false;
  this.drag={id,start:x,width:Math.max(1,width*.7),progress:0};return true;
 }
 move(id:number,x:number){
  if(this.drag?.id!==id)return null;
  return this.drag.progress=Math.max(0,Math.min(1,(x-this.drag.start)/this.drag.width));
 }
 finish(id:number,cancelled=false){
  if(this.drag?.id!==id)return null;
  const commit=!cancelled&&this.drag.progress>=.7;this.drag=null;return commit;
 }
 cancel(){this.drag=null;}
 owns(id:number){return this.drag?.id===id;}
}
