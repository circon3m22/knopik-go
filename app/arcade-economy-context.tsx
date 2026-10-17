'use client';
import {createContext,useContext} from 'react';
import {arcadeSettlement,arcadeProfitFactor} from './arcade-economy';
export const ArcadeEconomyContext=createContext({wealth:0,profit:0});
export function useArcadeQuote(){const economy=useContext(ArcadeEconomyContext);return {factor:arcadeProfitFactor(economy.wealth,economy.profit),quote:(amount:number,stake=0)=>arcadeSettlement(amount,stake,economy.wealth+stake,economy.profit).payout};}
