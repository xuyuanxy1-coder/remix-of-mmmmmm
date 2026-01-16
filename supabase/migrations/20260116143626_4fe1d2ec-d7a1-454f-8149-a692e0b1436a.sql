-- Add credit_score column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credit_score integer NOT NULL DEFAULT 100;

-- Create credit_score_logs table to track credit score changes
CREATE TABLE IF NOT EXISTS public.credit_score_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  previous_score integer NOT NULL,
  new_score integer NOT NULL,
  change_amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_score_logs
ALTER TABLE public.credit_score_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit score logs
CREATE POLICY "Users can view own credit score logs"
ON public.credit_score_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all credit score logs
CREATE POLICY "Admins can manage all credit score logs"
ON public.credit_score_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own credit score logs (for automatic deductions)
CREATE POLICY "Users can insert own credit score logs"
ON public.credit_score_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create withdrawal_attempts table to track withdrawal frequency
CREATE TABLE IF NOT EXISTS public.withdrawal_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on withdrawal_attempts
ALTER TABLE public.withdrawal_attempts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own withdrawal attempts
CREATE POLICY "Users can manage own withdrawal attempts"
ON public.withdrawal_attempts
FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all withdrawal attempts
CREATE POLICY "Admins can manage all withdrawal attempts"
ON public.withdrawal_attempts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trade_attempts table to track trade frequency
CREATE TABLE IF NOT EXISTS public.trade_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on trade_attempts
ALTER TABLE public.trade_attempts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own trade attempts
CREATE POLICY "Users can manage own trade attempts"
ON public.trade_attempts
FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all trade attempts
CREATE POLICY "Admins can manage all trade attempts"
ON public.trade_attempts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));