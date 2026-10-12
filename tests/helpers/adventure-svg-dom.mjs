import { SvgNode } from './runner-svg-dom.mjs';
export function parseAdventureSvg(source) {
  const stack = []; let root;
  for (const match of source.matchAll(/<[^>]+>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (!token.startsWith('<')) { if (stack.length) stack.at(-1).textContent += token; continue; }
    const name = token.match(/^<([\w:-]+)/)?.[1]; if (!name) continue;
    const node = new SvgNode(name);
    for (const a of token.matchAll(/([\w:-]+)="([^"]*)"/g)) node.setAttribute(a[1], a[2].replaceAll('&amp;', '&').replaceAll('&quot;', '"'));
    if (stack.length) stack.at(-1).append(node); else root = node;
    if (!token.endsWith('/>')) stack.push(node);
  }
  return root;
}
