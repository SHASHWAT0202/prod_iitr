/**
 * API Route: /api/cron
 * Cron job endpoint for Vercel/Railway scheduled tasks
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron",
 *     "schedule": "0/5 * * * *" (Every 5 minutes)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, verify the request is from your cron service
  // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Run lead scraper and competitor scraper in parallel
    const [scraperRes, competitorRes] = await Promise.all([
      fetch(`${baseUrl}/api/scraper`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);
    
    const scraperData = await scraperRes.json();
    const competitorData = await competitorRes.json();
    
    console.log(`[CRON] Scraper run at ${new Date().toISOString()}:`, scraperData);
    console.log(`[CRON] Competitor scan at ${new Date().toISOString()}:`, competitorData);
    
    return NextResponse.json({
      ok: true,
      message: 'Cron job executed successfully',
      scraper_result: scraperData,
      competitor_result: competitorData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
