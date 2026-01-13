import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KlineChart from '@/components/KlineChart';
import TradingPanel from '@/components/TradingPanel';
import UserAssets from '@/components/UserAssets';
import TradeHistory from '@/components/TradeHistory';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

const TradePage = () => {
  const { symbol = 'BTC' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { getPrice, getAllPrices, isDelayed } = useCryptoPrices();
  
  const upperSymbol = symbol.toUpperCase();
  const crypto = getPrice(upperSymbol);
  const allPrices = getAllPrices();

  // Fallback data if price not yet loaded
  const displayCrypto = crypto || {
    name: upperSymbol,
    icon: '💰',
    price: 0,
    change24h: 0,
    priceDirection: 'stable' as const,
  };

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
              <span className="text-4xl">{displayCrypto.icon}</span>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-2xl font-display font-semibold p-0 h-auto hover:bg-transparent">
                      {displayCrypto.name} ({upperSymbol})
                      <ChevronDown className="w-5 h-5 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                    {allPrices.map((item) => (
                      <DropdownMenuItem
                        key={item.symbol}
                        onClick={() => navigate(`/trade/${item.symbol}`)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">({item.symbol})</span>
                        </div>
                        <span className={item.change24h >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}>
                          {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xl font-medium flex items-center gap-1 ${
                    displayCrypto.priceDirection === 'up' ? 'text-[hsl(145,60%,45%)]' : 
                    displayCrypto.priceDirection === 'down' ? 'text-[hsl(0,70%,55%)]' : ''
                  }`}>
                    {displayCrypto.priceDirection === 'up' && <TrendingUp className="w-4 h-4" />}
                    {displayCrypto.priceDirection === 'down' && <TrendingDown className="w-4 h-4" />}
                    ${displayCrypto.price.toLocaleString(undefined, {
                      minimumFractionDigits: displayCrypto.price < 1 ? 6 : 2,
                      maximumFractionDigits: displayCrypto.price < 1 ? 6 : 2
                    })}
                  </span>
                  <span className={`flex items-center gap-1 text-sm ${displayCrypto.change24h >= 0 ? 'price-up' : 'price-down'}`}>
                    {displayCrypto.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {displayCrypto.change24h >= 0 ? '+' : ''}{displayCrypto.change24h.toFixed(2)}%
                  </span>
                  {isDelayed && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Data delayed
                    </span>
                  )}
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
              <TradingPanel symbol={upperSymbol} currentPrice={displayCrypto.price} />
              <UserAssets />
            </div>
          </div>

          {/* Trade History - Full Width Below */}
          <div className="mt-6">
            <TradeHistory />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TradePage;
