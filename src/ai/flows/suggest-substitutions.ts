'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting product substitutions based on rebate terms.
 *
 * The flow analyzes current product usage and contract terms to suggest clinically equivalent items with better rebate incentives.
 * It exports the suggestSubstitutions function, SuggestSubstitutionsInput type, and SuggestSubstitutionsOutput type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSubstitutionsInputSchema = z.object({
  productUsageData: z.string().describe('Current product usage data in JSON format. e.g., {"productX": 500, "productY": 2500}'),
  contractTerms: z.string().describe('Contract terms including rebate information for various products in JSON format. e.g., [{"product": "productX", "rebate": 0.05}, {"product": "productZ", "rebate": 0.10}]'),
  clinicalEquivalents: z.string().describe('Information on clinically equivalent products in JSON format. e.g., {"productX": ["productZ"]}')
});
export type SuggestSubstitutionsInput = z.infer<typeof SuggestSubstitutionsInputSchema>;


const SubstitutionSuggestionSchema = z.object({
    originalProduct: z.string().describe('The product currently in use.'),
    suggestedSubstitute: z.string().describe('The suggested substitute product.'),
    reasoning: z.string().describe('Explanation for why the substitution is recommended (e.g., better rebate, cost savings).'),
    estimatedSavings: z.string().describe('The estimated financial savings from making the substitution.'),
});

const SuggestSubstitutionsOutputSchema = z.object({
  suggestions: z.array(SubstitutionSuggestionSchema).describe('A list of substitution suggestions.'),
});
export type SuggestSubstitutionsOutput = z.infer<typeof SuggestSubstitutionsOutputSchema>;


export async function suggestSubstitutions(input: SuggestSubstitutionsInput): Promise<SuggestSubstitutionsOutput> {
  return suggestSubstitutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubstitutionsPrompt',
  input: {schema: SuggestSubstitutionsInputSchema},
  output: {schema: SuggestSubstitutionsOutputSchema},
  prompt: `You are an expert pharmaceutical analyst specializing in rebate optimization. Your task is to identify substitution opportunities for clinically equivalent items that offer better rebate terms.

Analyze the following data:
- Current Product Usage: {{{productUsageData}}}
- Contract Terms & Rebates: {{{contractTerms}}}
- Clinical Equivalents: {{{clinicalEquivalents}}}

Based on this data, provide a list of substitution suggestions. For each suggestion, include the original product, the suggested substitute, the reasoning for the switch (focus on financial benefit from rebates), and an estimate of the potential savings.
`,
});

const suggestSubstitutionsFlow = ai.defineFlow(
  {
    name: 'suggestSubstitutionsFlow',
    inputSchema: SuggestSubstitutionsInputSchema,
    outputSchema: SuggestSubstitutionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
