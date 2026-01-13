import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

const MarketTable = () => {
  const { getAllPrices, isLoading, isDelayed, refresh } = useCryptoPrices();
  const prices = getAllPrices();

  return (
    <section id="market" className="py-16 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-title">Live Market</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-muted-foreground">Track real-time prices and changes</p>
            {isDelayed && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Data delayed
              </span>
            )}
            <button 
              onClick={refresh}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              title="Refresh prices"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 py-4 px-6 border-b border-border bg-muted/50 text-sm font-medium text-muted-foreground">
            <div>Name</div>
            <div className="text-center">24h%</div>
            <div className="text-center">Chart</div>
            <div className="text-right">Price</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {prices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {isLoading ? 'Loading prices...' : 'No data available'}
              </div>
            ) : (
              prices.filter(item => item && item.price !== undefined).map((item) => (
                <div 
                  key={item.symbol}
                  className={`grid grid-cols-4 gap-4 py-4 px-6 hover:bg-muted/30 transition-colors ${
                    item.priceDirection === 'up' ? 'price-animate-up' : 
                    item.priceDirection === 'down' ? 'price-animate-down' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.symbol}</span>
                  </div>
                  
                  <div className={`flex items-center justify-center gap-1 ${(item.change24h ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                    {(item.change24h ?? 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{(item.change24h ?? 0) >= 0 ? '+' : ''}{(item.change24h ?? 0).toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <MiniChart positive={(item.change24h ?? 0) >= 0} />
                  </div>
                  
                  <div className={`text-right font-medium flex items-center justify-end gap-1 ${
                    item.priceDirection === 'up' ? 'text-[hsl(145,60%,45%)]' : 
                    item.priceDirection === 'down' ? 'text-[hsl(0,70%,55%)]' : ''
                  }`}>
                    {item.priceDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                    {item.priceDirection === 'down' && <TrendingDown className="w-3 h-3" />}
                    ${(item.price ?? 0).toLocaleString(undefined, { 
                      minimumFractionDigits: (item.price ?? 0) < 1 ? 6 : 2,
                      maximumFractionDigits: (item.price ?? 0) < 1 ? 6 : 2
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Simple mini chart component
const MiniChart = ({ positive }: { positive: boolean }) => {
  const points = positive 
    ? "0,20 10,18 20,15 30,17 40,12 50,8 60,10 70,5"
    : "0,5 10,8 20,10 30,7 40,12 50,15 60,13 70,20";
  
  return (
    <svg width="70" height="24" className={positive ? 'text-success' : 'text-danger'}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MarketTable;
