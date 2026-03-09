/**
 * Lead Scoring and Routing Logic for HPCL Lead Intelligence Agent
 * Rule-based scoring system with explainable criteria
 * Enhanced with ML-based feedback learning
 */

import { applyLearnedWeights, LearnedWeights, DEFAULT_LEARNED_WEIGHTS } from './feedback-learning';

// Lead interface for scoring (accepts any lead-like object)
interface LeadLike {
  source_text?: string;
  inference?: {
    confidence_score?: number;
    urgency_level?: string;
  } | null;
  timestamp?: number;
  trust?: number;
  geo?: string;
  source?: string;
  source_type?: string;
  score?: number;
  status?: string;
}

// User interface
interface UserLike {
  id: string;
  role: string;
  region?: string;
}

// Default users for geo matching
const users: UserLike[] = [
  { id: 'u1', role: 'sales', region: 'North' },
  { id: 'u2', role: 'sales', region: 'West' },
  { id: 'u3', role: 'sales', region: 'South' },
  { id: 'u4', role: 'sales', region: 'East' },
];

// Map Indian states/cities to sales regions
const GEO_REGION_MAP: Record<string, string> = {
  // North
  'delhi': 'North', 'delhi ncr': 'North', 'new delhi': 'North', 'haryana': 'North',
  'punjab': 'North', 'uttar pradesh': 'North', 'up': 'North', 'uttarakhand': 'North',
  'himachal pradesh': 'North', 'jammu': 'North', 'kashmir': 'North', 'chandigarh': 'North',
  'lucknow': 'North', 'jaipur': 'North', 'noida': 'North', 'gurgaon': 'North', 'gurugram': 'North',
  // West
  'maharashtra': 'West', 'mumbai': 'West', 'pune': 'West', 'gujarat': 'West',
  'rajasthan': 'West', 'goa': 'West', 'madhya pradesh': 'West', 'mp': 'West',
  'ahmedabad': 'West', 'surat': 'West', 'nagpur': 'West', 'indore': 'West', 'bhopal': 'West',
  // South
  'tamil nadu': 'South', 'karnataka': 'South', 'kerala': 'South', 'telangana': 'South',
  'andhra pradesh': 'South', 'ap': 'South', 'chennai': 'South', 'bangalore': 'South',
  'bengaluru': 'South', 'hyderabad': 'South', 'kochi': 'South', 'coimbatore': 'South',
  'visakhapatnam': 'South', 'vizag': 'South', 'thiruvananthapuram': 'South',
  // East
  'west bengal': 'East', 'kolkata': 'East', 'bihar': 'East', 'odisha': 'East',
  'jharkhand': 'East', 'chhattisgarh': 'East', 'assam': 'East', 'sikkim': 'East',
  'meghalaya': 'East', 'tripura': 'East', 'manipur': 'East', 'mizoram': 'East',
  'nagaland': 'East', 'arunachal pradesh': 'East', 'patna': 'East', 'ranchi': 'East',
  'bhubaneswar': 'East', 'guwahati': 'East', 'raipur': 'East',
  // Direct matches
  'north': 'North', 'south': 'South', 'east': 'East', 'west': 'West',
  'pan india': 'North', // Default for pan-India leads
};

function resolveRegion(geo: string): string | null {
  if (!geo) return null;
  return GEO_REGION_MAP[geo.toLowerCase().trim()] || null;
}

// Scoring weights (total = 100)
const WEIGHTS = {
  intentStrength: 35,  // How strong is the buying signal?
  freshness: 20,       // How recent is the signal?
  companySizeProxy: 20,// Estimated company size/potential
  trustScore: 15,      // Source reliability
  geographyMatch: 10,  // Does it match sales territory?
};

// Intent keywords and their scores
const INTENT_KEYWORDS: Record<string, number> = {
  tender: 10, bid: 10, procurement: 9, 'invites bids': 10, contract: 8,
  expansion: 8, 'new plant': 9, 'new facility': 9, fleet: 7, requirement: 7,
  supply: 6, purchase: 8, 'looking for': 7, urgent: 9, immediate: 9,
  capacity: 7, 'mega project': 8, bulk: 6, annual: 5,
};

// Company size indicators
const SIZE_INDICATORS: Record<string, number> = {
  crore: 3, billion: 5, million: 4, lakh: 2, mega: 4, large: 3,
  major: 3, national: 4, multinational: 5, government: 4, psu: 4,
  limited: 2, corporation: 3, mtpa: 5, mt: 3,
};

// Normalize company name for deduplication
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*(pvt\.?|private|ltd\.?|limited|inc\.?|corporation|corp\.?|llp)\s*/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// Main scoring function
export function scoreLead(lead: LeadLike): { score: number; breakdown: Record<string, number>; explanation: string[] } {
  const explanation: string[] = [];
  const breakdown: Record<string, number> = {};
  const content = (lead.source_text || '').toLowerCase();

  // 1. Intent Strength (0-35)
  let intentScore = 0;
  const matchedIntents: string[] = [];
  for (const [keyword, points] of Object.entries(INTENT_KEYWORDS)) {
    if (content.includes(keyword)) {
      intentScore += points;
      matchedIntents.push(keyword);
    }
  }
  // Also factor in inference confidence
  if (lead.inference?.confidence_score) {
    intentScore += lead.inference.confidence_score * 10;
  }
  intentScore = Math.min(WEIGHTS.intentStrength, (intentScore / 40) * WEIGHTS.intentStrength);
  breakdown.intentStrength = Math.round(intentScore);
  if (matchedIntents.length > 0) {
    explanation.push(`🎯 Strong intent: ${matchedIntents.slice(0, 3).join(', ')}`);
  }

  // 2. Freshness (0-20)
  const daysSince = Math.floor((Date.now() - (lead.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
  let freshnessScore = WEIGHTS.freshness;
  if (daysSince <= 1) {
    freshnessScore = WEIGHTS.freshness;
    explanation.push('⚡ Fresh signal (today)');
  } else if (daysSince <= 3) {
    freshnessScore = WEIGHTS.freshness * 0.85;
    explanation.push('📅 Recent signal (3 days)');
  } else if (daysSince <= 7) {
    freshnessScore = WEIGHTS.freshness * 0.6;
  } else {
    freshnessScore = WEIGHTS.freshness * 0.3;
    explanation.push('⏰ Older signal');
  }
  breakdown.freshness = Math.round(freshnessScore);

  // 3. Company Size Proxy (0-20)
  let sizeScore = 5;
  for (const [indicator, points] of Object.entries(SIZE_INDICATORS)) {
    if (content.includes(indicator)) {
      sizeScore += points;
    }
  }
  const numericMatch = content.match(/\d+[\s,]*(?:crore|billion|million|lakh|mt|mw|mtpa)/gi);
  if (numericMatch) {
    sizeScore += 5;
    explanation.push(`💰 Quantified: ${numericMatch[0]}`);
  }
  sizeScore = Math.min(WEIGHTS.companySizeProxy, sizeScore);
  breakdown.companySizeProxy = Math.round(sizeScore);

  // 4. Trust Score (0-15)
  // Trust is stored as 0-100 percentage; normalize to 0-1 for scoring
  const rawTrust = lead.trust || 0;
  const normalizedTrust = rawTrust > 1 ? rawTrust / 100 : rawTrust;
  const trustScore = normalizedTrust * WEIGHTS.trustScore;
  breakdown.trustScore = Math.round(trustScore);
  if (normalizedTrust >= 0.9) {
    explanation.push(`✓ Verified source: ${lead.source}`);
  } else if (normalizedTrust >= 0.7) {
    explanation.push(`◐ Trusted source: ${lead.source}`);
  }

  // 5. Geography Match (0-10)
  const resolvedRegion = resolveRegion(lead.geo || '');
  const assigned = resolvedRegion
    ? users.find(u => u.region === resolvedRegion && u.role === 'sales')
    : null;
  const geoScore = assigned ? WEIGHTS.geographyMatch : WEIGHTS.geographyMatch * 0.3;
  breakdown.geographyMatch = Math.round(geoScore);
  if (assigned) {
    explanation.push(`📍 Territory match: ${lead.geo} → ${resolvedRegion}`);
  }

  // Total
  const totalScore = Math.round(
    breakdown.intentStrength + breakdown.freshness + breakdown.companySizeProxy +
    breakdown.trustScore + breakdown.geographyMatch
  );

  // Route to sales officer
  const assignedTo = assigned?.id || users.find(u => u.role === 'sales')?.id || 'u1';

  return {
    score: Math.min(100, totalScore),
    breakdown,
    explanation,
  };
}

// Determine if lead should trigger urgent notification
export function shouldNotifyUrgent(lead: LeadLike): boolean {
  if (lead.inference?.urgency_level === 'high' && (lead.score || 0) >= 70) return true;
  if ((lead.score || 0) >= 85) return true;
  if (lead.source_type === 'tender' && (lead.score || 0) >= 60) return true;
  return false;
}

// Get priority level for sorting (1 = highest)
export function getPriorityLevel(lead: LeadLike): number {
  if (lead.status === 'new' && lead.inference?.urgency_level === 'high') return 1;
  if (lead.status === 'new' && (lead.score || 0) >= 80) return 2;
  if (lead.status === 'in_progress') return 3;
  if (lead.status === 'new') return 4;
  return 5;
}

// Generate explainable score summary
export function getScoreExplanation(breakdown: Record<string, number>): string[] {
  const explanations: string[] = [];
  if (breakdown.intentStrength >= 28) explanations.push('🎯 Very strong buying intent');
  else if (breakdown.intentStrength >= 20) explanations.push('📊 Good buying signals');
  if (breakdown.freshness >= 16) explanations.push('⚡ Very fresh opportunity');
  if (breakdown.companySizeProxy >= 15) explanations.push('🏢 Large enterprise');
  if (breakdown.trustScore >= 12) explanations.push('✓ Highly reliable source');
  if (breakdown.geographyMatch >= 8) explanations.push('📍 In your territory');
  return explanations;
}

// Enhanced scoring with learned weights
export function scoreLeadWithLearning(
  lead: LeadLike & { industry?: string; source_type?: string },
  learnedWeights?: LearnedWeights
): { 
  score: number; 
  breakdown: Record<string, number>; 
  explanation: string[];
  mlAdjusted: boolean;
  mlAdjustments?: string[];
} {
  // First, get the base score
  const baseResult = scoreLead(lead);
  
  // If no learned weights or not enough sample size, return base score
  if (!learnedWeights || learnedWeights.sampleSize < 10) {
    return {
      ...baseResult,
      mlAdjusted: false,
    };
  }

  // Apply learned weight adjustments
  const { adjustedScore, adjustments } = applyLearnedWeights(
    baseResult.score,
    baseResult.breakdown,
    {
      industry: (lead as any).inference?.industry || lead.industry,
      source_type: lead.source_type,
      geo: lead.geo,
    },
    learnedWeights
  );

  // Add ML adjustment explanations
  const enhancedExplanation = [...baseResult.explanation];
  if (adjustments.length > 0) {
    enhancedExplanation.push('🤖 ML-adjusted based on user feedback:');
    enhancedExplanation.push(...adjustments);
  }

  return {
    score: adjustedScore,
    breakdown: {
      ...baseResult.breakdown,
      mlAdjustment: adjustedScore - baseResult.score,
    },
    explanation: enhancedExplanation,
    mlAdjusted: true,
    mlAdjustments: adjustments,
  };
}

// Get current learned weights from database (async helper)
export async function getLearnedWeightsFromDb(
  learnedWeightsCollection: any
): Promise<LearnedWeights | null> {
  try {
    const weights = await learnedWeightsCollection.findOne({ id: 'learned_weights_v1' });
    return weights as LearnedWeights | null;
  } catch (error) {
    console.error('Error fetching learned weights:', error);
    return null;
  }
}

// Export default weights for reference
export { DEFAULT_LEARNED_WEIGHTS };
