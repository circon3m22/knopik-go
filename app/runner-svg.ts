// Each pooled node has one imperative owner. Avoid mutating unchanged SVG
// attributes: colors, display and visibility otherwise invalidate paint every frame.
const attributes = new WeakMap<Element, Map<string, string | null>>();
const styles = new WeakMap<Element, Map<string,string>>();
export function setRunnerStyle(node: Element & { style: CSSStyleDeclaration }, name: string, value: string) {
  let cache=styles.get(node);
  if(!cache){cache=new Map();styles.set(node,cache);}
  if(cache.get(name)===value)return;
  node.style.setProperty(name,value);cache.set(name,value);
}
export function setRunnerAttribute(node: Element, name: string, value: string) {
  let cache = attributes.get(node);
  if (!cache) { cache = new Map(); attributes.set(node, cache); }
  if (cache.get(name) === value) return;
  node.setAttribute(name, value); cache.set(name, value);
}
export function removeRunnerAttribute(node: Element, name: string) {
  let cache = attributes.get(node);
  if (!cache) { cache = new Map(); attributes.set(node, cache); }
  // Null is a tombstone: an absent clip/transform should not invalidate SVG
  // style every frame. Read once for attributes originally supplied by React.
  if (cache.get(name) === null) return;
  if (cache.has(name) || node.getAttribute(name) !== null) node.removeAttribute(name);
  cache.set(name, null);
}
