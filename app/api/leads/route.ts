/**
 * API Route: /api/leads
 * Handles all lead CRUD operations with MongoDB
 * Production-ready with rate limiting and caching headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit';

interface ApiResponse {
  ok: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Helper to add standard headers
function createResponse(
  data: ApiResponse, 
  status: number = 200, 
  rateLimitHeaders: Record<string, string> = {},
  cacheControl: string = 'private, no-cache'
) {
  return NextResponse.json(data, { 
    status,
    headers: {
      'Cache-Control': cacheControl,
      ...rateLimitHeaders,
    }
  });
}

// GET - Fetch all leads or filtered leads
export async function GET(request: NextRequest) {
  // Rate limiting
  const { allowed, headers: rateLimitHeaders } = checkRateLimit(request, rateLimitConfigs.default);
  if (!allowed) {
    return createResponse(
      { ok: false, error: 'Too many requests. Please try again later.' },
      429,
      rateLimitHeaders
    );
  }

  try {
    await initializeDatabase();
    const { leads } = await getCollections();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // If ID provided, fetch single lead
    if (id) {
      const lead = await leads.findOne({ id });
      if (!lead) {
        return createResponse({ ok: false, error: 'Lead not found' }, 404, rateLimitHeaders);
      }
      return createResponse(
        { ok: true, data: [lead] },
        200,
        rateLimitHeaders,
        'private, max-age=30' // Cache single lead for 30 seconds
      );
    }

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const result = await leads
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .toArray();

    return createResponse(
      { ok: true, data: result },
      200,
      rateLimitHeaders,
      'private, max-age=10' // Cache list for 10 seconds
    );
  } catch (error: any) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json<ApiResponse>({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { leads } = await getCollections();
    const body = await request.json();

    const newLead: any = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      company_name: body.company_name,
      normalized_name: body.company_name?.toLowerCase().replace(/[^a-z0-9]/g, ''),
      industry: body.industry || 'Unknown',
      source: body.source || 'Manual Entry',
      source_type: body.source_type || 'manual',
      source_text: body.source_text || body.company_name,
      source_url: body.source_url,
      timestamp: Date.now(),
      trust: body.trust || 70,
      geo: body.geo || 'India',
      status: 'new',
      score: body.score,
      scoreBreakdown: body.scoreBreakdown,
      scoreExplanation: body.scoreExplanation,
      inference: body.inference,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await leads.insertOne(newLead);

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: newLead,
      message: 'Lead created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json<ApiResponse>({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update a lead
export async function PATCH(request: NextRequest) {
  try {
    const { leads } = await getCollections();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Lead ID is required' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const result = await leads.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: result,
      message: 'Lead updated successfully',
    });
  } catch (error: any) {
    console.error('PATCH /api/leads error:', error);
    return NextResponse.json<ApiResponse>({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const { leads } = await getCollections();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const result = await leads.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      ok: true,
      message: 'Lead deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/leads error:', error);
    return NextResponse.json<ApiResponse>({ ok: false, error: error.message }, { status: 500 });
  }
}
