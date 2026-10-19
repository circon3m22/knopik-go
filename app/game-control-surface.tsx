import type {ReactNode} from 'react';

/** The glass samples the world directly. The rim and meter never clip the button
 * or its hit target, and no ancestor of the glass creates a backdrop root. */
export function GameControlSurface({children}:{children?:ReactNode}){
 return <span className="game-control-surface" aria-hidden="true">
  <span className="game-control-glass"/>
  {children&&<span className="game-control-meter">{children}</span>}
  <span className="game-control-rim"/>
 </span>;
}
