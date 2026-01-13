import { useState, useEffect, useRef, useCallback } from 'react';
import { api, PriceData } from '@/lib/api';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  previousPrice: number;
  change24h: number;
  priceDirection: 'up' | 'down' | 'stable';
  lastUpdated: number;
}

interface PriceState {
  prices: Record<string, CryptoPrice>;
  isLoading: boolean;
  error: string | null;
  isDelayed: boolean;
}

// Coin config mapping
const COIN_CONFIG: Record<string, { id: string; name: string; icon: string }> = {
  BTC: { id: 'bitcoin', name: 'Bitcoin', icon: '₿' },
  ETH: { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
  BNB: { id: 'binancecoin', name: 'BNB', icon: '🟡' },
  SOL: { id: 'solana', name: 'Solana', icon: '☀️' },
  XRP: { id: 'ripple', name: 'XRP', icon: '💧' },
  ADA: { id: 'cardano', name: 'Cardano', icon: '🔵' },
  DOGE: { id: 'dogecoin', name: 'Dogecoin', icon: '🐕' },
  AVAX: { id: 'avalanche-2', name: 'Avalanche', icon: '🔺' },
  DOT: { id: 'polkadot', name: 'Polkadot', icon: '⚪' },
  MATIC: { id: 'matic-network', name: 'Polygon', icon: '🟣' },
  LINK: { id: 'chainlink', name: 'Chainlink', icon: '🔗' },
  UNI: { id: 'uniswap', name: 'Uniswap', icon: '🦄' },
  SHIB: { id: 'shiba-inu', name: 'Shiba Inu', icon: '🐶' },
  LTC: { id: 'litecoin', name: 'Litecoin', icon: '🪙' },
  ATOM: { id: 'cosmos', name: 'Cosmos', icon: '⚛️' },
  ARB: { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
};

const COIN_IDS = Object.values(COIN_CONFIG).map(c => c.id).join(',');
const REFRESH_INTERVAL = 15000; // 15 seconds

// Fallback prices in case API fails
const FALLBACK_PRICES: Record<string, number> = {
  bitcoin: 92027.52,
  ethereum: 3138.56,
  binancecoin: 910.06,
  solana: 141.83,
  ripple: 2.18,
  cardano: 0.68,
  dogecoin: 0.32,
  'avalanche-2': 35.42,
  polkadot: 6.85,
  'matic-network': 0.89,
  chainlink: 13.28,
  uniswap: 5.47,
  'shiba-inu': 0.000022,
  litecoin: 84.32,
  cosmos: 8.76,
  arbitrum: 0.21,
};

export const useCryptoPrices = () => {
  const [state, setState] = useState<PriceState>({
    prices: {},
    isLoading: true,
    error: null,
    isDelayed: false,
  });

  const previousPricesRef = useRef<Record<string, number>>({});
  const lastSuccessfulFetchRef = useRef<number>(0);

  const fetchPrices = useCallback(async () => {
    try {
      // Call backend API: GET /api/prices?ids=bitcoin,ethereum,solana...
      const data = await api.get<Record<string, PriceData>>(
        `/prices?ids=${COIN_IDS}`,
        false // No auth required for price data
      );
      
      lastSuccessfulFetchRef.current = Date.now();

      const newPrices: Record<string, CryptoPrice> = {};

      Object.entries(COIN_CONFIG).forEach(([symbol, config]) => {
        const coinData = data[config.id];
        if (coinData) {
          const currentPrice = coinData.usd;
          const previousPrice = previousPricesRef.current[symbol] || currentPrice;
          
          let direction: 'up' | 'down' | 'stable' = 'stable';
          if (currentPrice > previousPrice) direction = 'up';
          else if (currentPrice < previousPrice) direction = 'down';

          newPrices[symbol] = {
            id: config.id,
            symbol,
            name: config.name,
            icon: config.icon,
            price: currentPrice,
            previousPrice,
            change24h: coinData.usd_24h_change || 0,
            priceDirection: direction,
            lastUpdated: Date.now(),
          };

          previousPricesRef.current[symbol] = currentPrice;
        }
      });

      setState({
        prices: newPrices,
        isLoading: false,
        error: null,
        isDelayed: false,
      });

      // Reset direction after animation
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          prices: Object.fromEntries(
            Object.entries(prev.prices).map(([key, value]) => [
              key,
              { ...value, priceDirection: 'stable' as const }
            ])
          ),
        }));
      }, 2500);

    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      
      // Use fallback prices if we have no data
      if (Object.keys(state.prices).length === 0) {
        const fallbackPrices: Record<string, CryptoPrice> = {};
        Object.entries(COIN_CONFIG).forEach(([symbol, config]) => {
          fallbackPrices[symbol] = {
            id: config.id,
            symbol,
            name: config.name,
            icon: config.icon,
            price: FALLBACK_PRICES[config.id] || 0,
            previousPrice: FALLBACK_PRICES[config.id] || 0,
            change24h: 0,
            priceDirection: 'stable',
            lastUpdated: Date.now(),
          };
        });
        
        setState({
          prices: fallbackPrices,
          isLoading: false,
          error: 'Using cached data',
          isDelayed: true,
        });
      } else {
        setState(prev => ({
          ...prev,
          isDelayed: true,
          error: 'Data delayed',
        }));
      }
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const getPrice = useCallback((symbol: string): CryptoPrice | null => {
    return state.prices[symbol.toUpperCase()] || null;
  }, [state.prices]);

  const getAllPrices = useCallback((): CryptoPrice[] => {
    return Object.values(state.prices);
  }, [state.prices]);

  return {
    ...state,
    getPrice,
    getAllPrices,
    refresh: fetchPrices,
  };
};

export type { CryptoPrice };
