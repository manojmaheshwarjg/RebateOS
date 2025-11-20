# RebateOS Product Requirements Document

## Product Overview

RebateOS is a healthcare rebate management platform that automates contract ingestion, eligibility verification, claim submission, payment reconciliation, and compliance reporting across 340B, GPO, and commercial rebate programs.

**Core Capabilities:**
- AI-powered contract parsing and rule modeling
- Multi-source data ingestion and normalization
- Real-time eligibility and duplicate-discount prevention
- Automated submission and reconciliation workflows
- Audit-ready compliance reporting

---

## User Roles & Permissions

### 1. System Administrator
- Full system access
- Manage organizations, facilities, users
- Configure integrations and security settings
- Access all audit logs

### 2. Finance Manager
- View/manage accruals ledger
- Reconcile payments
- Post cash entries
- Generate financial reports
- Approve disputes

### 3. Supply Chain Manager
- Manage contracts (med-surg, implants, capital)
- Configure tier rules and bundles
- View optimization recommendations
- Approve contract terms

### 4. Pharmacy Director
- Manage pharmacy contracts (NDC-based)
- Configure 340B settings
- Review duplicate-discount alerts
- Submit pharmacy claims

### 5. Compliance Officer
- Access audit trails
- Generate compliance reports
- Configure carve-out rules
- Review PHI handling logs
- Manage policy attestations

### 6. Data Analyst (Read-only)
- View dashboards and reports
- Export data for analysis
- No write access

---

## Feature Specifications

## 1. Contract Management System

### 1.1 Contract Inbox
**Purpose:** Centralized intake for all rebate agreements

**Requirements:**
- Drag-and-drop file upload (PDF, DOCX, images, emails)
- Bulk upload support (zip files)
- Email forwarding address for direct submission
- Support file sizes up to 50MB per document
- Automatic file type detection and routing

**Fields per Contract:**
- Contract ID (auto-generated)
- Vendor name
- Program type (340B/GPO/Commercial)
- Effective date / Expiration date
- Covered facilities (multi-select)
- Contract category (Pharmacy/Med-Surg/Implants/Capital)
- Status (Draft/Pending Review/Active/Expired/Terminated)
- Assigned to (user)
- Upload date/time
- Processing status

**Actions:**
- View raw document
- Start AI extraction
- Manually enter contract
- Archive/Delete
- Duplicate contract
- Export contract list

### 1.2 AI Document Parser

**Extraction Targets:**
- Vendor/manufacturer name and identifiers
- Contract effective and termination dates
- Item identifiers (NDCs, SKUs, part numbers, HCPCS codes)
- Tier structures (volume/value thresholds)
- Rebate percentages or fixed amounts
- Qualifying criteria (payer types, sites of care)
- Bundle requirements (cross-category spend)
- Carve-outs and exclusions
- Payment terms and submission deadlines
- Dispute resolution clauses
- Facility coverage lists

**Confidence Scoring:**
- High confidence (>90%): Auto-populate fields with review flag
- Medium confidence (70-90%): Populate with warning, require confirmation
- Low confidence (<70%): Flag for manual review

**Manual Review Interface:**
- Side-by-side view: original document + extracted data
- Highlight source text for each extracted field
- Click to correct any field
- Add missing items manually
- Flag ambiguous clauses for vendor clarification

### 1.3 Contract Rule Builder

**Tier Configuration:**
- Tier name (e.g., "Gold", "Platinum", "Volume 1-3")
- Threshold type: Volume (units/dollars) or Market Share (%)
- Threshold value (numeric)
- Rebate value (% or fixed $)
- Measurement period (Monthly/Quarterly/Annual/Rolling)
- Retroactive application (Yes/No + lookback period)

**Bundle Rules:**
- Multi-category requirements
- Minimum spend per category
- Shared vs. independent thresholds
- Growth requirements (vs. baseline period)

**Eligibility Criteria:**
- Covered facilities (checkbox list)
- Covered payer classes (Medicaid/Medicare/Commercial/Self-Pay/340B)
- Covered sites of service (Inpatient/Outpatient/Clinic/Retail)
- Item-level inclusions/exclusions
- Date range restrictions

**Advanced Rules:**
- Conditional logic (IF-THEN statements)
- Formulary compliance requirements
- Mix requirements (e.g., "70% from preferred SKUs")
- Cap amounts (maximum rebate per period)

**Versioning:**
- Track all changes with user/timestamp
- Compare versions (redline diff view)
- Activate specific version
- Revert to previous version
- Maintain historical calculation basis for submitted claims

### 1.4 Price File Sync

**Data Sources:**
- GPO schedules (CSV/Excel upload or API)
- Vendor price lists
- Wholesaler catalogs
- Contract amendment addenda

**Price Records:**
- Item identifier
- Unit price
- Unit of measure
- Effective date
- Pack size
- Source system/file

**Conflict Detection:**
- Flag mismatches between contract terms and price files
- Highlight items with multiple active prices
- Alert on expired pricing
- Detect price increases exceeding contract caps

---

## 2. Data Integration Layer

### 2.1 Connector Configuration

**Supported Systems:**
- ERP (SAP, Oracle, Infor, Workday, Meditech)
- EHR/Billing (Epic, Cerner, Meditech, AllScripts)
- Wholesaler portals (Cardinal, McKesson, AmerisourceBergen)
- PBM portals (CVS Caremark, Express Scripts, Optum)
- SFTP servers
- REST APIs

**Connection Types:**
- Direct database connection (read-only)
- File drop (scheduled SFTP/FTP)
- API integration (OAuth 2.0)
- Manual upload

**Per-Connection Settings:**
- Frequency (Real-time/Hourly/Daily/Weekly)
- Data window (All history/Incremental/Date range)
- Field mappings
- Transformation rules
- Error notification recipients

### 2.2 Data Mappings

**Entity Resolution:**

**NDC/SKU Crosswalks:**
- NDC-11 format standardization
- Link NDCs to HCPCS/J-codes
- Map manufacturer SKUs to internal item masters
- Handle package size conversions
- Associate generics/biosimilars with brand references

**Facility Mappings:**
- Hospital registration numbers
- 340B IDs
- GPO member IDs
- Ship-to addresses
- Cost center hierarchies
- Parent-child relationships

**Payer Classification:**
- Payer name standardization
- Map to categories (Medicaid/Medicare/Commercial/Self-Pay)
- State-specific Medicaid IDs
- Secondary payer handling

**Unit of Measure Conversions:**
- Map "EACH" vs. "BOX" vs. "CASE"
- Define conversion factors
- Handle both purchase and dispense UOM

**De-duplication Logic:**
- Fuzzy matching for names and addresses
- Probabilistic matching with confidence scores
- Manual merge/split tools
- Maintain linkage history

### 2.3 Data Quality Service

**Completeness Checks:**
- Required field validation (NDC, date, quantity, facility, payer)
- Missing identifier alerts
- Orphan record detection (items without contract coverage)

**Format Validation:**
- NDC format (5-4-2 structure)
- Date ranges (logical start/end dates)
- Numeric bounds (positive quantities, reasonable unit costs)

**Anomaly Detection:**
- Outlier unit costs (>3 standard deviations)
- Unexpected volume spikes
- Off-contract purchases
- Items with no recent activity
- Duplicate transactions (same patient/date/item)

**Remediation Workflows:**
- Exception queue with filterable views
- Bulk edit capabilities
- Auto-correction rules (e.g., "always map XYZ payer to Medicaid")
- Reject and hold from processing
- Approval workflows for high-value corrections

---

## 3. Eligibility Engine

### 3.1 Rule Execution

**Pre-Flight Checks (per transaction):**
- Item is covered under active contract
- Facility is eligible
- Date falls within contract period
- Payer class matches eligibility criteria
- Site of service is covered
- No exclusionary flags present

**340B Duplicate-Discount Prevention:**

**Medicaid Carve-Out Logic:**
- Cross-reference claim payer against state Medicaid IDs
- Apply state-specific carve-in/carve-out rules
- Check for Medicaid secondary coverage
- Flag FFS vs. managed Medicaid (state configuration)

**Commercial/Medicare Part D:**
- Check manufacturer-specific 340B exclusion lists
- Validate claim is not also submitted for 340B discount at point-of-sale
- Block submission if dispensed through 340B contract pharmacy with POS discount

**Accumulator Tracking:**
- Maintain running totals by contract/tier
- Track facility-level and system-level volume
- Calculate distance-to-next-tier
- Handle retroactive tier adjustments

**Pass/Fail Results:**
- Status (Eligible/Not Eligible/Warning)
- Reason codes (specific rule violated)
- Recommended action (Fix mapping/Contact vendor/Exclude claim)
- Auto-fix suggestions where applicable

### 3.2 Eligibility Queue

**List View:**
- Transaction ID
- Item (NDC/SKU + description)
- Facility
- Date of service/purchase
- Quantity
- Payer
- Contract matched (if any)
- Status (Eligible/Failed/Warning)
- Reason code
- Actions (Review/Edit/Exclude/Approve)

**Filters:**
- Status
- Contract
- Facility
- Date range
- Payer class
- Item category
- Reason code

**Bulk Actions:**
- Approve all eligible
- Exclude all failed (with reason)
- Re-run eligibility after corrections
- Export for external review

---

## 4. Submission Management

### 4.1 Submission Calendar

**View Modes:**
- Monthly calendar grid
- List view (upcoming deadlines)
- Gantt chart (overlapping cycles)

**Per Submission Cycle:**
- Program name (e.g., "Acme Pharma Q4 2024")
- Vendor/Manufacturer
- Submission frequency (Monthly/Quarterly/Annual/Rolling)
- Data cutoff date
- Submission deadline
- Expected payment date (SLA-based)
- Status (Draft/Ready/Submitted/Acknowledged/Paid/Disputed)
- Assigned to (user)

**Actions:**
- Create new cycle
- Clone previous cycle
- Manually trigger submission
- Download generated file
- View submission history
- Cancel submission

### 4.2 File Builder

**Claim Selection:**
- Automatically include all eligible claims in data window
- Exclude previously submitted claims (prevent duplication)
- Manual claim inclusions/exclusions
- Preview claim count and estimated rebate value

**File Format Configuration (per vendor):**
- Column mapping (Claim ID, NDC, Date, Qty, Patient ID, etc.)
- Date format (MM/DD/YYYY vs. YYYY-MM-DD)
- Delimiter (CSV, pipe-delimited, fixed-width)
- Header row (yes/no, custom labels)
- Footer row (totals, record count)
- Character encoding (UTF-8, ASCII)

**Attachment Handling:**
- Supporting documents (invoices, remittance, contracts)
- Naming conventions
- File size limits
- Compression (zip archive)

**Pre-Submission Validation:**
- Schema compliance check
- Required fields populated
- No duplicate claim IDs within file
- Totals reconciliation
- File size within vendor limits

**Secure Delivery:**
- SFTP upload (with retry logic)
- Vendor portal integration (automated login/upload)
- Encrypted email with password-protected attachment
- API submission (RESTful endpoints)
- Download for manual submission

**Submission Log:**
- File name
- Submission timestamp
- Submitted by (user)
- Claim count
- Total rebate value (estimated)
- Delivery method
- Acknowledgement status
- Error messages (if rejected)

### 4.3 Acknowledgement Tracking

**Status Updates:**
- Received (vendor acknowledged file receipt)
- Processing (vendor is adjudicating)
- Approved (claims accepted, payment pending)
- Partially Approved (some claims denied)
- Denied (entire submission rejected)
- Paid (remittance received)

**Denial Handling:**
- Import vendor rejection files
- Match denials to original claims
- Categorize denial reasons (missing data, duplicate, not eligible, etc.)
- Create worklist for corrections
- Resubmission queue

**SLA Monitoring:**
- Countdown timers for expected responses
- Overdue alerts (vendor missed SLA)
- Escalation workflows (automated reminders to vendor)
- Vendor performance dashboard (on-time % by counterparty)

---

## 5. Financial Management

### 5.1 Accruals Ledger

**Accrual Generation:**
- Calculate expected rebate for each eligible claim
- Apply contract terms (tier rates, caps, qualifiers)
- Aggregate by contract, month, facility
- Confidence levels (High/Medium/Low based on historical approval rates)

**Ledger Entry Fields:**
- Entry ID
- Contract
- Period (month/quarter)
- Facility
- Item category
- Estimated rebate amount
- Confidence level
- Status (Pending/Approved/Adjusted/Reversed)
- GL account code
- Created date
- Approved by / date
- Notes

**GL Export:**
- Format: CSV, Excel, or direct integration (via API)
- Customizable column mapping
- Journal entry format (Debit/Credit)
- Cost center allocations
- Export history and versioning

**Variance Management:**
- Compare accrued vs. actual payment
- Threshold alerts (>10% variance)
- Reason codes (Denied claims, Short pay, Tier miss, Pricing error)
- Adjustment journal entries

### 5.2 Remittance Reconciliation

**Remittance Ingestion:**
- Upload remittance files (835 EDI, CSV, PDF)
- OCR extraction from PDF statements
- API pull from vendor portals
- Manual entry form

**Auto-Matching Logic:**
- Match by claim ID (exact match)
- Match by date + NDC + quantity (fuzzy match)
- Match to submission batch
- Allocate partial payments proportionally

**Match Statuses:**
- Matched (1:1 correspondence)
- Partially Matched (payment < expected)
- Overpaid (payment > expected)
- Unmatched Payment (no corresponding claim)
- Unmatched Claim (claim submitted but no payment)

**Reconciliation View:**
- Side-by-side: Submitted claims vs. Remittance lines
- Highlight matched pairs (green)
- Highlight discrepancies (yellow/red)
- Total submitted vs. Total paid
- Actions: Accept match, Manual match, Dispute

**Short Pay Analysis:**
- Calculate short pay amount per claim
- Aggregate by reason code (if provided by vendor)
- Identify patterns (specific items, facilities, date ranges)
- Generate dispute queue

### 5.3 Dispute Management

**Dispute Creation:**
- Manual dispute creation
- Auto-generate from short pays
- Bulk dispute creation (select multiple claims)

**Dispute Record:**
- Dispute ID
- Related claims (multi-select)
- Vendor
- Dispute amount
- Reason (dropdown + free text)
- Supporting evidence (file attachments)
- Submitted date
- Response deadline (SLA-based)
- Status (Draft/Submitted/Under Review/Resolved/Escalated)
- Resolution (Paid/Denied/Partial)
- Resolution date
- Final amount recovered

**Evidence Packet:**
- Auto-assemble: original contract, claim detail, invoices, prior correspondence
- Generated PDF cover letter (templated)
- Secure delivery to vendor

**Dispute Tracking:**
- Dashboard view (aging report)
- Vendor response inbox
- Resolution workflow (accept/reject vendor response)
- Recovered amount posting

### 5.4 Cash Forecasting

**Inputs:**
- Historical time-to-payment by vendor
- Pending submissions (estimated amounts)
- Historical approval rates
- Seasonal patterns

**Forecast Views:**
- 30/60/90-day cash forecast
- By vendor (show expected payment dates)
- By contract/program
- Confidence intervals

**Scenario Planning:**
- "What if" tier attainment changes
- Impact of contract renegotiation
- Product mix shifts
- Facility additions/closures

**Metrics:**
- Days Sales Outstanding (DSO) equivalent for rebates
- Average time-to-cash by vendor
- Approval rate trends
- Denial recovery rate

---

## 6. Optimization Suite

### 6.1 Opportunity Heatmap

**Leakage Identification:**
- Off-contract spend (items purchased without rebate coverage)
- Near-tier thresholds (within 5% of next tier)
- Substitutable items (clinically equivalent with better rebate terms)
- Facilities underperforming vs. peers
- Expired contracts with ongoing purchases

**Visual Representation:**
- Heatmap grid (rows=contracts, columns=facilities)
- Color intensity = opportunity size ($)
- Drill-down to detail

**Opportunity Cards:**
- Description (e.g., "Switch to Preferred SKU X")
- Financial impact (estimated additional rebate)
- Required action
- Effort level (Low/Medium/High)
- Stakeholder (Supply Chain/Pharmacy/Clinical)
- Status (New/In Progress/Completed/Dismissed)

### 6.2 Tier Coach

**Current Status Dashboard:**
- All active contracts
- Current tier and spend
- Next tier threshold
- Gap to next tier ($ or units)
- Time remaining in period

**Recommendations:**
- "Buy $X more of Item Y to hit Gold tier by [date]"
- Financial impact projection
- ROI calculation (incremental spend vs. incremental rebate)
- Risk indicators (clinical appropriateness, inventory capacity)

**Action Plans:**
- Generate purchase order recommendations
- Export to ERP system
- Track execution status
- Post-period results comparison (actual vs. projected)

### 6.3 Substitution Advisor

**Substitution Opportunities:**
- Identify items with clinically equivalent alternatives
- Compare rebate rates across alternatives
- Calculate financial impact of switch
- Flag formulary restrictions
- Note physician preference history

**Approval Workflows:**
- Route to pharmacy/therapeutics committee
- Clinical review and approval
- Implementation plan (communications, order set updates)
- Track adoption rates post-approval

---

## 7. Compliance & Audit

### 7.1 Audit Binder

**Binder Generation:**
- Select date range
- Select contracts/vendors
- Select facilities
- Auto-compile all related documents

**Included Documents:**
- Original contracts (all versions)
- Amendments and addenda
- Price files active in period
- Purchase/claims data (transactional detail)
- Eligibility determination logs
- Submission files and receipts
- Remittances and reconciliation records
- Dispute correspondence
- Final payment records

**Organization:**
- Tabbed sections (Contracts, Data, Submissions, Payments, Disputes)
- Indexed and bookmarked PDF
- Hyperlinked table of contents
- Searchable text

**Export Formats:**
- PDF (single file or zipped folder)
- Native files (ZIP archive)
- HTML report

### 7.2 Duplicate Discount Prevention Log

**Event Logging:**
- Every time a claim is evaluated for duplicate discount risk
- Timestamp, claim ID, payer, 340B status, result (Allowed/Blocked)
- Reason (e.g., "Blocked: Medicaid FFS in carve-out state")

**Audit Report:**
- Total claims evaluated
- Claims blocked (count and $)
- Breakdown by reason code
- False positive review (claims incorrectly blocked)
- Configuration changes log

### 7.3 CMS/GPO Reporting Wizard

**Report Types:**
- Cost Report Worksheet S-10 (GPO rebate income disclosure)
- 340B Program Integrity attestations
- Manufacturer audit requests
- Internal audit reports

**Guided Workflow:**
- Select report type (loads template)
- Select reporting period
- Auto-populate data from system
- Review and adjust figures
- Add attestation statements
- Generate PDF for submission
- Maintain submission history

### 7.4 Access Logs

**Event Capture:**
- User login/logout
- Page views (for sensitive areas)
- Data exports
- Configuration changes
- Contract modifications
- Financial postings
- PHI access (if applicable)

**Log Fields:**
- Timestamp
- User ID and name
- Action type
- Resource accessed (contract ID, claim ID, etc.)
- IP address
- User agent
- Result (success/failure)

**Audit Review:**
- Searchable log viewer
- Filter by user, date, action type
- Export logs for external review
- Tamper-evident (logs are immutable)

---

## 8. 340B Program Management

### 8.1 340B Configuration

**Covered Entity Setup:**
- 340B ID
- Entity type (Hospital/FQHC/etc.)
- Parent-child relationships
- Registered locations
- Contract pharmacy registrations

**State-Specific Carve-Out Rules:**
- Select state
- Medicaid FFS carve-out (Yes/No)
- Medicaid managed care carve-out (Yes/No)
- Exceptions and special cases
- Effective date of state policy

**Payer Mappings:**
- Map payer names to Medicaid Y/N
- Identify dual-eligible patients (Medicaid + Medicare)
- Flag state-specific Medicaid IDs

### 8.2 Duplicate Discount Shield

**Real-Time Checks:**
- Before claim submission, check:
  - Was this dispensed at 340B discounted price? (Y/N flag from EHR)
  - Is payer Medicaid in a carve-out state? (Block if yes)
  - Is payer commercial with manufacturer exclusion? (Block if yes)

**Warning System:**
- Flag potential duplicates
- Display reason
- Allow override with justification (logged)
- Require secondary approval for overrides

**Reporting:**
- Duplicate discount prevention rate (% of claims screened)
- Claims blocked (count and estimated 340B discount $)
- Compliance scorecard

### 8.3 340B Rebate Pilot Submission

**Pilot-Specific Requirements:**
- Minimum PHI data set (patient identifier, date of service, NDC, quantity)
- Secure data transmission requirements
- Submission timelines per pilot protocol

**Data Preparation:**
- Flag pilot-eligible claims
- Extract required fields only
- Apply data minimization (no unnecessary PHI)
- Generate submission file per HRSA schema

**Submission Tracking:**
- Pilot cycle calendar
- Submission status per manufacturer
- Acknowledgements and approvals
- Payment reconciliation
- Audit trail for HRSA reporting

---

## 9. Executive Dashboard

### 9.1 Key Metrics (High-Level)

**Financial Performance:**
- Total rebates captured (YTD, QTD, MTD)
- vs. Prior year (% change)
- vs. Target/Budget (% achieved)
- Missed rebate opportunities ($)
- Average days-to-cash

**Operational Efficiency:**
- Submission approval rate (%)
- Average denial rate (%)
- Admin hours saved (vs. manual baseline)
- Claims processed (count)
- Contracts under management (count)

**Compliance:**
- Duplicate discounts prevented (count, $)
- Audit-ready contracts (%)
- Policy attestations completed (%)

**Optimization:**
- Tier attainment rate (% of contracts at optimal tier)
- Off-contract spend ($)
- Near-tier pipeline ($)

### 9.2 Visualizations

**Charts:**
- Rebate revenue trend (line chart over time)
- Pharmacy vs. Supply Chain split (pie chart)
- Top 10 contracts by value (bar chart)
- Facility performance matrix (bubble chart: volume vs. rebate yield)
- Denial reasons (pie chart)
- Vendor SLA compliance (stacked bar by vendor)

**Filters:**
- Date range
- Facility (multi-select)
- Contract/Vendor
- Program type (340B/GPO/Commercial)

### 9.3 Alerts & Notifications

**System Alerts:**
- Submission deadlines approaching (7-day, 3-day, 1-day warnings)
- SLA breaches (vendor overdue)
- High-value denials (>$10k)
- Large variance between accrual and payment
- Data quality issues (% incomplete records > threshold)
- Tier opportunities (near-miss with high impact)

**Notification Channels:**
- In-app notifications (bell icon)
- Email digests (daily/weekly)
- Dashboard widget ("Action Required" section)

---

## Page Inventory (Complete Application)

### Landing & Navigation
1. **Login Page**
2. **Dashboard (Home)**
3. **Global Navigation Bar** (persistent)
4. **Notifications Center**

### Setup & Configuration
5. **Organization Settings**
6. **Facilities & Payers**
   - Facility List
   - Add/Edit Facility
   - Payer List
   - Add/Edit Payer
7. **User Management**
   - User List
   - Add/Edit User
   - Roles & Permissions
8. **Data Connections**
   - Connector List
   - Add Connection (wizard)
   - Connection Detail (status, logs)
9. **340B Settings**
   - Covered Entity Setup
   - State Carve-Out Rules
   - Contract Pharmacy List

### Contracts
10. **Contract Inbox**
11. **Contract Detail**
    - Overview tab
    - Terms & Tiers tab
    - Items tab
    - Facilities & Eligibility tab
    - Version History tab
12. **AI Extraction Review**
13. **Contract Rule Builder**
14. **Price File Manager**
15. **Contract Conflicts Dashboard**

### Data Management
16. **Data Quality Dashboard**
17. **Entity Mappings**
    - NDC/SKU Crosswalk
    - Facility Mapping
    - Payer Mapping
    - UOM Conversions
18. **Eligibility Queue**
19. **Exceptions Worklist**
20. **Duplicate Discount Matrix** (340B-specific)

### Operations
21. **Submission Calendar**
22. **Submission Detail**
    - Claim Selection
    - File Builder
    - Submission History
23. **Vendor Portal Status** (aggregated view)
24. **SLA Dashboard**

### Finance
25. **Accruals Ledger**
26. **Remittance Matcher**
    - Unmatched Payments
    - Unmatched Claims
    - Matched Items (confirmation)
27. **Variance Analyzer**
28. **Dispute Center**
    - Dispute List
    - Create Dispute
    - Dispute Detail
29. **Cash Forecast**

### Optimization
30. **Opportunity Heatmap**
31. **Tier Coach**
32. **Off-Contract Tracker**
33. **Substitution Advisor**

### Compliance & Audit
34. **Audit Binder Generator**
35. **Duplicate Discount Log**
36. **CMS/GPO Reporting Wizard**
37. **Access Logs**
38. **Policy Checklists**

### Administration
39. **Integration Settings**
40. **Security Center**
    - Encryption settings
    - BAA management
    - PHI policies
41. **Data Retention Policies**
42. **API Keys & Webhooks**
43. **System Logs**

---

## Core User Flows

### Flow 1: Onboard New Contract

1. **User navigates to Contract Inbox**
2. **Drags PDF contract into upload zone**
3. **System processes file** → Triggers AI extraction
4. **User receives notification** when extraction complete
5. **User clicks "Review Extraction"** → Opens AI Extraction Review page
6. **User reviews extracted fields** side-by-side with source document
   - Green highlights = high confidence
   - Yellow highlights = medium confidence (require confirmation)
   - Red = failed extraction (manual entry required)
7. **User corrects any errors** by clicking field and editing
8. **User clicks "Create Contract"** → Contract Detail page opens
9. **User navigates to "Terms & Tiers" tab**
10. **User configures tier rules** using Rule Builder
    - Adds tier thresholds
    - Sets rebate percentages
    - Defines eligibility criteria
11. **User navigates to "Items" tab**
12. **User maps items** (NDC/SKU) to contract
    - Upload item list (CSV), OR
    - Manual item addition, OR
    - Auto-suggest based on historical purchases
13. **User navigates to "Facilities & Eligibility" tab**
14. **User selects covered facilities** (checkbox list)
15. **User sets payer eligibility rules**
16. **User clicks "Activate Contract"**
17. **System validates** (checks for missing required fields)
18. **Contract status changes to "Active"**
19. **System begins applying contract** to future transactions

---

### Flow 2: Daily Data Ingestion & Eligibility

1. **Scheduled job runs** (e.g., 2 AM daily)
2. **System pulls data** from connected ERP/EHR/Wholesaler
3. **System lands raw data** in staging tables
4. **Data Quality Service runs**:
   - Validates required fields
   - Checks formats
   - Detects anomalies
5. **Issues are logged** in Exceptions Worklist
6. **Clean records proceed** to entity resolution:
   - NDC normalized
   - Facilities mapped
   - Payers classified
   - Units converted
7. **Eligibility Engine runs** on each transaction:
   - Matches to active contracts
   - Validates eligibility criteria
   - Runs 340B duplicate-discount checks
   - Calculates tier accumulation
8. **Results populate Eligibility Queue**
   - Eligible claims (green status)
   - Failed claims (red status, with reason code)
   - Warning claims (yellow status, manual review)
9. **User (Pharmacy or Supply Chain Manager) reviews Eligibility Queue** in morning
10. **User filters to "Failed" status**
11. **User clicks on failed claim** → Detail view opens
12. **User sees reason** (e.g., "Payer not mapped")
13. **User clicks "Fix Mapping"** → Opens Entity Mappings page
14. **User adds missing payer mapping**
15. **User returns to Eligibility Queue** and clicks "Re-run Eligibility" on claim
16. **Claim status updates to "Eligible"**
17. **User bulk-approves all eligible claims** → Claims are staged for next submission

---

### Flow 3: Monthly Submission Cycle

1. **System sends alert** 7 days before submission deadline
2. **User (Finance or Pharmacy Manager) navigates to Submission Calendar**
3. **User clicks on upcoming submission** (e.g., "Acme Pharma Q4")
4. **Submission Detail page opens**
5. **System auto-populates** with all eligible, approved claims in date window
6. **User reviews claim count and estimated rebate value**
7. **User clicks "Build File"**
8. **File Builder page opens**:
   - Shows file format settings (pre-configured for vendor)
   - Preview of file contents (first 100 rows)
9. **User clicks "Validate"**
10. **System runs schema validation** → Shows any errors
11. **If errors** → User fixes (e.g., missing required field) and re-validates
12. **If clean** → User clicks "Generate File"
13. **System creates submission file** (CSV/Excel/XML per vendor spec)
14. **User clicks "Submit to Vendor"**
15. **System uploads file** via configured method (SFTP/API/Portal)
16. **Submission status updates to "Submitted"**
17. **System logs submission** with timestamp, claim count, file name
18. **User receives confirmation notification**
19. **Over next 30 days**, system polls vendor for acknowledgement
20. **When vendor acknowledges** → Submission status updates to "Acknowledged"
21. **SLA timer starts** for expected payment date
22. **If vendor approves** → Status updates to "Approved"
23. **If vendor denies** → Status updates to "Denied", denial report is imported, worklist created

---

### Flow 4: Payment Reconciliation

1. **Payment arrives** from vendor (check, ACH, or wire)
2. **Finance team receives remittance** (835 EDI or PDF statement)
3. **User (Finance Manager) navigates to Remittance Matcher**
4. **User uploads remittance file**
5. **System parses remittance**:
   - Extracts payment amount, date, claim IDs, line-item details
6. **System auto-matches** claims to payment lines:
   - Matched pairs show in green
   - Short pays show in yellow
   - Unmatched payment lines show in red
7. **User reviews Matched Items** tab
   - Clicks "Accept Matches" for all clean matches
8. **System posts cash** to GL (via export or API)
9. **User clicks on "Short Pays" tab**
10. **User sees list** of claims paid less than expected
11. **User selects claims** (checkboxes)
12. **User clicks "Create Dispute"**
13. **Dispute Detail page opens**:
    - Pre-populated with claim details and short pay amount
14. **User adds reason** (free text + dropdown)
15. **User clicks "Generate Evidence Packet"**
16. **System assembles** contract, claim detail, invoices, prior submissions into PDF
17. **User reviews packet** and clicks "Submit Dispute to Vendor"
18. **System delivers dispute** via configured method
19. **Dispute status updates to "Submitted"**
20. **User tracks dispute** in Dispute Center
21. **When vendor responds**:
    - If additional payment → User posts in Remittance Matcher
    - If denied → User closes dispute with notes
22. **User navigates to Variance Analyzer**
23. **User reviews accrual vs. actual** by contract
24. **User adjusts accruals** if needed (generates journal entry for variance)

---

### Flow 5: Audit Request Response

1. **Hospital receives manufacturer audit request** (email)
2. **User (Compliance Officer) navigates to Audit Binder Generator**
3. **User selects**:
   - Date range (per audit request)
   - Vendor/contract (per audit request)
   - Facilities (all or subset)
4. **User clicks "Generate Binder"**
5. **System compiles**:
   - Contracts (all versions)
   - Claims submitted in period
   - Supporting purchase/dispense records
   - Remittances
   - Reconciliation records
6. **System generates PDF** (bookmarked, indexed, searchable)
7. **User downloads PDF**
8. **User reviews binder** for completeness
9. **User uploads to secure portal** or emails to auditor
10. **User logs audit response** in Compliance tracking
11. **If auditor has follow-up questions**:
    - User navigates to Access Logs
    - Exports event log for specific claims/contracts
    - Provides to auditor
12. **Audit closes** → User marks as "Completed" in system

---

### Flow 6: Tier Optimization

1. **User (Supply Chain Manager) navigates to Tier Coach**
2. **Dashboard shows** all active contracts and current tier status
3. **User sees** "Near Tier" badge on Contract X
4. **User clicks on Contract X**
5. **Detail page shows**:
   - Current tier: Silver ($950K spent, 8% rebate)
   - Next tier: Gold ($1M threshold, 10% rebate)
   - Gap: $50K
   - Time remaining: 45 days
   - Incremental rebate if tier achieved: +$20K
6. **User clicks "Show Recommendations"**
7. **System displays**:
   - "Buy $50K more of Item Y (preferred SKU under contract)"
   - ROI: Spend $50K, earn $20K additional rebate = 40% return
8. **User clicks "Create Purchase Plan"**
9. **System generates**:
   - Suggested PO lines (Item Y, quantity, cost)
   - Delivery schedule (spread over next 30 days to avoid inventory spike)
10. **User exports plan** to ERP or emails to materials management
11. **User clicks "Track Plan"** → System monitors actual purchases against plan
12. **At period end**:
    - System calculates actual tier achieved
    - Compares to projection
    - Shows outcome (Did we hit Gold? Yes → $20K additional rebate earned)
13. **User reviews Opportunity Heatmap**:
    - Sees other contracts with near-tier opportunities
    - Prioritizes based on ROI
14. **User clicks "Dismiss" on low-ROI opportunities**

---

### Flow 7: 340B Duplicate Discount Prevention

1. **Pharmacy dispenses medication** to patient
2. **Claim is generated** in EHR (NDC, date, patient, payer)
3. **Claim is sent to RebateOS** via nightly EHR integration
4. **System processes claim**:
   - Identifies facility has 340B ID
   - Checks if item was purchased at 340B discounted price (flag from purchasing system)
   - Checks payer: Medicaid FFS in State X
5. **System references 340B Settings**:
   - State X has Medicaid carve-out = YES
6. **System evaluates**:
   - Item was purchased at 340B discount = YES
   - Payer is Medicaid in carve-out state = YES
   - **Result: Duplicate discount risk detected**
7. **System blocks claim** from rebate submission
8. **System logs event** in Duplicate Discount Prevention Log:
   - Claim ID, date, NDC, payer, reason ("340B + Medicaid carve-out")
9. **User (Compliance Officer) reviews Duplicate Discount Log** weekly
10. **User sees claim was correctly blocked**
11. **User runs report** for monthly attestation:
    - Total claims evaluated: 10,000
    - Claims blocked: 150 (1.5%)
    - Estimated 340B discount protected: $45K
12. **User exports report** for internal compliance committee
13. **If false positive** (claim incorrectly blocked):
    - User navigates to Eligibility Queue
    - Finds claim
    - Clicks "Override" with justification
    - Secondary approval required (Compliance Manager)
    - Claim is released for submission
    - Override is logged

---

## Data Models (High-Level)

### Contracts
```
Contract {
  id: UUID
  vendor_id: UUID (FK)
  program_type: ENUM(340B, GPO, Commercial)
  status: ENUM(Draft, Active, Expired, Terminated)
  effective_date: DATE
  expiration_date: DATE
  category: ENUM(Pharmacy, MedSurg, Implants, Capital)
  created_by: UUID (FK User)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

ContractVersion {
  id: UUID
  contract_id: UUID (FK)
  version_number: INT
  terms_json: JSON (tier rules, bundles, etc.)
  activated_at: TIMESTAMP
  activated_by: UUID (FK User)
}

ContractItem {
  id: UUID
  contract_id: UUID (FK)
  item_id: UUID (FK)
  included: BOOLEAN (true=covered, false=excluded)
  effective_date: DATE
  expiration_date: DATE
}

ContractFacility {
  id: UUID
  contract_id: UUID (FK)
  facility_id: UUID (FK)
}

ContractTier {
  id: UUID
  contract_version_id: UUID (FK)
  tier_name: STRING
  threshold_type: ENUM(Volume, Value, MarketShare)
  threshold_value: DECIMAL
  rebate_type: ENUM(Percentage, FixedAmount)
  rebate_value: DECIMAL
  measurement_period: ENUM(Monthly, Quarterly, Annual, Rolling)
  retroactive: BOOLEAN
}
```

### Items & Entities
```
Item {
  id: UUID
  ndc11: STRING (nullable, pharmacy items)
  sku: STRING (nullable, med-surg items)
  hcpcs_code: STRING (nullable)
  description: STRING
  manufacturer: STRING
  category: ENUM(Pharmacy, MedSurg, Implant, Capital)
  pack_size: INT
  unit_of_measure: STRING
}

ItemCrosswalk {
  id: UUID
  item_id: UUID (FK)
  external_id: STRING (e.g., wholesaler SKU)
  external_system: STRING
  conversion_factor: DECIMAL (for UOM conversion)
}

Facility {
  id: UUID
  name: STRING
  registration_number: STRING
  address: STRING
  facility_340b_id: STRING (nullable)
  gpo_member_id: STRING (nullable)
  parent_facility_id: UUID (nullable, FK self)
  status: ENUM(Active, Inactive)
}

Payer {
  id: UUID
  name: STRING
  payer_class: ENUM(Medicaid, Medicare, Commercial, SelfPay)
  state: STRING (nullable, for Medicaid)
  medicaid_id: STRING (nullable)
  is_managed_medicaid: BOOLEAN
}
```

### Transactions
```
Transaction {
  id: UUID
  source_system: STRING (ERP/EHR)
  source_transaction_id: STRING
  transaction_type: ENUM(Purchase, Dispense)
  facility_id: UUID (FK)
  item_id: UUID (FK)
  payer_id: UUID (FK, nullable)
  transaction_date: DATE
  quantity: DECIMAL
  unit_cost: DECIMAL
  total_cost: DECIMAL
  patient_id_token: STRING (nullable, hashed for privacy)
  eligibility_status: ENUM(Pending, Eligible, NotEligible, Warning)
  eligibility_reason: STRING
  ingested_at: TIMESTAMP
}

TransactionEligibility {
  id: UUID
  transaction_id: UUID (FK)
  contract_id: UUID (FK)
  eligible: BOOLEAN
  reason_code: STRING
  evaluated_at: TIMESTAMP
}

DuplicateDiscountCheck {
  id: UUID
  transaction_id: UUID (FK)
  is_340b_purchase: BOOLEAN
  payer_is_medicaid: BOOLEAN
  state_carve_out_rule: BOOLEAN
  blocked: BOOLEAN
  reason: STRING
  checked_at: TIMESTAMP
}
```

### Submissions
```
Submission {
  id: UUID
  contract_id: UUID (FK)
  submission_cycle: STRING (e.g., "2024-Q4")
  data_cutoff_date: DATE
  submission_deadline: DATE
  status: ENUM(Draft, Ready, Submitted, Acknowledged, Approved, Denied, Paid)
  submitted_at: TIMESTAMP
  submitted_by: UUID (FK User)
  claim_count: INT
  estimated_rebate: DECIMAL
  file_name: STRING
  vendor_confirmation_number: STRING (nullable)
}

SubmissionClaim {
  id: UUID
  submission_id: UUID (FK)
  transaction_id: UUID (FK)
  claim_line_number: INT
  rebate_amount_estimated: DECIMAL
}

SubmissionDenial {
  id: UUID
  submission_id: UUID (FK)
  submission_claim_id: UUID (FK)
  denial_reason: STRING
  denied_at: TIMESTAMP
}
```

### Finance
```
AccrualEntry {
  id: UUID
  contract_id: UUID (FK)
  period: DATE (month/quarter)
  facility_id: UUID (FK)
  estimated_rebate: DECIMAL
  confidence_level: ENUM(High, Medium, Low)
  status: ENUM(Pending, Approved, Adjusted, Reversed)
  gl_account: STRING
  posted_at: TIMESTAMP
  posted_by: UUID (FK User)
}

Remittance {
  id: UUID
  submission_id: UUID (FK)
  payment_amount: DECIMAL
  payment_date: DATE
  payment_method: ENUM(Check, ACH, Wire)
  reference_number: STRING
  received_at: TIMESTAMP
}

RemittanceLine {
  id: UUID
  remittance_id: UUID (FK)
  submission_claim_id: UUID (FK, nullable)
  line_amount: DECIMAL
  matched: BOOLEAN
  match_status: ENUM(Matched, PartialMatch, Overpaid, Unmatched)
}

Dispute {
  id: UUID
  submission_id: UUID (FK)
  dispute_amount: DECIMAL
  reason: STRING
  supporting_docs: JSON (file paths)
  submitted_at: TIMESTAMP
  status: ENUM(Draft, Submitted, UnderReview, Resolved, Escalated)
  resolution: ENUM(Paid, Denied, Partial, null)
  resolution_date: DATE (nullable)
  amount_recovered: DECIMAL (nullable)
}
```

### Audit & Compliance
```
AuditLog {
  id: UUID
  timestamp: TIMESTAMP
  user_id: UUID (FK)
  action_type: STRING
  resource_type: STRING (Contract, Claim, Submission, etc.)
  resource_id: UUID
  ip_address: STRING
  user_agent: STRING
  result: ENUM(Success, Failure)
  details_json: JSON
}

ComplianceAttestation {
  id: UUID
  attestation_type: STRING (e.g., "340B Duplicate Discount Policy")
  period: DATE
  attested_by: UUID (FK User)
  attested_at: TIMESTAMP
  evidence_json: JSON (links to reports, logs)
}
```

---

## Integration Requirements

### Inbound Integrations
- **ERP Systems**: Purchase orders, invoices, AP data
  - Methods: Direct DB read (JDBC), SFTP file drop, REST API
  - Frequency: Daily or real-time
  - Data: PO number, item, vendor, quantity, cost, facility, date
- **EHR/Billing Systems**: Dispenses, claims, patient encounters
  - Methods: HL7, FHIR API, flat file export
  - Frequency: Daily
  - Data: NDC, HCPCS, date of service, quantity, payer, facility, patient token
- **Wholesaler Portals**: Purchase history, pricing
  - Methods: API (if available), web scraping (fallback), file download
  - Frequency: Weekly
  - Data: NDC, quantity, cost, ship-to location, invoice date
- **PBM Portals**: Claim status, remittances
  - Methods: Portal API, file download, 835 EDI
  - Frequency: Daily
  - Data: Claim ID, approval/denial, payment amount, denial reason

### Outbound Integrations
- **ERP/GL Systems**: Accrual journal entries, cash postings
  - Methods: CSV export, API push (if available)
  - Frequency: On-demand or scheduled (month-end)
  - Data: GL account, debit/credit, amount, cost center, description
- **Vendor Submission Portals**: Rebate claim files
  - Methods: SFTP, REST API, web form automation
  - Frequency: Per submission cycle (monthly/quarterly)
  - Data: Claim files in vendor-specific formats
- **Email/Notifications**: Alerts and reports
  - Methods: SMTP
  - Frequency: Real-time and scheduled digests

---

## Technical Requirements

### Architecture
- **Frontend**: React (TypeScript), TailwindCSS
- **Backend**: Node.js or Python (FastAPI/Django)
- **Database**: PostgreSQL (primary), TimescaleDB (time-series for transactions)
- **File Storage**: S3-compatible object storage (documents, exports)
- **Cache**: Redis (session, frequently accessed configs)
- **Queue**: RabbitMQ or AWS SQS (async processing, submission jobs)
- **Search**: Elasticsearch (contract search, audit logs)

### AI/ML Components
- **Document Parsing**: OpenAI GPT-4 or Claude API for contract extraction, fallback to OCR (Tesseract) + NLP (spaCy)
- **Entity Resolution**: Fuzzy matching library (FuzzyWuzzy/RapidFuzz)
- **Forecasting**: Time-series models (Prophet, ARIMA) for cash forecasting
- **Anomaly Detection**: Statistical methods (Z-score, IQR) for data quality

### Security & Compliance
- **Authentication**: OAuth 2.0 / SAML SSO, MFA support
- **Authorization**: RBAC with granular permissions
- **Encryption**:
  - In transit: TLS 1.3
  - At rest: AES-256 for database and files
- **PHI Handling**:
  - Tokenization for patient identifiers (irreversible hash with secure vault)
  - Field-level access controls
  - Audit all PHI access
- **Compliance Standards**:
  - HIPAA (BAA required)
  - HITRUST CSF alignment
  - SOC 2 Type II (goal)
- **Data Retention**:
  - Contracts: 7 years
  - Transactions: 7 years
  - Audit logs: 7 years
  - Temporary files: 90 days

### Performance Requirements
- **Response Time**: <2s for page loads, <5s for complex queries
- **Throughput**: Support 1M transactions/month per customer
- **Uptime**: 99.9% SLA
- **Scalability**: Horizontal scaling for web and worker nodes

### Monitoring & Observability
- **Application Monitoring**: Datadog or New Relic
- **Error Tracking**: Sentry
- **Logging**: Centralized logging (ELK stack or CloudWatch)
- **Alerting**: PagerDuty integration for critical errors

---

## Non-Functional Requirements

### Usability
- Responsive design (desktop-first, tablet-friendly)
- WCAG 2.1 AA accessibility compliance
- In-app help tooltips and guided tours (for onboarding)
- Searchable knowledge base

### Reliability
- Automated backups (daily, retained 30 days)
- Disaster recovery plan (RPO <24h, RTO <4h)
- Graceful degradation (if integration fails, queue and retry)

### Maintainability
- Modular codebase (microservices or well-separated monolith)
- API versioning
- Feature flags for controlled rollout
- Comprehensive unit and integration tests (>80% coverage)

---

## Open Questions / Future Considerations
- Multi-tenant architecture: Per-customer database vs. shared with tenant isolation?
- Internationalization: Support for non-US healthcare systems?
- Mobile app: Do users need mobile access for approvals/alerts?
- White-label: Will customers want to brand the interface?
- Marketplace: Should there be an ecosystem for third-party integrations/plugins?

---

**End of PRD**
