import type {NeighborhoodObject} from './neighborhood-map';
import {getVisualProfile} from './graphics-quality';
import {NeighborhoodExtraProp} from './neighborhood-details';
import {CityBuilding,CityTree,CityLamp,CitySmallProp,CityVehicle,CityPavilion,CityFountain} from './neighborhood-city-props';
export type StreetPalette={ink:string;ground:string;grass:string;leaf:string;leafLight:string;leafDark:string;paving:string;seam:string;road:string;wall:string;trim:string;wood:string;roof:string;water:string;waterLight:string;metal:string;shadow:string;night:boolean};
export function streetPalette(night:boolean):StreetPalette{return night?
  {ink:"#222738",ground:"#354c50",grass:"#3e5d55",leaf:"#345b53",leafLight:"#527d68",leafDark:"#253e43",paving:"#657077",seam:"#4b565f",road:"#414653",wall:"#697384",trim:"#97a09e",wood:"#655960",roof:"#585465",water:"#284d60",waterLight:"#6b9aab",metal:"#697c89",shadow:"#182438",night}:
  {ink:"#343041",ground:"#b6bb97",grass:"#a1b68a",leaf:"#537d65",leafLight:"#88a980",leafDark:"#3e625a",paving:"#d8c6a4",seam:"#b3a28b",road:"#88858a",wall:"#ece3ca",trim:"#d8c6a4",wood:"#775442",roof:"#ad7d6c",water:"#88b6b0",waterLight:"#c5ddd0",metal:"#667f82",shadow:"#48635e",night};}

export function StreetProp({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
 const detail=getVisualProfile().detail,v=o.variant??0;
 switch(o.kind){
  case 'house':return <CityBuilding object={o} p={p} detail={detail}/>;
  case 'tree':return <CityTree p={p} variant={v} detail={detail}/>;
  case 'lamp':return <CityLamp p={p} variant={v} detail={detail}/>;
  case 'car':case 'bicycle':return <CityVehicle object={o} p={p} detail={detail}/>;
  case 'kiosk':case 'cafe':case 'greenhouse':case 'pergola':return <CityPavilion object={o} p={p} detail={detail}/>;
  case 'fountain':return <CityFountain p={p} detail={detail}/>;
  case 'notice':case 'utility':return <NeighborhoodExtraProp object={o} p={p}/>;
  case 'sign':return <g data-city-material="sign"><path d="M-5-90H5V0H-5Z" fill={p.wood}/><path d="M-50-93h94v5h10v25H-50Z" fill={p.ink}/><path d="M-46-89h86v5h10v17H-46Z" fill={p.trim}/><path d="M-44-88h82v2h-82Z" fill={p.wall}/><text x="0" y="-74" fontSize="11" textAnchor="middle" fill={p.ink}>{['ПАРК →','К РЕКЕ ↓','RUN ↑','САД ↑','ПЛОЩАДЬ →'][v]}</text><path d="M-42-85h2v2h-2Zm0 14h2v2h-2Z" fill={p.metal}/></g>;
  default:return <CitySmallProp object={o} p={p} detail={detail}/>;
 }
}
export {AnimatedNeighborhoodResident as NeighborhoodResident} from './neighborhood-resident-art';
export function NeighborhoodCat({p}:{p:StreetPalette}){return <g><path d="M-22 1h44v5h-44Z" fill={p.shadow} opacity=".35"/><path d="M-20-18h38v18h-38Z" fill={p.ink}/><path d="M-16-15h31v13h-31Z" fill={p.trim}/><g data-cat-head=""><path d="M10-27h6v-6h5v10h6v-10h5v6h5v24H10Z" fill={p.ink}/><path d="M14-24h19v17H14Z" fill={p.trim}/><path d="M16-20h4v3h-4Zm11 0h4v3h-4Z" fill={p.leafDark}/><path d="M22-13h3v3h-3Z" fill={p.wood}/></g><path data-cat-tail="" d="M-21-9h-8v-10h-5v-9h5v6h5v10h7Z" fill={p.trim}/></g>;}
