import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Copy, 
  Check,
  Info,
  Clock,
  AlertTriangle,
  Upload,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssets } from '@/contexts/AssetsContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type AccountView = 'overview' | 'withdraw' | 'recharge' | 'exchange';

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: 'bg-green-500' },
  { symbol: 'BNB', name: 'BNB', icon: '🟡', color: 'bg-yellow-500' },
  { symbol: 'SOL', name: 'Solana', icon: '☀️', color: 'bg-purple-500' },
  { symbol: 'XRP', name: 'XRP', icon: '💧', color: 'bg-gray-500' },
];

const RECHARGE_NETWORKS = [
  { id: 'erc20', name: 'ERC20-USDT', rate: '1.00' },
  { id: 'trc20', name: 'TRC20-USDT', rate: '1.00' },
  { id: 'eth', name: 'ETH', rate: '1.00' },
];

const MIN_DEPOSITS: Record<string, number> = {
  BTC: 0.001,
  ETH: 0.1,
  USDT: 100,
  USDC: 100,
};

const Account = () => {
  const [currentView, setCurrentView] = useState<AccountView>('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('usdt');
  const [selectedRechargeNetwork, setSelectedRechargeNetwork] = useState('trc20');
  const [copied, setCopied] = useState(false);
  
  const { assets, getBalance } = useAssets();
  const { getPrice } = useCryptoPrices();

  // Calculate total assets in USD
  const totalAssets = CRYPTO_ASSETS.reduce((total, crypto) => {
    const balance = getBalance(crypto.symbol);
    const priceData = getPrice(crypto.symbol);
    const price = priceData?.price || 0;
    return total + (balance * price);
  }, 0);

  // Simulated P&L
  const floatingPnL = -381.58;
  const floatingPnLPercent = -1.42;

  const walletAddress = 'TXkd8Jq9vM3Kn5Wp2YhL4Nz7Rf6Bc8Ds2E';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount < 10) {
      toast.error('Minimum withdrawal is 10 USDT');
      return;
    }
    if (!withdrawAddress) {
      toast.error('Please enter a receiving address');
      return;
    }
    toast.success('Withdrawal request submitted. Please wait for processing.');
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const renderBreadcrumb = () => {
    const viewNames: Record<AccountView, string> = {
      overview: 'Account',
      withdraw: 'Withdraw',
      recharge: 'Recharge',
      exchange: 'Exchange',
    };

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">MetaMask Trade</Link>
        <ChevronRight className="w-4 h-4" />
        <button 
          onClick={() => setCurrentView('overview')}
          className={currentView === 'overview' ? 'text-foreground' : 'hover:text-foreground'}
        >
          Account
        </button>
        {currentView !== 'overview' && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{viewNames[currentView]}</span>
          </>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Total Assets Card */}
      <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl p-6 lg:p-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Account Total Assets</p>
          <h1 className="text-4xl lg:text-5xl font-display font-bold">
            {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xl text-muted-foreground ml-2">USD</span>
          </h1>
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm ${
            floatingPnL >= 0 ? 'bg-[hsl(145,60%,45%)]/20 text-[hsl(145,60%,45%)]' : 'bg-[hsl(0,70%,55%)]/20 text-[hsl(0,70%,55%)]'
          }`}>
            <span>Floating P&L:</span>
            <span className="font-medium">
              {floatingPnL >= 0 ? '+' : ''}{floatingPnL.toFixed(2)} USD ({floatingPnLPercent >= 0 ? '+' : ''}{floatingPnLPercent}%)
            </span>
          </div>
        </div>

        {/* Balance & Loan */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
            <p className="text-2xl font-semibold">{getBalance('USDT').toLocaleString()} USD</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Loan</p>
            <p className="text-2xl font-semibold">0.00 USD</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => setCurrentView('withdraw')}
            className="flex flex-col items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider">Withdraw</span>
          </button>
          <button 
            onClick={() => setCurrentView('recharge')}
            className="flex flex-col items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider">Recharge</span>
          </button>
          <button 
            onClick={() => setCurrentView('exchange')}
            className="flex flex-col items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider">Exchange</span>
          </button>
        </div>
      </div>

      {/* Crypto Assets */}
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">Crypto Assets</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {CRYPTO_ASSETS.map((crypto, index) => {
            const balance = getBalance(crypto.symbol);
            const priceData = getPrice(crypto.symbol);
            const price = priceData?.price || 0;
            const usdValue = balance * price;

            return (
              <div 
                key={crypto.symbol}
                className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
                  index !== CRYPTO_ASSETS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${crypto.color} flex items-center justify-center text-white text-lg`}>
                    {crypto.icon}
                  </div>
                  <div>
                    <p className="font-medium">{crypto.name}</p>
                    <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{balance.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">≈ {usdValue.toFixed(2)} USD</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="space-y-6">
          {/* Network Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Select Network:</label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="erc20">ERC20</SelectItem>
                <SelectItem value="trc20">TRC20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Amount (USDT):</label>
            <div className="relative">
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount..."
                className="pr-16"
              />
              <Button 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                onClick={() => setWithdrawAmount(getBalance('USDT').toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Receiving address:</label>
            <Input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Address..."
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleWithdraw}
            className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium"
          >
            Withdraw Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Transaction Notice */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          Transaction Notice
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>Fee: <span className="font-medium">0.3%</span> (Deducted after network confirmation)</span>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>Processing time: Requires blockchain confirmation</span>
          </div>
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>Minimum withdrawal: <span className="font-medium">10 USDT</span></span>
          </div>
          <div className="flex items-start gap-3 text-[hsl(0,70%,55%)]">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>Security reminder: Never transfer crypto to strangers</span>
          </div>
          <div className="flex items-start gap-3">
            <Wallet className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>For P2P fiat trading, please contact customer service.</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecharge = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Network Tabs */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <Tabs value={selectedRechargeNetwork} onValueChange={setSelectedRechargeNetwork}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {RECHARGE_NETWORKS.map((network) => (
              <TabsTrigger 
                key={network.id} 
                value={network.id}
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                {network.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {RECHARGE_NETWORKS.map((network) => (
            <TabsContent key={network.id} value={network.id} className="space-y-6">
              {/* Rate Display */}
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-primary font-medium">1 {network.name}: {network.rate} USD</span>
              </div>

              {/* Contact Notice */}
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-muted-foreground">Please contact customer service to recharge.</p>
              </div>

              {/* Copy Address Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleCopyAddress}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white p-4 rounded-lg border border-border">
                  <div className="w-full h-full bg-[repeating-conic-gradient(#000_0_90deg,#fff_90deg_180deg)_0_0/25%_25%] rounded"></div>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground break-all font-mono bg-muted/50 p-3 rounded-lg">
                  {walletAddress}
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Recharge Instructions */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Recharge Instructions
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">Minimum Deposit Amount:</p>
        
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Object.entries(MIN_DEPOSITS).map(([symbol, amount]) => (
            <div key={symbol} className="text-center p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">{symbol}</p>
              <p className="font-semibold">{amount}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 text-sm text-primary">
          <Info className="w-4 h-4 mt-0.5" />
          <span>For P2P fiat transactions, please contact customer service</span>
        </div>
      </div>

      {/* Upload Receipt Button */}
      <Button className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium">
        <Upload className="w-5 h-5 mr-2" />
        Upload receipt
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );

  const renderExchange = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-6">Exchange Crypto</h3>
        
        <div className="space-y-6">
          {/* From */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">From:</label>
            <div className="flex gap-3">
              <Select defaultValue="usdt">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                  <SelectItem value="eth">ETH</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Amount" className="flex-1" />
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* To */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">To:</label>
            <div className="flex gap-3">
              <Select defaultValue="btc">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                  <SelectItem value="eth">ETH</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="You receive" className="flex-1" disabled />
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span>1 USDT = 0.0000108 BTC</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Fee</span>
              <span>0.1%</span>
            </div>
          </div>

          <Button className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium">
            Exchange Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {renderBreadcrumb()}
          
          {currentView === 'overview' && renderOverview()}
          {currentView === 'withdraw' && renderWithdraw()}
          {currentView === 'recharge' && renderRecharge()}
          {currentView === 'exchange' && renderExchange()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
