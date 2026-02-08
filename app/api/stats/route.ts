/**
 * API Route: /api/stats
 * Provides dashboard statistics with caching and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limiting
  const { allowed, headers: rateLimitHeaders } = checkRateLimit(request, rateLimitConfigs.relaxed);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: rateLimitHeaders
      }
    );
  }

  try {
    await initializeDatabase();
    const { leads, analytics } = await getCollections();

    // Calculate stats in parallel for better performance
    const [
      totalLeads,
      newLeads,
      inProgress,
      converted,
      rejected,
      leadsThisWeek,
      allLeadsWithScore,
      highPriorityCount,
      sectorAgg,
      regionAgg,
      productAgg,
    ] = await Promise.all([
      leads.countDocuments(),
      leads.countDocuments({ status: 'new' }),
      leads.countDocuments({ status: 'in_progress' }),
      leads.countDocuments({ status: 'converted' }),
      leads.countDocuments({ status: 'rejected' }),
      leads.countDocuments({ timestamp: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 } }),
      leads.find({ score: { $exists: true } }).toArray(),
      leads.countDocuments({ score: { $gt: 75 }, status: 'new' }),
      leads.aggregate([{ $group: { _id: '$industry', count: { $sum: 1 } } }]).toArray(),
      leads.aggregate([{ $group: { _id: '$geo', count: { $sum: 1 } } }]).toArray(),
      leads.aggregate([
        { $unwind: { path: '$inference.inferred_products', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$inference.inferred_products', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
    ]);

    // Calculate average score
    const avgScore = allLeadsWithScore.length > 0 
      ? Math.round(allLeadsWithScore.reduce((sum, l) => sum + (l.score || 0), 0) / allLeadsWithScore.length)
      : 0;

    // Conversion rate
    const conversionRate = totalLeads > 0 
      ? Math.round((converted / totalLeads) * 100) 
      : 0;

    // Sector distribution
    const sectorDistribution: Record<string, number> = {};
    sectorAgg.forEach((s: any) => {
      sectorDistribution[s._id || 'Unknown'] = s.count;
    });

    // Top products from parallel query
    const topProducts = productAgg.map((p: any) => ({
      name: p._id,
      count: p.count,
    }));

    // Region distribution from parallel query
    const regionDistribution: Record<string, number> = {};
    regionAgg.forEach((r: any) => {
      regionDistribution[r._id || 'Unknown'] = r.count;
    });

    // Update analytics collection
    await analytics.updateOne(
      { id: 'main' },
      {
        $set: {
          total_leads: totalLeads,
          new_leads: newLeads,
          in_progress_leads: inProgress,
          converted_leads: converted,
          rejected_leads: rejected,
          leads_this_week: leadsThisWeek,
          conversion_rate: conversionRate,
          sector_distribution: sectorDistribution,
          region_distribution: regionDistribution,
          top_products: topProducts.map((p: any) => p.name),
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json<ApiResponse>(
      {
        ok: true,
        data: {
          totalLeads,
          newLeads,
          inProgress,
          converted,
          rejected,
          leadsThisWeek,
          avgScore,
          highPriorityCount,
          conversionRate,
          sectorDistribution,
          regionDistribution,
          topProducts,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=15', // Cache stats for 15 seconds
          ...rateLimitHeaders,
        }
      }
    );
  } catch (error: any) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: error.message }, 
      { 
        status: 500,
        headers: rateLimitHeaders
      }
    );
  }
}
