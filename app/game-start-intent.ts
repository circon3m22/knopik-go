/** A Play click during account bootstrap is carried into the first game mount.
 * This is an in-page intent, never a substitute for account/save readiness. */
let requested=false;
const listeners=new Set<()=>void>();
export const earlyPlayRequested=()=>requested;
export const earlyPlayServerSnapshot=()=>false;
export function subscribeEarlyPlay(change:()=>void){listeners.add(change);return()=>{listeners.delete(change);};}
export function requestEarlyPlay(){requested=true;listeners.forEach(change=>change());}
export function clearEarlyPlay(){requested=false;listeners.forEach(change=>change());}
