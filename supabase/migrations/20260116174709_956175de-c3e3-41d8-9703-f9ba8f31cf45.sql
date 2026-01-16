-- Allow users to submit Advanced KYC after Primary is approved by permitting updates on approved-primary records
-- Replace the overly-restrictive policy that only allowed updates when status='pending'.

DO $$
BEGIN
  -- Drop old policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='kyc_records' AND policyname='Users can update own pending KYC'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update own pending KYC" ON public.kyc_records';
  END IF;
END $$;

CREATE POLICY "Users can update own KYC for submission"
ON public.kyc_records
FOR UPDATE
USING (
  auth.uid() = user_id
  AND (
    status = 'pending'::kyc_status
    OR (status = 'approved'::kyc_status AND verification_level = 'primary')
  )
);

-- Keep INSERT policy unchanged; users still can only insert their own KYC records.
-- Keep SELECT policy unchanged.