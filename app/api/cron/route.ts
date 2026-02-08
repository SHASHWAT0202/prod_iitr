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
    // Call the scraper endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/scraper`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log(`[CRON] Scraper run at ${new Date().toISOString()}:`, data);
    
    return NextResponse.json({
      ok: true,
      message: 'Cron job executed successfully',
      scraper_result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
