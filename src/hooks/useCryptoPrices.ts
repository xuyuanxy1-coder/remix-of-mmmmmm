import { useState, useEffect, useRef, useCallback } from 'react';

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

// Fallback prices in case API fails (updated with recent values)
const FALLBACK_PRICES: Record<string, number> = {
  bitcoin: 105000,
  ethereum: 3800,
  binancecoin: 720,
  solana: 180,
  ripple: 2.5,
  cardano: 0.95,
  dogecoin: 0.38,
  'avalanche-2': 42,
  polkadot: 7.5,
  'matic-network': 0.52,
  chainlink: 15,
  uniswap: 14,
  'shiba-inu': 0.000024,
  litecoin: 110,
  cosmos: 7.2,
  arbitrum: 0.85,
};

// Symbol mapping for Binance API
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT',
  ripple: 'XRPUSDT',
  cardano: 'ADAUSDT',
  dogecoin: 'DOGEUSDT',
  'avalanche-2': 'AVAXUSDT',
  polkadot: 'DOTUSDT',
  'matic-network': 'MATICUSDT',
  chainlink: 'LINKUSDT',
  uniswap: 'UNIUSDT',
  'shiba-inu': 'SHIBUSDT',
  litecoin: 'LTCUSDT',
  cosmos: 'ATOMUSDT',
  arbitrum: 'ARBUSDT',
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
      let data: Record<string, { usd: number; usd_24h_change?: number }> = {};
      let usedFallback = false;

      // Try CoinGecko first
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('CoinGecko API failed');
        }
      } catch (cgError) {
        console.warn('CoinGecko API failed, trying Binance:', cgError);
        
        // Try Binance as backup
        try {
          const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
          if (binanceResponse.ok) {
            const binanceData = await binanceResponse.json();
            const binancePrices: Record<string, { usd: number; usd_24h_change: number }> = {};
            
            Object.entries(COIN_CONFIG).forEach(([_, config]) => {
              const binanceSymbol = BINANCE_SYMBOL_MAP[config.id];
              if (binanceSymbol) {
                const ticker = binanceData.find((t: any) => t.symbol === binanceSymbol);
                if (ticker) {
                  binancePrices[config.id] = {
                    usd: parseFloat(ticker.lastPrice),
                    usd_24h_change: parseFloat(ticker.priceChangePercent),
                  };
                }
              }
            });
            
            if (Object.keys(binancePrices).length > 0) {
              data = binancePrices;
            } else {
              throw new Error('No Binance data found');
            }
          } else {
            throw new Error('Binance API failed');
          }
        } catch (binanceError) {
          console.warn('Binance API also failed, using fallback:', binanceError);
          usedFallback = true;
          // Use fallback data
          Object.entries(COIN_CONFIG).forEach(([_, config]) => {
            data[config.id] = {
              usd: FALLBACK_PRICES[config.id] || 0,
              usd_24h_change: 0,
            };
          });
        }
      }

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
