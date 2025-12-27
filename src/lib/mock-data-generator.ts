/**
 * Mock Data Generator for AI-Powered Optimization Dashboard
 * Generates realistic purchase history, tier performance, and optimization data
 */

export interface PurchaseHistoryEntry {
  date: Date;
  productName: string;
  quantity: number;
  amount: number;
  tierQualified?: string;
  rebateEarned?: number;
}

export interface TierPerformanceData {
  tierName: string;
  currentVolume: number;
  threshold: number;
  progress: number; // 0-100
  estimatedAnnualVolume: number;
  rebateRate: number;
  potentialSavings: number;
}

export interface OptimizationOpportunity {
  id: string;
  type: 'tier_upgrade' | 'product_substitution' | 'volume_timing' | 'contract_renewal';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  confidence: number; // 0-1
  actionItems: string[];
  dueDate?: Date;
  implementation_effort: 'easy' | 'medium' | 'complex';
}

export interface ContractHealthMetrics {
  overallScore: number; // 0-100
  rebateCaptureRate: number; // 0-100
  tierUtilization: number; // 0-100
  productUtilization: number; // 0-100
  complianceScore: number; // 0-100
  daysUntilExpiration: number;
  estimatedAnnualValue: number;
  currentYearSavings: number;
  potentialAdditionalSavings: number;
}

/**
 * Generate realistic purchase history based on contract dates and products
 */
export function generatePurchaseHistory(
  contract: any,
  monthsBack: number = 12
): PurchaseHistoryEntry[] {
  const history: PurchaseHistoryEntry[] = [];
  const products = contract.products || [];

  if (products.length === 0) return history;

  const startDate = contract.start_date ? new Date(contract.start_date) : new Date();
  const endDate = new Date();

  // Generate monthly purchases for each product
  for (let month = 0; month < monthsBack; month++) {
    const purchaseDate = new Date(endDate);
    purchaseDate.setMonth(purchaseDate.getMonth() - month);

    // Skip if before contract start
    if (purchaseDate < startDate) continue;

    // Add seasonal variation (Q4 highest, Q2 lowest)
    const monthNum = purchaseDate.getMonth();
    let seasonalMultiplier = 1.0;
    if (monthNum >= 9) seasonalMultiplier = 1.4; // Q4
    else if (monthNum >= 6) seasonalMultiplier = 1.1; // Q3
    else if (monthNum >= 3) seasonalMultiplier = 0.8; // Q2
    else seasonalMultiplier = 1.2; // Q1

    // Generate purchases for random subset of products
    const productsThisMonth = products
      .filter(() => Math.random() > 0.3) // 70% chance each product purchased
      .slice(0, Math.max(1, Math.floor(products.length * 0.6))); // Use 60% of products

    productsThisMonth.forEach((product: any) => {
      const baseQuantity = Math.floor(Math.random() * 500) + 100;
      const quantity = Math.floor(baseQuantity * seasonalMultiplier);
      const unitPrice = product.unitPrice || (Math.random() * 100 + 50);
      const amount = quantity * unitPrice;

      history.push({
        date: purchaseDate,
        productName: product.productName,
        quantity,
        amount,
      });
    });
  }

  return history.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate tier performance based on purchase history and contract tiers
 */
export function calculateTierPerformance(
  contract: any,
  purchaseHistory: PurchaseHistoryEntry[]
): TierPerformanceData[] {
  const tiers = contract.rebate_tiers || [];
  if (tiers.length === 0) return [];

  // Calculate total annual volume (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const annualPurchases = purchaseHistory.filter(p => p.date >= oneYearAgo);
  const totalAnnualVolume = annualPurchases.reduce((sum, p) => sum + p.amount, 0);

  // Calculate performance for each tier
  return tiers.map((tier: any) => {
    const threshold = tier.minThreshold || 0;
    const progress = Math.min(100, (totalAnnualVolume / threshold) * 100);
    const rebateRate = tier.rebatePercentage || 0;

    // Calculate potential savings if tier is reached
    const potentialSavings = totalAnnualVolume >= threshold
      ? totalAnnualVolume * (rebateRate / 100)
      : (threshold - totalAnnualVolume) * (rebateRate / 100);

    return {
      tierName: tier.tierName || `Tier ${tiers.indexOf(tier) + 1}`,
      currentVolume: totalAnnualVolume,
      threshold,
      progress,
      estimatedAnnualVolume: totalAnnualVolume,
      rebateRate,
      potentialSavings,
    };
  });
}

/**
 * Generate AI optimization opportunities
 */
export function generateOptimizationOpportunities(
  contract: any,
  tierPerformance: TierPerformanceData[],
  purchaseHistory: PurchaseHistoryEntry[]
): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // Find next achievable tier
  const currentTier = tierPerformance.find(t => t.progress >= 100) || tierPerformance[0];
  const nextTier = tierPerformance[tierPerformance.indexOf(currentTier) + 1];

  if (nextTier && nextTier.progress < 100) {
    const gapAmount = nextTier.threshold - nextTier.currentVolume;
    const additionalRebate = (nextTier.rebateRate - (currentTier?.rebateRate || 0)) / 100;
    const potentialSavings = nextTier.threshold * additionalRebate;

    opportunities.push({
      id: 'tier-upgrade-1',
      type: 'tier_upgrade',
      priority: gapAmount < nextTier.threshold * 0.2 ? 'high' : 'medium',
      title: `Unlock ${nextTier.tierName} - ${nextTier.rebateRate}% Rebate`,
      description: `You're $${gapAmount.toLocaleString()} away from ${nextTier.tierName}. Increase purchases by this amount to unlock ${nextTier.rebateRate}% rebate rate.`,
      estimatedSavings: potentialSavings,
      confidence: 0.92,
      actionItems: [
        `Purchase additional $${gapAmount.toLocaleString()} before ${contract.end_date || 'year end'}`,
        'Focus on high-margin products to maximize ROI',
        'Consider bulk ordering to meet threshold',
      ],
      implementation_effort: 'easy',
    });
  }

  // Volume timing opportunity
  const daysUntilExpiration = contract.end_date
    ? Math.floor((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 365;

  if (daysUntilExpiration < 90 && nextTier && nextTier.progress > 70) {
    opportunities.push({
      id: 'timing-1',
      type: 'volume_timing',
      priority: 'critical',
      title: 'Accelerate Purchases - Contract Expiring Soon',
      description: `Contract expires in ${daysUntilExpiration} days. You're ${Math.floor(100 - nextTier.progress)}% away from next tier. Act now to maximize rebates before renewal.`,
      estimatedSavings: nextTier.potentialSavings,
      confidence: 0.88,
      actionItems: [
        'Review pending purchase orders',
        'Accelerate planned Q4 orders',
        'Consider early inventory replenishment',
      ],
      dueDate: new Date(contract.end_date),
      implementation_effort: 'medium',
    });
  }

  // Product substitution opportunity
  if (contract.products && contract.products.length > 3) {
    const avgSavings = contract.products.length * 8000; // $8K per product
    opportunities.push({
      id: 'substitution-1',
      type: 'product_substitution',
      priority: 'medium',
      title: 'Generic Alternatives Available',
      description: `Switch to clinically-equivalent generic alternatives for ${contract.products.length} products to increase rebate capture while maintaining quality.`,
      estimatedSavings: avgSavings,
      confidence: 0.85,
      actionItems: [
        'Review clinical equivalency data',
        'Consult with pharmacy team',
        'Run pilot program with 2-3 products',
        'Monitor patient outcomes',
      ],
      implementation_effort: 'medium',
    });
  }

  // Contract renewal opportunity
  if (daysUntilExpiration < 180) {
    opportunities.push({
      id: 'renewal-1',
      type: 'contract_renewal',
      priority: daysUntilExpiration < 90 ? 'critical' : 'high',
      title: 'Contract Renewal Approaching',
      description: `Contract expires in ${daysUntilExpiration} days. Use current performance data to negotiate better terms.`,
      estimatedSavings: contract.estimated_annual_value * 0.15, // 15% improvement
      confidence: 0.75,
      actionItems: [
        'Compile performance metrics',
        'Research competitor offerings',
        'Schedule vendor meeting',
        'Prepare negotiation strategy',
      ],
      dueDate: new Date(new Date(contract.end_date).getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days before expiration
      implementation_effort: 'complex',
    });
  }

  return opportunities.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate overall contract health metrics
 */
export function calculateContractHealth(
  contract: any,
  tierPerformance: TierPerformanceData[],
  purchaseHistory: PurchaseHistoryEntry[]
): ContractHealthMetrics {
  // Calculate rebate capture rate
  const currentTier = tierPerformance.find(t => t.progress >= 100) || tierPerformance[0];
  const maxTier = tierPerformance[tierPerformance.length - 1];
  const rebateCaptureRate = currentTier && maxTier
    ? (currentTier.rebateRate / maxTier.rebateRate) * 100
    : 0;

  // Calculate tier utilization (how many tiers are being used)
  const achievedTiers = tierPerformance.filter(t => t.progress >= 100).length;
  const tierUtilization = (achievedTiers / Math.max(1, tierPerformance.length)) * 100;

  // Calculate product utilization
  const activeProducts = new Set(purchaseHistory.map(p => p.productName)).size;
  const totalProducts = contract.products?.length || 1;
  const productUtilization = (activeProducts / totalProducts) * 100;

  // Compliance score (mock - assume high compliance)
  const complianceScore = 92 + Math.random() * 8; // 92-100%

  // Days until expiration
  const daysUntilExpiration = contract.end_date
    ? Math.floor((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 365;

  // Current year savings
  const currentYearSavings = tierPerformance
    .filter(t => t.progress >= 100)
    .reduce((sum, t) => sum + (t.currentVolume * t.rebateRate / 100), 0);

  // Potential additional savings (if next tier reached)
  const nextTier = tierPerformance.find(t => t.progress < 100 && t.progress > 0);
  const potentialAdditionalSavings = nextTier?.potentialSavings || 0;

  // Estimated annual value
  const estimatedAnnualValue = currentYearSavings + potentialAdditionalSavings;

  // Overall score (weighted average)
  const overallScore = (
    rebateCaptureRate * 0.4 +
    tierUtilization * 0.3 +
    productUtilization * 0.2 +
    complianceScore * 0.1
  );

  return {
    overallScore: Math.round(overallScore),
    rebateCaptureRate: Math.round(rebateCaptureRate),
    tierUtilization: Math.round(tierUtilization),
    productUtilization: Math.round(productUtilization),
    complianceScore: Math.round(complianceScore),
    daysUntilExpiration,
    estimatedAnnualValue: Math.round(estimatedAnnualValue),
    currentYearSavings: Math.round(currentYearSavings),
    potentialAdditionalSavings: Math.round(potentialAdditionalSavings),
  };
}

/**
 * Generate complete optimization dataset for a contract
 */
export function generateOptimizationData(contract: any) {
  const purchaseHistory = generatePurchaseHistory(contract, 12);
  const tierPerformance = calculateTierPerformance(contract, purchaseHistory);
  const opportunities = generateOptimizationOpportunities(contract, tierPerformance, purchaseHistory);
  const healthMetrics = calculateContractHealth(contract, tierPerformance, purchaseHistory);

  return {
    purchaseHistory,
    tierPerformance,
    opportunities,
    healthMetrics,
  };
}
