import { db, Contract, ContractFile, Claim, Dispute, RebateRule, Accrual } from './db';

/**
 * Query helper functions for performing joins and complex queries
 */

export interface ContractWithFiles extends Contract {
  files?: ContractFile[];
  file_count?: number;
}

export interface ClaimWithContract extends Claim {
  contract?: Contract;
}

export interface DisputeWithClaimAndContract extends Dispute {
  claim?: Claim;
  contract?: Contract;
}

export interface RebateRuleWithContract extends RebateRule {
  contract?: Contract;
}

export interface AccrualWithContract extends Accrual {
  contract?: Contract;
}

/**
 * Get contracts with their associated files
 */
export async function getContractsWithFiles(): Promise<ContractWithFiles[]> {
  const contracts = await db.contracts.toArray();
  const files = await db.contract_files.toArray();

  return contracts.map(contract => ({
    ...contract,
    files: files.filter(f => f.contract_id === contract.id),
    file_count: files.filter(f => f.contract_id === contract.id).length,
  }));
}

/**
 * Get a single contract with its files
 */
export async function getContractWithFiles(contractId: string): Promise<ContractWithFiles | null> {
  const contract = await db.contracts.get(contractId);
  if (!contract) return null;

  const files = await db.contract_files.where('contract_id').equals(contractId).toArray();

  return {
    ...contract,
    files,
    file_count: files.length,
  };
}

/**
 * Get claims with their associated contracts
 */
export async function getClaimsWithContracts(vendorId?: string): Promise<ClaimWithContract[]> {
  let claims = vendorId
    ? await db.claims.where('vendor_id').equals(vendorId).toArray()
    : await db.claims.toArray();

  const contractIds = [...new Set(claims.map(c => c.contract_id))];
  const contracts = await db.contracts.bulkGet(contractIds);
  const contractMap = new Map(contracts.filter(Boolean).map(c => [c!.id, c!]));

  return claims.map(claim => ({
    ...claim,
    contract: contractMap.get(claim.contract_id),
  }));
}

/**
 * Get disputes with their claims and contracts
 */
export async function getDisputesWithDetails(vendorId?: string): Promise<DisputeWithClaimAndContract[]> {
  let disputes = vendorId
    ? await db.disputes.where('vendor_id').equals(vendorId).toArray()
    : await db.disputes.toArray();

  const claimIds = [...new Set(disputes.map(d => d.claim_id))];
  const claims = await db.claims.bulkGet(claimIds);
  const claimMap = new Map(claims.filter(Boolean).map(c => [c!.id, c!]));

  const contractIds = [...new Set(claims.filter(Boolean).map(c => c!.contract_id))];
  const contracts = await db.contracts.bulkGet(contractIds);
  const contractMap = new Map(contracts.filter(Boolean).map(c => [c!.id, c!]));

  return disputes.map(dispute => {
    const claim = claimMap.get(dispute.claim_id);
    return {
      ...dispute,
      claim,
      contract: claim ? contractMap.get(claim.contract_id) : undefined,
    };
  });
}

/**
 * Get rebate rules with their contracts
 */
export async function getRebateRulesWithContracts(): Promise<RebateRuleWithContract[]> {
  const rules = await db.rebate_rules.toArray();

  const contractIds = [...new Set(rules.map(r => r.contract_id))];
  const contracts = await db.contracts.bulkGet(contractIds);
  const contractMap = new Map(contracts.filter(Boolean).map(c => [c!.id, c!]));

  return rules.map(rule => ({
    ...rule,
    contract: contractMap.get(rule.contract_id),
  }));
}

/**
 * Get accruals with their contracts
 */
export async function getAccrualsWithContracts(vendorId?: string): Promise<AccrualWithContract[]> {
  let accruals = vendorId
    ? await db.accruals.where('vendor_id').equals(vendorId).toArray()
    : await db.accruals.toArray();

  const contractIds = [...new Set(accruals.map(a => a.contract_id))];
  const contracts = await db.contracts.bulkGet(contractIds);
  const contractMap = new Map(contracts.filter(Boolean).map(c => [c!.id, c!]));

  return accruals.map(accrual => ({
    ...accrual,
    contract: contractMap.get(accrual.contract_id),
  }));
}

/**
 * Get contracts with file count and stats
 */
export async function getContractsWithStats() {
  const contracts = await db.contracts.orderBy('created_at').reverse().toArray();
  const files = await db.contract_files.toArray();

  return contracts.map(contract => {
    const contractFiles = files.filter(f => f.contract_id === contract.id);
    return {
      ...contract,
      document_count: contractFiles.length,
      total_pages: contractFiles.reduce((sum, f) => sum + (f.page_count || 0), 0),
    };
  });
}

/**
 * Search contracts by name or contract number
 */
export async function searchContracts(query: string): Promise<Contract[]> {
  const lowerQuery = query.toLowerCase();
  const contracts = await db.contracts.toArray();

  return contracts.filter(contract =>
    contract.name.toLowerCase().includes(lowerQuery) ||
    contract.contract_number?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get contract file by ID with contract details
 */
export async function getContractFileWithContract(fileId: string) {
  const file = await db.contract_files.get(fileId);
  if (!file) return null;

  const contract = await db.contracts.get(file.contract_id);

  return {
    ...file,
    contract,
  };
}
