import Dexie, { Table } from 'dexie';

// Type definitions matching the database schema
export interface Contract {
  id: string;
  vendor_id: string;
  name: string;
  contract_number?: string;
  contract_type?: 'GPO' | 'IDN' | 'Direct' | 'Wholesale' | 'Other';
  start_date?: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'pending-review' | 'draft' | 'archived';
  description?: string;
  contract_file_url?: string;
  rebate_tiers?: any;
  products?: any;
  vendor_contact?: any;
  payment_terms?: string;
  renewal_terms?: string;
  special_conditions?: any;
  document_count?: number;
  total_pages?: number;
  parsing_status?: 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
  review_status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  estimated_annual_value?: number;
  potential_savings?: number;
  rebate_capture_rate?: number;
  requires_clinical_review?: boolean;
  requires_finance_review?: boolean;
  requires_supply_chain_review?: boolean;
  last_parsed_at?: string;
  parsing_errors?: any;
  extraction_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface ContractFile {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url?: string;
  uploaded_by: string;
  document_type?: 'msa' | 'rebate_schedule' | 'amendment' | 'product_list' | 'terms' | 'compliance' | 'other';
  document_subtype?: string;
  version?: number;
  supersedes_file_id?: string;
  parsing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  parsing_started_at?: string;
  parsing_completed_at?: string;
  parsing_duration_ms?: number;
  extracted_data?: any;
  extraction_confidence?: number;
  extraction_errors?: any;
  review_status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  page_count?: number;
  file_hash?: string;
  ocr_required?: boolean;
  extraction_method?: 'text' | 'ocr' | 'hybrid';
  ocr_confidence?: number;
  ocr_processing_time_ms?: number;
  language?: string;
  created_at: string;
}

export interface FileBlob {
  id: string; // matches ContractFile.id
  blob: Blob;
  created_at: string;
}

export interface ExtractedField {
  id: string;
  contract_id: string;
  source_file_id?: string;
  field_category?: 'financial' | 'product' | 'terms' | 'compliance' | 'dates';
  field_name: string;
  field_path?: string;
  field_label?: string;
  value_text?: string;
  value_numeric?: number;
  value_date?: string;
  value_boolean?: boolean;
  value_json?: any;
  source_page?: number;
  source_section?: string;
  source_quote?: string;
  extraction_method?: 'ai' | 'manual' | 'calculated' | 'imported';
  confidence_score?: number;
  ai_reasoning?: string;
  ai_model?: string;
  review_status?: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewed_by?: string;
  reviewed_at?: string;
  original_value?: any;
  review_notes?: string;
  has_conflict?: boolean;
  conflicting_field_ids?: string[];
  conflict_resolution?: string;
  conflict_resolved_by?: string;
  conflict_resolved_at?: string;
  is_active?: boolean;
  priority?: number;
  requires_review?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  vendor_id: string;
  contract_id: string;
  claim_date: string;
  amount: number;
  status: 'pending-review' | 'approved' | 'rejected';
  details?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  vendor_id: string;
  claim_id: string;
  dispute_date: string;
  reason: string;
  status: 'open' | 'resolved' | 'closed';
  created_at: string;
}

export interface RebateRule {
  id: string;
  contract_id: string;
  name: string;
  type: string;
  description?: string;
  criteria?: any;
  status: 'active' | 'inactive';
  source?: 'ai-generated' | 'manual';
  created_at: string;
}

export interface Accrual {
  id: string;
  vendor_id: string;
  contract_id: string;
  claim_id?: string;
  accrual_date: string;
  amount: number;
  status: 'accrued' | 'paid';
  notes?: string;
  created_at: string;
}

export interface ContractInsight {
  id: string;
  contract_id: string;
  insight_type: 'cost_saving' | 'risk' | 'opportunity' | 'deadline' | 'compliance' | 'optimization';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  target_team?: 'clinical' | 'finance' | 'supply_chain' | 'compliance' | 'all';
  title: string;
  description: string;
  recommendation?: string;
  action_items?: string[];
  estimated_impact?: number;
  impact_type?: 'savings' | 'cost' | 'revenue' | 'risk' | 'efficiency';
  impact_timeframe?: string;
  source_field_ids?: string[];
  source_file_ids?: string[];
  ai_generated?: boolean;
  ai_confidence?: number;
  status?: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  assigned_to?: string;
  assigned_at?: string;
  due_date?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ParsingAuditLog {
  id: string;
  contract_id?: string;
  file_id?: string;
  field_id?: string;
  event_type: 'upload' | 'parse_start' | 'parse_complete' | 'parse_error' | 'review' | 'approve' | 'reject' | 'edit' | 'conflict_resolve';
  event_category: 'document' | 'field' | 'contract' | 'insight';
  event_data?: any;
  user_id: string;
  user_role?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Obligation interface
export interface Obligation {
  id: string;
  contract_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  type: 'report' | 'payment' | 'review' | 'compliance' | 'other';
  recurrence?: string;
  created_at: string;
  completed_at?: string;
}

// Dexie database class
export class RebateOSDatabase extends Dexie {
  contracts!: Table<Contract>;
  contract_files!: Table<ContractFile>;
  file_blobs!: Table<FileBlob>;
  extracted_fields!: Table<ExtractedField>;
  claims!: Table<Claim>;
  disputes!: Table<Dispute>;
  rebate_rules!: Table<RebateRule>;
  accruals!: Table<Accrual>;
  contract_insights!: Table<ContractInsight>;
  parsing_audit_log!: Table<ParsingAuditLog>;
  obligations!: Table<Obligation>;

  constructor() {
    super('RebateOSDB');
    this.version(1).stores({
      contracts: 'id, vendor_id, status, parsing_status, review_status, created_at',
      contract_files: 'id, contract_id, parsing_status, review_status, created_at',
      file_blobs: 'id',
      extracted_fields: 'id, contract_id, source_file_id, field_category, field_name, review_status, created_at',
      claims: 'id, vendor_id, contract_id, status, claim_date, created_at',
      disputes: 'id, vendor_id, claim_id, status, dispute_date, created_at',
      rebate_rules: 'id, contract_id, status, created_at',
      accruals: 'id, vendor_id, contract_id, claim_id, status, accrual_date, created_at',
      contract_insights: 'id, contract_id, insight_type, severity, status, created_at',
      parsing_audit_log: 'id, contract_id, file_id, field_id, event_type, created_at',
    });
    
    // Add obligations table in version 2
    this.version(2).stores({
        obligations: 'id, contract_id, status, type, due_date, created_at'
    });
  }
}

// Export a singleton instance
export const db = new RebateOSDatabase();

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get current timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Mock user ID for single-user mode
export const MOCK_USER_ID = 'local-user';
