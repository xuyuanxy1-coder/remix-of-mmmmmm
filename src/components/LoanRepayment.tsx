import { useState } from 'react';
import { useLoan } from '@/contexts/LoanContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Upload, ChevronRight } from 'lucide-react';

const LoanRepayment = () => {
  const { loans, repayLoan, calculateOwed } = useLoan();
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

  const handleRepay = (loanId: string, currency: string, totalDue: number) => {
    const amount = parseFloat(repaymentAmounts[loanId] || '0');
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }

    if (amount < totalDue) {
      toast.error(`Repayment amount must be at least ${totalDue.toFixed(4)} ${currency}`);
      return;
    }

    if (!receiptImages[loanId]) {
      toast.error('Please upload a payment receipt');
      return;
    }

    // Submit repayment request
    toast.success('Repayment request submitted. Please wait for confirmation.');
    
    // Clear the form for this loan
    setRepaymentAmounts(prev => ({ ...prev, [loanId]: '' }));
    setReceiptImages(prev => ({ ...prev, [loanId]: '' }));
    setReceiptFileNames(prev => ({ ...prev, [loanId]: '' }));
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
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Repayment must be made via external wallet transfer. Account balance cannot be used for loan repayment. Please transfer funds and upload your payment receipt below.
          </p>
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

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal</span>
                          <span>{owed.principal.toLocaleString()} {loan.currency}</span>
                        </div>
                        {owed.interest > 0 && (
                          <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                            <span>Interest (1%/day)</span>
                            <span>+{owed.interest.toFixed(4)} {loan.currency}</span>
                          </div>
                        )}
                        {owed.penalty > 0 && (
                          <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Penalty (2%/day)</span>
                            <span>+{owed.penalty.toFixed(4)} {loan.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                          <span>Total Due</span>
                          <span>{owed.total.toFixed(4)} {loan.currency}</span>
                        </div>
                      </div>

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
                            placeholder={`Minimum: ${owed.total.toFixed(4)}`}
                          />
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
                          onClick={() => handleRepay(loan.id, loan.currency, owed.total)}
                        >
                          Repay Now
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
                    <span className="text-xs text-muted-foreground">Paid</span>
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
