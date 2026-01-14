import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  refreshTrades: () => Promise<void>;
}

const TradeHistoryContext = createContext<TradeHistoryContextType | undefined>(undefined);

export const TradeHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const { user } = useAuth();

  // Parse trade info from transaction note
  const parseTradeNote = (note: string | null): { 
    direction: 'long' | 'short'; 
    symbol: string; 
    entryPrice: number; 
    duration: number;
    result?: 'WIN' | 'LOSS';
    profit?: number;
  } | null => {
    if (!note) return null;
    
    // Parse note format: "Smart Trade: LONG BTC @ $96,969 for 5 min | Result: WIN | Profit: +166.65 USDT"
    const match = note.match(/Smart Trade: (LONG|SHORT) (\w+) @ \$([\d,]+(?:\.\d+)?) for (\d+) min/);
    if (!match) return null;

    const result: { direction: 'long' | 'short'; symbol: string; entryPrice: number; duration: number; result?: 'WIN' | 'LOSS'; profit?: number } = {
      direction: match[1].toLowerCase() as 'long' | 'short',
      symbol: match[2],
      entryPrice: parseFloat(match[3].replace(/,/g, '')),
      duration: parseInt(match[4]) * 60, // Convert to seconds
    };

    // Check for result
    const resultMatch = note.match(/Result: (WIN|LOSS)/);
    if (resultMatch) {
      result.result = resultMatch[1] as 'WIN' | 'LOSS';
    }

    // Check for profit
    const profitMatch = note.match(/Profit: ([+-]?[\d.]+) USDT/);
    if (profitMatch) {
      result.profit = parseFloat(profitMatch[1]);
    }

    // Check for loss
    const lostMatch = note.match(/Lost: -?([\d.]+) USDT/);
    if (lostMatch) {
      result.profit = -parseFloat(lostMatch[1]);
    }

    return result;
  };

  // Fetch trades from database
  const refreshTrades = async () => {
    if (!user?.id) {
      setTrades([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'trade')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch trades:', error);
        return;
      }

      const parsedTrades: TradeRecord[] = [];
      
      data?.forEach(tx => {
        const tradeInfo = parseTradeNote(tx.note);
        if (!tradeInfo) return;

        const profitRates: Record<number, number> = { 60: 0.10, 180: 0.20, 300: 0.30, 900: 0.40 };
        const profitRate = profitRates[tradeInfo.duration] || 0.30;

        let isWin = false;
        let profit = 0;
        let settlementPrice = tradeInfo.entryPrice;

        if (tradeInfo.result === 'WIN') {
          isWin = true;
          profit = tradeInfo.profit ?? tx.amount * profitRate;
          // Estimate settlement price based on win
          settlementPrice = tradeInfo.direction === 'long' 
            ? tradeInfo.entryPrice * 1.01 
            : tradeInfo.entryPrice * 0.99;
        } else if (tradeInfo.result === 'LOSS') {
          isWin = false;
          profit = -(tx.amount);
          // Estimate settlement price based on loss
          settlementPrice = tradeInfo.direction === 'long' 
            ? tradeInfo.entryPrice * 0.99 
            : tradeInfo.entryPrice * 1.01;
        } else if (tx.status === 'pending') {
          // Still pending, show as in-progress
          return;
        }

        parsedTrades.push({
          id: tx.id,
          symbol: tradeInfo.symbol,
          direction: tradeInfo.direction,
          amount: tx.amount,
          entryPrice: tradeInfo.entryPrice,
          settlementPrice,
          duration: tradeInfo.duration,
          profitRate,
          fee: tx.fee || 0,
          profit,
          isWin,
          createdAt: new Date(tx.created_at),
        });
      });

      setTrades(parsedTrades);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  // Fetch trades on user change
  useEffect(() => {
    refreshTrades();
  }, [user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('trade-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh trades when any transaction changes
          if (payload.new && (payload.new as any).type === 'trade') {
            refreshTrades();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
    <TradeHistoryContext.Provider value={{ trades, addTrade, getTotalProfit, getWinRate, refreshTrades }}>
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
