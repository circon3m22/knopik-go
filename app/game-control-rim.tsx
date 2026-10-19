import {CONTROL_FRAME as frame} from './game-control-frame';
const corners=[['top-left','0 0 12 12'],['top-right','36 0 12 12'],['bottom-left','0 36 12 12'],['bottom-right','36 36 12 12']] as const;
/** A real top-level paint layer, not a border image inside the glass surface. */
export function GameControlRim(){
 return <span className="game-control-rim" aria-hidden="true" data-control-outline="native">
  {corners.map(([corner,viewBox])=><span key={corner} className={`game-control-corner is-${corner}`}><svg width="12" height="12" viewBox={viewBox} preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false" aria-hidden="true">{frame.paths.map(({fill,d})=><path key={fill} fill={fill} fillRule="evenodd" d={d}/>)}</svg></span>)}
  <span className="game-control-edge is-top"/><span className="game-control-edge is-right"/><span className="game-control-edge is-bottom"/><span className="game-control-edge is-left"/>
 </span>;
}
