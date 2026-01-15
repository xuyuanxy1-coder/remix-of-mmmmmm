import { useState, useEffect } from 'react';
import { useLoan } from '@/contexts/LoanContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Send, Loader2, History, Upload } from 'lucide-react';
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
  receipt_image_url?: string;
}

const LoanRepayment = () => {
  const { loans, calculateOwed, refreshLoans } = useLoan();
  const { user } = useAuth();
  const [repaymentModal, setRepaymentModal] = useState<{ open: boolean; loanId: string | null; totalOwed: number; principal: number; interest: number; penalty: number }>({ 
    open: false, 
    loanId: null,
    totalOwed: 0,
    principal: 0,
    interest: 0,
    penalty: 0,
  });
  const [repaymentType, setRepaymentType] = useState<'partial' | 'early_full' | 'full'>('partial');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');

  // Active loans are those with 'approved' or 'overdue' status
  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const paidLoans = loans.filter(l => l.status === 'repaid');

  // Calculate total remaining balance across all active loans
  const totalRemainingOwed = activeLoans.reduce((sum, loan) => {
    const owed = calculateOwed(loan);
    return sum + owed.total;
  }, 0);

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
      .limit(50);

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

  const openRepaymentModal = (loanId: string, owed: { total: number; principal: number; interest: number; penalty: number }) => {
    setRepaymentModal({ 
      open: true, 
      loanId, 
      totalOwed: owed.total,
      principal: owed.principal,
      interest: owed.interest,
      penalty: owed.penalty,
    });
    setRepaymentType('partial');
    setRepaymentAmount('');
    setReceiptImage(null);
    setReceiptFileName('');
  };

  const handleRepaymentTypeChange = (type: 'partial' | 'early_full' | 'full') => {
    setRepaymentType(type);
    if (type === 'full' || type === 'early_full') {
      setRepaymentAmount(repaymentModal.totalOwed.toFixed(2));
    } else {
      setRepaymentAmount('');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmitRepayment = async () => {
    if (!user || !repaymentModal.loanId) return;
    
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > repaymentModal.totalOwed * 1.01) {
      toast.error('Amount cannot exceed the total owed');
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
          receipt_image_url: receiptImage || null,
        });

      if (error) {
        throw error;
      }

      toast.success('Repayment request submitted, awaiting admin review');
      setRepaymentModal({ open: false, loanId: null, totalOwed: 0, principal: 0, interest: 0, penalty: 0 });
      setReceiptImage(null);
      setReceiptFileName('');
      fetchRepaymentHistory();
    } catch (error: any) {
      console.error('Repayment submission failed:', error);
      toast.error('Submission failed, please try again');
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
      case 'partial': return 'Partial Repayment';
      case 'early_full': return 'Early Full Repayment';
      case 'full': return 'Full Repayment';
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
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
      </div>

      {/* Total Remaining Balance Summary */}
      {activeLoans.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-orange-600 dark:text-orange-400">Total Remaining Balance</span>
            </div>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {totalRemainingOwed.toFixed(2)} USDT
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {activeLoans.length} outstanding loan{activeLoans.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Repayment Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <p>Click "Repay Now" to submit a repayment request</p>
            <p className="text-xs opacity-80">• Payment priority: Penalty → Interest → Principal</p>
            <p className="text-xs opacity-80">• Early repayment supported, no interest for first 7 days</p>
          </div>
        </div>
      </div>

      {/* Repayment History - Now more prominent */}
      {showHistory && (
        <div className="mb-6 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              Repayment History
            </h4>
            <span className="text-xs text-muted-foreground">{repaymentHistory.length} records</span>
          </div>
          {repaymentHistory.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No repayment records</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {repaymentHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.amount.toLocaleString()} USDT</span>
                      {getRepaymentStatusBadge(record.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRepaymentTypeLabel(record.repayment_type)} · {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
                    </p>
                    {record.status === 'rejected' && record.reject_reason && (
                      <p className="text-xs text-red-500 mt-1">Rejection reason: {record.reject_reason}</p>
                    )}
                  </div>
                  {record.receipt_image_url && (
                    <div className="ml-2">
                      <img 
                        src={record.receipt_image_url} 
                        alt="Receipt" 
                        className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80"
                        onClick={() => window.open(record.receipt_image_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeLoans.length === 0 && paidLoans.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No loans found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to the loan application page to apply for a loan
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Outstanding Loans</h4>
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
                      <div className="space-y-2 text-sm mb-4 bg-muted/30 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal</span>
                          <span className="font-medium">{owed.principal.toLocaleString()} {loan.currency}</span>
                        </div>
                        <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                          <span>Interest (1%/day)</span>
                          <span>{owed.interest > 0 ? '+' : ''}{owed.interest.toFixed(2)} {loan.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                          <span>Penalty (2%/day)</span>
                          <span>{owed.penalty > 0 ? '+' : ''}{owed.penalty.toFixed(2)} {loan.currency}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-border text-base">
                          <span>Total Owed</span>
                          <span className="text-primary">{owed.total.toFixed(2)} {loan.currency}</span>
                        </div>
                      </div>

                      {/* Repayment Button */}
                      <Button 
                        className="w-full"
                        onClick={() => openRepaymentModal(loan.id, owed)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Repay Now
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
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Paid Off Loans</h4>
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
                      <span className="text-xs text-green-600 dark:text-green-400">Paid Off</span>
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
      <Dialog open={repaymentModal.open} onOpenChange={(open) => !open && setRepaymentModal({ open: false, loanId: null, totalOwed: 0, principal: 0, interest: 0, penalty: 0 })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Repayment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Detailed breakdown */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal</span>
                <span>{repaymentModal.principal.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm text-yellow-600 dark:text-yellow-400">
                <span>Interest</span>
                <span>+{repaymentModal.interest.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                <span>Penalty</span>
                <span>+{repaymentModal.penalty.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>Total Owed</span>
                <span className="text-primary text-lg">{repaymentModal.totalOwed.toFixed(2)} USDT</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Repayment Type</Label>
              <Select value={repaymentType} onValueChange={(v) => handleRepaymentTypeChange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="partial">Partial Repayment</SelectItem>
                  <SelectItem value="early_full">Early Full Repayment</SelectItem>
                  <SelectItem value="full">Full Repayment (On Due Date)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Repayment Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="Enter repayment amount"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                disabled={repaymentType === 'full' || repaymentType === 'early_full'}
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Payment Receipt (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="receipt-upload"
                  onChange={handleReceiptUpload}
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {receiptImage ? (
                    <div className="space-y-2">
                      <img src={receiptImage} alt="Receipt" className="max-h-32 mx-auto rounded-lg" />
                      <p className="text-xs text-muted-foreground">{receiptFileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload payment receipt</p>
                      <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG supported</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Awaiting admin review after submission</p>
              <p>• Early repayment can reduce interest</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepaymentModal({ open: false, loanId: null, totalOwed: 0, principal: 0, interest: 0, penalty: 0 })}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRepayment} disabled={isSubmitting || !repaymentAmount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanRepayment;
