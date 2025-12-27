import Groq from 'groq-sdk';

function getGroqClient() {
  return new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || 'dummy_key_to_prevent_crash_if_missing',
    dangerouslyAllowBrowser: true, 
  });
}



export interface ContractHealthMetrics {
  tierUtilization: number;
  compliance: number;
  productsUsed: number;
  daysRemaining: number;
  rebateCaptureRate: number;
  currentSavings: number;
  potentialAdditional: number;
  totalVolume: number;
  currentTierName: string;
}

export interface OptimizationOpportunity {
  id: string;
  type: 'tier' | 'substitution' | 'volume' | 'timing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  confidence: number;
  actionItems: string[];
}

export interface TierOptimizationResult {
  recommendations: string[];
  optimizedTiers?: any[];
  opportunities: OptimizationOpportunity[];
}

export interface SubstitutionSuggestion {
  originalProduct: string;
  suggestedSubstitute: string;
  reasoning: string;
  estimatedSavings: number;
  clinicalEquivalence: number;
  rebateBenefit: number;
}

/**
 * Calculate contract health metrics from real data
 */
export async function calculateContractHealth(
  contract: any,
  claims: any[] = [],
  purchases: any[] = []
): Promise<ContractHealthMetrics> {
  const now = new Date();
  const endDate = new Date(contract.end_date);
  const startDate = new Date(contract.start_date);

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate total volume from purchases
  const totalPurchases = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Identify current tier
  const currentTier = findApplicableTier(contract.rebate_tiers, totalPurchases);
  const currentTierName = currentTier ? currentTier.tierName : 'None';

  // Calculate tier utilization based on actual purchases
  const highestTier = contract.rebate_tiers?.[contract.rebate_tiers.length - 1];
  const tierUtilization = highestTier
    ? Math.min(100, (totalPurchases / highestTier.minThreshold) * 100)
    : 0;

  // Calculate compliance based on submitted claims
  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const compliance = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 100;

  // Calculate products used
  const uniqueProducts = new Set(purchases.map(p => p.product_id)).size;
  const totalProducts = contract.products?.length || 0;
  const productsUsed = totalProducts > 0 ? (uniqueProducts / totalProducts) * 100 : 0;

  // Calculate rebate capture rate
  const totalRebatesEarned = claims
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.rebate_amount || 0), 0);
  const potentialRebates = purchases.reduce((sum, p) => {
    const tier = findApplicableTier(contract.rebate_tiers, p.amount);
    return sum + (p.amount * (tier?.rebatePercentage || 0) / 100);
  }, 0);
  const rebateCaptureRate = potentialRebates > 0
    ? (totalRebatesEarned / potentialRebates) * 100
    : 0;

  return {
    tierUtilization: Math.round(tierUtilization) || 0,
    compliance: Math.round(compliance) || 0,
    productsUsed: Math.round(productsUsed) || 0,
    daysRemaining: daysRemaining || 0,
    rebateCaptureRate: Math.round(rebateCaptureRate) || 0,
    currentSavings: totalRebatesEarned || 0,
    potentialAdditional: Math.max(0, (potentialRebates || 0) - (totalRebatesEarned || 0)),
    totalVolume: totalPurchases || 0,
    currentTierName,
  };
}

/**
 * Find applicable rebate tier for a given purchase amount
 */
function findApplicableTier(tiers: any[], amount: number) {
  if (!tiers) return null;
  return tiers.find(tier =>
    amount >= tier.minThreshold &&
    (!tier.maxThreshold || amount <= tier.maxThreshold)
  );
}

/**
 * Generate AI-powered contract insights using Groq
 */
export async function generateContractInsights(
  contract: any,
  healthMetrics: ContractHealthMetrics,
  purchases: any[] = [],
  claims: any[] = []
): Promise<OptimizationOpportunity[]> {
  const groq = getGroqClient();
  let prompt = `You are a pharmaceutical rebate optimization expert. Analyze this contract and provide actionable optimization opportunities.

CONTRACT DETAILS:
- Vendor: ${contract.name}
- Contract Type: ${contract.contract_type}
- Start Date: ${contract.start_date}
- End Date: ${contract.end_date}
- Days Remaining: ${healthMetrics.daysRemaining}

REBATE TIERS:
${JSON.stringify(contract.rebate_tiers, null, 2)}

CURRENT PERFORMANCE:
- Tier Utilization: ${healthMetrics.tierUtilization}%
- Compliance: ${healthMetrics.compliance}%
- Products Used: ${healthMetrics.productsUsed}%
- Rebate Capture Rate: ${healthMetrics.rebateCaptureRate}%
- Current Savings: $${healthMetrics.currentSavings.toLocaleString()}
- Potential Additional: $${healthMetrics.potentialAdditional.toLocaleString()}

PURCHASE SUMMARY:
- Total Purchases: ${purchases.length}
- Total Volume: $${purchases.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}

CLAIMS SUMMARY:
- Total Claims: ${claims.length}
- Approved Claims: ${claims.filter(c => c.status === 'approved').length}

Based on this data, identify 3-5 specific optimization opportunities.`;

  // Add cold-start context if no data exists
  if (purchases.length === 0 && claims.length === 0) {
    prompt += `
IMPORTANT: This is a NEW contract with NO purchase history yet.
Since there is no performance data, do NOT suggest "increasing volume" or "optimizing current spend".
Instead, focus on STRUCTURE and SETUP opportunities, such as:
1. "Setup Purchase Tracking": Recommend setting up data feeds for the specific products in this contract.
2. "Tier Analysis": Analyze if the starting tier is realistic or if the jump to the next tier is too high.
3. "Compliance Monitoring": Suggest setting up alerts for the specific rebate tiers.
`;
  }

  prompt += `
  RETURN ONLY A JSON OBJECT with a key "opportunities" containing an array of objects.
  Each object MUST strictly follow this schema:
  {
    "type": "tier" | "substitution" | "volume" | "timing",
    "priority": "high" | "medium" | "low",
    "title": "string (concise and actionable)",
    "description": "string (2-3 sentences)",
    "estimatedSavings": number (numeric value only, no symbols),
    "confidence": number (0-100),
    "actionItems": ["string", "string"]
  }
  
  Example Response:
  {
    "opportunities": [
      {
        "type": "tier",
        "priority": "high",
        "title": "Upgrade to Gold Tier",
        "description": "Increase volume by 5% to reach Gold tier rebates.",
        "estimatedSavings": 15000,
        "confidence": 85,
        "actionItems": ["Review purchase history", "Consolidate orders"]
      }
    ]
  }
  `;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical rebate optimization expert. Respond only with valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"opportunities": []}';
    const parsed = JSON.parse(content);
    const opportunities = parsed.opportunities || parsed;

    // Ensure proper format
    const sanitizeNumber = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = String(val).replace(/[^0-9.-]/g, '');
        return parseFloat(str) || 0;
    };

    return Array.isArray(opportunities)
      ? opportunities.map((opp, idx) => ({
          id: `opp-${Date.now()}-${idx}`,
          type: opp.type || 'volume',
          priority: opp.priority || 'medium',
          title: opp.title || 'Optimization Opportunity',
          description: opp.description || '',
          estimatedSavings: sanitizeNumber(opp.estimatedSavings || opp.estimated_savings),
          confidence: parseInt(opp.confidence || 75),
          actionItems: opp.actionItems || opp.action_items || [],
        }))
      : [];
  } catch (error) {
    console.error('Error generating contract insights:', error);
    return [];
  }
}

/**
 * Generate tier optimization recommendations using Groq
 */
export async function generateTierOptimizations(
  contract: any,
  healthMetrics: ContractHealthMetrics,
  purchases: any[] = []
): Promise<TierOptimizationResult> {
  const groq = getGroqClient();
  const prompt = `You are a pharmaceutical rebate tier optimization expert. Analyze the current tier structure and suggest optimizations.

CONTRACT: ${contract.name}
CURRENT TIERS:
${JSON.stringify(contract.rebate_tiers, null, 2)}

PERFORMANCE METRICS:
- Tier Utilization: ${healthMetrics.tierUtilization}%
- Days Remaining: ${healthMetrics.daysRemaining}
- Current Savings: $${healthMetrics.currentSavings}
- Potential Additional: $${healthMetrics.potentialAdditional}

PURCHASE HISTORY:
- Total Purchases: ${purchases.length}
- Total Volume: $${purchases.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
- Average Purchase: $${purchases.length > 0 ? (purchases.reduce((sum, p) => sum + (p.amount || 0), 0) / purchases.length).toFixed(2) : 0}

Provide:
1. Specific recommendations for tier optimization
2. Suggested optimized tier structure (if applicable)
3. Action items to maximize rebates before contract end

Respond with JSON containing:
{
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "optimizedTiers": [{"tierName": "...", "threshold": 0, "rebatePercentage": 0}, ...],
  "opportunities": [{"type": "tier", "priority": "high", "title": "...", "description": "...", "estimatedSavings": 0, "confidence": 0, "actionItems": ["..."]}]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical rebate tier optimization expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      recommendations: result.recommendations || [],
      optimizedTiers: result.optimizedTiers || result.optimized_tiers,
      opportunities: (result.opportunities || []).map((opp: any, idx: number) => ({
        id: `tier-opp-${Date.now()}-${idx}`,
        type: 'tier',
        priority: opp.priority || 'medium',
        title: opp.title || 'Tier Optimization',
        description: opp.description || '',
        estimatedSavings: parseFloat(opp.estimatedSavings || opp.estimated_savings || 0),
        confidence: parseInt(opp.confidence || 75),
        actionItems: opp.actionItems || opp.action_items || [],
      })),
    };
  } catch (error) {
    console.error('Error generating tier optimizations:', error);
    return {
      opportunities: [],
      recommendations: ['Unable to generate optimizations. Please try again.'],
    };
  }
}

/**
 * Generate product substitution suggestions using Groq
 */
export async function generateSubstitutionSuggestions(
  contract: any,
  purchases: any[] = []
): Promise<SubstitutionSuggestion[]> {
  const groq = getGroqClient();
  const prompt = `You are a pharmaceutical product substitution expert. Analyze purchase patterns and suggest product substitutions that could increase rebate capture.

CONTRACT: ${contract.name}
PRODUCTS:
${JSON.stringify(contract.products?.slice(0, 20), null, 2)}

REBATE TIERS:
${JSON.stringify(contract.rebate_tiers, null, 2)}

RECENT PURCHASES:
${JSON.stringify(purchases.slice(0, 10).map(p => ({ product: p.product_name, amount: p.amount })), null, 2)}

Identify product substitution opportunities where:
1. A generic or alternative product offers higher rebates
2. Clinical equivalence is maintained
3. Total cost of ownership is reduced

For each suggestion, provide:
- originalProduct: Current product name
- suggestedSubstitute: Recommended alternative
- reasoning: Why this substitution makes sense (2-3 sentences)
- estimatedSavings: Dollar amount saved per year
- clinicalEquivalence: Percentage (0-100)
- rebateBenefit: Percentage increase in rebate

Respond with JSON array of suggestions only.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical product substitution expert. Respond only with valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"suggestions": []}';
    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions || parsed;

    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('Error generating substitution suggestions:', error);
    return [];
  }
}

