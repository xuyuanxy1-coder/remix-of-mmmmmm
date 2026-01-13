import { TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const marketData = [
  { name: 'BTC', icon: '₿', change: 1.51, price: 92027.52 },
  { name: 'ETH', icon: '⟠', change: 0.94, price: 3138.56 },
  { name: 'BNB', icon: '🟡', change: 1.09, price: 910.06 },
  { name: 'SOL', icon: '☀️', change: 1.58, price: 141.83 },
  { name: 'XRP', icon: '💧', change: 2.34, price: 2.18 },
  { name: 'ADA', icon: '🔵', change: -0.85, price: 0.68 },
  { name: 'DOGE', icon: '🐕', change: 3.21, price: 0.32 },
  { name: 'AVAX', icon: '🔺', change: 1.87, price: 35.42 },
  { name: 'DOT', icon: '⚪', change: -1.23, price: 6.85 },
  { name: 'MATIC', icon: '🟣', change: 0.76, price: 0.89 },
  { name: 'LINK', icon: '🔗', change: 1.30, price: 13.28 },
  { name: 'UNI', icon: '🦄', change: 1.88, price: 5.47 },
  { name: 'SHIB', icon: '🐶', change: 4.52, price: 0.000022 },
  { name: 'LTC', icon: '🪙', change: -0.45, price: 84.32 },
  { name: 'ATOM', icon: '⚛️', change: 2.15, price: 8.76 },
  { name: 'ARB', icon: '🔷', change: 3.53, price: 0.21 },
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
              <Link 
                key={index}
                to={`/trade/${item.name}`}
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
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/trade/BTC"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View all markets
            <span>→</span>
          </Link>
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
