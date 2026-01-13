import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const defaultAssets: Asset[] = [
  { symbol: 'USDT', name: 'Tether', balance: 10000, icon: '💵' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.5, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: 5.0, icon: '⟠' },
  { symbol: 'BNB', name: 'BNB', balance: 10.0, icon: '🟡' },
  { symbol: 'SOL', name: 'Solana', balance: 50.0, icon: '☀️' },
];

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export const AssetsProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);

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
    <AssetsContext.Provider value={{ assets, updateBalance, getBalance }}>
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
