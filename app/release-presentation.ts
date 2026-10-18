import presentations from './release-presentations.json' with {type:'json'};
import {GAME_RELEASES,type GameRelease} from './game-release.ts';
export type ReleasePresentation={id:string;portraitArtwork?:string;portraitAlt?:string;retired?:boolean;foreground?:string;muted?:string;buttonText?:string;border?:string;introducedIn:string;edition:string;title:string;alt:string;artwork:string;tagline:string;hint:string;background:string;surface:string;accent:string;highlight:string};
export const RELEASE_PRESENTATIONS:readonly ReleasePresentation[]=presentations;
export function releasePresentation(release:Pick<GameRelease,'presentation'>=GAME_RELEASES[0]){
 return RELEASE_PRESENTATIONS.find(p=>p.id===release.presentation)??RELEASE_PRESENTATIONS[0];
}
export const GAME_PRESENTATION=releasePresentation();
