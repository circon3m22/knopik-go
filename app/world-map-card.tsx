import type {ReactNode} from 'react';

export function WorldMapCard({title,subtitle,objective,detail,counter,legend,children,onClose,secondaryAction}:{
 title:string;subtitle:string;objective:string;detail?:string;counter?:string;
 legend:ReactNode;children:ReactNode;onClose:()=>void;secondaryAction?:ReactNode;
}){
 return <section className="world-map-card atlas-card" aria-label={`Карта: ${title}`}>
  <header className="world-map-heading"><div><small>{subtitle}</small><h2>{title}</h2></div>
   <button type="button" className="world-map-close" aria-label="Закрыть карту" onClick={onClose}><svg viewBox="0 0 20 20" aria-hidden="true" shapeRendering="crispEdges"><path d="M3 3h3v3H3Zm3 3h3v3H6Zm3 3h2v2H9Zm2-3h3v3h-3Zm3-3h3v3h-3ZM6 11h3v3H6Zm-3 3h3v3H3Zm8-3h3v3h-3Zm3 3h3v3h-3Z" fill="currentColor"/></svg></button>
  </header>
  <div className="atlas-canvas world-map-canvas">{children}</div>
  <div className="world-map-info">
   <div className="world-map-location"><span>{detail}</span>{counter&&<b>{counter}</b>}</div>
   <div className="atlas-legend">{legend}</div>
   <section className="world-map-objective" aria-label="Текущее задание"><small>ТЕКУЩЕЕ ЗАДАНИЕ</small><p>{objective}</p></section>
  </div>
  <footer className="world-map-actions">{secondaryAction}<button type="button" className="world-map-resume" autoFocus onClick={onClose}>Вернуться в игру</button></footer>
 </section>;
}
