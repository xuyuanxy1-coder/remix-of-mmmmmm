import { TrendingUp, TrendingDown } from 'lucide-react';

const marketData = [
  { name: 'AAPL', icon: '🍎', change: 0.38, price: 272 },
  { name: 'USDCNY', icon: '🇨🇳', change: -0.2, price: 7.0143 },
  { name: 'UKOIL', icon: '🛢️', change: 0, price: 62.454 },
  { name: 'INTC', icon: '💻', change: -4.04, price: 34.9 },
  { name: 'XAU', icon: '🥇', change: 0.03, price: 4484.84 },
  { name: 'USDJPY', icon: '🇯🇵', change: -0.18, price: 155.936 },
  { name: 'BTC', icon: '₿', change: 1.51, price: 92027.52 },
  { name: 'USDHKD', icon: '🇭🇰', change: -0.01, price: 7.77631 },
  { name: 'TSLA', icon: '⚡', change: -0.5, price: 486.3 },
  { name: 'USOIL', icon: '🛢️', change: 0.13, price: 58.534 },
  { name: 'FTT', icon: '🔷', change: 0.76, price: 0.5285 },
  { name: 'XAG', icon: '🥈', change: 1.07, price: 72.068 },
  { name: 'NVDA', icon: '🎮', change: 2.46, price: 188.2 },
  { name: 'ETH', icon: '⟠', change: 0.94, price: 3138.56 },
  { name: 'BNB', icon: '🟡', change: 1.09, price: 910.06 },
  { name: 'SOL', icon: '☀️', change: 1.58, price: 141.83 },
];

const MarketTable = () => {
  return (
    <section id="market" className="py-16 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-title">Live Market</h2>
          <p className="text-muted-foreground mt-2">Track real-time prices and changes</p>
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
            {marketData.map((item, index) => (
              <div 
                key={index} 
                className="grid grid-cols-4 gap-4 py-4 px-6 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                
                <div className={`flex items-center justify-center gap-1 ${item.change >= 0 ? 'price-up' : 'price-down'}`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">{item.change >= 0 ? '+' : ''}{item.change}%</span>
                </div>
                
                <div className="flex items-center justify-center">
                  <MiniChart positive={item.change >= 0} />
                </div>
                
                <div className="text-right font-medium">
                  ${item.price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <a 
            href="#" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View all markets
            <span>→</span>
          </a>
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
