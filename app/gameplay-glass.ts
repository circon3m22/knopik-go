/** Keep the scene behind glass while reserving the original area for interactive overlays. */
export function attachGameplayGlass(dialog:HTMLElement){
 const layout=dialog.querySelector<HTMLElement>('.adventure-layout');
 if(!layout)return ()=>{};
 const root=dialog.ownerDocument.documentElement;
 const header=layout.querySelector<HTMLElement>(':scope > .adventure-hud, :scope > .coop-hud');
 const controls=layout.querySelector<HTMLElement>(':scope > .adventure-controls');
 let resize:ResizeObserver|undefined,active=false,disposed=false;
 const measure=()=>{
  if(!active)return;
  const values={'--glass-hud-height':`${header?.offsetHeight??0}px`,'--glass-controls-height':`${controls?.offsetHeight??0}px`,'--glass-controls-width':`${controls?.offsetWidth??0}px`};
  for(const [name,value]of Object.entries(values))if(layout.style.getPropertyValue(name)!==value)layout.style.setProperty(name,value);
 };
 const update=()=>{
  if(disposed)return;
  const quality=root.dataset.knopikGraphics,next=quality==='high'||quality==='very-high';
  if(next===active)return;
  active=next;
  if(active){
   layout.dataset.gameGlass='on';measure();
   resize=new ResizeObserver(measure);if(header)resize.observe(header);if(controls)resize.observe(controls);
  }else{
   resize?.disconnect();resize=undefined;delete layout.dataset.gameGlass;
   for(const name of ['--glass-hud-height','--glass-controls-height','--glass-controls-width'])layout.style.removeProperty(name);
  }
 };
 const quality=new MutationObserver(update);
 quality.observe(root,{attributes:true,attributeFilter:['data-knopik-graphics']});update();
 return ()=>{disposed=true;active=false;quality.disconnect();resize?.disconnect();delete layout.dataset.gameGlass;for(const name of ['--glass-hud-height','--glass-controls-height','--glass-controls-width'])layout.style.removeProperty(name);};
}
