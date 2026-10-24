import {useId} from 'react';
import {GRAPHICS_QUALITIES,migrateGraphicsQuality,type GraphicsQuality,type GraphicsPreset} from './graphics-quality';
import {GraphicsQualityPreview} from './graphics-quality-preview';

export function GraphicsQualityPicker({value,onSelect}:{value:GraphicsQuality;onSelect:(quality:GraphicsPreset)=>void}){
 const id=`graphics-picker-${useId().replaceAll(':','')}`,selected=migrateGraphicsQuality(value,undefined,undefined);
 return <fieldset className="graphics-preset-picker" aria-describedby={`${id}-hint`}>
  <legend>Качество графики</legend>
  <p id={`${id}-hint`}>Одна сцена — три уровня детализации. Режим применяется ко всей игре.</p>
  <div className="graphics-preset-options">{GRAPHICS_QUALITIES.map(mode=><label key={mode.id} className="graphics-preset-card" data-selected={selected===mode.id}>
   <input type="radio" name={id} value={mode.id} checked={selected===mode.id} aria-labelledby={`${id}-${mode.id}-title`} aria-describedby={`${id}-${mode.id}-detail`} onChange={()=>onSelect(mode.id)}/>
   <GraphicsQualityPreview quality={mode.id}/>
   <span className="graphics-preset-copy"><strong id={`${id}-${mode.id}-title`}>{mode.title}</strong><small className="graphics-preset-tag">{mode.tag}</small><span id={`${id}-${mode.id}-detail`}>{mode.detail}</span></span>
   <span className="graphics-preset-check" aria-hidden="true">{selected===mode.id?'✓':''}</span>
  </label>)}</div>
 </fieldset>;
}
