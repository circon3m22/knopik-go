// Each pooled node has one imperative owner. Avoid mutating unchanged SVG
// attributes: colors, display and visibility otherwise invalidate paint every frame.
const attributes = new WeakMap<Element, Map<string, string>>();
export function setRunnerAttribute(node: Element, name: string, value: string) {
  let cache = attributes.get(node);
  if (!cache) { cache = new Map(); attributes.set(node, cache); }
  if (cache.get(name) === value) return;
  node.setAttribute(name, value); cache.set(name, value);
}
export function removeRunnerAttribute(node: Element, name: string) {
  attributes.get(node)?.delete(name); node.removeAttribute(name);
}
