import { useTradeHistory, TradeRecord } from '@/contexts/TradeHistoryContext';
import { TrendingUp, TrendingDown, Clock, History, Trophy, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TradeHistory = () => {
  const { trades, getTotalProfit, getWinRate } = useTradeHistory();
  
  const totalProfit = getTotalProfit();
  const winRate = getWinRate();
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.isWin).length;
  const losses = totalTrades - wins;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)}分钟`;
    }
    return `${seconds}秒`;
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Trading History
        </h3>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
            <Target className="w-3 h-3" />
            Total P&L
          </div>
          <div className={`font-bold text-lg ${totalProfit >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">USDT</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
            <Trophy className="w-3 h-3" />
            Win Rate
          </div>
          <div className={`font-bold text-lg ${winRate >= 50 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
            {winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">{wins}W/{losses}L</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
            <Clock className="w-3 h-3" />
            Trades
          </div>
          <div className="font-bold text-lg">{totalTrades}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Trade List */}
      <ScrollArea className="h-[300px]">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
            <History className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No trading history yet</p>
            <p className="text-xs mt-1">Your completed trades will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {trades.map((trade) => (
              <TradeItem key={trade.id} trade={trade} formatTime={formatTime} formatDuration={formatDuration} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface TradeItemProps {
  trade: TradeRecord;
  formatTime: (date: Date) => string;
  formatDuration: (seconds: number) => string;
}

const TradeItem = ({ trade, formatTime, formatDuration }: TradeItemProps) => {
  const priceChange = ((trade.settlementPrice - trade.entryPrice) / trade.entryPrice) * 100;
  
  return (
    <div className="p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {trade.direction === 'long' ? (
            <div className="flex items-center gap-1 text-[hsl(145,60%,45%)]">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">Long</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[hsl(0,70%,55%)]">
              <TrendingDown className="w-4 h-4" />
              <span className="font-medium text-sm">Short</span>
            </div>
          )}
          <span className="text-sm font-medium">{trade.symbol}</span>
          <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
            {formatDuration(trade.duration)}
          </span>
        </div>
        
        <div className={`font-bold ${trade.isWin ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)} USDT
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Entry: ${trade.entryPrice.toLocaleString()}</span>
          <span>→</span>
          <span className={priceChange >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}>
            Exit: ${trade.settlementPrice.toLocaleString()} ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
          </span>
        </div>
        <span>{formatTime(trade.createdAt)}</span>
      </div>
      
      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
        <span>Amount: {trade.amount.toFixed(2)} USDT</span>
        <span>Fee: {trade.fee.toFixed(2)} USDT</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          trade.isWin 
            ? 'bg-[hsl(145,60%,45%)]/20 text-[hsl(145,60%,45%)]' 
            : 'bg-[hsl(0,70%,55%)]/20 text-[hsl(0,70%,55%)]'
        }`}>
          {trade.isWin ? 'WIN' : 'LOSS'}
        </span>
      </div>
    </div>
  );
};

export default TradeHistory;
