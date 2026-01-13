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
  const [usdtAmount, setUsdtAmount] = useState('');
  const [price, setPrice] = useState(currentPrice.toString());

  const usdtBalance = getBalance('USDT');

  // Calculate crypto amount based on USDT input
  const cryptoAmount = (parseFloat(usdtAmount) || 0) / (parseFloat(price) || currentPrice);

  const handleBuy = () => {
    const usdtNum = parseFloat(usdtAmount);
    const priceNum = parseFloat(price);

    if (isNaN(usdtNum) || usdtNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const cryptoNum = usdtNum / priceNum;

    if (usdtNum > usdtBalance) {
      toast.error('Insufficient USDT balance');
      return;
    }

    updateBalance('USDT', -usdtNum);
    updateBalance(symbol, cryptoNum);
    toast.success(`Successfully bought ${cryptoNum.toFixed(6)} ${symbol} for ${usdtNum} USDT`);

    setUsdtAmount('');
  };

  const setPercentage = (pct: number) => {
    const maxUsdt = usdtBalance * pct;
    setUsdtAmount(maxUsdt.toFixed(2));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[hsl(145,60%,45%)]"></span>
          Buy {symbol}
        </h3>
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
          <label className="text-sm text-muted-foreground mb-1 block">Amount (USDT)</label>
          <Input
            type="number"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
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

        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          <div className="flex justify-between">
            <span>≈ {symbol} Amount:</span>
            <span className="font-medium">{cryptoAmount.toFixed(6)} {symbol}</span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Available:</span>
            <span>{usdtBalance.toLocaleString()} USDT</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total:</span>
            <span>{(parseFloat(usdtAmount) || 0).toLocaleString()} USDT</span>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          className="w-full bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,40%)] text-white"
        >
          Buy {symbol}
        </Button>
      </div>
    </div>
  );
};

export default TradingPanel;
