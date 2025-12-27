-- Enable RLS on contract_files if not already enabled
ALTER TABLE public.contract_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view files for contracts they own
DROP POLICY IF EXISTS "Users can view own contract files" ON public.contract_files;
CREATE POLICY "Users can view own contract files" ON public.contract_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_files.contract_id 
    AND vendor_id = auth.uid()
  ));

-- Policy: Users can insert files for contracts they own
DROP POLICY IF EXISTS "Users can insert own contract files" ON public.contract_files;
CREATE POLICY "Users can insert own contract files" ON public.contract_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));

-- Policy: Users can update files for contracts they own
DROP POLICY IF EXISTS "Users can update own contract files" ON public.contract_files;
CREATE POLICY "Users can update own contract files" ON public.contract_files FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));

-- Policy: Users can delete files for contracts they own
DROP POLICY IF EXISTS "Users can delete own contract files" ON public.contract_files;
CREATE POLICY "Users can delete own contract files" ON public.contract_files FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));
