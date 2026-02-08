/**
 * AI Inference API
 * Runs OpenAI inference for product need analysis
 */

import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { inferProductNeeds } from '@/lib/openai';
import { scoreLead } from '@/lib/scoring';

export async function POST(req: Request) {
  try {
    const { leads } = await getCollections();
    const body = await req.json();
    const { id, text, company_name } = body;

    // Find lead if ID provided
    const lead = id ? await leads.findOne({ id }) : null;

    if (id && !lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    // Use provided text/company or lead's data
    const signalText = text || lead?.source_text;
    const companyName = company_name || lead?.company_name;

    if (!signalText || !companyName) {
      return NextResponse.json({ ok: false, error: 'text and company_name required' }, { status: 400 });
    }

    // Run inference
    const inference = await inferProductNeeds(signalText, companyName);

    // Update lead if exists
    if (lead) {
      // Re-score with new inference
      const leadWithInference = { ...lead, inference };
      const { score, breakdown, explanation } = scoreLead(leadWithInference);

      await leads.updateOne(
        { id: lead.id },
        {
          $set: {
            inference,
            industry: inference.industry,
            score,
            scoreBreakdown: breakdown,
            scoreExplanation: explanation,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        ok: true,
        data: {
          inference,
          score,
          breakdown,
        },
        message: 'Inference complete and lead updated',
      });
    }

    return NextResponse.json({
      ok: true,
      data: inference,
      message: 'Inference complete',
    });
  } catch (error: any) {
    console.error('POST /api/infer error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// Batch inference for leads without inference
export async function GET(req: Request) {
  try {
    const { leads } = await getCollections();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Find leads without inference
    const leadsToProcess = await leads
      .find({ inference: { $exists: false } })
      .limit(limit)
      .toArray();

    const results = [];

    for (const lead of leadsToProcess) {
      try {
        const inference = await inferProductNeeds(lead.source_text, lead.company_name);
        const leadWithInference = { ...lead, inference };
        const { score, breakdown, explanation } = scoreLead(leadWithInference);

        await leads.updateOne(
          { id: lead.id },
          {
            $set: {
              inference,
              industry: inference.industry,
              score,
              scoreBreakdown: breakdown,
              scoreExplanation: explanation,
              updatedAt: new Date(),
            },
          }
        );

        results.push({ id: lead.id, company: lead.company_name, score, status: 'success' });
      } catch (e: any) {
        results.push({ id: lead.id, company: lead.company_name, error: e.message, status: 'failed' });
      }
    }

    return NextResponse.json({
      ok: true,
      data: results,
      message: `Processed ${results.length} leads`,
    });
  } catch (error: any) {
    console.error('GET /api/infer error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
