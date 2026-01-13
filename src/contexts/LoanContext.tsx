import { createContext, useContext, useState, ReactNode } from 'react';
import { useAssets } from './AssetsContext';

export interface Loan {
  id: string;
  amount: number;
  currency: string;
  borrowDate: Date;
  repaidDate?: Date;
  status: 'active' | 'overdue' | 'paid';
  guarantorId?: string;
  interestPaid?: number;
  penaltyPaid?: number;
}

interface LoanContextType {
  loans: Loan[];
  applyLoan: (amount: number, currency: string, guarantorId?: string) => boolean;
  repayLoan: (loanId: string) => boolean;
  calculateOwed: (loan: Loan) => { principal: number; interest: number; penalty: number; total: number; daysElapsed: number };
  loanHistory: Loan[];
}

export const MIN_LOAN_AMOUNT = 5000;
export const MAX_LOAN_AMOUNT = 100000;

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { updateBalance, getBalance } = useAssets();

  const calculateOwed = (loan: Loan) => {
    const now = new Date();
    const borrowDate = new Date(loan.borrowDate);
    const daysElapsed = Math.floor((now.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const principal = loan.amount;
    let interest = 0;
    let penalty = 0;

    if (daysElapsed > 15) {
      // 超过15天：7天后的利息 + 超过15天的违约金
      interest = principal * 0.01 * (15 - 7); // 第8-15天的利息
      penalty = principal * 0.02 * (daysElapsed - 15); // 超过15天每天2%违约金
    } else if (daysElapsed > 7) {
      // 8-15天：每天1%利息
      interest = principal * 0.01 * (daysElapsed - 7);
    }
    // 7天内免息

    return {
      principal,
      interest,
      penalty,
      total: principal + interest + penalty,
      daysElapsed
    };
  };

  const applyLoan = (amount: number, currency: string, guarantorId?: string): boolean => {
    if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) return false;
    
    const newLoan: Loan = {
      id: Date.now().toString(),
      amount,
      currency,
      borrowDate: new Date(),
      status: 'active',
      guarantorId: guarantorId || undefined
    };

    setLoans(prev => [...prev, newLoan]);
    updateBalance(currency, amount);
    return true;
  };

  const repayLoan = (loanId: string): boolean => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return false;

    const { total, interest, penalty } = calculateOwed(loan);
    const balance = getBalance(loan.currency);

    if (balance < total) return false;

    updateBalance(loan.currency, -total);
    setLoans(prev => prev.map(l => 
      l.id === loanId 
        ? { 
            ...l, 
            status: 'paid' as const, 
            repaidDate: new Date(),
            interestPaid: interest,
            penaltyPaid: penalty
          } 
        : l
    ));
    return true;
  };

  const loanHistory = loans.filter(l => l.status === 'paid');

  return (
    <LoanContext.Provider value={{ loans, applyLoan, repayLoan, calculateOwed, loanHistory }}>
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
