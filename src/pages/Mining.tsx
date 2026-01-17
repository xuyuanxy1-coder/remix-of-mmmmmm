import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Pickaxe, 
  Lock, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Wallet
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMining, MINING_TIERS } from '@/contexts/MiningContext';
import { useAssets } from '@/contexts/AssetsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoan } from '@/contexts/LoanContext';
import { toast } from 'sonner';

const Mining = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    investments, 
    totalMiningAmount, 
    pendingEarnings,
    totalDeposits,
    isEligible, 
    submitMiningApplication,
    getActiveInvestments,
    getPendingInvestments,
  } = useMining();
  const { getBalance } = useAssets();
  const { isAuthenticated } = useAuth();
  const { activeLoans, calculateOwed } = useLoan();
  const navigate = useNavigate();

  // Calculate available balance (only USDT balance, not loans)
  const usdtBalance = getBalance('USDT');
  const availableForMining = usdtBalance;

  const activeInvestments = getActiveInvestments();
  const pendingInvestments = getPendingInvestments();

  const handleTierSelect = (tier: 1 | 2 | 3) => {
    setSelectedTier(tier);
    const tierConfig = MINING_TIERS.find(t => t.tier === tier);
    if (tierConfig) {
      setInvestAmount(tierConfig.minAmount.toString());
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    if (!selectedTier) {
      toast.error('Please select a mining tier');
      return;
    }

    const amount = parseFloat(investAmount);
    const tierConfig = MINING_TIERS.find(t => t.tier === selectedTier);

    if (!tierConfig) {
      toast.error('Invalid tier selected');
      return;
    }

    if (isNaN(amount) || amount < tierConfig.minAmount) {
      toast.error(`Minimum investment for this tier is ${tierConfig.minAmount} USDT`);
      return;
    }

    if (amount > availableForMining) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await submitMiningApplication(amount, selectedTier);
      if (success) {
        toast.success('Mining application submitted! Please wait for admin approval.');
        setSelectedTier(null);
        setInvestAmount('');
      } else {
        toast.error('Failed to submit mining application');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', label: 'Pending Approval', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      active: { color: 'bg-green-500/20 text-green-600 dark:text-green-400', label: 'Active', icon: <CheckCircle2 className="w-3 h-3" /> },
      completed: { color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" /> },
      settled: { color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400', label: 'Settled', icon: <CheckCircle2 className="w-3 h-3" /> },
      rejected: { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Rejected', icon: <XCircle className="w-3 h-3" /> },
    };
    const item = config[status] || { color: 'bg-muted', label: status, icon: null };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${item.color}`}>
        {item.icon}
        {item.label}
      </span>
    );
  };

  const calculateProgress = (investment: typeof investments[0]) => {
    if (!investment.startDate || !investment.endDate) return 0;
    const now = new Date();
    const start = investment.startDate.getTime();
    const end = investment.endDate.getTime();
    const current = now.getTime();
    return Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));
  };

  const calculateDaysRemaining = (investment: typeof investments[0]) => {
    if (!investment.endDate) return investment.lockDays;
    const now = new Date();
    const end = investment.endDate.getTime();
    const remaining = Math.ceil((end - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      
      <main className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">MetaMaskTrade</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Mining</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Pickaxe className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold">Crypto Mining</h1>
            </div>
            <p className="text-muted-foreground">
              Stake your crypto and earn daily rewards. Lock your funds for higher returns.
            </p>
          </div>

          {/* Eligibility Warning Banner - shown at top for ineligible users */}
          {!isEligible && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">Mining Requires Deposit of 5,000 USDT or More</p>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">
                    To participate in mining, your total deposits must exceed 5,000 USDT. 
                    Your current total deposits: <span className="font-medium">{totalDeposits.toLocaleString()} USDT</span>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                    onClick={() => navigate('/account')}
                  >
                    Go to Recharge
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards - only show for eligible users */}
          {isEligible && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Locked in Mining
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalMiningAmount.toLocaleString()} USDT</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    Pending Earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Available for Mining
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{availableForMining.toLocaleString()} USDT</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mining Tiers - show for all users */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Mining Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MINING_TIERS.map((tier) => (
                <Card 
                  key={tier.tier}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedTier === tier.tier ? 'border-primary ring-2 ring-primary/20' : ''
                  } ${!isEligible ? 'opacity-70' : ''}`}
                  onClick={() => isEligible && handleTierSelect(tier.tier as 1 | 2 | 3)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.label}</CardTitle>
                      {tier.tier === 3 && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                          Best Value
                        </span>
                      )}
                    </div>
                    <CardDescription>Lock Period: {tier.lockDays} days</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold text-primary">{tier.dailyRate}%</p>
                      <p className="text-sm text-muted-foreground">Daily Return</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Investment</span>
                        <span className="font-medium">{tier.minAmount.toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Return</span>
                        <span className="font-medium text-green-500">
                          {(tier.dailyRate * tier.lockDays).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Investment Form - only show for eligible users who selected a tier */}
          {isEligible && selectedTier && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Start Mining</CardTitle>
                <CardDescription>
                  You selected: {MINING_TIERS.find(t => t.tier === selectedTier)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Investment Amount (USDT)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="Enter amount..."
                      min={MINING_TIERS.find(t => t.tier === selectedTier)?.minAmount}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                      onClick={() => setInvestAmount(availableForMining.toString())}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum: {MINING_TIERS.find(t => t.tier === selectedTier)?.minAmount.toLocaleString()} USDT
                  </p>
                </div>

                {/* Expected Returns */}
                {investAmount && parseFloat(investAmount) > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Earnings</span>
                      <span className="text-green-500 font-medium">
                        +{(parseFloat(investAmount) * (MINING_TIERS.find(t => t.tier === selectedTier)?.dailyRate || 0) / 100).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Earnings</span>
                      <span className="text-green-500 font-medium">
                        +{(parseFloat(investAmount) * (MINING_TIERS.find(t => t.tier === selectedTier)?.dailyRate || 0) / 100 * (MINING_TIERS.find(t => t.tier === selectedTier)?.lockDays || 0)).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Total at Maturity</span>
                      <span className="font-bold">
                        {(parseFloat(investAmount) + parseFloat(investAmount) * (MINING_TIERS.find(t => t.tier === selectedTier)?.dailyRate || 0) / 100 * (MINING_TIERS.find(t => t.tier === selectedTier)?.lockDays || 0)).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Mining Application
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notice */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-5 h-5 text-primary" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Mining investments are locked for the selected period and cannot be withdrawn early.</p>
              <p>• Earnings are automatically added to your balance upon maturity.</p>
              <p>• Loan amounts can be used for mining investments.</p>
              <p>• Mining applications require admin approval before activation.</p>
            </CardContent>
          </Card>

          {/* Active Investments - only show for eligible users */}
          {isEligible && activeInvestments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Active Mining</h2>
              <div className="space-y-4">
                {activeInvestments.map((investment) => (
                  <Card key={investment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold">{investment.amount.toLocaleString()} USDT</p>
                          <p className="text-sm text-muted-foreground">
                            Tier {investment.tier} • {investment.dailyRate}% daily
                          </p>
                        </div>
                        {getStatusBadge(investment.status)}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {calculateDaysRemaining(investment)} days remaining
                          </span>
                          <span className="text-green-500">
                            +{(investment.amount * (investment.dailyRate / 100) * Math.min(
                              investment.lockDays,
                              investment.startDate ? Math.floor((new Date().getTime() - investment.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                            )).toFixed(2)} USDT earned
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${calculateProgress(investment)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Investments - only show for eligible users */}
          {isEligible && pendingInvestments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Pending Applications</h2>
              <div className="space-y-4">
                {pendingInvestments.map((investment) => (
                  <Card key={investment.id} className="border-yellow-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{investment.amount.toLocaleString()} USDT</p>
                          <p className="text-sm text-muted-foreground">
                            Tier {investment.tier} • {investment.lockDays} days lock • {investment.dailyRate}% daily
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {investment.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(investment.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* History - only show for eligible users */}
          {isEligible && investments.filter(inv => ['completed', 'settled', 'rejected'].includes(inv.status)).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Mining History</h2>
              <div className="space-y-4">
                {investments
                  .filter(inv => ['completed', 'settled', 'rejected'].includes(inv.status))
                  .map((investment) => (
                    <Card key={investment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{investment.amount.toLocaleString()} USDT</p>
                            <p className="text-sm text-muted-foreground">
                              Tier {investment.tier} • {investment.lockDays} days
                            </p>
                            {investment.status === 'settled' && (
                              <p className="text-sm text-green-500 mt-1">
                                Earned: +{investment.totalEarnings.toLocaleString()} USDT
                              </p>
                            )}
                            {investment.adminNote && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {investment.adminNote}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(investment.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
});

Mining.displayName = 'Mining';

export default Mining;
