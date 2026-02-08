/**
 * Feedback-Based Learning System for HPCL Lead Intelligence
 * Learns from user approve/reject actions to improve lead scoring
 */

import { Collection, Document } from 'mongodb';

// Feedback types
export type FeedbackAction = 'approved' | 'rejected' | 'converted' | 'contacted';
export type RejectionReason = 
  | 'not_relevant' 
  | 'wrong_industry' 
  | 'too_small' 
  | 'already_customer'
  | 'bad_timing'
  | 'competitor'
  | 'low_quality_source'
  | 'duplicate'
  | 'other';

export interface LeadFeedback {
  id: string;
  leadId: string;
  userId: string;
  action: FeedbackAction;
  reason?: RejectionReason;
  notes?: string;
  
  // Lead characteristics at time of feedback (for learning)
  leadSnapshot: {
    score: number;
    source_type: string;
    industry: string;
    geo: string;
    trust: number;
    intentStrength: number;
    freshness: number;
    companySizeProxy: number;
    keywords: string[];
    inferenceConfidence?: number;
    urgencyLevel?: string;
  };
  
  createdAt: Date;
}

// Learned weight adjustments (stored in DB)
export interface LearnedWeights {
  id: string;
  
  // Base weight multipliers (1.0 = no change, >1 = increase importance, <1 = decrease)
  intentStrengthMultiplier: number;
  freshnessMultiplier: number;
  companySizeMultiplier: number;
  trustMultiplier: number;
  geoMatchMultiplier: number;
  
  // Industry-specific adjustments
  industryBoosts: Record<string, number>; // e.g., { "Manufacturing": 1.2, "IT": 0.8 }
  
  // Source-type adjustments
  sourceBoosts: Record<string, number>; // e.g., { "tender": 1.3, "news": 0.9 }
  
  // Keyword adjustments learned from feedback
  keywordBoosts: Record<string, number>; // e.g., { "expansion": 1.5, "rumor": 0.5 }
  
  // Geo-specific adjustments
  geoBoosts: Record<string, number>;
  
  // Metadata
  sampleSize: number;
  lastUpdated: Date;
  version: number;
}

// Default weights (no learning applied yet)
export const DEFAULT_LEARNED_WEIGHTS: LearnedWeights = {
  id: 'learned_weights_v1',
  intentStrengthMultiplier: 1.0,
  freshnessMultiplier: 1.0,
  companySizeMultiplier: 1.0,
  trustMultiplier: 1.0,
  geoMatchMultiplier: 1.0,
  industryBoosts: {},
  sourceBoosts: {},
  keywordBoosts: {},
  geoBoosts: {},
  sampleSize: 0,
  lastUpdated: new Date(),
  version: 1,
};

// Extract keywords from lead text for learning
export function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const importantTerms = [
    'tender', 'bid', 'procurement', 'expansion', 'new plant', 'fleet',
    'capacity', 'bulk', 'annual', 'contract', 'requirement', 'urgent',
    'immediate', 'supply', 'purchase', 'project', 'investment', 'infrastructure',
    'manufacturing', 'logistics', 'transport', 'construction', 'energy',
    'refinery', 'petroleum', 'diesel', 'lubricant', 'fuel', 'bitumen'
  ];
  
  const lowerText = text.toLowerCase();
  for (const term of importantTerms) {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  }
  return keywords;
}

// Analyze feedback patterns and compute new weights
export async function analyzeFeedbackPatterns(
  feedbackCollection: Collection<Document>
): Promise<{
  patterns: any;
  suggestedWeights: Partial<LearnedWeights>;
  insights: string[];
}> {
  const insights: string[] = [];
  
  // Get all feedback with enough data
  const allFeedback = await feedbackCollection.find({}).toArray() as unknown as LeadFeedback[];
  
  if (allFeedback.length < 10) {
    return {
      patterns: null,
      suggestedWeights: {},
      insights: ['📊 Need more feedback data (minimum 10 actions) to start learning'],
    };
  }

  // Separate approved vs rejected
  const approved = allFeedback.filter(f => f.action === 'approved' || f.action === 'converted');
  const rejected = allFeedback.filter(f => f.action === 'rejected');

  // Analyze score distributions
  const avgApprovedScore = approved.length > 0 
    ? approved.reduce((sum, f) => sum + (f.leadSnapshot?.score || 0), 0) / approved.length 
    : 0;
  const avgRejectedScore = rejected.length > 0
    ? rejected.reduce((sum, f) => sum + (f.leadSnapshot?.score || 0), 0) / rejected.length
    : 0;

  insights.push(`✅ Avg score of approved leads: ${avgApprovedScore.toFixed(1)}`);
  insights.push(`❌ Avg score of rejected leads: ${avgRejectedScore.toFixed(1)}`);

  // Analyze breakdown components
  const componentAnalysis: Record<string, { approved: number[]; rejected: number[] }> = {
    intentStrength: { approved: [], rejected: [] },
    freshness: { approved: [], rejected: [] },
    companySizeProxy: { approved: [], rejected: [] },
    trust: { approved: [], rejected: [] },
  };

  for (const fb of approved) {
    if (fb.leadSnapshot) {
      componentAnalysis.intentStrength.approved.push(fb.leadSnapshot.intentStrength || 0);
      componentAnalysis.freshness.approved.push(fb.leadSnapshot.freshness || 0);
      componentAnalysis.companySizeProxy.approved.push(fb.leadSnapshot.companySizeProxy || 0);
      componentAnalysis.trust.approved.push(fb.leadSnapshot.trust || 0);
    }
  }

  for (const fb of rejected) {
    if (fb.leadSnapshot) {
      componentAnalysis.intentStrength.rejected.push(fb.leadSnapshot.intentStrength || 0);
      componentAnalysis.freshness.rejected.push(fb.leadSnapshot.freshness || 0);
      componentAnalysis.companySizeProxy.rejected.push(fb.leadSnapshot.companySizeProxy || 0);
      componentAnalysis.trust.rejected.push(fb.leadSnapshot.trust || 0);
    }
  }

  // Calculate weight adjustments
  const suggestedWeights: Partial<LearnedWeights> = {};
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  // If approved leads consistently have higher intent scores, boost intent weight
  const intentDiff = avg(componentAnalysis.intentStrength.approved) - avg(componentAnalysis.intentStrength.rejected);
  if (intentDiff > 5) {
    suggestedWeights.intentStrengthMultiplier = 1.0 + (intentDiff / 50);
    insights.push(`🎯 Intent strength is a strong predictor - boosting weight`);
  } else if (intentDiff < -3) {
    suggestedWeights.intentStrengthMultiplier = Math.max(0.7, 1.0 + (intentDiff / 50));
    insights.push(`⚠️ High intent doesn't correlate with approval - reducing weight`);
  }

  // Analyze trust score correlation
  const trustDiff = avg(componentAnalysis.trust.approved) - avg(componentAnalysis.trust.rejected);
  if (trustDiff > 10) {
    suggestedWeights.trustMultiplier = 1.2;
    insights.push(`✓ Trust score correlates with success - boosting weight`);
  }

  // Analyze industry patterns
  const industryStats: Record<string, { approved: number; rejected: number }> = {};
  for (const fb of allFeedback) {
    const industry = fb.leadSnapshot?.industry || 'Unknown';
    if (!industryStats[industry]) {
      industryStats[industry] = { approved: 0, rejected: 0 };
    }
    if (fb.action === 'approved' || fb.action === 'converted') {
      industryStats[industry].approved++;
    } else if (fb.action === 'rejected') {
      industryStats[industry].rejected++;
    }
  }

  const industryBoosts: Record<string, number> = {};
  for (const [industry, stats] of Object.entries(industryStats)) {
    const total = stats.approved + stats.rejected;
    if (total >= 3) {
      const approvalRate = stats.approved / total;
      if (approvalRate > 0.7) {
        industryBoosts[industry] = 1.0 + (approvalRate - 0.5) * 0.5;
        insights.push(`📈 ${industry}: High approval rate (${(approvalRate * 100).toFixed(0)}%) - boosting`);
      } else if (approvalRate < 0.3) {
        industryBoosts[industry] = Math.max(0.6, approvalRate + 0.3);
        insights.push(`📉 ${industry}: Low approval rate (${(approvalRate * 100).toFixed(0)}%) - reducing`);
      }
    }
  }
  if (Object.keys(industryBoosts).length > 0) {
    suggestedWeights.industryBoosts = industryBoosts;
  }

  // Analyze source type patterns
  const sourceStats: Record<string, { approved: number; rejected: number }> = {};
  for (const fb of allFeedback) {
    const source = fb.leadSnapshot?.source_type || 'unknown';
    if (!sourceStats[source]) {
      sourceStats[source] = { approved: 0, rejected: 0 };
    }
    if (fb.action === 'approved' || fb.action === 'converted') {
      sourceStats[source].approved++;
    } else if (fb.action === 'rejected') {
      sourceStats[source].rejected++;
    }
  }

  const sourceBoosts: Record<string, number> = {};
  for (const [source, stats] of Object.entries(sourceStats)) {
    const total = stats.approved + stats.rejected;
    if (total >= 3) {
      const approvalRate = stats.approved / total;
      if (approvalRate > 0.65) {
        sourceBoosts[source] = 1.0 + (approvalRate - 0.5) * 0.6;
        insights.push(`📰 ${source} sources: ${(approvalRate * 100).toFixed(0)}% approval - boosting`);
      } else if (approvalRate < 0.35) {
        sourceBoosts[source] = Math.max(0.6, approvalRate + 0.3);
        insights.push(`📰 ${source} sources: ${(approvalRate * 100).toFixed(0)}% approval - reducing`);
      }
    }
  }
  if (Object.keys(sourceBoosts).length > 0) {
    suggestedWeights.sourceBoosts = sourceBoosts;
  }

  // Analyze rejection reasons
  const rejectionReasons: Record<string, number> = {};
  for (const fb of rejected) {
    if (fb.reason) {
      rejectionReasons[fb.reason] = (rejectionReasons[fb.reason] || 0) + 1;
    }
  }
  
  const topReasons = Object.entries(rejectionReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topReasons.length > 0) {
    insights.push(`🔍 Top rejection reasons: ${topReasons.map(([r, c]) => `${r} (${c})`).join(', ')}`);
  }

  // Analyze geo patterns
  const geoStats: Record<string, { approved: number; rejected: number }> = {};
  for (const fb of allFeedback) {
    const geo = fb.leadSnapshot?.geo || 'Unknown';
    if (!geoStats[geo]) {
      geoStats[geo] = { approved: 0, rejected: 0 };
    }
    if (fb.action === 'approved' || fb.action === 'converted') {
      geoStats[geo].approved++;
    } else if (fb.action === 'rejected') {
      geoStats[geo].rejected++;
    }
  }

  const geoBoosts: Record<string, number> = {};
  for (const [geo, stats] of Object.entries(geoStats)) {
    const total = stats.approved + stats.rejected;
    if (total >= 3) {
      const approvalRate = stats.approved / total;
      if (approvalRate > 0.7) {
        geoBoosts[geo] = 1.1;
        insights.push(`📍 ${geo}: High-performing region`);
      } else if (approvalRate < 0.3) {
        geoBoosts[geo] = 0.8;
        insights.push(`📍 ${geo}: Needs attention - low approval`);
      }
    }
  }
  if (Object.keys(geoBoosts).length > 0) {
    suggestedWeights.geoBoosts = geoBoosts;
  }

  return {
    patterns: {
      totalFeedback: allFeedback.length,
      approved: approved.length,
      rejected: rejected.length,
      approvalRate: approved.length / allFeedback.length,
      avgApprovedScore,
      avgRejectedScore,
      industryStats,
      sourceStats,
      rejectionReasons,
      geoStats,
    },
    suggestedWeights,
    insights,
  };
}

// Apply learned weights to compute adjusted score
export function applyLearnedWeights(
  baseScore: number,
  breakdown: Record<string, number>,
  lead: {
    industry?: string;
    source_type?: string;
    geo?: string;
  },
  learnedWeights: LearnedWeights
): { adjustedScore: number; adjustments: string[] } {
  const adjustments: string[] = [];
  let adjustedScore = baseScore;

  // Apply component multipliers
  const intentAdjustment = (breakdown.intentStrength || 0) * (learnedWeights.intentStrengthMultiplier - 1);
  const freshnessAdjustment = (breakdown.freshness || 0) * (learnedWeights.freshnessMultiplier - 1);
  const sizeAdjustment = (breakdown.companySizeProxy || 0) * (learnedWeights.companySizeMultiplier - 1);
  const trustAdjustment = (breakdown.trustScore || 0) * (learnedWeights.trustMultiplier - 1);
  const geoAdjustment = (breakdown.geographyMatch || 0) * (learnedWeights.geoMatchMultiplier - 1);

  const componentAdjustment = intentAdjustment + freshnessAdjustment + sizeAdjustment + trustAdjustment + geoAdjustment;
  
  if (Math.abs(componentAdjustment) > 1) {
    adjustedScore += componentAdjustment;
    adjustments.push(`📊 Component weights: ${componentAdjustment > 0 ? '+' : ''}${componentAdjustment.toFixed(1)}`);
  }

  // Apply industry boost
  const industryBoost = lead.industry ? learnedWeights.industryBoosts[lead.industry] : undefined;
  if (industryBoost && industryBoost !== 1) {
    const industryAdjustment = (industryBoost - 1) * 10;
    adjustedScore += industryAdjustment;
    adjustments.push(`🏭 Industry (${lead.industry}): ${industryAdjustment > 0 ? '+' : ''}${industryAdjustment.toFixed(1)}`);
  }

  // Apply source boost
  const sourceBoost = lead.source_type ? learnedWeights.sourceBoosts[lead.source_type] : undefined;
  if (sourceBoost && sourceBoost !== 1) {
    const sourceAdjustment = (sourceBoost - 1) * 8;
    adjustedScore += sourceAdjustment;
    adjustments.push(`📰 Source (${lead.source_type}): ${sourceAdjustment > 0 ? '+' : ''}${sourceAdjustment.toFixed(1)}`);
  }

  // Apply geo boost
  const geoBoost = lead.geo ? learnedWeights.geoBoosts[lead.geo] : undefined;
  if (geoBoost && geoBoost !== 1) {
    const geoAdjustment = (geoBoost - 1) * 5;
    adjustedScore += geoAdjustment;
    adjustments.push(`📍 Region (${lead.geo}): ${geoAdjustment > 0 ? '+' : ''}${geoAdjustment.toFixed(1)}`);
  }

  return {
    adjustedScore: Math.max(0, Math.min(100, Math.round(adjustedScore))),
    adjustments,
  };
}

// Get learning summary statistics
export async function getLearningStats(
  feedbackCollection: Collection<Document>,
  weightsCollection: Collection<Document>
): Promise<{
  totalFeedback: number;
  approvalRate: number;
  learningEnabled: boolean;
  lastUpdated: Date | null;
  version: number;
  recentTrend: 'improving' | 'stable' | 'declining' | 'unknown';
}> {
  const feedbackCount = await feedbackCollection.countDocuments({});
  const approvedCount = await feedbackCollection.countDocuments({ 
    action: { $in: ['approved', 'converted'] } 
  });
  
  const weights = await weightsCollection.findOne({ id: 'learned_weights_v1' }) as LearnedWeights | null;

  // Calculate recent trend (last 7 days vs previous 7 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentApproved = await feedbackCollection.countDocuments({
    action: { $in: ['approved', 'converted'] },
    createdAt: { $gte: oneWeekAgo }
  });
  const recentTotal = await feedbackCollection.countDocuments({
    createdAt: { $gte: oneWeekAgo }
  });
  const previousApproved = await feedbackCollection.countDocuments({
    action: { $in: ['approved', 'converted'] },
    createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
  });
  const previousTotal = await feedbackCollection.countDocuments({
    createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
  });

  let recentTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown';
  if (recentTotal >= 5 && previousTotal >= 5) {
    const recentRate = recentApproved / recentTotal;
    const previousRate = previousApproved / previousTotal;
    if (recentRate > previousRate + 0.1) {
      recentTrend = 'improving';
    } else if (recentRate < previousRate - 0.1) {
      recentTrend = 'declining';
    } else {
      recentTrend = 'stable';
    }
  }

  return {
    totalFeedback: feedbackCount,
    approvalRate: feedbackCount > 0 ? approvedCount / feedbackCount : 0,
    learningEnabled: (weights?.sampleSize || 0) >= 10,
    lastUpdated: weights?.lastUpdated || null,
    version: weights?.version || 0,
    recentTrend,
  };
}
