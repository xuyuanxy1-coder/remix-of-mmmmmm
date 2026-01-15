import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Loan {
  id: string;
  amount: number;
  currency: string;
  borrowDate: Date;
  repaidDate?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'repaid' | 'overdue';
  interestRate: number;
  termDays: number;
  dueDate?: Date;
  totalRepaid: number; // Track total approved repayments
}

interface LoanContextType {
  loans: Loan[];
  applyLoan: (amount: number, currency?: string) => Promise<boolean>;
  calculateOwed: (loan: Loan) => { 
    principal: number; 
    interest: number; 
    penalty: number; 
    total: number; 
    daysElapsed: number;
  };
  activeLoans: Loan[];
  loanHistory: Loan[];
  refreshLoans: () => Promise<void>;
  isLoading: boolean;
}

export const MIN_LOAN_AMOUNT = 5000;
export const MAX_LOAN_AMOUNT = 100000;

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshLoans = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoans([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch loans
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch loans:', error);
        return;
      }

      if (data) {
        // Fetch all approved repayments for these loans
        const loanIds = data.map(l => l.id);
        const { data: repayments } = await supabase
          .from('loan_repayments')
          .select('loan_id, amount')
          .in('loan_id', loanIds)
          .eq('status', 'approved');

        // Calculate total repaid per loan
        const repaidByLoan: Record<string, number> = {};
        repayments?.forEach(r => {
          repaidByLoan[r.loan_id] = (repaidByLoan[r.loan_id] || 0) + Number(r.amount);
        });

        setLoans(data.map(l => ({
          id: l.id,
          amount: Number(l.amount),
          currency: l.currency,
          borrowDate: new Date(l.created_at),
          repaidDate: l.repaid_at ? new Date(l.repaid_at) : undefined,
          status: l.status as Loan['status'],
          interestRate: Number(l.interest_rate),
          termDays: l.term_days,
          dueDate: l.due_date ? new Date(l.due_date) : undefined,
          totalRepaid: repaidByLoan[l.id] || 0,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshLoans();
  }, [refreshLoans]);

  const calculateOwed = (loan: Loan) => {
    const now = new Date();
    const borrowDate = new Date(loan.borrowDate);
    const daysElapsed = Math.floor((now.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const originalPrincipal = loan.amount;
    let interest = 0;
    let penalty = 0;

    if (daysElapsed > 15) {
      // Over 15 days: interest for days 8-15 + penalty for days after 15
      interest = originalPrincipal * 0.01 * (15 - 7); // Days 8-15 at 1% per day
      penalty = originalPrincipal * 0.02 * (daysElapsed - 15); // After day 15 at 2% per day
    } else if (daysElapsed > 7) {
      // 8-15 days: 1% per day interest
      interest = originalPrincipal * 0.01 * (daysElapsed - 7);
    }
    // First 7 days: no interest

    // Calculate total owed before any repayments
    const totalOwedBeforeRepayment = originalPrincipal + interest + penalty;
    
    // Apply repayments: priority is penalty -> interest -> principal
    let remainingRepaid = loan.totalRepaid || 0;
    
    let remainingPenalty = penalty;
    let remainingInterest = interest;
    let remainingPrincipal = originalPrincipal;

    // First, apply to penalty
    if (remainingRepaid > 0 && remainingPenalty > 0) {
      const penaltyPayment = Math.min(remainingRepaid, remainingPenalty);
      remainingPenalty -= penaltyPayment;
      remainingRepaid -= penaltyPayment;
    }

    // Then, apply to interest
    if (remainingRepaid > 0 && remainingInterest > 0) {
      const interestPayment = Math.min(remainingRepaid, remainingInterest);
      remainingInterest -= interestPayment;
      remainingRepaid -= interestPayment;
    }

    // Finally, apply to principal
    if (remainingRepaid > 0 && remainingPrincipal > 0) {
      const principalPayment = Math.min(remainingRepaid, remainingPrincipal);
      remainingPrincipal -= principalPayment;
      remainingRepaid -= principalPayment;
    }

    return {
      principal: Math.max(0, remainingPrincipal),
      interest: Math.max(0, remainingInterest),
      penalty: Math.max(0, remainingPenalty),
      total: Math.max(0, remainingPrincipal + remainingInterest + remainingPenalty),
      daysElapsed,
    };
  };

  const applyLoan = async (amount: number, currency: string = 'USDT'): Promise<boolean> => {
    if (!user) return false;
    if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) return false;

    try {
      const { error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          amount,
          currency,
          interest_rate: 5.00,
          term_days: 30,
          status: 'pending',
        });

      if (error) {
        console.error('Loan application failed:', error);
        return false;
      }

      await refreshLoans();
      return true;
    } catch (error) {
      console.error('Loan application failed:', error);
      return false;
    }
  };

  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const loanHistory = loans.filter(l => l.status === 'repaid' || l.status === 'rejected');

  return (
    <LoanContext.Provider value={{ 
      loans, 
      applyLoan, 
      calculateOwed, 
      activeLoans,
      loanHistory,
      refreshLoans,
      isLoading,
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoan = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};
