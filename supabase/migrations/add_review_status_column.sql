-- Add review_status column to contracts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'review_status'
    ) THEN
        ALTER TABLE public.contracts 
        ADD COLUMN review_status text DEFAULT 'not_started' CHECK (review_status IN ('not_started', 'in_progress', 'completed'));
    END IF;
END $$;
