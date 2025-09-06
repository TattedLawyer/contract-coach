-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create billing_transactions table for tracking usage
CREATE TABLE public.billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL, -- 'contract_draft', 'contract_review', 'subscription'
    amount INTEGER NOT NULL, -- Amount in cents
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    metadata JSONB, -- Store additional info like contract type, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (true);

-- RLS Policies for billing_transactions
CREATE POLICY "Users can view their own transactions" ON public.billing_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.billing_transactions
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert transactions" ON public.billing_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update transactions" ON public.billing_transactions
    FOR UPDATE USING (true);

-- Create training-contracts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'training-contracts', 
    'training-contracts', 
    false, 
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS Policies for training-contracts
CREATE POLICY "Admins can upload training contracts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'training-contracts' 
        AND public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can view training contracts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'training-contracts' 
        AND public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can update training contracts" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'training-contracts' 
        AND public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can delete training contracts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'training-contracts' 
        AND public.has_role(auth.uid(), 'admin')
    );

-- AI functions need read access to training contracts (using service role)
CREATE POLICY "Service role can read training contracts" ON storage.objects
    FOR SELECT USING (bucket_id = 'training-contracts');

-- Create trigger for updated_at on billing_transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_transactions_updated_at
    BEFORE UPDATE ON public.billing_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();