import { db } from './db';

/**
 * Export/Import utilities for backing up and restoring data
 */

export interface DatabaseExport {
  version: number;
  exportDate: string;
  data: {
    contracts: any[];
    contract_files: any[];
    extracted_fields: any[];
    claims: any[];
    disputes: any[];
    rebate_rules: any[];
    accruals: any[];
    contract_insights: any[];
    parsing_audit_log: any[];
  };
  // Note: File blobs are NOT included in export to avoid large file sizes
  // Users should re-upload documents after import
}

/**
 * Export all data to JSON (excluding file blobs)
 */
export async function exportData(): Promise<DatabaseExport> {
  const [
    contracts,
    contract_files,
    extracted_fields,
    claims,
    disputes,
    rebate_rules,
    accruals,
    contract_insights,
    parsing_audit_log,
  ] = await Promise.all([
    db.contracts.toArray(),
    db.contract_files.toArray(),
    db.extracted_fields.toArray(),
    db.claims.toArray(),
    db.disputes.toArray(),
    db.rebate_rules.toArray(),
    db.accruals.toArray(),
    db.contract_insights.toArray(),
    db.parsing_audit_log.toArray(),
  ]);

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      contracts,
      contract_files,
      extracted_fields,
      claims,
      disputes,
      rebate_rules,
      accruals,
      contract_insights,
      parsing_audit_log,
    },
  };
}

/**
 * Download exported data as JSON file
 */
export async function downloadDataExport(): Promise<void> {
  const exportData = await exportData();
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rebateos-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON export
 * @param data The exported data object
 * @param clearExisting Whether to clear existing data first
 */
export async function importData(data: DatabaseExport, clearExisting = false): Promise<void> {
  if (clearExisting) {
    await clearAllData();
  }

  await db.transaction('rw', [
    db.contracts,
    db.contract_files,
    db.extracted_fields,
    db.claims,
    db.disputes,
    db.rebate_rules,
    db.accruals,
    db.contract_insights,
    db.parsing_audit_log,
  ], async () => {
    await db.contracts.bulkPut(data.data.contracts);
    await db.contract_files.bulkPut(data.data.contract_files);
    await db.extracted_fields.bulkPut(data.data.extracted_fields);
    await db.claims.bulkPut(data.data.claims);
    await db.disputes.bulkPut(data.data.disputes);
    await db.rebate_rules.bulkPut(data.data.rebate_rules);
    await db.accruals.bulkPut(data.data.accruals);
    await db.contract_insights.bulkPut(data.data.contract_insights);
    await db.parsing_audit_log.bulkPut(data.data.parsing_audit_log);
  });
}

/**
 * Import data from a JSON file
 * @param file The JSON file to import
 * @param clearExisting Whether to clear existing data first
 */
export async function importDataFromFile(file: File, clearExisting = false): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as DatabaseExport;
  await importData(data, clearExisting);
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [
    db.contracts,
    db.contract_files,
    db.file_blobs,
    db.extracted_fields,
    db.claims,
    db.disputes,
    db.rebate_rules,
    db.accruals,
    db.contract_insights,
    db.parsing_audit_log,
  ], async () => {
    await db.contracts.clear();
    await db.contract_files.clear();
    await db.file_blobs.clear();
    await db.extracted_fields.clear();
    await db.claims.clear();
    await db.disputes.clear();
    await db.rebate_rules.clear();
    await db.accruals.clear();
    await db.contract_insights.clear();
    await db.parsing_audit_log.clear();
  });
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [
    contractCount,
    fileCount,
    fieldCount,
    claimCount,
    disputeCount,
    ruleCount,
    accrualCount,
    insightCount,
    auditLogCount,
    blobCount,
  ] = await Promise.all([
    db.contracts.count(),
    db.contract_files.count(),
    db.extracted_fields.count(),
    db.claims.count(),
    db.disputes.count(),
    db.rebate_rules.count(),
    db.accruals.count(),
    db.contract_insights.count(),
    db.parsing_audit_log.count(),
    db.file_blobs.count(),
  ]);

  const blobs = await db.file_blobs.toArray();
  const totalBlobSize = blobs.reduce((sum, blob) => sum + blob.blob.size, 0);

  return {
    contracts: contractCount,
    files: fileCount,
    extractedFields: fieldCount,
    claims: claimCount,
    disputes: disputeCount,
    rules: ruleCount,
    accruals: accrualCount,
    insights: insightCount,
    auditLogs: auditLogCount,
    blobs: blobCount,
    totalBlobSizeMB: (totalBlobSize / (1024 * 1024)).toFixed(2),
  };
}
