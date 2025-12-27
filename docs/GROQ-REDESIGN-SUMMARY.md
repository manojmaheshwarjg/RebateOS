# Contract Detail Page Redesign - Groq AI Integration

## Summary

The contract detail page has been completely redesigned to use **Groq AI API** for all insights and analytics, replacing all mock/hardcoded data with real-time AI-powered analysis.

## What Changed

### 1. **New Groq AI Service** (`src/lib/groq-ai.ts`)

Created a comprehensive AI service that provides:

#### Real Health Metrics Calculation
- **Tier Utilization**: Based on actual purchase data vs tier thresholds
- **Compliance**: Calculated from approved vs total claims
- **Products Used**: Percentage of contract products actually purchased
- **Days Remaining**: Real-time calculation from contract end date
- **Rebate Capture Rate**: Actual rebates earned vs potential rebates
- **Current Savings**: Sum of all approved claim rebates
- **Potential Additional**: Uncaptured rebate opportunities

#### AI-Powered Insights (using Groq)
- **Contract Insights**: Analyzes contract performance and generates 3-5 actionable optimization opportunities
- **Tier Optimization**: Provides recommendations for tier structure improvements
- **Substitution Suggestions**: Identifies product substitution opportunities for better rebates

All AI functions use the **Mixtral-8x7b-32768** model via Groq API for fast, accurate analysis.

### 2. **Redesigned Contract Detail Page**

The contract detail page (`src/app/dashboard/contracts/[contractId]/page.tsx`) now features:

#### Modern Header Design
- Large contract number/ID display
- Status badge and contract metadata
- Breadcrumb navigation with back button

#### Real-Time Health Metrics Dashboard
- 4 KPI cards showing live metrics:
  - Tier Utilization (with progress bar)
  - Compliance (with progress bar)
  - Products Used (with progress bar)
  - Days Remaining (with status indicator)

#### Overall Performance Card
- Rebate Capture Rate (primary KPI)
- Current Savings (total earned)
- Potential Additional (opportunity value)

#### AI-Powered Recommendations Section
- **"Powered by Groq" badge** clearly identifies AI source
- Auto-generates insights when contract loads
- Displays opportunities with:
  - Priority level (high/medium/low)
  - Type (tier/substitution/volume/timing)
  - Confidence score
  - Estimated savings
  - Actionable steps
- Color-coded priority indicators
- Icon-based type identification

#### On-Demand Analysis Features
1. **Optimize Tiers** button
   - Generates tier optimization recommendations
   - Suggests improved tier structures
   - Shows comparative analysis

2. **Find Substitutions** button
   - Identifies product substitution opportunities
   - Shows clinical equivalence ratings
   - Calculates rebate benefits

3. **Generate Rules** button
   - Auto-creates rebate rules from contract tiers
   - Maintains existing functionality

#### Tabbed Contract Details
- **Details Tab**: Contract info and vendor contact
- **Tiers Tab**: Rebate tier table
- **Products Tab**: Product list with NDC codes
- **Document Tab**: PDF viewer/link

### 3. **Removed Dependencies**

Completely removed:
- `mock-data-generator.ts` import
- `ContractAIInsights` component (replaced with inline implementation)
- `RebateTierVisual` component (no longer needed)
- `PurchaseOptimizer` component (no longer needed)
- All hardcoded/mock optimization data

### 4. **Data Flow**

```
Contract Load
    ↓
Fetch Contract Data (from IndexedDB)
    ↓
Fetch Related Data (Claims, Purchases)
    ↓
Calculate Real Health Metrics (calculateContractHealth)
    ↓
Auto-Generate AI Insights (generateContractInsights via Groq)
    ↓
Display Live Dashboard
    ↓
User Actions (Optimize Tiers, Find Substitutions)
    ↓
Additional Groq API Calls (on-demand)
    ↓
Display Results
```

## Key Features

### 1. **100% Dynamic Data**
- No hardcoded values
- All metrics calculated from real data
- AI insights generated in real-time

### 2. **Groq AI Integration**
- Fast inference with Mixtral-8x7b-32768 model
- JSON-formatted responses for structured data
- Intelligent prompting for pharmaceutical domain expertise

### 3. **Progressive Loading**
- Initial health metrics load immediately
- AI insights generate in background
- Loading states for all AI operations

### 4. **Error Handling**
- Graceful fallbacks for AI failures
- Toast notifications for user feedback
- Console logging for debugging

### 5. **Modern UI/UX**
- Clean, card-based layout
- Color-coded priority system
- Icon-based navigation
- Responsive design
- Gradient backgrounds for AI sections
- Progress bars for metrics

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_GROQ_API_KEY=gsk_...
GROQ_API_KEY=gsk_...
```

## API Usage

The new system makes Groq API calls for:

1. **Initial Load**: 1 call to `generateContractInsights`
2. **Optimize Tiers**: 1 call to `generateTierOptimizations`
3. **Find Substitutions**: 1 call to `generateSubstitutionSuggestions`

Each call uses the Mixtral-8x7b-32768 model with temperature 0.3-0.4 for consistent, accurate results.

## Performance

- **Health Metrics**: Instant (calculated locally)
- **AI Insights**: ~2-5 seconds (Groq inference)
- **Tier Optimization**: ~3-6 seconds
- **Substitutions**: ~3-6 seconds

## Future Enhancements

Possible improvements:
1. Cache AI insights for repeated views
2. Add user feedback mechanism for AI suggestions
3. Implement action tracking (which suggestions were implemented)
4. Add historical comparison of health metrics over time
5. Export optimization reports as PDF
6. Integrate with claims submission workflow

## Testing

To test the new page:

1. Navigate to any contract detail page
2. Observe the health metrics populate immediately
3. Watch the "AI-Powered Recommendations" section load (shows spinner)
4. Click "Optimize Tiers" to see tier analysis
5. Click "Find Substitutions" to see product recommendations
6. Verify all data is dynamic (no hardcoded "0%" or mock values)

## Migration Notes

- Old components (`ContractAIInsights`, `RebateTierVisual`, `PurchaseOptimizer`) are still in the codebase but no longer used
- These can be safely deleted if no other pages use them
- The `mock-data-generator.ts` file can also be removed
- All functionality has been replaced with real AI-powered analysis

## Technical Details

### Type Definitions

```typescript
interface ContractHealthMetrics {
  tierUtilization: number;
  compliance: number;
  productsUsed: number;
  daysRemaining: number;
  rebateCaptureRate: number;
  currentSavings: number;
  potentialAdditional: number;
}

interface OptimizationOpportunity {
  id: string;
  type: 'tier' | 'substitution' | 'volume' | 'timing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  confidence: number;
  actionItems: string[];
}
```

### Groq Configuration

```typescript
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});
```

## Conclusion

The contract detail page is now a fully dynamic, AI-powered analytics dashboard that provides real-time insights and actionable recommendations using Groq AI. All mock data has been eliminated, and the system calculates metrics from actual contract, claim, and purchase data.
