-- ============================================================================
-- ENTERPRISE MULTI-DOCUMENT CONTRACT PARSER - DATABASE MIGRATION
-- Version: 2.0
-- Purpose: Support multiple documents per contract with AI extraction,
--          human review, conflict resolution, and team-specific insights
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UPDATE CONTRACTS TABLE - Add Multi-Document Support
-- ============================================================================

-- Add multi-document tracking fields
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS document_count integer DEFAULT 0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS total_pages integer DEFAULT 0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'draft';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS approval_notes text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS estimated_annual_value numeric(12,2);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS potential_savings numeric(12,2);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS rebate_capture_rate numeric(5,2);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS requires_clinical_review boolean DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS requires_finance_review boolean DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS requires_supply_chain_review boolean DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS last_parsed_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS parsing_errors jsonb;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS extraction_confidence numeric(3,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_parsing_status ON public.contracts(parsing_status);
CREATE INDEX IF NOT EXISTS idx_contracts_review_status ON public.contracts(review_status);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON public.contracts(vendor_id);

-- ============================================================================
-- 2. UPDATE CONTRACT_FILES TABLE - Enhanced Document Tracking
-- ============================================================================

-- Add comprehensive document metadata
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS document_subtype text;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS supersedes_file_id uuid REFERENCES public.contract_files(id);
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'pending';
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS parsing_started_at timestamptz;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS parsing_completed_at timestamptz;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS parsing_duration_ms integer;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS extracted_data jsonb;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS extraction_confidence numeric(3,2);
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS extraction_errors jsonb;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending';
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS review_notes text;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS page_count integer;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS file_hash text;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS ocr_required boolean DEFAULT false;
ALTER TABLE public.contract_files ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_files_contract ON public.contract_files(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_files_type ON public.contract_files(document_type);
CREATE INDEX IF NOT EXISTS idx_contract_files_status ON public.contract_files(parsing_status);
CREATE INDEX IF NOT EXISTS idx_contract_files_hash ON public.contract_files(file_hash);

-- ============================================================================
-- 3. CREATE EXTRACTED_FIELDS TABLE - Field-Level Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.extracted_fields (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  source_file_id uuid REFERENCES public.contract_files(id) ON DELETE CASCADE,
  
  -- Field identification
  field_category text NOT NULL, -- 'financial', 'product', 'terms', 'compliance', 'dates'
  field_name text NOT NULL, -- 'rebate_percentage', 'tier_1_threshold', etc.
  field_path text, -- JSON path for nested data
  field_label text, -- Human-readable label
  
  -- Extracted value (support multiple types)
  value_text text,
  value_numeric numeric(15,4),
  value_date date,
  value_boolean boolean,
  value_json jsonb,
  
  -- Source information
  source_page integer,
  source_section text,
  source_quote text, -- Exact text from document
  
  -- AI metadata
  extraction_method text DEFAULT 'ai', -- 'ai', 'manual', 'calculated', 'imported'
  confidence_score numeric(3,2),
  ai_reasoning text, -- Why AI extracted this value
  ai_model text DEFAULT 'gemini-2.0-flash',
  
  -- Human review
  review_status text DEFAULT 'pending', -- pending, approved, rejected, modified
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  original_value jsonb, -- Before human modification
  review_notes text,
  
  -- Conflict tracking
  has_conflict boolean DEFAULT false,
  conflicting_field_ids uuid[], -- Other fields with different values
  conflict_resolution text, -- How conflict was resolved
  conflict_resolved_by uuid REFERENCES public.profiles(id),
  conflict_resolved_at timestamptz,
  
  -- Metadata
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0, -- Higher priority fields shown first
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contract fields" ON public.extracted_fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = extracted_fields.contract_id 
    AND vendor_id = auth.uid()
  ));

CREATE POLICY "Users can insert own contract fields" ON public.extracted_fields FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));

CREATE POLICY "Users can update own contract fields" ON public.extracted_fields FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_extracted_fields_contract ON public.extracted_fields(contract_id);
CREATE INDEX idx_extracted_fields_category ON public.extracted_fields(field_category);
CREATE INDEX idx_extracted_fields_name ON public.extracted_fields(field_name);
CREATE INDEX idx_extracted_fields_review ON public.extracted_fields(review_status);
CREATE INDEX idx_extracted_fields_conflict ON public.extracted_fields(has_conflict) WHERE has_conflict = true;
CREATE INDEX idx_extracted_fields_active ON public.extracted_fields(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. CREATE CONTRACT_INSIGHTS TABLE - Actionable Intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_insights (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight details
  insight_type text NOT NULL, -- 'cost_saving', 'risk', 'opportunity', 'deadline', 'compliance', 'optimization'
  severity text NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
  target_team text NOT NULL, -- 'clinical', 'finance', 'supply_chain', 'compliance', 'all'
  
  title text NOT NULL,
  description text NOT NULL,
  recommendation text,
  action_items text[], -- List of suggested actions
  
  -- Financial impact
  estimated_impact numeric(12,2),
  impact_type text, -- 'savings', 'cost', 'revenue', 'risk', 'efficiency'
  impact_timeframe text, -- 'immediate', 'quarterly', 'annual', 'long_term'
  
  -- Source attribution
  source_field_ids uuid[], -- Links to extracted_fields
  source_file_ids uuid[], -- Links to contract_files
  ai_generated boolean DEFAULT true,
  ai_confidence numeric(3,2),
  
  -- Action tracking
  status text DEFAULT 'new', -- new, acknowledged, in_progress, resolved, dismissed
  assigned_to uuid REFERENCES public.profiles(id),
  assigned_at timestamptz,
  due_date date,
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.contract_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contract insights" ON public.contract_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_insights.contract_id 
    AND vendor_id = auth.uid()
  ));

CREATE POLICY "Users can update own contract insights" ON public.contract_insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = contract_id 
    AND vendor_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_insights_contract ON public.contract_insights(contract_id);
CREATE INDEX idx_insights_team ON public.contract_insights(target_team);
CREATE INDEX idx_insights_status ON public.contract_insights(status);
CREATE INDEX idx_insights_severity ON public.contract_insights(severity);
CREATE INDEX idx_insights_type ON public.contract_insights(insight_type);
CREATE INDEX idx_insights_due_date ON public.contract_insights(due_date) WHERE due_date IS NOT NULL;

-- ============================================================================
-- 5. CREATE PARSING_AUDIT_LOG TABLE - Complete Audit Trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parsing_audit_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_id uuid REFERENCES public.contract_files(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.extracted_fields(id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL, -- 'upload', 'parse_start', 'parse_complete', 'parse_error', 'review', 'approve', 'reject', 'edit', 'conflict_resolve'
  event_category text, -- 'document', 'field', 'contract', 'insight'
  event_data jsonb, -- Flexible event-specific data
  
  -- User context
  user_id uuid REFERENCES public.profiles(id),
  user_role text,
  user_email text,
  
  -- System context
  ip_address inet,
  user_agent text,
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.parsing_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contract audit logs" ON public.parsing_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE id = parsing_audit_log.contract_id 
    AND vendor_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_audit_contract ON public.parsing_audit_log(contract_id);
CREATE INDEX idx_audit_file ON public.parsing_audit_log(file_id);
CREATE INDEX idx_audit_event ON public.parsing_audit_log(event_type);
CREATE INDEX idx_audit_time ON public.parsing_audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON public.parsing_audit_log(user_id);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update contract document count
CREATE OR REPLACE FUNCTION update_contract_document_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contracts
  SET document_count = (
    SELECT COUNT(*) 
    FROM public.contract_files 
    WHERE contract_id = COALESCE(NEW.contract_id, OLD.contract_id)
  ),
  total_pages = (
    SELECT COALESCE(SUM(page_count), 0)
    FROM public.contract_files
    WHERE contract_id = COALESCE(NEW.contract_id, OLD.contract_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for document count
DROP TRIGGER IF EXISTS trigger_update_document_count ON public.contract_files;
CREATE TRIGGER trigger_update_document_count
  AFTER INSERT OR DELETE ON public.contract_files
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_document_count();

-- Function to update contract parsing status
CREATE OR REPLACE FUNCTION update_contract_parsing_status()
RETURNS TRIGGER AS $$
DECLARE
  total_docs integer;
  completed_docs integer;
  failed_docs integer;
BEGIN
  SELECT COUNT(*) INTO total_docs
  FROM public.contract_files
  WHERE contract_id = NEW.contract_id;
  
  SELECT COUNT(*) INTO completed_docs
  FROM public.contract_files
  WHERE contract_id = NEW.contract_id
  AND parsing_status = 'completed';
  
  SELECT COUNT(*) INTO failed_docs
  FROM public.contract_files
  WHERE contract_id = NEW.contract_id
  AND parsing_status = 'failed';
  
  UPDATE public.contracts
  SET 
    parsing_status = CASE
      WHEN failed_docs > 0 THEN 'error'
      WHEN completed_docs = total_docs THEN 'review'
      WHEN completed_docs > 0 THEN 'parsing'
      ELSE 'draft'
    END,
    last_parsed_at = CASE
      WHEN NEW.parsing_status = 'completed' THEN now()
      ELSE last_parsed_at
    END,
    updated_at = now()
  WHERE id = NEW.contract_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for parsing status
DROP TRIGGER IF EXISTS trigger_update_parsing_status ON public.contract_files;
CREATE TRIGGER trigger_update_parsing_status
  AFTER UPDATE OF parsing_status ON public.contract_files
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_parsing_status();

-- Function to update extracted field timestamps
CREATE OR REPLACE FUNCTION update_extracted_field_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_extracted_field_timestamp ON public.extracted_fields;
CREATE TRIGGER trigger_update_extracted_field_timestamp
  BEFORE UPDATE ON public.extracted_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_extracted_field_timestamp();

-- ============================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Contract summary with document stats
CREATE OR REPLACE VIEW contract_summary AS
SELECT 
  c.*,
  COUNT(DISTINCT cf.id) as file_count,
  COUNT(DISTINCT cf.id) FILTER (WHERE cf.parsing_status = 'completed') as parsed_file_count,
  COUNT(DISTINCT ef.id) as extracted_field_count,
  COUNT(DISTINCT ef.id) FILTER (WHERE ef.review_status = 'approved') as approved_field_count,
  COUNT(DISTINCT ci.id) as insight_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'new') as new_insight_count
FROM public.contracts c
LEFT JOIN public.contract_files cf ON c.id = cf.contract_id
LEFT JOIN public.extracted_fields ef ON c.id = ef.contract_id AND ef.is_active = true
LEFT JOIN public.contract_insights ci ON c.id = ci.contract_id
GROUP BY c.id;

-- View: Pending reviews
CREATE OR REPLACE VIEW pending_reviews AS
SELECT 
  c.id as contract_id,
  c.name as contract_name,
  c.vendor_id,
  COUNT(DISTINCT cf.id) FILTER (WHERE cf.review_status = 'pending') as pending_documents,
  COUNT(DISTINCT ef.id) FILTER (WHERE ef.review_status = 'pending') as pending_fields,
  COUNT(DISTINCT ef.id) FILTER (WHERE ef.has_conflict = true) as conflict_count
FROM public.contracts c
LEFT JOIN public.contract_files cf ON c.id = cf.contract_id
LEFT JOIN public.extracted_fields ef ON c.id = ef.contract_id AND ef.is_active = true
WHERE c.review_status IN ('pending', 'in_review')
GROUP BY c.id, c.name, c.vendor_id;

-- ============================================================================
-- 8. SEED DATA - Document Types & Field Categories
-- ============================================================================

-- This will be used for dropdowns and validation
COMMENT ON COLUMN public.contract_files.document_type IS 
  'Valid values: msa, rebate_schedule, amendment, product_list, terms, compliance, other';

COMMENT ON COLUMN public.extracted_fields.field_category IS 
  'Valid values: financial, product, terms, compliance, dates, parties, performance';

COMMENT ON COLUMN public.contract_insights.insight_type IS 
  'Valid values: cost_saving, risk, opportunity, deadline, compliance, optimization';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('contracts', 'contract_files', 'extracted_fields', 'contract_insights', 'parsing_audit_log');
  
  RAISE NOTICE 'Migration complete. Tables created/updated: %', table_count;
END $$;
