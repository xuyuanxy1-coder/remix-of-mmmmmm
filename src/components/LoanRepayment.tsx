import { useLoan } from '@/contexts/LoanContext';
import { useAssets } from '@/contexts/AssetsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const LoanRepayment = () => {
  const { loans, repayLoan, calculateOwed } = useLoan();
  const { getBalance } = useAssets();

  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');

  const handleRepay = (loanId: string, currency: string, total: number) => {
    const balance = getBalance(currency);
    if (balance < total) {
      toast.error(`Insufficient ${currency} balance. Need ${total.toFixed(4)} ${currency}`);
      return;
    }

    const success = repayLoan(loanId);
    if (success) {
      toast.success('Loan repaid successfully!');
    } else {
      toast.error('Failed to repay loan');
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

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Loan Repayment</h3>
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
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const owed = calculateOwed(loan);
                  const balance = getBalance(loan.currency);
                  const canRepay = balance >= owed.total;

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

                      <Button
                        className="w-full"
                        variant={canRepay ? 'default' : 'outline'}
                        onClick={() => handleRepay(loan.id, loan.currency, owed.total)}
                        disabled={!canRepay}
                      >
                        {canRepay ? 'Repay Now' : `Insufficient ${loan.currency}`}
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
