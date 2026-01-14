import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
}

interface AssetsContextType {
  assets: Asset[];
  updateBalance: (symbol: string, amount: number) => Promise<boolean>;
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
  { symbol: 'XRP', name: 'XRP', balance: 0, icon: '💧' },
  { symbol: 'ADA', name: 'Cardano', balance: 0, icon: '🔵' },
  { symbol: 'DOGE', name: 'Dogecoin', balance: 0, icon: '🐕' },
];

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export const AssetsProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshAssets = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAssets(defaultAssets);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('currency, balance')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to fetch assets:', error);
        return;
      }

      if (data && data.length > 0) {
        // Merge with default assets to ensure all currencies are shown
        const assetMap = new Map(data.map(a => [a.currency, Number(a.balance)]));
        
        setAssets(defaultAssets.map(asset => ({
          ...asset,
          balance: assetMap.get(asset.symbol) ?? 0,
        })));
      } else {
        setAssets(defaultAssets);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch assets when authentication changes
  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  const updateBalance = async (symbol: string, amount: number): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current balance
      const { data: current } = await supabase
        .from('assets')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', symbol)
        .maybeSingle();

      const currentBalance = current ? Number(current.balance) : 0;
      const newBalance = Math.max(0, currentBalance + amount);

      // Upsert the balance
      const { error } = await supabase
        .from('assets')
        .upsert({
          user_id: user.id,
          currency: symbol,
          balance: newBalance,
        }, {
          onConflict: 'user_id,currency',
        });

      if (error) {
        console.error('Failed to update balance:', error);
        return false;
      }

      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.symbol === symbol 
          ? { ...asset, balance: newBalance }
          : asset
      ));

      return true;
    } catch (error) {
      console.error('Failed to update balance:', error);
      return false;
    }
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

export const useAssets = () => {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
};
