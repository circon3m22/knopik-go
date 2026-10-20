import '../tests/helpers/tsx-loader.mjs';
import{resolve}from'node:path';
import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import{mkdir,writeFile,copyFile}from'node:fs/promises';import sharp from'sharp';
import{parseAdventureSvg}from'../tests/helpers/adventure-svg-dom.mjs';
import{NeighborhoodEngine}from'../app/neighborhood-engine.ts';
import{defaultNeighborhoodProgress}from'../app/neighborhood-progress.ts';
import{setGraphicsQuality}from'../app/graphics-quality.ts';
const{NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const{AnimatedNeighborhoodResident}=await import('../app/neighborhood-resident-art.tsx');
const{streetPalette}=await import('../app/neighborhood-props.tsx');
const dir='outputs/neighborhood-city';await mkdir(dir,{recursive:true});await mkdir(dir+'/font-cache',{recursive:true});if(process.env.KNOPIK_PREVIEW_FONT)await copyFile(process.env.KNOPIK_PREVIEW_FONT,dir+'/font-cache/tiny5.ttf');
await writeFile(dir+'/fonts.conf',`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${resolve(dir+'/font-cache')}</dir><cachedir>${resolve(dir+'/font-cache')}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=resolve(dir+'/fonts.conf');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const serialize=n=>`<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${esc(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
for(const quality of['medium','ultra'])for(const night of[false,true]){
 setGraphicsQuality(quality);const progress=defaultNeighborhoodProgress();progress.missions.lights.steps=7;
 const engine=new NeighborhoodEngine(progress,{change(){},progress(){},home(){},run(){},sound(){}});
 for(const[name,x,y]of[['home',430,700],['garden',3940,700],['square',3730,1270],['river',4000,1770],['west',40,900],['east',4755,900],['north',1650,190]]){
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night,prefix:'preview-'+name})));const renderer=new NeighborhoodRenderer(svg,night,true);renderer.resize(720,800);Object.assign(engine.player,{x,y});renderer.paint(engine,true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','720');svg.setAttribute('height','800');
  const source=serialize(svg).replace('>','><style>text{font-family:Tiny5,monospace;font-weight:400}</style>'),file=`${dir}/${name}-${quality}-${night?'night':'day'}`;await writeFile(file+'.svg',source);await sharp(Buffer.from(source)).png().toFile(file+'.png');
 }
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night,prefix:'overview'}))),renderer=new NeighborhoodRenderer(svg,night,true);renderer.paint(engine,true);
 for(const selector of['[data-world-object]','[data-city-backdrop]','[data-resident]','[data-ground-chunk]'])for(const n of svg.querySelectorAll(selector))n.setAttribute('display','inline');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','2400');svg.setAttribute('height','841');svg.setAttribute('viewBox','0 0 4800 1681');
 const source=serialize(svg).replace('>','><style>text{font-family:Tiny5,monospace;font-weight:400}</style>'),file=`${dir}/overview-${quality}-${night?'night':'day'}`;await writeFile(file+'.svg',source);await sharp(Buffer.from(source)).png().toFile(file+'.png');
 svg.setAttribute('width','2480');svg.setAttribute('height','1028');svg.setAttribute('viewBox','-700 -440 6200 2570');
 const continuation=serialize(svg).replace('>','><style>text{font-family:Tiny5,monospace;font-weight:400}</style>'),continuationFile=`${dir}/continuation-${quality}-${night?'night':'day'}`;await writeFile(continuationFile+'.svg',continuation);await sharp(Buffer.from(continuation)).png().toFile(continuationFile+'.png');
}
setGraphicsQuality('ultra');const people=Array.from({length:12},(_,i)=>React.createElement('g',{key:i,transform:`translate(${55+i%6*90} ${100+Math.floor(i/6)*110})`},React.createElement(AnimatedNeighborhoodResident,{variant:i,p:streetPalette(false)})));
const svg=renderToStaticMarkup(React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',width:1080,height:460,viewBox:'0 0 540 230',shapeRendering:'crispEdges'},React.createElement('rect',{width:540,height:230,fill:'#ded7bd'}),...people));await writeFile(dir+'/residents.svg',svg);await sharp(Buffer.from(svg)).png().toFile(dir+'/residents.png');
console.log('Native SVG previews: '+dir+' (not browser screenshots)');
