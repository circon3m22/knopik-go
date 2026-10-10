import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const source = await fs.readFile(path.join(root, 'app/pixel-artwork.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const scratch = path.join(root, 'work');
await fs.mkdir(scratch, { recursive: true });
const modulePath = path.join(scratch, 'pixel-artwork.mjs');
await fs.writeFile(modulePath, compiled);
const { PixelDog, PixelLogo } = await import(pathToFileURL(modulePath).href);
const innerSvg = markup => markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const dog = innerSvg(renderToStaticMarkup(React.createElement(PixelDog, { ears: true })));
const logo = innerSvg(renderToStaticMarkup(React.createElement(PixelLogo)));
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 160 160" shape-rendering="crispEdges"><path fill="#f3e7cf" d="M0 0h160v160H0Z"/><path fill="#343041" d="M20 8h120v4h8v8h4v120h-4v8h-8v4H20v-4h-8v-8H8V20h4v-8h8Z"/><path fill="#e0be85" d="M24 16h112v4h8v8h4v104h-4v8h-8v4H24v-4h-8v-8h-4V28h4v-8h8Z"/><g transform="translate(22 19) scale(.90625)">${dog}</g></svg>`;
await fs.writeFile(path.join(root, 'public/icon.svg'), icon);
for (const [filename, size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]) {
  await sharp(Buffer.from(icon)).resize(size,size,{kernel:'nearest'}).png({palette:true,compressionLevel:9}).toFile(path.join(root,'public',filename));
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" shape-rendering="crispEdges"><path fill="#f3e7cf" d="M0 0h1200v630H0Z"/><path fill="#e0be85" d="M0 530h1200v100H0Z"/><g transform="translate(80 140) scale(11)">${logo}</g><g transform="translate(725 74) scale(3.5)">${dog}</g><path fill="#b76253" d="M80 330h470v8H80Z"/><path fill="#c3dce7" d="M80 370h200v24H80Zm0 48h320v24H80Z"/></svg>`;
await sharp(Buffer.from(og)).png({palette:true,compressionLevel:9}).toFile(path.join(root,'public/og.png'));
await fs.unlink(modulePath);
console.log('Pixel launcher icons exported from SVG source.');
