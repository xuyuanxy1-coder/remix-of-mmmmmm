
-- =============================================
-- 1. 用户角色枚举和角色表（安全关键）
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 安全函数：检查用户角色（避免 RLS 递归）
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 用户只能查看自己的角色
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- 2. 用户资料表
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    is_frozen BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 用户可以插入自己的资料
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 管理员可以更新所有用户
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. 用户资产表
-- =============================================
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    frozen_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, currency)
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
ON public.assets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
ON public.assets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
ON public.assets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assets"
ON public.assets FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. 交易记录表
-- =============================================
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdraw', 'trade', 'loan', 'repayment', 'transfer');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    currency TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status transaction_status NOT NULL DEFAULT 'pending',
    tx_hash TEXT,
    from_address TEXT,
    to_address TEXT,
    network TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions"
ON public.transactions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. 贷款申请表
-- =============================================
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'rejected', 'repaid', 'overdue');

CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    term_days INTEGER NOT NULL DEFAULT 30,
    collateral_amount DECIMAL(20, 8),
    collateral_currency TEXT,
    status loan_status NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    repaid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
ON public.loans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
ON public.loans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all loans"
ON public.loans FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 6. KYC 认证表
-- =============================================
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    real_name TEXT NOT NULL,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    front_image_url TEXT,
    back_image_url TEXT,
    selfie_url TEXT,
    status kyc_status NOT NULL DEFAULT 'pending',
    reject_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
ON public.kyc_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC"
ON public.kyc_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC"
ON public.kyc_records FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all KYC"
ON public.kyc_records FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. 系统配置表（充值地址等）
-- =============================================
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取配置
CREATE POLICY "Anyone can view config"
ON public.system_config FOR SELECT
USING (true);

-- 只有管理员可以修改
CREATE POLICY "Admins can manage config"
ON public.system_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 插入默认充值地址
INSERT INTO public.system_config (key, value, description) VALUES
('deposit_address_eth', '0x0000000000000000000000000000000000000000', 'ETH 充值地址'),
('deposit_address_bsc', '0x0000000000000000000000000000000000000000', 'BSC 充值地址'),
('deposit_address_trc', 'T0000000000000000000000000000000000', 'TRC20 充值地址');

-- =============================================
-- 8. 自动创建用户资料的触发器
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 创建用户资料
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'username');
  
  -- 分配默认角色
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- 创建默认资产账户
  INSERT INTO public.assets (user_id, currency, balance) VALUES
  (NEW.id, 'USDT', 0),
  (NEW.id, 'BTC', 0),
  (NEW.id, 'ETH', 0);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. 更新时间戳触发器
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_kyc_records_updated_at BEFORE UPDATE ON public.kyc_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
