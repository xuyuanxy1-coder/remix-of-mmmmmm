import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KlineChart from '@/components/KlineChart';
import TradingPanel from '@/components/TradingPanel';
import UserAssets from '@/components/UserAssets';

const cryptoData: Record<string, { name: string; icon: string; price: number; change: number }> = {
  BTC: { name: 'Bitcoin', icon: '₿', price: 92027.52, change: 1.51 },
  ETH: { name: 'Ethereum', icon: '⟠', price: 3138.56, change: 0.94 },
  BNB: { name: 'BNB', icon: '🟡', price: 910.06, change: 1.09 },
  SOL: { name: 'Solana', icon: '☀️', price: 141.83, change: 1.58 },
  XRP: { name: 'XRP', icon: '💧', price: 2.18, change: 2.34 },
  ADA: { name: 'Cardano', icon: '🔵', price: 0.68, change: -0.85 },
  DOGE: { name: 'Dogecoin', icon: '🐕', price: 0.32, change: 3.21 },
  AVAX: { name: 'Avalanche', icon: '🔺', price: 35.42, change: 1.87 },
  DOT: { name: 'Polkadot', icon: '⚪', price: 6.85, change: -1.23 },
  MATIC: { name: 'Polygon', icon: '🟣', price: 0.89, change: 0.76 },
  LINK: { name: 'Chainlink', icon: '🔗', price: 13.28, change: 1.30 },
  UNI: { name: 'Uniswap', icon: '🦄', price: 5.47, change: 1.88 },
  SHIB: { name: 'Shiba Inu', icon: '🐶', price: 0.000022, change: 4.52 },
  LTC: { name: 'Litecoin', icon: '🪙', price: 84.32, change: -0.45 },
  ATOM: { name: 'Cosmos', icon: '⚛️', price: 8.76, change: 2.15 },
  ARB: { name: 'Arbitrum', icon: '🔷', price: 0.21, change: 3.53 },
};

const TradePage = () => {
  const { symbol = 'BTC' } = useParams<{ symbol: string }>();
  const crypto = cryptoData[symbol.toUpperCase()] || cryptoData.BTC;
  const upperSymbol = symbol.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link to="/#market" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Market
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-4xl">{crypto.icon}</span>
              <div>
                <h1 className="text-2xl font-display font-semibold">
                  {crypto.name} ({upperSymbol})
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl font-medium">
                    ${crypto.price.toLocaleString()}
                  </span>
                  <span className={`flex items-center gap-1 text-sm ${crypto.change >= 0 ? 'price-up' : 'price-down'}`}>
                    {crypto.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="font-semibold mb-4">{upperSymbol}/USDT Chart</h2>
                <KlineChart symbol={upperSymbol} />
              </div>
            </div>

            {/* Trading Panel & Assets */}
            <div className="space-y-6">
              <TradingPanel symbol={upperSymbol} currentPrice={crypto.price} />
              <UserAssets />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TradePage;
