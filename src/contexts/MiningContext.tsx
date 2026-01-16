import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MiningInvestment {
  id: string;
  userId: string;
  amount: number;
  tier: 1 | 2 | 3;
  dailyRate: number;
  lockDays: number;
  startDate: Date | null;
  endDate: Date | null;
  status: 'pending' | 'active' | 'completed' | 'rejected' | 'settled';
  totalEarnings: number;
  adminNote?: string;
  createdAt: Date;
}

export const MINING_TIERS = [
  { tier: 1, lockDays: 15, dailyRate: 1, minAmount: 3000, label: '15 Days Lock' },
  { tier: 2, lockDays: 30, dailyRate: 1.5, minAmount: 7000, label: '30 Days Lock' },
  { tier: 3, lockDays: 60, dailyRate: 2, minAmount: 10000, label: '60 Days Lock' },
] as const;

interface MiningContextType {
  investments: MiningInvestment[];
  totalMiningAmount: number;
  pendingEarnings: number;
  totalDeposits: number;
  isEligible: boolean;
  isLoading: boolean;
  refreshInvestments: () => Promise<void>;
  submitMiningApplication: (amount: number, tier: 1 | 2 | 3) => Promise<boolean>;
  getActiveInvestments: () => MiningInvestment[];
  getPendingInvestments: () => MiningInvestment[];
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export const MiningProvider = ({ children }: { children: ReactNode }) => {
  const [investments, setInvestments] = useState<MiningInvestment[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshInvestments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setInvestments([]);
      setTotalDeposits(0);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch mining investments
      const { data: investmentData, error: investmentError } = await supabase
        .from('mining_investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (investmentError) {
        console.error('Failed to fetch mining investments:', investmentError);
      } else if (investmentData) {
        setInvestments(investmentData.map(inv => ({
          id: inv.id,
          userId: inv.user_id,
          amount: Number(inv.amount),
          tier: inv.tier as 1 | 2 | 3,
          dailyRate: Number(inv.daily_rate),
          lockDays: inv.lock_days,
          startDate: inv.start_date ? new Date(inv.start_date) : null,
          endDate: inv.end_date ? new Date(inv.end_date) : null,
          status: inv.status as MiningInvestment['status'],
          totalEarnings: Number(inv.total_earnings) || 0,
          adminNote: inv.admin_note || undefined,
          createdAt: new Date(inv.created_at),
        })));
      }

      // Fetch total deposits using RPC
      const { data: depositsData, error: depositsError } = await supabase
        .rpc('get_user_total_deposits', { p_user_id: user.id });

      if (depositsError) {
        console.error('Failed to fetch total deposits:', depositsError);
      } else {
        setTotalDeposits(Number(depositsData) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch mining data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshInvestments();
  }, [refreshInvestments]);

  const submitMiningApplication = async (amount: number, tier: 1 | 2 | 3): Promise<boolean> => {
    if (!user) return false;

    const tierConfig = MINING_TIERS.find(t => t.tier === tier);
    if (!tierConfig) return false;

    try {
      const { error } = await supabase
        .from('mining_investments')
        .insert({
          user_id: user.id,
          amount,
          tier,
          daily_rate: tierConfig.dailyRate,
          lock_days: tierConfig.lockDays,
          status: 'pending',
        });

      if (error) {
        console.error('Mining application failed:', error);
        return false;
      }

      await refreshInvestments();
      return true;
    } catch (error) {
      console.error('Mining application failed:', error);
      return false;
    }
  };

  const getActiveInvestments = () => investments.filter(inv => inv.status === 'active');
  const getPendingInvestments = () => investments.filter(inv => inv.status === 'pending');

  // Calculate total amount locked in mining (active investments)
  const totalMiningAmount = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Calculate pending earnings for active investments
  const pendingEarnings = investments
    .filter(inv => inv.status === 'active' && inv.startDate)
    .reduce((sum, inv) => {
      if (!inv.startDate) return sum;
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - inv.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const actualDays = Math.min(daysElapsed, inv.lockDays);
      return sum + (inv.amount * (inv.dailyRate / 100) * actualDays);
    }, 0);

  // User is eligible if total deposits > 5000 USDT
  const isEligible = totalDeposits >= 5000;

  return (
    <MiningContext.Provider value={{
      investments,
      totalMiningAmount,
      pendingEarnings,
      totalDeposits,
      isEligible,
      isLoading,
      refreshInvestments,
      submitMiningApplication,
      getActiveInvestments,
      getPendingInvestments,
    }}>
      {children}
    </MiningContext.Provider>
  );
};

export const useMining = () => {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMining must be used within a MiningProvider');
  }
  return context;
};
