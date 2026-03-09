/**
 * API Route: /api/competitors
 * Competitor Monitoring — scrape, store, and retrieve competitor intelligence signals.
 * 
 * GET  — Fetch stored competitor signals (with filters)
 * POST — Run competitor scraper and store new signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { runCompetitorScraper, processCompetitorSignals } from '@/lib/competitor-scraper';

// GET — Retrieve competitor signals
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { competitorSignals } = await getCollections();
    const { searchParams } = new URL(request.url);

    // Build filter
    const filter: Record<string, any> = {};
    const competitor = searchParams.get('competitor');
    const activityType = searchParams.get('activityType');
    const impactLevel = searchParams.get('impactLevel');
    const geo = searchParams.get('geo');
    const days = parseInt(searchParams.get('days') || '30');

    if (competitor) filter.competitor = competitor;
    if (activityType) filter.activityType = activityType;
    if (impactLevel) filter.impactLevel = impactLevel;
    if (geo) filter.geo = { $regex: geo, $options: 'i' };

    // Date filter
    const since = new Date();
    since.setDate(since.getDate() - days);
    filter.createdAt = { $gte: since };

    const signals = await competitorSignals
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Build stats
    const allSignals = await competitorSignals.find({ createdAt: { $gte: since } }).toArray();
    const competitorBreakdown: Record<string, number> = {};
    const activityBreakdown: Record<string, number> = {};
    const impactBreakdown: Record<string, number> = {};
    const geoBreakdown: Record<string, number> = {};
    const weeklyTrend: Record<string, number> = {};

    for (const sig of allSignals) {
      competitorBreakdown[sig.competitor] = (competitorBreakdown[sig.competitor] || 0) + 1;
      activityBreakdown[sig.activityType] = (activityBreakdown[sig.activityType] || 0) + 1;
      impactBreakdown[sig.impactLevel] = (impactBreakdown[sig.impactLevel] || 0) + 1;
      geoBreakdown[sig.geo] = (geoBreakdown[sig.geo] || 0) + 1;

      // Weekly buckets
      const weekStart = new Date(sig.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().substring(0, 10);
      weeklyTrend[weekKey] = (weeklyTrend[weekKey] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        signals,
        total: allSignals.length,
        filtered: signals.length,
        stats: {
          competitorBreakdown,
          activityBreakdown,
          impactBreakdown,
          geoBreakdown,
          weeklyTrend,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Competitor GET error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST — Run competitor scraper
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { competitorSignals, apiUsage } = await getCollections();

    const body = await request.json().catch(() => ({}));
    const usePaidApis = body.usePaidApis !== false;

    console.log(`\n🏢 Running Competitor Scraper (paid=${usePaidApis})`);

    // Run scraper
    const report = await runCompetitorScraper(apiUsage, { usePaidApis });

    // Process and store
    const result = await processCompetitorSignals(competitorSignals, report);

    return NextResponse.json({
      ok: true,
      message: `Competitor scan complete. ${result.inserted} new signals, ${result.duplicates} duplicates skipped.`,
      data: {
        newSignals: result.inserted,
        duplicatesSkipped: result.duplicates,
        totalScraped: report.totalSignals,
        sourceBreakdown: report.sourceBreakdown,
        competitorBreakdown: report.competitorBreakdown,
        signals: result.signals,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Competitor POST error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
