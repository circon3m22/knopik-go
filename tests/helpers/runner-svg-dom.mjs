// Bounded SVG DOM for renderer checks. This measures JavaScript/DOM mutations,
// not browser rasterization, screen FPS, an account or a live game session.
export const svgMetrics = { writes: 0, removals: 0, moves: 0, created: 0 };
export function resetSvgMetrics() { for (const key of Object.keys(svgMetrics)) svgMetrics[key] = 0; }
export class SvgNode {
  attrs = new Map(); children = []; parent = null; textContent = '';
  style = { setProperty: (key, value) => { this.attrs.set(`style:${key}`, value); svgMetrics.writes++; } };
  constructor(tag = 'g') { this.tag = tag; svgMetrics.created++; }
  get ownerDocument() { return svgDocument(); }
  get id() { return this.getAttribute('id')??''; }
  set id(value) { this.setAttribute('id',value); }
  get firstElementChild() { return this.children[0] ?? null; }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  setAttribute(key, value) { this.attrs.set(key, String(value)); svgMetrics.writes++; }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  removeAttribute(key) { this.attrs.delete(key); svgMetrics.removals++; }
  append(...nodes) { for (const node of nodes) this.insertBefore(node, null); }
  insertBefore(node, reference) {
    if (node === reference) return;
    node.remove(); node.parent = this;
    const index = reference ? this.children.indexOf(reference) : -1;
    if (index < 0) this.children.push(node); else this.children.splice(index, 0, node);
    svgMetrics.moves++;
  }
  remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); } this.parent = null; }
  replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this.append(...nodes); }
  matches(selector) {
    if (selector.startsWith('[')) {
      const [, key, value] = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return this.attrs.has(key) && (value === undefined || this.getAttribute(key) === value);
    }
    return this.tag === selector;
  }
  querySelectorAll(selector) {
    const descendants = selector.split(/\s+(?=\[)/);
    if (descendants.length > 1) return this.querySelectorAll(descendants[0]).flatMap(node => node.querySelectorAll(descendants.slice(1).join(' ')));
    const [parentSelector, childSelector] = selector.split(/\s*>\s*/);
    if (childSelector) return this.querySelectorAll(parentSelector).flatMap(node => node.children.filter(child => child.matches(childSelector)));
    const result = [];
    const visit = node => { for (const child of node.children) { if (child.matches(selector)) result.push(child); visit(child); } };
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  getBoundingClientRect() { return { width: 360, height: 780 }; }
}
export function svgDocument() { return { createElementNS: (_, tag) => new SvgNode(tag) }; }
export function runnerSvgScene() {
  const svg = new SvgNode('svg');
  const group = name => { const node = new SvgNode(); node.setAttribute(`data-runner-${name}`, ''); svg.append(node); return node; };
  for (const name of ['ground','sidewalk','road','world','skyline','clouds','stars','sun','moon','bird','rain','splashes','lightning','sunset','night-shade','player','pose','roll','shadow','shield','magnet','firework','flames','flyby','collar','leg-left','leg-right','arm-left','arm-right','tail','head','turn','chaser','start','start-back','flash','far-buildings','near-buildings','traffic','crossings','obstacles','tunnel','depth-objects']) group(name);
  svg.querySelector('[data-runner-chaser]').append(new SvgNode('use'));
  for (const [name, count] of [['road-tiles',80],['markings',200],['rain',84],['splashes',12],['road-details',48],['speed-lines',16]]) {
    const parent = svg.querySelector(`[data-runner-${name}]`) ?? group(name);
    for (let i = 0; i < count; i++) parent.append(new SvgNode('path'));
  }
  for (const name of ['sidewalk-tiles','roof-walls']) {
    const parent = group(name);
    for (let i = 0; i < 80; i++) { const node = new SvgNode(); node.append(new SvgNode('path'), new SvgNode('path')); parent.append(node); }
  }
  for (const [name, count] of [['far',384],['near',48]]) for (let i = 0; i < count; i++) {
    const node = new SvgNode(); node.setAttribute('data-runner-slot', name); node.append(new SvgNode('use')); svg.append(node);
  }
  const particles = group('particles');
  for (let i = 0; i < 72; i++) { const node = new SvgNode(); node.append(new SvgNode('rect'), new SvgNode('use')); particles.append(node); }
  return svg;
}
