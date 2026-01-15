import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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
  TrendingDown,
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Ban,
  History
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAssets } from '@/contexts/AssetsContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useAuth } from '@/contexts/AuthContext';
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
import { useLoan } from '@/contexts/LoanContext';
import { useKYC } from '@/contexts/KYCContext';
import { supabase } from '@/integrations/supabase/client';

type AccountView = 'overview' | 'withdraw' | 'recharge' | 'exchange' | 'verification';

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: 'bg-green-500' },
  { symbol: 'BNB', name: 'BNB', icon: '🟡', color: 'bg-yellow-500' },
  { symbol: 'SOL', name: 'Solana', icon: '☀️', color: 'bg-purple-500' },
  { symbol: 'XRP', name: 'XRP', icon: '💧', color: 'bg-gray-500' },
];

const RECHARGE_NETWORKS = [
  { id: 'ERC20-USDT', name: 'ERC20-USDT' },
  { id: 'TRC20-USDT', name: 'TRC20-USDT' },
  { id: 'ETH', name: 'ETH' },
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
  const [selectedNetwork, setSelectedNetwork] = useState('ERC20-USDT');
  const [selectedRechargeNetwork, setSelectedRechargeNetwork] = useState('ERC20-USDT');
  const [copied, setCopied] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  
  // Exchange state - must be at top level
  const [fromCurrency, setFromCurrency] = useState('usdt');
  const [toCurrency, setToCurrency] = useState('btc');
  const [exchangeAmount, setExchangeAmount] = useState('');
  
  // KYC state
  const [kycName, setKycName] = useState('');
  const [kycIdNumber, setKycIdNumber] = useState('');
  const [kycIdType, setKycIdType] = useState<'passport' | 'driver_license' | 'national_id' | 'other'>('passport');
  const [kycIdImage, setKycIdImage] = useState<string | null>(null);
  const [kycIdFileName, setKycIdFileName] = useState('');
  
  const { assets, getBalance } = useAssets();
  const { getPrice } = useCryptoPrices();
  const { loans } = useLoan();
  const { kycData, submitKYC, isVerified } = useKYC();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Fetch wallet addresses from database
  useEffect(() => {
    const fetchWalletAddresses = async () => {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('key, value')
          .like('key', 'recharge_address_%');

        if (error) {
          console.error('Failed to fetch wallet addresses:', error);
          return;
        }

        const addressMap: Record<string, string> = {};
        data?.forEach(item => {
          // Extract network from key like "recharge_address_ERC20-USDT"
          const network = item.key.replace('recharge_address_', '');
          addressMap[network] = item.value;
        });
        setWalletAddresses(addressMap);
      } catch (error) {
        console.error('Failed to fetch wallet addresses:', error);
      }
    };

    fetchWalletAddresses();
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Check if user has active loans (approved or overdue status)
  const hasActiveLoan = loans.some(loan => loan.status === 'approved' || loan.status === 'overdue');

  // Check if account is frozen
  const [isFrozen, setIsFrozen] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  useEffect(() => {
    const checkFrozenStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('is_frozen')
        .eq('user_id', user.id)
        .single();
      
      setIsFrozen(data?.is_frozen || false);
    };
    
    checkFrozenStatus();
  }, [user?.id]);

  // Fetch withdrawal history
  useEffect(() => {
    const fetchWithdrawHistory = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setWithdrawHistory(data || []);
    };
    
    fetchWithdrawHistory();
  }, [user?.id]);
  const totalAssets = CRYPTO_ASSETS.reduce((total, crypto) => {
    const balance = getBalance(crypto.symbol);
    const priceData = getPrice(crypto.symbol);
    const price = priceData?.price || 0;
    return total + (balance * price);
  }, 0);

  // Simulated P&L
  const floatingPnL = -381.58;
  const floatingPnLPercent = -1.42;

  // Get current wallet address based on selected network
  const currentWalletAddress = walletAddresses[selectedRechargeNetwork] || '';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentWalletAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const WITHDRAW_FEE_RATE = 0.005; // 0.5%
  const MIN_WITHDRAW_AMOUNT = 10;

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount < MIN_WITHDRAW_AMOUNT) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAW_AMOUNT} USDT`);
      return;
    }
    if (!withdrawAddress) {
      toast.error('Please enter a receiving address');
      return;
    }
    
    const usdtBalance = getBalance('USDT');
    if (amount > usdtBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!user?.id) {
      toast.error('Please login first');
      return;
    }

    try {
      const fee = amount * WITHDRAW_FEE_RATE;
      
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdraw',
        amount,
        currency: 'USDT',
        status: 'pending',
        to_address: withdrawAddress,
        network: selectedNetwork,
        fee,
        note: `Withdraw ${amount} USDT to ${withdrawAddress} via ${selectedNetwork}`,
      });

      if (error) throw error;
      
      const receiveAmount = amount - fee;
      toast.success(`Withdrawal request submitted. Amount: ${amount} USDT, Fee: ${fee.toFixed(2)} USDT, You will receive: ${receiveAmount.toFixed(2)} USDT`);
      setWithdrawAmount('');
      setWithdrawAddress('');
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Withdrawal request failed');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRechargeSubmit = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!receiptImage) {
      toast.error('Please upload a receipt image');
      return;
    }

    if (!user?.id) {
      toast.error('Please login first');
      return;
    }

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount,
        currency: 'USDT',
        status: 'pending',
        network: selectedRechargeNetwork,
        note: `Recharge ${amount} USDT via ${selectedRechargeNetwork}. Receipt uploaded.`,
      });

      if (error) throw error;
      
      toast.success('Recharge request submitted. Please wait for confirmation.');
      setRechargeAmount('');
      setReceiptImage(null);
      setReceiptFileName('');
    } catch (error: any) {
      console.error('Recharge error:', error);
      toast.error(error.message || 'Recharge request failed');
    }
  };

  const renderBreadcrumb = () => {
    const viewNames: Record<AccountView, string> = {
      overview: 'Account',
      withdraw: 'Withdraw',
      recharge: 'Recharge',
      exchange: 'Exchange',
      verification: 'Identity Verification',
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
            <span className="text-xl text-muted-foreground ml-2">USDT</span>
          </h1>
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm ${
            floatingPnL >= 0 ? 'bg-[hsl(145,60%,45%)]/20 text-[hsl(145,60%,45%)]' : 'bg-[hsl(0,70%,55%)]/20 text-[hsl(0,70%,55%)]'
          }`}>
            <span>Floating P&L:</span>
            <span className="font-medium">
              {floatingPnL >= 0 ? '+' : ''}{floatingPnL.toFixed(2)} USDT ({floatingPnLPercent >= 0 ? '+' : ''}{floatingPnLPercent}%)
            </span>
          </div>
        </div>

        {/* Balance & Loan */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
            <p className="text-2xl font-semibold">{getBalance('USDT').toLocaleString()} USDT</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Loan</p>
            <p className="text-2xl font-semibold">0.00 USDT</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <button 
            onClick={() => setCurrentView('withdraw')}
            className="flex flex-col items-center gap-2 md:gap-3 p-2 md:p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">Withdraw</span>
          </button>
          <button 
            onClick={() => setCurrentView('recharge')}
            className="flex flex-col items-center gap-2 md:gap-3 p-2 md:p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">Recharge</span>
          </button>
          <button 
            onClick={() => setCurrentView('exchange')}
            className="flex flex-col items-center gap-2 md:gap-3 p-2 md:p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
              <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">Exchange</span>
          </button>
          <button 
            onClick={() => setCurrentView('verification')}
            className="flex flex-col items-center gap-2 md:gap-3 p-2 md:p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all group relative"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
              kycData.status === 'approved' 
                ? 'border-green-500 bg-green-500/10' 
                : kycData.status === 'pending'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-foreground/20 group-hover:border-primary group-hover:bg-primary/10'
            }`}>
              <UserCheck className={`w-4 h-4 md:w-5 md:h-5 ${
                kycData.status === 'approved' 
                  ? 'text-green-500' 
                  : kycData.status === 'pending'
                  ? 'text-yellow-500'
                  : ''
              }`} />
            </div>
            <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">Verify</span>
            {kycData.status === 'approved' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
            )}
            {kycData.status === 'pending' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-6 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 hover:border-red-500/40 p-4 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-red-500">Log Out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
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
                  <p className="text-sm text-muted-foreground">≈ {usdValue.toFixed(2)} USDT</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const isActionDisabled = hasActiveLoan || isFrozen;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', label: 'Pending' },
      completed: { color: 'bg-green-500/20 text-green-600 dark:text-green-400', label: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Cancelled' },
      failed: { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Failed' },
    };
    const item = config[status] || { color: 'bg-muted', label: status };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.color}`}>{item.label}</span>;
  };

  const renderWithdraw = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account Frozen Warning */}
      {isFrozen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Account Frozen</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Your account has been frozen. Withdrawals, trades, exchanges, and loans are disabled. Please contact customer support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Loan Warning */}
      {hasActiveLoan && !isFrozen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Withdrawal Locked</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                You have an active loan. Withdrawals are disabled until all loans are fully repaid.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-card border border-border rounded-2xl p-6 ${isActionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
            <span>Fee: <span className="font-medium">0.5%</span> of withdrawal amount</span>
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

      {/* Withdrawal History */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Withdrawal History
        </h3>
        {withdrawHistory.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No withdrawal records</p>
        ) : (
          <div className="space-y-3">
            {withdrawHistory.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tx.amount} {tx.currency}</span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tx.to_address ? `To: ${tx.to_address.slice(0, 10)}...${tx.to_address.slice(-8)}` : 'No address'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()} · {tx.network?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  {tx.fee && <p className="text-xs text-muted-foreground">Fee: {tx.fee} USDT</p>}
                </div>
              </div>
            ))}
          </div>
        )}
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

          {RECHARGE_NETWORKS.map((network) => {
            const ethPrice = getPrice('ETH');
            const showRate = network.id === 'eth';
            
            return (
            <TabsContent key={network.id} value={network.id} className="space-y-6">
              {/* Rate Display - Only for ETH */}
              {showRate && (
                <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
                  <span className="text-primary font-medium">
                    1 ETH: {ethPrice ? ethPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'} USDT
                  </span>
                </div>
              )}

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border border-border">
                  <QRCodeSVG 
                    value={walletAddresses[network.id] || ''}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Wallet Address */}
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Deposit Address</p>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm break-all font-mono">
                    {walletAddresses[network.id] || 'Loading...'}
                  </p>
                </div>
                <Button 
                  onClick={handleCopyAddress}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>
              </div>
            </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Upload Receipt Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Recharge Receipt
        </h3>
        
        <div className="space-y-4">
          {/* Recharge Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Recharge Amount (USDT):</label>
            <Input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="Enter amount..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Receipt Image:</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                {receiptImage ? (
                  <div className="space-y-3">
                    <img 
                      src={receiptImage} 
                      alt="Receipt preview" 
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">{receiptFileName}</p>
                    <p className="text-xs text-primary">Click to change image</p>
                  </div>
                ) : (
                  <div className="py-6">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload receipt image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleRechargeSubmit}
            className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium"
          >
            Submit Recharge Request
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const exchangeCurrencies = [
    { value: 'usdt', label: 'USDT' },
    { value: 'btc', label: 'BTC' },
    { value: 'eth', label: 'ETH' },
    { value: 'bnb', label: 'BNB' },
    { value: 'sol', label: 'SOL' },
    { value: 'xrp', label: 'XRP' },
    { value: 'ada', label: 'ADA' },
    { value: 'doge', label: 'DOGE' },
    { value: 'dot', label: 'DOT' },
    { value: 'ltc', label: 'LTC' },
  ];

  // Get prices for calculation
  const fromPrice = fromCurrency === 'usdt' ? 1 : (getPrice(fromCurrency.toUpperCase())?.price || 0);
  const toPrice = toCurrency === 'usdt' ? 1 : (getPrice(toCurrency.toUpperCase())?.price || 0);
  
  const exchangeRate = toPrice > 0 ? fromPrice / toPrice : 0;
  const toAmount = exchangeAmount && exchangeRate > 0 ? (parseFloat(exchangeAmount) * exchangeRate * 0.999).toFixed(8) : '';

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setExchangeAmount('');
  };

  const handleExchange = () => {
    if (isFrozen) {
      toast.error('Your account is frozen. Exchange is disabled.');
      return;
    }
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const fromBalance = getBalance(fromCurrency.toUpperCase());
    if (parseFloat(exchangeAmount) > fromBalance) {
      toast.error('Insufficient balance');
      return;
    }
    toast.success(`Exchange request submitted: ${exchangeAmount} ${fromCurrency.toUpperCase()} → ${toAmount} ${toCurrency.toUpperCase()}`);
    setExchangeAmount('');
  };

  const renderExchange = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Exchange Crypto</h3>
          
          <div className="space-y-6">
            {/* From */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">From:</label>
              <div className="flex gap-3">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exchangeCurrencies.filter(c => c.value !== toCurrency).map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder="Amount" 
                  className="flex-1" 
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {getBalance(fromCurrency.toUpperCase()).toFixed(4)} {fromCurrency.toUpperCase()}
              </p>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <button 
                onClick={handleSwapCurrencies}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* To */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">To:</label>
              <div className="flex gap-3">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exchangeCurrencies.filter(c => c.value !== fromCurrency).map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder="You receive" 
                  className="flex-1" 
                  value={toAmount}
                  disabled 
                />
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span>1 {fromCurrency.toUpperCase()} = {exchangeRate.toFixed(8)} {toCurrency.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Fee</span>
                <span>0.1%</span>
              </div>
            </div>

            <Button 
              onClick={handleExchange}
              className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium"
            >
              Exchange Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleKycImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setKycIdFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKycIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKycSubmit = () => {
    if (!kycName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!kycIdNumber.trim()) {
      toast.error('Please enter your ID number');
      return;
    }
    if (!kycIdImage) {
      toast.error('Please upload your ID document');
      return;
    }

    submitKYC({
      fullName: kycName.trim(),
      idNumber: kycIdNumber.trim(),
      idType: kycIdType,
      idImage: kycIdImage,
    });

    toast.success('Identity verification submitted. Please wait for approval.');
    setKycName('');
    setKycIdNumber('');
    setKycIdImage(null);
    setKycIdFileName('');
  };

  const renderVerification = () => {
    const idTypeLabels = {
      passport: 'Passport',
      driver_license: "Driver's License",
      national_id: 'National ID Card',
      other: 'Other ID Document',
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        {kycData.status !== 'not_submitted' && (
          <div className={`rounded-2xl p-6 border ${
            kycData.status === 'approved' 
              ? 'bg-green-500/10 border-green-500/30' 
              : kycData.status === 'pending'
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {kycData.status === 'approved' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              {kycData.status === 'pending' && <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />}
              {kycData.status === 'rejected' && <XCircle className="w-6 h-6 text-red-500" />}
              <div>
                <p className="font-semibold">
                  {kycData.status === 'approved' && 'Identity Verified'}
                  {kycData.status === 'pending' && 'Verification Pending'}
                  {kycData.status === 'rejected' && 'Verification Rejected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {kycData.status === 'approved' && `Verified as: ${kycData.fullName}`}
                  {kycData.status === 'pending' && 'Your documents are being reviewed. This usually takes 1-3 business days.'}
                  {kycData.status === 'rejected' && 'Please submit valid documents again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Form */}
        {(kycData.status === 'not_submitted' || kycData.status === 'rejected') && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Identity Verification (KYC)</h3>
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label>Full Name (as shown on ID)</Label>
                <Input
                  type="text"
                  placeholder="Enter your full legal name"
                  value={kycName}
                  onChange={(e) => setKycName(e.target.value)}
                />
              </div>

              {/* ID Type Selection */}
              <div className="space-y-2">
                <Label>ID Document Type</Label>
                <Select value={kycIdType} onValueChange={(v) => setKycIdType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="driver_license">Driver's License</SelectItem>
                    <SelectItem value="national_id">National ID Card</SelectItem>
                    <SelectItem value="other">Other ID Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ID Number */}
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  type="text"
                  placeholder="Enter your ID number"
                  value={kycIdNumber}
                  onChange={(e) => setKycIdNumber(e.target.value)}
                />
              </div>

              {/* ID Document Upload */}
              <div className="space-y-2">
                <Label>Upload ID Document</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleKycImageUpload}
                    className="hidden"
                    id="kyc-upload"
                  />
                  <label htmlFor="kyc-upload" className="cursor-pointer">
                    {kycIdImage ? (
                      <div className="space-y-3">
                        <div className="w-full max-w-xs mx-auto">
                          <img 
                            src={kycIdImage} 
                            alt="ID Preview" 
                            className="w-full h-auto rounded-lg border border-border"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{kycIdFileName}</p>
                        <p className="text-xs text-primary">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Upload ID Document</p>
                          <p className="text-sm text-muted-foreground">
                            Click to upload a clear photo of your ID
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPG, PNG, PDF. Max size: 5MB
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleKycSubmit}
                className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium"
              >
                Submit Verification
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            Why Verify Your Identity?
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>Required for loan applications and higher withdrawal limits</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>Protects your account from unauthorized access</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>Complies with financial regulations</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>Verification usually takes 1-3 business days</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      
      <main className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {renderBreadcrumb()}
          
          {currentView === 'overview' && renderOverview()}
          {currentView === 'withdraw' && renderWithdraw()}
          {currentView === 'recharge' && renderRecharge()}
          {currentView === 'exchange' && renderExchange()}
          {currentView === 'verification' && renderVerification()}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Account;
