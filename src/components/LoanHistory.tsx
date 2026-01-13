import { useLoan } from '@/contexts/LoanContext';
import { History, Shield, CheckCircle } from 'lucide-react';

const LoanHistory = () => {
  const { loanHistory } = useLoan();

  if (loanHistory.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Loan History</h3>
        </div>
        <div className="text-center py-12">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No loan history yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Completed loans will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Loan History</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {loanHistory.length} completed
        </span>
      </div>

      <div className="space-y-3">
        {loanHistory.slice().reverse().map((loan) => {
          const borrowDate = new Date(loan.borrowDate);
          const repaidDate = loan.repaidDate ? new Date(loan.repaidDate) : null;
          const daysHeld = repaidDate 
            ? Math.floor((repaidDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          const totalPaid = loan.amount + (loan.interestPaid || 0) + (loan.penaltyPaid || 0);

          return (
            <div 
              key={loan.id} 
              className="bg-muted/50 rounded-lg p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{loan.amount.toLocaleString()} {loan.currency}</span>
                  {loan.guarantorId && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3" />
                      Secured
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {daysHeld} day(s)
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Borrowed</span>
                  <span>{borrowDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Repaid</span>
                  <span>{repaidDate?.toLocaleDateString()}</span>
                </div>
                {loan.guarantorId && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Guarantor ID</span>
                    <span className="font-mono text-xs">{loan.guarantorId.slice(0, 8)}...</span>
                  </div>
                )}
                {(loan.interestPaid || 0) > 0 && (
                  <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                    <span>Interest Paid</span>
                    <span>{loan.interestPaid?.toFixed(2)} {loan.currency}</span>
                  </div>
                )}
                {(loan.penaltyPaid || 0) > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Penalty Paid</span>
                    <span>{loan.penaltyPaid?.toFixed(2)} {loan.currency}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span>Total Paid</span>
                  <span>{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} {loan.currency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoanHistory;
