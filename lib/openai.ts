/**
 * OpenAI Integration for HPCL Lead Intelligence Agent
 * Handles product need inference with explainable AI
 */

import { productCatalog, InferenceResult } from './mockData';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Build product catalog context for the prompt
const PRODUCT_CONTEXT = productCatalog
  .map(p => `- ${p.name} (${p.category}): For ${p.industry_fit.join(', ')}`)
  .join('\n');

const SYSTEM_PROMPT = `You are an AI assistant for HPCL (Hindustan Petroleum Corporation Limited) B2B sales team.
Analyze business signals and infer which HPCL products would be relevant for the company.

HPCL Product Catalog:
${PRODUCT_CONTEXT}

Respond with ONLY valid JSON matching this schema:
{
  "company_name": "string",
  "industry": "string (e.g., Manufacturing, Transportation, Construction, Hospitality, Steel, Logistics)",
  "inferred_products": ["array of up to 3 product names from catalog"],
  "reason_codes": ["array of 2-4 short explanations why each product is recommended"],
  "confidence_score": number between 0 and 1,
  "urgency_level": "low" | "medium" | "high",
  "suggested_next_action": "specific actionable recommendation for sales team"
}

Urgency levels:
- high: Active tender, immediate expansion, time-sensitive opportunity
- medium: Planned expansion, growth news, potential future need
- low: General news, indirect signals, speculative opportunity

Be precise and business-focused. Base inference on explicit signals in the text.`;

export async function inferProductNeeds(text: string, company_name: string): Promise<InferenceResult> {
  // Fallback mock inference when API key is missing
  if (!OPENAI_KEY) {
    return mockInference(text, company_name);
  }

  const userPrompt = `Analyze this business signal and infer HPCL product needs:

Company: ${company_name}
Signal:
"""
${text}
"""

Respond with only valid JSON.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.error('OpenAI API error:', res.status);
      return mockInference(text, company_name);
    }

    const payload: any = await res.json();
    const content = payload?.choices?.[0]?.message?.content || '';

    const result = JSON.parse(content) as InferenceResult;

    // Validate and clamp confidence score
    result.confidence_score = Math.min(1, Math.max(0, result.confidence_score || 0.5));

    // Ensure products are from catalog
    result.inferred_products = result.inferred_products?.filter(p =>
      productCatalog.some(cat => cat.name === p)
    ) || [];

    if (result.inferred_products.length === 0) {
      result.inferred_products = ['HP Diesel - HSD'];
    }

    return result;
  } catch (error) {
    console.error('OpenAI inference error:', error);
    return mockInference(text, company_name);
  }
}

// Mock inference for development without API key
function mockInference(text: string, company_name: string): InferenceResult {
  const lowerText = text.toLowerCase();
  const matchedProducts: string[] = [];
  const reasonCodes: string[] = [];

  // Simple keyword matching
  for (const product of productCatalog) {
    const hasMatch = product.tags.some(tag => lowerText.includes(tag));
    if (hasMatch && matchedProducts.length < 3) {
      matchedProducts.push(product.name);
      reasonCodes.push(`Signal mentions ${product.category.toLowerCase()}-related terms`);
    }
  }

  // Default fallback
  if (matchedProducts.length === 0) {
    matchedProducts.push('HP Diesel - HSD');
    reasonCodes.push('Diesel commonly required for business operations');
  }

  // Detect urgency
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  if (lowerText.includes('tender') || lowerText.includes('urgent') || lowerText.includes('immediate') || lowerText.includes('bid')) {
    urgency = 'high';
  } else if (lowerText.includes('planned') || lowerText.includes('future') || lowerText.includes('considering')) {
    urgency = 'low';
  }

  // Detect industry
  let industry = 'General Business';
  const industryMap: Record<string, string> = {
    steel: 'Steel Manufacturing', construction: 'Construction', highway: 'Infrastructure',
    road: 'Infrastructure', hotel: 'Hospitality', food: 'Food Processing',
    logistics: 'Logistics', fleet: 'Transportation', mining: 'Mining',
    power: 'Power & Utilities', metro: 'Transportation', shipping: 'Marine',
  };

  for (const [keyword, ind] of Object.entries(industryMap)) {
    if (lowerText.includes(keyword)) {
      industry = ind;
      break;
    }
  }

  return {
    company_name,
    industry,
    inferred_products: matchedProducts,
    reason_codes: reasonCodes,
    confidence_score: 0.75,
    urgency_level: urgency,
    suggested_next_action: `Contact ${company_name} procurement team to discuss ${matchedProducts[0]} supply requirements.`,
  };
}
