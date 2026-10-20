import {getVisualProfile} from './graphics-quality';
import {projectAdventureY} from './adventure-projection';
import {CITY_LIFE_ACTORS,type CityLifeActor} from './neighborhood-city-life';
import type {StreetPalette} from './neighborhood-props';
function LifeArt({a,p}:{a:CityLifeActor;p:StreetPalette}){
 const detail=getVisualProfile().detail;
 switch(a.kind){
  case 'pigeon':return <><path data-life-shadow="" d="M-12 0h24v3h-24Z" fill={p.shadow} opacity=".25"/><g data-life-body=""><path d="M-10-13h15v-5h8v12H5v5H-10v-4h-5v-5h5Z" fill={p.ink}/><path d="M-9-11H5v-4h6v7H3v5H-8Z" fill={p.night?'#8a999e':'#bbc3bb'}/><path d="M2-11h8v3H2Z" fill={p.leaf}/><path data-life-wing="" d="M-10-10H1v6H-10Z" fill={p.metal}/><path d="M12-12h5v3h-5ZM-5-1h2v4h-2Zm7 0h2v4H2Z" fill="#b88c76"/><path d="M8-15h2v2H8Z" fill={p.ink}/></g></>;
  case 'duck':return <><path data-life-wake="" d="M-24 4h45v1h-45Zm-7 4h20v1h-20Zm39 0h16v1H8Z" fill={p.waterLight} opacity=".6"/><g data-life-body=""><path d="M-17-12h31v5h6v10h-7v4H-12V3h-9V-7h4Z" fill={p.ink}/><path d="M-15-9H12v5h5v6H9v3H-10V1h-8v-5h3Z" fill={a.seed%3===2?'#d7bd81':p.trim}/><path d="M7-22h12v17H7Z" fill={a.seed%3===2?'#c8a96f':p.leafDark}/><path d="M18-16h11v4H18Z" fill="#d8ae78"/><path d="M14-19h2v2h-2Z" fill={p.ink}/><path d="M-9-7H4v6H-9Z" fill={p.night?'#788a8f':'#b0c5c0'}/></g></>;
  case 'butterfly':return p.night?<g data-life-body=""><path d="M-4-1h8v2h-8ZM-1-4h2v8h-2Z" fill="#d2cf94" opacity=".25"/><path data-life-wing="" d="M-1-1h2v2h-2Z" fill="#f4df9a"/></g>:<g data-life-body=""><g data-life-wing=""><path d="M-7-6h5v3h4v-3h5v8H3v4H-3V2h-4Z" fill={a.seed%2?'#c48d85':'#d9bf83'}/><path d="M-6-5h3v3h-3Zm9 0h3v3H3Z" fill="#eee0ae"/></g><path d="M-1-4h2v9h-2Z" fill={p.ink}/></g>;
  case 'smoke':case 'steam':return <g data-life-body=""><path d="M-6-7h13v-5h8v7h-4v10H-8V0h-4v-5h6Zm-5-16h12v-5h10v12H5v5H-7v-5h-4Z" fill={p.night?'#acb9b0':'#e2dec9'}/>{detail>=3&&<path d="M0-25h15v-5h9v13H13v5H0Z" fill={p.night?'#819c98':'#c7cec0'}/>}</g>;
  case 'fountain':return <><path data-life-drops="" fill={p.waterLight}/>{detail>=3&&<path data-life-wake="" d="M-58-8h22v1h-22Zm87 4h24v1H29Z" fill={p.waterLight}/>}</>;
  case 'boat':return <><path data-life-wake="" d="M-103 9h38v2h-38Zm13 7h26v2h-26ZM-86-6h24v2h-24Z" fill={p.waterLight} opacity=".5"/><g data-life-body=""><path d="M-63-9H62v7H51v10H33v5H-37V8h-15V2h-11Z" fill={p.ink}/><path d="M-57-5H54v5H45v7H29v3H-34V5h-13V0h-10Z" fill={p.roof}/><path d="M-44-9H38v10H-44Z" fill={p.wood}/><path d="M-37-7H33v2H-37ZM-19-4h4v11h-4Zm35 0h4v11h-4Z" fill={p.trim}/><path d="M-6-42H9v15H-6Z" fill={p.ink}/><path d="M-4-39H7v9H-4Z" fill="#d6b28d"/><path d="M-8-26h20v19H-8Z" fill={p.leafDark}/><path d="M-5-24H9v13H-5Z" fill={p.trim}/><path d="M4-18h33v4H4Zm26 0h4v21h-4Z" fill={p.wood}/>{detail>=2&&<><path d="M-52-3h19v1h-19Zm18 8h14v1h-14Zm58-6h17v1H24Z" fill={p.trim}/><path d="M-25-23h10v11h-10Z" fill={p.wood}/><path d="M-24-22h8v2h-8Z" fill={p.wall}/></>}</g></>;
  case 'reeds':return <g data-life-body=""><path d="M-22 1h2v-19h2V2h8v-33h2V2h9v-23h2V3h7v-38h2V3h9v-18h2V4h-45Z" fill={p.leafDark}/><path d="M-12-32h5v12h-5Zm19-7h5v14H7Z" fill={p.wood}/><path d="M-22-12h-5v-5h3v4h5Zm24-5h5v-6h3v8H2Z" fill={p.leaf}/></g>;
  case 'pennant':{const top=a.seed===2?-149:-80;return <g data-life-body=""><path d={`M-59 ${top}h118v2H-59Z`} fill={p.wood}/>{[-46,-23,0,23,46].map((x,i)=><g key={x}><path d={`M${x-7} ${top+2}h14v10h-3v4h-3v4h-2v-4h-3v-4h-3Z`} fill={[p.roof,p.trim,p.leafLight][(i+a.seed)%3]}/><path d={`M${x-5} ${top+4}h10v2h-10Z`} fill={p.night?'#adad9c':'#efdfb8'}/></g>)}</g>;}

 }
}
export function CityLifeArtwork({p}:{p:StreetPalette}){
 const detail=getVisualProfile().detail;if(detail===0)return null;
 return <>{CITY_LIFE_ACTORS.filter(a=>detail>=a.detail).map(a=><g key={a.id} data-city-life={a.id} pointerEvents="none" data-depth={a.y+.4} transform={`translate(${a.x} ${projectAdventureY(a.y)})`}><g transform="scale(1 .82)"><LifeArt a={a} p={p}/></g></g>)}</>;
}
