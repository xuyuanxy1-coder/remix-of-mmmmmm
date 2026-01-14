import { useLoan } from '@/contexts/LoanContext';
import { CreditCard, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const LoanRepayment = () => {
  const { loans, calculateOwed } = useLoan();

  // Active loans are those with 'approved' or 'overdue' status
  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const paidLoans = loans.filter(l => l.status === 'repaid');

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
          <div className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
            <p>Repayment must be made via external wallet transfer. Contact admin for repayment address.</p>
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
