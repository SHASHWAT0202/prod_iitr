/**
 * API Route: /api/feedback
 * Records user feedback on leads and manages ML-based learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { 
  LeadFeedback, 
  RejectionReason, 
  FeedbackAction,
  extractKeywords,
  analyzeFeedbackPatterns,
  DEFAULT_LEARNED_WEIGHTS,
  getLearningStats,
} from '@/lib/feedback-learning';

// POST - Record new feedback
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const db = await getCollections();
    const { leads, feedback, learnedWeights } = db;
    
    const body = await request.json();
    const { leadId, userId, action, reason, notes } = body;

    if (!leadId || !action) {
      return NextResponse.json({ 
        ok: false, 
        error: 'leadId and action are required' 
      }, { status: 400 });
    }

    // Validate action
    const validActions: FeedbackAction[] = ['approved', 'rejected', 'converted', 'contacted'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 });
    }
    const validatedAction = action as FeedbackAction;

    // Get the lead to capture snapshot
    const lead = await leads.findOne({ id: leadId });
    if (!lead) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    // Create lead snapshot for learning
    const leadSnapshot = {
      score: lead.score || 0,
      source_type: lead.source_type || 'unknown',
      industry: lead.inference?.industry || lead.industry || 'Unknown',
      geo: lead.geo || 'Unknown',
      trust: lead.trust || 0,
      intentStrength: lead.scoreBreakdown?.intentStrength || 0,
      freshness: lead.scoreBreakdown?.freshness || 0,
      companySizeProxy: lead.scoreBreakdown?.companySizeProxy || 0,
      keywords: extractKeywords(lead.source_text || ''),
      inferenceConfidence: lead.inference?.confidence_score,
      urgencyLevel: lead.inference?.urgency_level,
    };

    // Create feedback record
    const feedbackRecord: LeadFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      leadId,
      userId: userId || 'anonymous',
      action: validatedAction,
      reason: reason as RejectionReason | undefined,
      notes,
      leadSnapshot,
      createdAt: new Date(),
    };

    // Insert feedback
    await feedback.insertOne(feedbackRecord);

    // Update lead status based on action
    const statusMap: Record<FeedbackAction, string> = {
      'approved': 'in_progress',
      'rejected': 'rejected',
      'converted': 'converted',
      'contacted': 'in_progress',
    };

    await leads.updateOne(
      { id: leadId },
      { 
        $set: { 
          status: statusMap[validatedAction],
          updatedAt: new Date(),
          lastFeedback: {
            action: validatedAction,
            reason,
            at: new Date(),
          }
        }
      }
    );

    // Check if we should trigger learning update
    const feedbackCount = await feedback.countDocuments({});
    let learningTriggered = false;
    let insights: string[] = [];

    // Trigger learning every 5 feedback entries or on converted leads
    if (feedbackCount >= 10 && (feedbackCount % 5 === 0 || action === 'converted')) {
      const analysis = await analyzeFeedbackPatterns(feedback);
      
      if (analysis.suggestedWeights && Object.keys(analysis.suggestedWeights).length > 0) {
        // Update learned weights
        const existingWeights = await learnedWeights.findOne({ id: 'learned_weights_v1' });
        const currentWeights = existingWeights || DEFAULT_LEARNED_WEIGHTS;
        
        const updatedWeights = {
          ...currentWeights,
          ...analysis.suggestedWeights,
          sampleSize: feedbackCount,
          lastUpdated: new Date(),
          version: (currentWeights.version || 0) + 1,
        };

        await learnedWeights.updateOne(
          { id: 'learned_weights_v1' },
          { $set: updatedWeights },
          { upsert: true }
        );

        learningTriggered = true;
        insights = analysis.insights;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Feedback recorded: ${action}`,
      feedbackId: feedbackRecord.id,
      learningTriggered,
      insights: learningTriggered ? insights : undefined,
    });
  } catch (error: any) {
    console.error('POST /api/feedback error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET - Get learning stats and insights
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { feedback, learnedWeights } = await getCollections();
    const { searchParams } = new URL(request.url);
    
    const action = searchParams.get('action');

    // Return learning stats
    if (action === 'stats') {
      const stats = await getLearningStats(feedback, learnedWeights);
      return NextResponse.json({
        ok: true,
        data: stats,
      });
    }

    // Return full analysis
    if (action === 'analyze') {
      const analysis = await analyzeFeedbackPatterns(feedback);
      const weights = await learnedWeights.findOne({ id: 'learned_weights_v1' });
      
      return NextResponse.json({
        ok: true,
        data: {
          patterns: analysis.patterns,
          insights: analysis.insights,
          currentWeights: weights || DEFAULT_LEARNED_WEIGHTS,
          suggestedWeights: analysis.suggestedWeights,
        },
      });
    }

    // Return recent feedback
    const limit = parseInt(searchParams.get('limit') || '20');
    const leadId = searchParams.get('leadId');

    const query: any = {};
    if (leadId) {
      query.leadId = leadId;
    }

    const recentFeedback = await feedback
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      ok: true,
      data: recentFeedback,
    });
  } catch (error: any) {
    console.error('GET /api/feedback error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Clear feedback (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    const { feedback, learnedWeights } = await getCollections();
    const { searchParams } = new URL(request.url);
    
    const confirm = searchParams.get('confirm');
    
    if (confirm !== 'yes') {
      return NextResponse.json({
        ok: false,
        error: 'Add ?confirm=yes to confirm deletion',
      }, { status: 400 });
    }

    // Reset feedback and learned weights
    await feedback.deleteMany({});
    await learnedWeights.deleteMany({});

    return NextResponse.json({
      ok: true,
      message: 'Feedback and learned weights have been reset',
    });
  } catch (error: any) {
    console.error('DELETE /api/feedback error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}
