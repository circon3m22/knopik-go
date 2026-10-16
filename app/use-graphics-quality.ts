'use client';
import {useSyncExternalStore} from 'react';
import {getGraphicsQuality,subscribeGraphicsQuality,type GraphicsQuality} from './graphics-quality';
const serverQuality=():GraphicsQuality=>getGraphicsQuality();
export function useGraphicsQuality(){return useSyncExternalStore(subscribeGraphicsQuality,getGraphicsQuality,serverQuality);}
