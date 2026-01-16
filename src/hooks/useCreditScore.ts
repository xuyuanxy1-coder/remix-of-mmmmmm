import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreditScoreLog {
  id: string;
  previous_score: number;
  new_score: number;
  change_amount: number;
  reason: string;
  created_at: string;
}

interface UseCreditScoreReturn {
  creditScore: number;
  isLoading: boolean;
  logs: CreditScoreLog[];
  canWithdraw: boolean;
  refreshScore: () => Promise<void>;
  checkWithdrawalLimit: () => Promise<boolean>;
  checkTradeLimit: () => Promise<boolean>;
  recordWithdrawalAttempt: () => Promise<void>;
  recordTradeAttempt: () => Promise<void>;
  deductScoreForOverdueLoan: (loanId: string, daysOverdue: number) => Promise<void>;
}

export const useCreditScore = (): UseCreditScoreReturn => {
  const [creditScore, setCreditScore] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<CreditScoreLog[]>([]);
  const { user } = useAuth();

  const refreshScore = useCallback(async () => {
    if (!user?.id) {
      setCreditScore(100);
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch current credit score from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('credit_score')
        .eq('user_id', user.id)
        .single();

      setCreditScore(profile?.credit_score ?? 100);

      // Fetch credit score logs
      const { data: logsData } = await supabase
        .from('credit_score_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs((logsData as CreditScoreLog[]) || []);
    } catch (error) {
      console.error('Error fetching credit score:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  const canWithdraw = creditScore >= 100;

  // Check if user has attempted to withdraw 3+ times in the last hour
  const checkWithdrawalLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return true;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('withdrawal_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if ((count || 0) >= 3) {
      // Deduct credit score
      await deductScore(10, 'Attempted to withdraw 3+ times within an hour');
      return false;
    }

    return true;
  }, [user?.id]);

  // Check if user has traded 3+ times in the last hour
  const checkTradeLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return true;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('trade_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if ((count || 0) >= 3) {
      // Deduct credit score
      await deductScore(10, 'Traded 3+ times within an hour');
      return false;
    }

    return true;
  }, [user?.id]);

  const recordWithdrawalAttempt = useCallback(async () => {
    if (!user?.id) return;

    await supabase.from('withdrawal_attempts').insert({
      user_id: user.id,
    });
  }, [user?.id]);

  const recordTradeAttempt = useCallback(async () => {
    if (!user?.id) return;

    await supabase.from('trade_attempts').insert({
      user_id: user.id,
    });
  }, [user?.id]);

  const deductScore = async (amount: number, reason: string) => {
    if (!user?.id) return;

    try {
      // Get current score
      const { data: profile } = await supabase
        .from('profiles')
        .select('credit_score')
        .eq('user_id', user.id)
        .single();

      const currentScore = profile?.credit_score ?? 100;
      const newScore = Math.max(0, currentScore - amount);

      // Update profile
      await supabase
        .from('profiles')
        .update({ credit_score: newScore })
        .eq('user_id', user.id);

      // Log the change
      await supabase.from('credit_score_logs').insert({
        user_id: user.id,
        previous_score: currentScore,
        new_score: newScore,
        change_amount: -amount,
        reason,
      });

      setCreditScore(newScore);
    } catch (error) {
      console.error('Error deducting credit score:', error);
    }
  };

  const deductScoreForOverdueLoan = useCallback(async (loanId: string, daysOverdue: number) => {
    if (!user?.id || daysOverdue <= 0) return;

    // Check if we already deducted for this loan today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingLog } = await supabase
      .from('credit_score_logs')
      .select('id')
      .eq('user_id', user.id)
      .ilike('reason', `%Loan ${loanId}%overdue%`)
      .gte('created_at', today)
      .maybeSingle();

    if (existingLog) {
      // Already deducted today
      return;
    }

    // Deduct 2 points per day overdue after day 15
    const deduction = 2 * daysOverdue;
    await deductScore(deduction, `Loan ${loanId.slice(0, 8)} is ${daysOverdue} days overdue (after day 15)`);
  }, [user?.id]);

  return {
    creditScore,
    isLoading,
    logs,
    canWithdraw,
    refreshScore,
    checkWithdrawalLimit,
    checkTradeLimit,
    recordWithdrawalAttempt,
    recordTradeAttempt,
    deductScoreForOverdueLoan,
  };
};
