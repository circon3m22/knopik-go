/** React can update scene attributes too, so compare the actual DOM value. */
export function setSvgAttribute(node:Element|null|undefined,name:string,value:string){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}

/** Only for pool slots whose display is owned by the renderer (JSX is always
 * display="none"). Ordinary scene attributes still check the real DOM. */
export class SvgPoolVisibility{
 private values=new WeakMap<Element,boolean>();
 set(node:Element|null|undefined,visible:boolean){
  if(!node||this.values.get(node)===visible)return;
  setSvgAttribute(node,'display',visible?'inline':'none');this.values.set(node,visible);
 }
}
