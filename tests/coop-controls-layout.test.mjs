import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const {CoopGameControls}=await import('../app/coop-controls.tsx');
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {readFileSync} from 'node:fs';

const render=cape=>parseAdventureSvg(renderToStaticMarkup(React.createElement(CoopGameControls,{cape,disabled:false,dodgeReady:true,energyReady:true,weapon:'fist',interaction:'Помочь · держи E',controls:{set(){},dodge(){},energy(){}},onPause(){}})));

test('cape power and held help are separate buttons inside one utility grid item',()=>{
 const root=render(true),row=root.querySelector('[class="coop-utility-actions has-cape"]');
 assert.ok(row);assert.equal(row.children.length,2);
 assert.ok(row.children[0].getAttribute('class').includes('adventure-interact'));
 assert.equal(row.children[1].getAttribute('class'),'coop-energy');
 assert.equal(row.children[1].getAttribute('type'),'button');
 assert.equal(render(false).querySelector('[class="coop-utility-actions"]').children.length,1);
 // Shared controls assign grid row 1 to all adventure-interact nodes. The cape
 // must not carry that class, and its wrapper must override those child areas.
 const css=readFileSync(new URL('../app/coop.css',import.meta.url),'utf8');
 assert.match(css,/\.coop-utility-actions\.has-cape\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
 assert.match(css,/\.coop-utility-actions>button\{grid-area:auto/);
 assert.match(css,/orientation:landscape[\s\S]*\.coop-utility-actions\{grid-column:1;grid-row:2/);
});
