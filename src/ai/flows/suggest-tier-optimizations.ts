'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting tier optimizations based on various data inputs.
 *
 * The flow analyzes rebate tiers and suggests optimizations using AI based on historical sales data, market trends, and contract terms.
 * It exports the SuggestTierOptimizations function, SuggestTierOptimizationsInput type, and SuggestTierOptimizationsOutput type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTierOptimizationsInputSchema = z.object({
  historicalSalesData: z.string().describe('Historical sales data in JSON format.'),
  marketTrends: z.string().describe('Market trends data in JSON format.'),
  contractTerms: z.string().describe('Contract terms in JSON format.'),
  currentTiers: z.string().describe('Current rebate tiers in JSON format.'),
});
export type SuggestTierOptimizationsInput = z.infer<typeof SuggestTierOptimizationsInputSchema>;

const SuggestTierOptimizationsOutputSchema = z.object({
  optimizedTiers: z.string().describe('Suggested optimized rebate tiers in JSON format.'),
  explanation: z.string().describe('Explanation of the suggested optimizations.'),
});
export type SuggestTierOptimizationsOutput = z.infer<typeof SuggestTierOptimizationsOutputSchema>;

export async function suggestTierOptimizations(input: SuggestTierOptimizationsInput): Promise<SuggestTierOptimizationsOutput> {
  return suggestTierOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTierOptimizationsPrompt',
  input: {schema: SuggestTierOptimizationsInputSchema},
  output: {schema: SuggestTierOptimizationsOutputSchema},
  prompt: `You are an expert rebate analyst. Analyze the following data and suggest optimized rebate tiers.

Historical Sales Data: {{{historicalSalesData}}}
Market Trends: {{{marketTrends}}}
Contract Terms: {{{contractTerms}}}
Current Rebate Tiers: {{{currentTiers}}}

Provide the optimized rebate tiers in JSON format, and explain the reasoning behind your suggestions.
`,
});

const suggestTierOptimizationsFlow = ai.defineFlow(
  {
    name: 'suggestTierOptimizationsFlow',
    inputSchema: SuggestTierOptimizationsInputSchema,
    outputSchema: SuggestTierOptimizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
