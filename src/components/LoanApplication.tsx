import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLoan, MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT } from '@/contexts/LoanContext';
import { useKYC } from '@/contexts/KYCContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Coins, Clock, Info, AlertTriangle, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const currencies = [
  { symbol: 'USDT', name: 'Tether' },
];

const LoanApplication = () => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorContact, setGuarantorContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const { applyLoan, loans } = useLoan();
  const { kycData } = useKYC();
  const { user } = useAuth();

  // Check if account is frozen
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

  // Count active loans (approved or overdue status)
  const activeLoans = loans.filter((l) => l.status === 'approved' || l.status === 'overdue');
  const kycNotCompleted = kycData.status !== 'approved';

  const handleApply = async () => {
    const loanAmount = parseFloat(amount);

    if (!loanAmount || loanAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (loanAmount < MIN_LOAN_AMOUNT) {
      toast.error(`Minimum loan amount is ${MIN_LOAN_AMOUNT.toLocaleString()} ${currency}`);
      return;
    }

    if (loanAmount > MAX_LOAN_AMOUNT) {
      toast.error(`Maximum loan amount is ${MAX_LOAN_AMOUNT.toLocaleString()} ${currency}`);
      return;
    }

    if (activeLoans.length >= 3) {
      toast.error('Maximum 3 active loans allowed');
      return;
    }

    const hasGuarantor = guarantorName.trim() && guarantorContact.trim();

    setIsSubmitting(true);
    try {
      const success = await applyLoan(loanAmount, currency, hasGuarantor ? { name: guarantorName.trim(), contact: guarantorContact.trim() } : null);
      if (success) {
        toast.success(`Loan application submitted for ${loanAmount.toLocaleString()} ${currency}. Waiting for approval.`);
        setAmount('');
        setGuarantorName('');
        setGuarantorContact('');
      } else {
        toast.error('Failed to process loan application');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Coins className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Apply for Loan</h3>
      </div>

      {/* Account Frozen Warning */}
      {isFrozen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Account Frozen</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Your account has been frozen. Loan applications are disabled. Please contact customer support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KYC Warning */}
      {kycNotCompleted && !isFrozen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Identity Verification Required</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Please complete identity verification before applying for a loan.
              </p>
              <Link 
                to="/account" 
                className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
              >
                Go to Verification →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={`space-y-6 ${isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Currency Selection */}
        <div className="space-y-2">
          <Label>Select Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.symbol} value={c.symbol}>
                  <div className="flex items-center gap-2">
                    <span>{c.symbol}</span>
                    <span className="text-muted-foreground text-sm">- {c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Loan Amount</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder={`${MIN_LOAN_AMOUNT.toLocaleString()} - ${MAX_LOAN_AMOUNT.toLocaleString()}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16"
              min={MIN_LOAN_AMOUNT}
              max={MAX_LOAN_AMOUNT}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currency}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Min: {MIN_LOAN_AMOUNT.toLocaleString()} | Max: {MAX_LOAN_AMOUNT.toLocaleString()} {currency}
          </p>
        </div>

        {/* Guarantor (optional) */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4">
            <Label>Guarantor (Optional)</Label>
            <p className="text-xs text-muted-foreground text-right">
              Adding a guarantor can increase the loan amount and the success rate.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="Guarantor name"
              value={guarantorName}
              onChange={(e) => setGuarantorName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Guarantor contact (phone/email)"
              value={guarantorContact}
              onChange={(e) => setGuarantorContact(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[5000, 20000, 50000, 100000].map((val) => (
            <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val.toString())}>
              {val >= 1000 ? `${val / 1000}K` : val}
            </Button>
          ))}
        </div>

        {/* Loan Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>Interest-free period: 7 days</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-yellow-500" />
            <span>After 7 days: 1% daily interest</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-red-500" />
            <span>After 15 days: 2% daily penalty</span>
          </div>
        </div>

        {/* Active Loans Warning */}
        {activeLoans.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              You have {activeLoans.length} active loan(s). Max 3 allowed.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          className="w-full btn-primary" 
          size="lg"
          onClick={handleApply}
          disabled={activeLoans.length >= 3 || kycNotCompleted || isSubmitting || isFrozen}
        >
          {isSubmitting ? 'Submitting...' : 'Apply for Loan'}
        </Button>
      </div>
    </div>
  );
};

export default LoanApplication;
