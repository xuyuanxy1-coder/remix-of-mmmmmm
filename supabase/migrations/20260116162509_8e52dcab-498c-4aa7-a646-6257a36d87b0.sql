-- Add verification_level to kyc_records
ALTER TABLE public.kyc_records 
ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'basic';

-- Create mining_investments table
CREATE TABLE public.mining_investments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  tier integer NOT NULL CHECK (tier IN (1, 2, 3)),
  daily_rate numeric NOT NULL,
  lock_days integer NOT NULL,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected', 'settled')),
  total_earnings numeric DEFAULT 0,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mining_investments ENABLE ROW LEVEL SECURITY;

-- RLS policies for mining_investments
CREATE POLICY "Users can view own mining investments"
  ON public.mining_investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mining investments"
  ON public.mining_investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all mining investments"
  ON public.mining_investments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate total deposits for a user
CREATE OR REPLACE FUNCTION public.get_user_total_deposits(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.transactions
  WHERE user_id = p_user_id 
    AND type = 'deposit' 
    AND status = 'completed';
$$;

-- Function to settle completed mining investments
CREATE OR REPLACE FUNCTION public.settle_mining_investment(p_investment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investment RECORD;
  v_earnings numeric;
BEGIN
  -- Get investment details
  SELECT * INTO v_investment
  FROM public.mining_investments
  WHERE id = p_investment_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if investment has matured
  IF v_investment.end_date > now() THEN
    RETURN false;
  END IF;
  
  -- Calculate total earnings
  v_earnings := v_investment.amount * (v_investment.daily_rate / 100) * v_investment.lock_days;
  
  -- Update investment status
  UPDATE public.mining_investments
  SET status = 'settled', total_earnings = v_earnings, updated_at = now()
  WHERE id = p_investment_id;
  
  -- Add principal + earnings to user's USDT balance
  UPDATE public.assets
  SET balance = balance + v_investment.amount + v_earnings, updated_at = now()
  WHERE user_id = v_investment.user_id AND currency = 'USDT';
  
  -- If no USDT asset exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.assets (user_id, currency, balance)
    VALUES (v_investment.user_id, 'USDT', v_investment.amount + v_earnings);
  END IF;
  
  RETURN true;
END;
$$;