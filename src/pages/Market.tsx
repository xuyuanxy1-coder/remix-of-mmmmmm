import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Search, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock additional market data (in real app, this would come from API)
const MOCK_MARKET_DATA: Record<string, { marketCap: number; volume24h: number; circulatingSupply: number; maxSupply: number | null }> = {
  BTC: { marketCap: 1820000000000, volume24h: 42500000000, circulatingSupply: 19780000, maxSupply: 21000000 },
  ETH: { marketCap: 378000000000, volume24h: 18200000000, circulatingSupply: 120420000, maxSupply: null },
  BNB: { marketCap: 136000000000, volume24h: 1850000000, circulatingSupply: 149530000, maxSupply: 200000000 },
  SOL: { marketCap: 68500000000, volume24h: 3200000000, circulatingSupply: 483000000, maxSupply: null },
  XRP: { marketCap: 124000000000, volume24h: 4500000000, circulatingSupply: 56800000000, maxSupply: 100000000000 },
  ADA: { marketCap: 24200000000, volume24h: 520000000, circulatingSupply: 35600000000, maxSupply: 45000000000 },
  DOGE: { marketCap: 47500000000, volume24h: 2800000000, circulatingSupply: 147200000000, maxSupply: null },
  AVAX: { marketCap: 14500000000, volume24h: 580000000, circulatingSupply: 409000000, maxSupply: 720000000 },
  DOT: { marketCap: 9800000000, volume24h: 280000000, circulatingSupply: 1430000000, maxSupply: null },
  MATIC: { marketCap: 8900000000, volume24h: 320000000, circulatingSupply: 10000000000, maxSupply: 10000000000 },
  LINK: { marketCap: 8200000000, volume24h: 450000000, circulatingSupply: 617000000, maxSupply: 1000000000 },
  UNI: { marketCap: 4100000000, volume24h: 180000000, circulatingSupply: 753000000, maxSupply: 1000000000 },
  SHIB: { marketCap: 12800000000, volume24h: 680000000, circulatingSupply: 589000000000000, maxSupply: null },
  LTC: { marketCap: 6300000000, volume24h: 420000000, circulatingSupply: 75000000, maxSupply: 84000000 },
  ATOM: { marketCap: 3400000000, volume24h: 180000000, circulatingSupply: 390000000, maxSupply: null },
  ARB: { marketCap: 2100000000, volume24h: 320000000, circulatingSupply: 10000000000, maxSupply: 10000000000 },
};

type SortField = 'rank' | 'name' | 'price' | 'change24h' | 'marketCap' | 'volume24h';
type SortOrder = 'asc' | 'desc';

const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
};

const formatSupply = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(0);
};

const Market = () => {
  const { getAllPrices, isLoading, isDelayed, refresh } = useCryptoPrices();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const prices = getAllPrices();

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort data
  const filteredAndSortedPrices = prices
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) || item.symbol.toLowerCase().includes(query);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      ...MOCK_MARKET_DATA[item.symbol],
    }))
    .sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change24h':
          aValue = a.change24h;
          bValue = b.change24h;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        case 'volume24h':
          aValue = a.volume24h || 0;
          bValue = b.volume24h || 0;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      
      <main className="pt-20 lg:pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
              Cryptocurrency Prices by Market Cap
            </h1>
            <p className="text-muted-foreground">
              The global cryptocurrency market cap today is {formatNumber(2.45e12)}, with a 24-hour trading volume of {formatNumber(98.5e9)}.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cryptocurrency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              {isDelayed && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Data delayed
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Market Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Coins</p>
              <p className="text-xl font-bold">{prices.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Active Markets</p>
              <p className="text-xl font-bold">24</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">BTC Dominance</p>
              <p className="text-xl font-bold">52.4%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">ETH Dominance</p>
              <p className="text-xl font-bold">17.2%</p>
            </div>
          </div>

          {/* Market Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Table Header - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 py-4 px-6 border-b border-border bg-muted/50 text-sm font-medium text-muted-foreground">
              <button 
                onClick={() => handleSort('rank')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                # <SortIcon field="rank" />
              </button>
              <button 
                onClick={() => handleSort('name')}
                className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Coin <SortIcon field="name" />
              </button>
              <button 
                onClick={() => handleSort('price')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
              >
                Price <SortIcon field="price" />
              </button>
              <button 
                onClick={() => handleSort('change24h')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
              >
                24h % <SortIcon field="change24h" />
              </button>
              <button 
                onClick={() => handleSort('marketCap')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
              >
                Market Cap <SortIcon field="marketCap" />
              </button>
              <button 
                onClick={() => handleSort('volume24h')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
              >
                Volume (24h) <SortIcon field="volume24h" />
              </button>
              <div className="text-center">Trade</div>
            </div>

            {/* Table Header - Mobile */}
            <div className="lg:hidden grid grid-cols-4 gap-2 py-3 px-4 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              <div className="col-span-2">Coin</div>
              <div className="text-right">Price</div>
              <div className="text-right">24h %</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {filteredAndSortedPrices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <p>Loading market data...</p>
                    </div>
                  ) : searchQuery ? (
                    <p>No results found for "{searchQuery}"</p>
                  ) : (
                    <p>No market data available</p>
                  )}
                </div>
              ) : (
                filteredAndSortedPrices.map((item, index) => (
                  <div key={item.symbol}>
                    {/* Desktop Row */}
                    <div 
                      className={`hidden lg:grid lg:grid-cols-12 gap-4 py-4 px-6 hover:bg-muted/30 transition-colors items-center ${
                        item.priceDirection === 'up' ? 'price-animate-up' : 
                        item.priceDirection === 'down' ? 'price-animate-down' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <button 
                          onClick={() => toggleFavorite(item.symbol)}
                          className="hover:text-primary transition-colors"
                        >
                          <Star className={`w-4 h-4 ${favorites.has(item.symbol) ? 'fill-primary text-primary' : ''}`} />
                        </button>
                        <span>{index + 1}</span>
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{item.symbol}</p>
                        </div>
                      </div>
                      
                      <div className={`col-span-2 text-right font-medium flex items-center justify-end gap-1 ${
                        item.priceDirection === 'up' ? 'text-[hsl(145,60%,45%)]' : 
                        item.priceDirection === 'down' ? 'text-[hsl(0,70%,55%)]' : ''
                      }`}>
                        {item.priceDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                        {item.priceDirection === 'down' && <TrendingDown className="w-3 h-3" />}
                        ${item.price.toLocaleString(undefined, { 
                          minimumFractionDigits: item.price < 1 ? 6 : 2,
                          maximumFractionDigits: item.price < 1 ? 6 : 2
                        })}
                      </div>
                      
                      <div className={`col-span-2 text-right font-medium ${item.change24h >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                          item.change24h >= 0 ? 'bg-[hsl(145,60%,45%)]/10' : 'bg-[hsl(0,70%,55%)]/10'
                        }`}>
                          {item.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="col-span-2 text-right text-muted-foreground">
                        {item.marketCap ? formatNumber(item.marketCap) : '-'}
                      </div>
                      
                      <div className="col-span-2 text-right text-muted-foreground">
                        {item.volume24h ? formatNumber(item.volume24h) : '-'}
                      </div>
                      
                      <div className="text-center">
                        <Link to={`/trade/${item.symbol}`}>
                          <Button size="sm" className="h-8 px-4">
                            Trade
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Mobile Row */}
                    <Link 
                      to={`/trade/${item.symbol}`}
                      className={`lg:hidden grid grid-cols-4 gap-2 py-4 px-4 hover:bg-muted/30 transition-colors items-center ${
                        item.priceDirection === 'up' ? 'price-animate-up' : 
                        item.priceDirection === 'down' ? 'price-animate-down' : ''
                      }`}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{item.symbol}</p>
                          <p className="text-xs text-muted-foreground">{item.name}</p>
                        </div>
                      </div>
                      
                      <div className={`text-right text-sm font-medium ${
                        item.priceDirection === 'up' ? 'text-[hsl(145,60%,45%)]' : 
                        item.priceDirection === 'down' ? 'text-[hsl(0,70%,55%)]' : ''
                      }`}>
                        ${item.price < 1 ? item.price.toFixed(6) : item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      
                      <div className={`text-right text-sm font-medium ${item.change24h >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-[hsl(0,70%,55%)]'}`}>
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Data updates every 15 seconds via CoinGecko API</p>
          </div>
        </div>
      </main>
      
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Market;