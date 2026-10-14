import { Children, useId, type ReactNode } from "react";

export function ApartmentBottleShelf({ children }: { children: ReactNode }) {
  const bottles=Children.toArray(children),id=`bar-wood-${useId().replaceAll(":","")}`;
  return <section className="apartment-bottle-shelves" aria-label="Полки напитков мини-бара">
    <div className="apartment-bar-cabinet">
      <svg className="bar-cabinet-wood" viewBox="0 0 360 500" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true"><defs><pattern id={id} width="80" height="64" patternUnits="userSpaceOnUse"><rect width="80" height="64" fill="#79523d"/><path d="M6 0h3v48H6Zm14 16h2v48h-2Zm29-16h4v64h-4Zm22 0h2v36h-2Z" fill="#684734"/><path d="M10 0h2v46h-2Zm44 0h2v64h-2Z" fill="#987052"/></pattern></defs><rect width="360" height="500" fill="#343041"/><rect x="8" y="8" width="344" height="484" fill={`url(#${id})`}/><path d="M12 12h336v12H24v456H12Z" fill="#bd9062"/><path d="M336 24h12v456H24v-12h312Z" fill="#533e32"/>{[40,140,240,340,440].map(y=><g key={y}><rect x="14" y={y} width="6" height="6" fill="#343041"/><rect x="15" y={y+1} width="3" height="3" fill="#f4d889"/><rect x="340" y={y} width="6" height="6" fill="#343041"/><rect x="341" y={y+1} width="3" height="3" fill="#f4d889"/></g>)}</svg>
      <div className="apartment-bar-cornice" aria-hidden="true"><span/><span/><span/></div>
      {Array.from({length:Math.ceil(bottles.length/3)},(_,row)=><div className="apartment-bar-row" key={row}>
        {bottles.slice(row*3,row*3+3)}
        <div className="apartment-bar-ledge" aria-hidden="true"/>
      </div>)}
      <div className="apartment-bar-base" aria-hidden="true"/>
    </div>
  </section>;
}
