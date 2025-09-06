-- Create RLS policies for training-contracts storage bucket

-- Allow admins to upload training contracts
CREATE POLICY "Admins can upload training contracts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'training-contracts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to view all training contracts
CREATE POLICY "Admins can view all training contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'training-contracts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update training contracts
CREATE POLICY "Admins can update training contracts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'training-contracts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete training contracts
CREATE POLICY "Admins can delete training contracts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'training-contracts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create a table to track training contract metadata
CREATE TABLE public.training_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  contract_type TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on training_contracts table
ALTER TABLE public.training_contracts ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage training contract metadata
CREATE POLICY "Admins can view all training contracts metadata"
ON public.training_contracts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert training contracts metadata"
ON public.training_contracts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update training contracts metadata"
ON public.training_contracts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete training contracts metadata"
ON public.training_contracts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_training_contracts_updated_at
BEFORE UPDATE ON public.training_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();