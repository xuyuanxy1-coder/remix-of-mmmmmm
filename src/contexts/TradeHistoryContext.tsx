import { createContext, useContext, useState, ReactNode } from 'react';

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  amount: number;
  entryPrice: number;
  settlementPrice: number;
  duration: number;
  profitRate: number;
  fee: number;
  profit: number;
  isWin: boolean;
  createdAt: Date;
}

interface TradeHistoryContextType {
  trades: TradeRecord[];
  addTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  getTotalProfit: () => number;
  getWinRate: () => number;
}

const TradeHistoryContext = createContext<TradeHistoryContextType | undefined>(undefined);

export const TradeHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  const addTrade = (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => {
    const newTrade: TradeRecord = {
      ...trade,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    setTrades(prev => [newTrade, ...prev]);
  };

  const getTotalProfit = () => {
    return trades.reduce((total, trade) => total + trade.profit, 0);
  };

  const getWinRate = () => {
    if (trades.length === 0) return 0;
    const wins = trades.filter(t => t.isWin).length;
    return (wins / trades.length) * 100;
  };

  return (
    <TradeHistoryContext.Provider value={{ trades, addTrade, getTotalProfit, getWinRate }}>
      {children}
    </TradeHistoryContext.Provider>
  );
};

export const useTradeHistory = () => {
  const context = useContext(TradeHistoryContext);
  if (!context) {
    throw new Error('useTradeHistory must be used within a TradeHistoryProvider');
  }
  return context;
};
