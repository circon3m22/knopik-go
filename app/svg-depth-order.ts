/** Keep the longest already ordered subsequence in place. Moving one actor across
 * furniture must not detach and repaint every SVG subtree in the layer. */
export function reorderSvgChildren(parent:Element,desired:readonly Element[]){
  const positions=new Map(Array.from(parent.children).map((node,i)=>[node,i]));
  const tails:number[]=[],previous=new Int32Array(desired.length).fill(-1);
  for(let i=0;i<desired.length;i++){
    const position=positions.get(desired[i])??-1;
    if(position<0)continue;
    let lo=0,hi=tails.length;
    while(lo<hi){const mid=(lo+hi)>>>1;if((positions.get(desired[tails[mid]])??-1)<position)lo=mid+1;else hi=mid;}
    if(lo>0)previous[i]=tails[lo-1];tails[lo]=i;
  }
  const keep=new Set<number>();
  for(let i=tails.at(-1)??-1;i>=0;i=previous[i])keep.add(i);
  let anchor:Element|null=null;
  for(let i=desired.length-1;i>=0;i--){if(!keep.has(i))parent.insertBefore(desired[i],anchor);anchor=desired[i];}
}
