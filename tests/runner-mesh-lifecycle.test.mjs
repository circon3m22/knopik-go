import assert from 'node:assert/strict';
import test from 'node:test';
import { RunnerArchitecture } from '../app/runner-architecture.ts';
import { RunnerObstacles } from '../app/runner-obstacles.ts';
import { RunnerTraffic } from '../app/runner-traffic.ts';
import { RunnerTunnel } from '../app/runner-tunnel.ts';

// A small SVG tree is enough to verify pool lifetime; no game simulation,
// browser session, account or balance is involved in these regression checks.
class SvgNode {
  attrs = new Map();
  children = [];
  parent = null;
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  append(...nodes) {
    for (const node of nodes) { node.remove(); node.parent = this; this.children.push(node); }
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this);
    this.parent = null;
  }
  replaceChildren(...nodes) { for (const node of [...this.children]) node.remove(); this.append(...nodes); }
  querySelectorAll(selector) {
    const [, name, value] = selector.match(/^\[([^=\]]+)(?:="([^"]+)")?\]$/);
    const result = [];
    const visit = node => { for (const child of node.children) { if (child.attrs.has(name) && (value === undefined || child.getAttribute(name) === value)) result.push(child); visit(child); } };
    visit(this);
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
}

function scene() {
  const svg = new SvgNode();
  for (const name of ['far-buildings', 'near-buildings', 'traffic', 'crossings', 'obstacles', 'tunnel']) {
    const group = new SvgNode(); group.setAttribute(`data-runner-${name}`, ''); svg.append(group);
  }
  return svg;
}
const object = kind => ({ id: 1, kind, x: 0, z: 70, height: kind === 'building' ? 300 : 102, depth: 18, variant: 0, district: 0, passed: false, activatedAt: -1 });
const project = (x, z, h = 0) => ({ x, y: z - h, scale: 1 });

test('neon tunnel geometry stays finite at the near plane and its pool fully retires', () => {
  const previous = globalThis.document;
  globalThis.document = { createElementNS: () => new SvgNode() };
  try {
    const svg=scene(), pool=new RunnerTunnel(svg);
    for(const z of [590,150,30,7,-7,-20]) {
      pool.begin(); const mesh=pool.draw({...object('tunnel-wall'),depth:28},z,project,15,false); pool.end();
      for(const path of mesh.children) assert.doesNotMatch(path.getAttribute('d')??'',/NaN|Infinity/);
    }
    pool.begin();pool.end();
    assert.equal(svg.querySelectorAll('[data-runner-mesh="tunnel"]').length,30);
    assert.ok(svg.querySelectorAll('[data-runner-mesh="tunnel"]').every(n=>n.getAttribute('display')==='none'));
    new RunnerTunnel(svg);assert.equal(svg.querySelectorAll('[data-runner-mesh="tunnel"]').length,30);
  } finally { globalThis.document=previous; }
});

test('unused pooled SVG objects disappear despite explicitly visible child paths', () => {
  const previous = globalThis.document;
  globalThis.document = { createElementNS: () => new SvgNode() };
  try {
    for (const [Ctor, kind, draw] of [
      [RunnerArchitecture, 'building', (pool, item) => pool.draw(item, 70, project, '#abcdef', false)],
      [RunnerObstacles, 'cargo', (pool, item) => pool.draw(item, 70, project)],
      [RunnerTraffic, 'car', (pool, item) => pool.draw(item, 70, project, 0, false)],
      [RunnerTraffic, 'crossing', (pool, item) => pool.draw(item, 70, project, 0, false)],
    ]) {
      const svg = scene(), pool = new Ctor(svg);
      const count = svg.querySelectorAll('[data-runner-mesh]').length;
      pool.begin(); const visible = draw(pool, object(kind)); pool.end();
      assert.equal(visible.getAttribute('display'), 'inline', kind);
      assert.ok(visible.children.some(child => child.getAttribute('visibility') === 'visible'), kind);
      // The next frame contains no such object. SVG visibility:hidden would
      // leave explicitly visible descendants on screen; display:none cannot.
      pool.begin(); pool.end();
      assert.equal(visible.getAttribute('display'), 'none', `${kind}: stale geometry must disappear`);
      for (let i = 0; i < 10; i++) { pool.begin(); draw(pool, object(kind)); pool.end(); pool.begin(); pool.end(); }
      assert.equal(svg.querySelectorAll('[data-runner-mesh]').length, count, `${kind}: pool must stay bounded`);
      assert.ok(svg.querySelectorAll('[data-runner-mesh]').every(node => node.getAttribute('display') === 'none'));
    }
  } finally { globalThis.document = previous; }
});

test('recreating a renderer removes old meshes even after depth-layer reparenting', () => {
  const previous = globalThis.document;
  globalThis.document = { createElementNS: () => new SvgNode() };
  try {
    for (const Ctor of [RunnerArchitecture, RunnerObstacles, RunnerTraffic]) {
      const svg = scene(); new Ctor(svg);
      const before = svg.querySelectorAll('[data-runner-mesh]');
      const depth = new SvgNode(); svg.append(depth); depth.append(...before);
      new Ctor(svg);
      const after = svg.querySelectorAll('[data-runner-mesh]');
      assert.equal(after.length, before.length);
      assert.ok(before.every(node => node.parent === null));
    }
  } finally { globalThis.document = previous; }
});

test('distant buildings render without accessing absent façade details', () => {
  const previous = globalThis.document;
  globalThis.document = { createElementNS: () => new SvgNode() };
  try {
    const svg = scene(), pool = new RunnerArchitecture(svg);
    const count = svg.querySelectorAll('[data-runner-mesh]').length;
    for (const kind of ['building', 'platform']) {
      for (const district of [0, 2, 3]) {
        for (let variant = 0; variant < 8; variant++) {
          // Follow geometry from the extended view range across the detail
          // boundary and past the player, without starting a gameplay run.
          for (const z of [599, 300, 150, 149, 70, -3]) {
            const item = { ...object(kind), x: variant % 2 ? 176 : -176, district, variant, z };
            pool.begin();
            const visible = pool.draw(item, z, project, '#abcdef', z < 6);
            pool.end();
            assert.equal(visible.getAttribute('display'), 'inline', `${kind}: z=${z}`);
            assert.ok(visible.querySelectorAll('[d]').length > 0);
            for (const path of visible.querySelectorAll('[d]')) {
              assert.doesNotMatch(path.getAttribute('d'), /NaN|Infinity|undefined/);
            }
            assert.equal(svg.querySelectorAll('[data-runner-mesh]').filter(node => node.getAttribute('display') === 'inline').length, 1);
          }
        }
      }
    }
    assert.equal(svg.querySelectorAll('[data-runner-mesh]').length, count);
    pool.begin(); pool.end();
    assert.ok(svg.querySelectorAll('[data-runner-mesh]').every(node => node.getAttribute('display') === 'none'));
  } finally { globalThis.document = previous; }
});
