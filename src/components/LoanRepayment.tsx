import { useState, useEffect } from 'react';
import { useLoan } from '@/contexts/LoanContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Send, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RepaymentRecord {
  id: string;
  loan_id: string;
  amount: number;
  repayment_type: string;
  status: string;
  created_at: string;
  reject_reason?: string;
}

const LoanRepayment = () => {
  const { loans, calculateOwed, refreshLoans } = useLoan();
  const { user } = useAuth();
  const [repaymentModal, setRepaymentModal] = useState<{ open: boolean; loanId: string | null; totalOwed: number }>({ 
    open: false, 
    loanId: null,
    totalOwed: 0
  });
  const [repaymentType, setRepaymentType] = useState<'partial' | 'early_full' | 'full'>('partial');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Active loans are those with 'approved' or 'overdue' status
  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const paidLoans = loans.filter(l => l.status === 'repaid');

  useEffect(() => {
    if (user) {
      fetchRepaymentHistory();
    }
  }, [user]);

  const fetchRepaymentHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('loan_repayments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setRepaymentHistory(data as RepaymentRecord[]);
    }
  };

  const getStatusColor = (daysElapsed: number) => {
    if (daysElapsed <= 7) return 'text-green-500';
    if (daysElapsed <= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (daysElapsed: number) => {
    if (daysElapsed <= 7) return <Clock className="w-4 h-4 text-green-500" />;
    if (daysElapsed <= 15) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const openRepaymentModal = (loanId: string, totalOwed: number) => {
    setRepaymentModal({ open: true, loanId, totalOwed });
    setRepaymentType('partial');
    setRepaymentAmount('');
  };

  const handleRepaymentTypeChange = (type: 'partial' | 'early_full' | 'full') => {
    setRepaymentType(type);
    if (type === 'full' || type === 'early_full') {
      setRepaymentAmount(repaymentModal.totalOwed.toFixed(2));
    } else {
      setRepaymentAmount('');
    }
  };

  const handleSubmitRepayment = async () => {
    if (!user || !repaymentModal.loanId) return;
    
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > repaymentModal.totalOwed) {
      toast.error('Amount cannot exceed total owed');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('loan_repayments')
        .insert({
          loan_id: repaymentModal.loanId,
          user_id: user.id,
          amount,
          repayment_type: repaymentType,
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      toast.success('Repayment request submitted. Awaiting admin approval.');
      setRepaymentModal({ open: false, loanId: null, totalOwed: 0 });
      fetchRepaymentHistory();
    } catch (error: any) {
      console.error('Repayment submission failed:', error);
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRepaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-600">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-600">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-600">Rejected</span>;
      default:
        return null;
    }
  };

  const getRepaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'partial': return 'Partial';
      case 'early_full': return 'Early Full';
      case 'full': return 'Full';
      default: return type;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Loan Repayment</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-4 h-4 mr-1" />
          {showHistory ? 'Hide' : 'History'}
        </Button>
      </div>

      {/* Repayment Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <p>Click "Make Payment" button to submit a repayment request</p>
            <p className="text-xs opacity-80">• Priority: Penalty → Interest → Principal</p>
            <p className="text-xs opacity-80">• Early repayment supported, 7 days interest-free</p>
          </div>
        </div>
      </div>

      {/* Repayment History */}
      {showHistory && repaymentHistory.length > 0 && (
        <div className="mb-6 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Repayment Requests</h4>
          {repaymentHistory.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{record.amount.toLocaleString()} USDT</span>
                  {getRepaymentStatusBadge(record.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRepaymentTypeLabel(record.repayment_type)} · {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
                </p>
                {record.status === 'rejected' && record.reject_reason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {record.reject_reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeLoans.length === 0 && paidLoans.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No loans found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Apply for a loan to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Loans</h4>
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const owed = calculateOwed(loan);

                  return (
                    <div 
                      key={loan.id} 
                      className="bg-muted/50 rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(owed.daysElapsed)}
                          <span className={`text-sm font-medium ${getStatusColor(owed.daysElapsed)}`}>
                            Day {owed.daysElapsed + 1}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(loan.borrowDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Owed Breakdown */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal</span>
                          <span>{owed.principal.toLocaleString()} {loan.currency}</span>
                        </div>
                        {owed.interest > 0 && (
                          <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                            <span>Interest (1%/day)</span>
                            <span>+{owed.interest.toFixed(2)} {loan.currency}</span>
                          </div>
                        )}
                        {owed.penalty > 0 && (
                          <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Penalty (2%/day)</span>
                            <span>+{owed.penalty.toFixed(2)} {loan.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                          <span>Total Owed</span>
                          <span>{owed.total.toFixed(2)} {loan.currency}</span>
                        </div>
                      </div>

                      {/* Repayment Button */}
                      <Button 
                        className="w-full"
                        onClick={() => openRepaymentModal(loan.id, owed.total)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Make Payment
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paid Loans */}
          {paidLoans.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Paid Loans</h4>
              <div className="space-y-2">
                {paidLoans.slice(-5).map((loan) => (
                  <div 
                    key={loan.id} 
                    className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{loan.amount} {loan.currency}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-green-600 dark:text-green-400">Fully Paid</span>
                      {loan.repaidDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(loan.repaidDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Repayment Modal */}
      <Dialog open={repaymentModal.open} onOpenChange={(open) => !open && setRepaymentModal({ open: false, loanId: null, totalOwed: 0 })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Repayment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount Owed</p>
              <p className="text-xl font-bold">{repaymentModal.totalOwed.toFixed(2)} USDT</p>
            </div>

            <div className="space-y-2">
              <Label>Repayment Type</Label>
              <Select value={repaymentType} onValueChange={(v) => handleRepaymentTypeChange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="early_full">Early Full Payment</SelectItem>
                  <SelectItem value="full">Full Payment (On Due)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="Enter repayment amount"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                disabled={repaymentType === 'full' || repaymentType === 'early_full'}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Await admin approval after submission</p>
              <p>• Early repayment reduces interest charges</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepaymentModal({ open: false, loanId: null, totalOwed: 0 })}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRepayment} disabled={isSubmitting || !repaymentAmount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanRepayment;