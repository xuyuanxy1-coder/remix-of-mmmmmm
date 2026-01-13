import { useState } from 'react';
import { useLoan } from '@/contexts/LoanContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Upload, ChevronRight, History, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const LoanRepayment = () => {
  const { loans, submitRepayment, calculateOwed } = useLoan();
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, string>>({});
  const [receiptImages, setReceiptImages] = useState<Record<string, string>>({});
  const [receiptFileNames, setReceiptFileNames] = useState<Record<string, string>>({});

  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');

  const handleImageUpload = (loanId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setReceiptFileNames(prev => ({ ...prev, [loanId]: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImages(prev => ({ ...prev, [loanId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRepay = (loanId: string, currency: string) => {
    const amount = parseFloat(repaymentAmounts[loanId] || '0');
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }

    if (!receiptImages[loanId]) {
      toast.error('Please upload a payment receipt');
      return;
    }

    // Submit repayment request
    const success = submitRepayment(loanId, amount, receiptImages[loanId]);
    
    if (success) {
      toast.success('Repayment request submitted. Waiting for admin approval.');
      // Clear the form for this loan
      setRepaymentAmounts(prev => ({ ...prev, [loanId]: '' }));
      setReceiptImages(prev => ({ ...prev, [loanId]: '' }));
      setReceiptFileNames(prev => ({ ...prev, [loanId]: '' }));
    } else {
      toast.error('Failed to submit repayment request');
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

  const getRepaymentStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Loan Repayment</h3>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
            <p>Repayment must be made via external wallet transfer. Account balance cannot be used for loan repayment.</p>
            <p className="text-xs opacity-80">• Partial repayment is allowed</p>
            <p className="text-xs opacity-80">• Repayment priority: Penalty → Interest → Principal</p>
          </div>
        </div>
      </div>

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
                  const pendingRepayments = loan.repayments.filter(r => r.status === 'pending');
                  const totalPendingAmount = pendingRepayments.reduce((sum, r) => sum + r.amount, 0);

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
                          {loan.guarantorId && (
                            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                              Secured
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(loan.borrowDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Owed Breakdown */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal</span>
                          <div className="text-right">
                            <span>{owed.remainingPrincipal.toLocaleString()} {loan.currency}</span>
                            {loan.principalPaid > 0 && (
                              <span className="text-xs text-green-500 ml-2">
                                (-{loan.principalPaid.toFixed(2)} paid)
                              </span>
                            )}
                          </div>
                        </div>
                        {owed.interest > 0 && (
                          <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                            <span>Interest (1%/day)</span>
                            <div className="text-right">
                              <span>+{owed.remainingInterest.toFixed(4)} {loan.currency}</span>
                              {loan.interestPaid > 0 && (
                                <span className="text-xs text-green-500 ml-2">
                                  (-{loan.interestPaid.toFixed(2)} paid)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {owed.penalty > 0 && (
                          <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Penalty (2%/day)</span>
                            <div className="text-right">
                              <span>+{owed.remainingPenalty.toFixed(4)} {loan.currency}</span>
                              {loan.penaltyPaid > 0 && (
                                <span className="text-xs text-green-500 ml-2">
                                  (-{loan.penaltyPaid.toFixed(2)} paid)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                          <span>Remaining Total</span>
                          <span>{owed.remainingTotal.toFixed(4)} {loan.currency}</span>
                        </div>
                        {totalPendingAmount > 0 && (
                          <div className="flex justify-between text-yellow-600 dark:text-yellow-400 text-xs">
                            <span>Pending Approval</span>
                            <span>{totalPendingAmount.toFixed(4)} {loan.currency}</span>
                          </div>
                        )}
                      </div>

                      {/* Repayment History for this loan */}
                      {loan.repayments.length > 0 && (
                        <div className="mb-4 p-3 bg-background/50 rounded-lg border border-border">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <History className="w-3 h-3" />
                            Repayment History
                          </h5>
                          <ScrollArea className="max-h-32">
                            <div className="space-y-2">
                              {loan.repayments.map((rep) => (
                                <div key={rep.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span>{rep.amount.toFixed(2)} {loan.currency}</span>
                                    {getRepaymentStatusBadge(rep.status)}
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Date(rep.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Repayment Form */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        {/* Repayment Amount */}
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">
                            Repayment Amount ({loan.currency}):
                          </label>
                          <Input
                            type="number"
                            value={repaymentAmounts[loan.id] || ''}
                            onChange={(e) => setRepaymentAmounts(prev => ({ 
                              ...prev, 
                              [loan.id]: e.target.value 
                            }))}
                            placeholder="Enter any amount"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Partial repayment allowed. Full amount: {owed.remainingTotal.toFixed(4)} {loan.currency}
                          </p>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">
                            Payment Receipt:
                          </label>
                          <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(loan.id, e)}
                              className="hidden"
                              id={`receipt-${loan.id}`}
                            />
                            <label htmlFor={`receipt-${loan.id}`} className="cursor-pointer">
                              {receiptImages[loan.id] ? (
                                <div className="space-y-2">
                                  <img 
                                    src={receiptImages[loan.id]} 
                                    alt="Receipt preview" 
                                    className="max-h-32 mx-auto rounded-lg"
                                  />
                                  <p className="text-xs text-muted-foreground">{receiptFileNames[loan.id]}</p>
                                  <p className="text-xs text-primary">Click to change</p>
                                </div>
                              ) : (
                                <div className="py-4">
                                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">Upload payment receipt</p>
                                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleRepay(loan.id, loan.currency)}
                        >
                          Submit Repayment
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
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
    </div>
  );
};

export default LoanRepayment;
