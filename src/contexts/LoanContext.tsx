import { createContext, useContext, useState, ReactNode } from 'react';
import { api, LoanApplicationRequest, RepaymentRequest, ApplicationResponse } from '@/lib/api';

export interface RepaymentRecord {
  id: string;
  loanId: string;
  amount: number;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  appliedToInterest: number;
  appliedToPenalty: number;
  appliedToPrincipal: number;
}

export interface Loan {
  id: string;
  amount: number;
  currency: string;
  borrowDate: Date;
  repaidDate?: Date;
  status: 'active' | 'overdue' | 'paid';
  guarantorId?: string;
  interestPaid: number;
  penaltyPaid: number;
  principalPaid: number;
  repayments: RepaymentRecord[];
}

interface LoanContextType {
  loans: Loan[];
  applyLoan: (amount: number, currency: string, guarantorId?: string) => Promise<boolean>;
  submitRepayment: (loanId: string, amount: number, receiptImage: string) => Promise<boolean>;
  approveRepayment: (loanId: string, repaymentId: string) => boolean;
  rejectRepayment: (loanId: string, repaymentId: string) => boolean;
  calculateOwed: (loan: Loan) => { principal: number; interest: number; penalty: number; total: number; daysElapsed: number; remainingPrincipal: number; remainingInterest: number; remainingPenalty: number; remainingTotal: number };
  loanHistory: Loan[];
  pendingRepayments: RepaymentRecord[];
  refreshLoans: () => Promise<void>;
}

export const MIN_LOAN_AMOUNT = 5000;
export const MAX_LOAN_AMOUNT = 100000;

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  const [loans, setLoans] = useState<Loan[]>([]);

  const refreshLoans = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      const response = await api.get<{ loans: Loan[] }>('/loans');
      if (response.loans) {
        setLoans(response.loans.map(l => ({
          ...l,
          borrowDate: new Date(l.borrowDate),
          repaidDate: l.repaidDate ? new Date(l.repaidDate) : undefined,
          repayments: l.repayments?.map(r => ({
            ...r,
            submittedAt: new Date(r.submittedAt),
            reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
          })) || [],
        })));
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  };

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

    // Calculate remaining amounts after approved repayments
    const remainingPenalty = Math.max(0, penalty - loan.penaltyPaid);
    const remainingInterest = Math.max(0, interest - loan.interestPaid);
    const remainingPrincipal = Math.max(0, principal - loan.principalPaid);
    const remainingTotal = remainingPrincipal + remainingInterest + remainingPenalty;

    return {
      principal,
      interest,
      penalty,
      total: principal + interest + penalty,
      daysElapsed,
      remainingPrincipal,
      remainingInterest,
      remainingPenalty,
      remainingTotal
    };
  };

  const applyLoan = async (amount: number, currency: string, guarantorId?: string): Promise<boolean> => {
    if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) return false;
    
    try {
      const request: LoanApplicationRequest = { amount };
      await api.post<ApplicationResponse>('/applications/loan', request);
      
      // Add to local state (pending loan)
      const newLoan: Loan = {
        id: Date.now().toString(),
        amount,
        currency,
        borrowDate: new Date(),
        status: 'active',
        guarantorId: guarantorId || undefined,
        interestPaid: 0,
        penaltyPaid: 0,
        principalPaid: 0,
        repayments: []
      };

      setLoans(prev => [...prev, newLoan]);
      return true;
    } catch (error) {
      console.error('Loan application failed:', error);
      return false;
    }
  };

  const submitRepayment = async (loanId: string, amount: number, receiptImage: string): Promise<boolean> => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.status === 'paid') return false;

    try {
      const request: RepaymentRequest = {
        amount,
        loanId,
        receiptImage,
      };
      await api.post<ApplicationResponse>('/applications/repayment', request);

      const repayment: RepaymentRecord = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loanId,
        amount,
        receiptImage,
        status: 'pending',
        submittedAt: new Date(),
        appliedToInterest: 0,
        appliedToPenalty: 0,
        appliedToPrincipal: 0
      };

      setLoans(prev => prev.map(l => 
        l.id === loanId 
          ? { ...l, repayments: [...l.repayments, repayment] }
          : l
      ));

      return true;
    } catch (error) {
      console.error('Repayment submission failed:', error);
      return false;
    }
  };

  const approveRepayment = (loanId: string, repaymentId: string): boolean => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return false;

    const repayment = loan.repayments.find(r => r.id === repaymentId);
    if (!repayment || repayment.status !== 'pending') return false;

    // Calculate current owed amounts
    const owed = calculateOwed(loan);
    let remainingPayment = repayment.amount;

    // Priority: Penalty → Interest → Principal
    let appliedToPenalty = 0;
    let appliedToInterest = 0;
    let appliedToPrincipal = 0;

    // 1. Apply to penalty first
    if (remainingPayment > 0 && owed.remainingPenalty > 0) {
      appliedToPenalty = Math.min(remainingPayment, owed.remainingPenalty);
      remainingPayment -= appliedToPenalty;
    }

    // 2. Apply to interest
    if (remainingPayment > 0 && owed.remainingInterest > 0) {
      appliedToInterest = Math.min(remainingPayment, owed.remainingInterest);
      remainingPayment -= appliedToInterest;
    }

    // 3. Apply to principal
    if (remainingPayment > 0 && owed.remainingPrincipal > 0) {
      appliedToPrincipal = Math.min(remainingPayment, owed.remainingPrincipal);
      remainingPayment -= appliedToPrincipal;
    }

    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;

      const newPenaltyPaid = l.penaltyPaid + appliedToPenalty;
      const newInterestPaid = l.interestPaid + appliedToInterest;
      const newPrincipalPaid = l.principalPaid + appliedToPrincipal;

      // Check if fully paid
      const updatedOwed = calculateOwed({
        ...l,
        penaltyPaid: newPenaltyPaid,
        interestPaid: newInterestPaid,
        principalPaid: newPrincipalPaid
      });

      const isFullyPaid = updatedOwed.remainingTotal <= 0;

      return {
        ...l,
        penaltyPaid: newPenaltyPaid,
        interestPaid: newInterestPaid,
        principalPaid: newPrincipalPaid,
        status: isFullyPaid ? 'paid' as const : l.status,
        repaidDate: isFullyPaid ? new Date() : l.repaidDate,
        repayments: l.repayments.map(r => 
          r.id === repaymentId 
            ? {
                ...r,
                status: 'approved' as const,
                reviewedAt: new Date(),
                appliedToPenalty,
                appliedToInterest,
                appliedToPrincipal
              }
            : r
        )
      };
    }));

    return true;
  };

  const rejectRepayment = (loanId: string, repaymentId: string): boolean => {
    setLoans(prev => prev.map(l => 
      l.id === loanId 
        ? {
            ...l,
            repayments: l.repayments.map(r => 
              r.id === repaymentId 
                ? { ...r, status: 'rejected' as const, reviewedAt: new Date() }
                : r
            )
          }
        : l
    ));
    return true;
  };

  const loanHistory = loans.filter(l => l.status === 'paid');
  const pendingRepayments = loans.flatMap(l => 
    l.repayments.filter(r => r.status === 'pending')
  );

  return (
    <LoanContext.Provider value={{ 
      loans, 
      applyLoan, 
      submitRepayment, 
      approveRepayment,
      rejectRepayment,
      calculateOwed, 
      loanHistory,
      pendingRepayments,
      refreshLoans
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
