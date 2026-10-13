import { Children, type ReactNode } from "react";

export function ApartmentBottleShelf({ children }: { children: ReactNode }) {
  const bottles=Children.toArray(children);
  return <section className="apartment-bottle-shelves" aria-label="Полки напитков мини-бара">
    <div className="apartment-bar-cabinet">
      <div className="apartment-bar-cornice" aria-hidden="true"><span/><span/><span/></div>
      {Array.from({length:Math.ceil(bottles.length/3)},(_,row)=><div className="apartment-bar-row" key={row}>
        {bottles.slice(row*3,row*3+3)}
        <div className="apartment-bar-ledge" aria-hidden="true"/>
      </div>)}
      <div className="apartment-bar-base" aria-hidden="true"/>
    </div>
  </section>;
}
