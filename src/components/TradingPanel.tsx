import { useState } from 'react';
import { useAssets } from '@/contexts/AssetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
}

const TradingPanel = ({ symbol, currentPrice }: TradingPanelProps) => {
  const { getBalance, updateBalance } = useAssets();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(currentPrice.toString());

  const usdtBalance = getBalance('USDT');
  const cryptoBalance = getBalance(symbol);

  const handleTrade = () => {
    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const total = amountNum * priceNum;

    if (orderType === 'buy') {
      if (total > usdtBalance) {
        toast.error('Insufficient USDT balance');
        return;
      }
      updateBalance('USDT', -total);
      updateBalance(symbol, amountNum);
      toast.success(`Successfully bought ${amountNum} ${symbol}`);
    } else {
      if (amountNum > cryptoBalance) {
        toast.error(`Insufficient ${symbol} balance`);
        return;
      }
      updateBalance(symbol, -amountNum);
      updateBalance('USDT', total);
      toast.success(`Successfully sold ${amountNum} ${symbol}`);
    }

    setAmount('');
  };

  const setPercentage = (pct: number) => {
    const priceNum = parseFloat(price) || currentPrice;
    if (orderType === 'buy') {
      const maxAmount = (usdtBalance * pct) / priceNum;
      setAmount(maxAmount.toFixed(8));
    } else {
      const maxAmount = cryptoBalance * pct;
      setAmount(maxAmount.toFixed(8));
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={orderType === 'buy' ? 'default' : 'outline'}
          onClick={() => setOrderType('buy')}
          className={`flex-1 ${orderType === 'buy' ? 'bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,40%)] text-white' : ''}`}
        >
          Buy
        </Button>
        <Button
          variant={orderType === 'sell' ? 'default' : 'outline'}
          onClick={() => setOrderType('sell')}
          className={`flex-1 ${orderType === 'sell' ? 'bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,50%)] text-white' : ''}`}
        >
          Sell
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Price (USDT)</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Amount ({symbol})</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className="flex-1 text-xs py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                {pct * 100}%
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Available:</span>
            <span>
              {orderType === 'buy' 
                ? `${usdtBalance.toLocaleString()} USDT`
                : `${cryptoBalance.toLocaleString()} ${symbol}`
              }
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total:</span>
            <span>
              {((parseFloat(amount) || 0) * (parseFloat(price) || 0)).toLocaleString()} USDT
            </span>
          </div>
        </div>

        <Button
          onClick={handleTrade}
          className={`w-full ${
            orderType === 'buy' 
              ? 'bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,40%)]' 
              : 'bg-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,50%)]'
          } text-white`}
        >
          {orderType === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`}
        </Button>
      </div>
    </div>
  );
};

export default TradingPanel;
