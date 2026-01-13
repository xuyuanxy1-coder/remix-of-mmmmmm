import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, WalletAsset, WalletResponse } from '@/lib/api';

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
}

interface AssetsContextType {
  assets: Asset[];
  updateBalance: (symbol: string, amount: number) => void;
  getBalance: (symbol: string) => number;
  refreshAssets: () => Promise<void>;
  isLoading: boolean;
}

const defaultAssets: Asset[] = [
  { symbol: 'USDT', name: 'Tether', balance: 0, icon: '💵' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: 0, icon: '⟠' },
  { symbol: 'BNB', name: 'BNB', balance: 0, icon: '🟡' },
  { symbol: 'SOL', name: 'Solana', balance: 0, icon: '☀️' },
];

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export const AssetsProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAssets = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!api.isAuthenticated()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<WalletResponse>('/wallet');
      
      if (response.assets && response.assets.length > 0) {
        setAssets(response.assets.map(a => ({
          symbol: a.symbol,
          name: a.name,
          balance: a.balance,
          icon: a.icon || getDefaultIcon(a.symbol),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch wallet assets:', error);
      // Keep current assets on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch assets on mount and when token changes
  useEffect(() => {
    refreshAssets();
    
    // Listen for storage changes (token updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        refreshAssets();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAssets]);

  const updateBalance = (symbol: string, amount: number) => {
    setAssets(prev => prev.map(asset => 
      asset.symbol === symbol 
        ? { ...asset, balance: Math.max(0, asset.balance + amount) }
        : asset
    ));
  };

  const getBalance = (symbol: string) => {
    return assets.find(a => a.symbol === symbol)?.balance ?? 0;
  };

  return (
    <AssetsContext.Provider value={{ assets, updateBalance, getBalance, refreshAssets, isLoading }}>
      {children}
    </AssetsContext.Provider>
  );
};

// Helper to get default icon for a symbol
function getDefaultIcon(symbol: string): string {
  const icons: Record<string, string> = {
    USDT: '💵',
    BTC: '₿',
    ETH: '⟠',
    BNB: '🟡',
    SOL: '☀️',
    XRP: '💧',
    ADA: '🔵',
    DOGE: '🐕',
  };
  return icons[symbol] || '🪙';
}

export const useAssets = () => {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
};
