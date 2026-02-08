/**
 * API Route: /api/cleanup
 * Remove duplicate leads and cleanup database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';

// GET - Show duplicates
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { leads } = await getCollections();
    
    // Get all leads
    const allLeads = await leads.find({}).sort({ createdAt: -1 }).toArray();
    
    // Group by normalized_name to find duplicates
    const grouped: Record<string, any[]> = {};
    for (const lead of allLeads) {
      const key = lead.normalized_name || lead.company_name?.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(lead);
    }
    
    // Find duplicates (more than 1 with same name)
    const duplicates: any[] = [];
    const uniqueCompanies: string[] = [];
    
    for (const [name, leadsList] of Object.entries(grouped)) {
      if (leadsList.length > 1) {
        duplicates.push({
          company: name,
          count: leadsList.length,
          ids: leadsList.map(l => l.id),
          keepId: leadsList[0].id, // Keep the newest (first since sorted desc)
          removeIds: leadsList.slice(1).map(l => l.id),
        });
      }
      uniqueCompanies.push(name);
    }
    
    return NextResponse.json({
      ok: true,
      stats: {
        totalLeads: allLeads.length,
        uniqueCompanies: uniqueCompanies.length,
        duplicateGroups: duplicates.length,
        leadsToRemove: duplicates.reduce((sum, d) => sum + d.removeIds.length, 0),
      },
      duplicates,
      message: duplicates.length > 0 
        ? `Found ${duplicates.length} companies with duplicates. POST to this endpoint to remove them.`
        : 'No duplicates found!',
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST - Remove duplicates (keep newest)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { leads, notifications } = await getCollections();
    
    // Get all leads sorted by createdAt descending (newest first)
    const allLeads = await leads.find({}).sort({ createdAt: -1 }).toArray();
    
    // Track seen companies and IDs to remove
    const seen = new Set<string>();
    const idsToRemove: string[] = [];
    
    for (const lead of allLeads) {
      const key = lead.normalized_name || lead.company_name?.toLowerCase().trim();
      if (seen.has(key)) {
        // This is a duplicate (older), mark for removal
        idsToRemove.push(lead.id);
      } else {
        seen.add(key);
      }
    }
    
    if (idsToRemove.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No duplicates found. Database is clean!',
        removed: 0,
      });
    }
    
    // Remove duplicate leads
    const deleteResult = await leads.deleteMany({ id: { $in: idsToRemove } });
    
    // Also remove notifications for deleted leads
    await notifications.deleteMany({ leadId: { $in: idsToRemove } });
    
    // Get final count
    const finalCount = await leads.countDocuments();
    
    return NextResponse.json({
      ok: true,
      message: `Successfully removed ${deleteResult.deletedCount} duplicate leads`,
      removed: deleteResult.deletedCount,
      removedIds: idsToRemove,
      remainingLeads: finalCount,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
