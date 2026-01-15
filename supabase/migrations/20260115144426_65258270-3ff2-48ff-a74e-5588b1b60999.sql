-- Create loan repayments table to track user repayment submissions
CREATE TABLE public.loan_repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  repayment_type TEXT NOT NULL DEFAULT 'partial', -- 'partial', 'early_full', 'full'
  receipt_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT
);

-- Enable RLS
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- Users can view their own repayments
CREATE POLICY "Users can view own repayments"
ON public.loan_repayments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own repayments
CREATE POLICY "Users can insert own repayments"
ON public.loan_repayments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all repayments
CREATE POLICY "Admins can manage all repayments"
ON public.loan_repayments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));