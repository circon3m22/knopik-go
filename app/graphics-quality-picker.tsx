import {useId} from 'react';
import {GRAPHICS_QUALITIES,migrateGraphicsQuality,type GraphicsQuality,type GraphicsPreset} from './graphics-quality';
import {GraphicsQualityPreview} from './graphics-quality-preview';
import {useDesktopMode,selectDesktopUltra} from './desktop-experience';

export function GraphicsQualityPicker({value,onSelect}:{value:GraphicsQuality;onSelect:(quality:GraphicsPreset)=>void}){
 const {desktop,ultra}=useDesktopMode(),pcSelected=desktop&&ultra&&value==='ultra';
 const id=`graphics-picker-${useId().replaceAll(':','')}`,selected=migrateGraphicsQuality(value,undefined,undefined);
 return <fieldset className="graphics-preset-picker" aria-describedby={`${id}-hint`}>
  <legend>Качество графики</legend>
  <p id={`${id}-hint`}>{desktop?"Четыре режима, включая Ultra для ПК. Настройка применяется ко всей игре.":"Одна сцена — три уровня детализации. Режим применяется ко всей игре."}</p>
  <div className="graphics-preset-options">{GRAPHICS_QUALITIES.map(mode=><label key={mode.id} className="graphics-preset-card" data-selected={selected===mode.id&&!pcSelected}>
   <input type="radio" name={id} value={mode.id} checked={selected===mode.id&&!pcSelected} aria-labelledby={`${id}-${mode.id}-title`} aria-describedby={`${id}-${mode.id}-detail`} onChange={()=>{if(desktop)selectDesktopUltra(false);onSelect(mode.id);}}/>
   <GraphicsQualityPreview quality={mode.id}/>
   <span className="graphics-preset-copy"><strong id={`${id}-${mode.id}-title`}>{mode.title}</strong><small className="graphics-preset-tag">{mode.tag}</small><span id={`${id}-${mode.id}-detail`}>{mode.detail}</span></span>
   <span className="graphics-preset-check" aria-hidden="true">{selected===mode.id&&!pcSelected?'✓':''}</span>
  </label>)}{desktop&&<label className="graphics-preset-card pc-ultra-option" data-selected={pcSelected}>
   <input type="radio" name={id} value="pc-ultra" checked={pcSelected} aria-label="Ultra · только ПК" onChange={()=>{selectDesktopUltra(true);onSelect('ultra');}}/>
   <GraphicsQualityPreview quality="ultra"/>
   <span className="graphics-preset-copy"><strong>Ultra · ПК</strong><small className="graphics-preset-tag">PC EDITION</small><span>Полный свет, объёмный туман, отражения, дополнительные искры и следы атак.</span></span><span className="graphics-preset-check" aria-hidden="true">{pcSelected?'✓':''}</span>
  </label>}</div>
 </fieldset>;
}
