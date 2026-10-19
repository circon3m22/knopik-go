import {getGraphicsQuality} from './graphics-quality.ts';

type Backdrops={surfaces:Set<HTMLElement>;phase:boolean;reduced:MediaQueryList|null;supported:boolean};
const worlds=new WeakMap<Element,Backdrops>();

/** Register only the tiny glass layers. Never invalidate inherited styles on
 * the layout: that would also restyle the thousands of SVG world nodes. */
export function registerControlBackdrop(glass:HTMLElement|null){
 const world=glass?.closest('.adventure-layout');
 if(!glass||!world)return()=>{};
 let group=worlds.get(world);
 if(!group){
  const win=glass.ownerDocument.defaultView;
  const supported=!!win?.CSS?.supports?.('backdrop-filter','blur(1px)')||!!win?.CSS?.supports?.('-webkit-backdrop-filter','blur(1px)');
  group={surfaces:new Set(),phase:false,reduced:win?.matchMedia?.('(prefers-reduced-transparency: reduce)')??null,supported};
  worlds.set(world,group);
 }
 group.surfaces.add(glass);
 return()=>{
  group.surfaces.delete(glass);glass.style.removeProperty('--control-live-sample');
  if(group.surfaces.size===0&&worlds.get(world)===group)worlds.delete(world);
 };
}

/** Call after an actual scene paint, in its existing limited RAF. WebKit can
 * retain a clipped backdrop when only the SVG behind it changes. An imperceptible
 * 0.01px change to the filter invalidates that cached sample for this frame.
 * No forced layout, remount, extra RAF, timer or captured background image. */
export function refreshControlBackdrops(scene:Element){
 const quality=getGraphicsQuality();
 if(quality==='low'||quality==='medium')return;
 const world=scene.closest('.adventure-layout'),group=world&&worlds.get(world);
 if(!world||!group||!group.supported||group.reduced?.matches||world.ownerDocument.hidden||world.getAttribute('data-world-chrome-hidden')==='true')return;
 group.phase=!group.phase;
 const sample=group.phase?'0.01px':'0px';
 for(const glass of group.surfaces)glass.style.setProperty('--control-live-sample',sample);
}
