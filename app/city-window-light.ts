/** Shared with the pixel facade and its light on the pavement. */
export const cityWindowSeed=(id:string)=>[...id].reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,7);
export const cityWindowKey=(seed:number,row:number,col:number)=>(seed+row*17+col*23)%29;
