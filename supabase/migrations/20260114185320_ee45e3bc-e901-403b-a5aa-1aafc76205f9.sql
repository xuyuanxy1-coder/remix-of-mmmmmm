-- Create a function for admin to safely update user balance
CREATE OR REPLACE FUNCTION public.admin_add_balance(
  _user_id uuid,
  _currency text,
  _amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;
  
  -- Update balance and return new value
  UPDATE assets 
  SET balance = balance + _amount
  WHERE user_id = _user_id AND currency = _currency
  RETURNING balance INTO new_balance;
  
  RETURN new_balance;
END;
$$;