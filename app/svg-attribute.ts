/** React can update scene attributes too, so compare the actual DOM value. */
export function setSvgAttribute(node:Element|null|undefined,name:string,value:string){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
