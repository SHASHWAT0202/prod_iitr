/**
 * Lead Scoring and Action API
 * Handles lead status updates, scoring, and routing
 */

import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { scoreLead, shouldNotifyUrgent } from '@/lib/scoring';

export async function POST(req: Request) {
  try {
    const { leads, notifications } = await getCollections();
    const body = await req.json();
    const { id, action, note } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Lead ID required' }, { status: 400 });
    }

    // Find lead
    const lead = await leads.findOne({ id });
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    const previousStatus = lead.status;
    let newStatus = lead.status;
    let notificationMessage = '';
    let notificationType = 'info';

    // Update status based on action
    switch (action) {
      case 'accept':
        newStatus = 'in_progress';
        notificationMessage = `Lead accepted: ${lead.company_name}`;
        notificationType = 'success';
        break;
      case 'reject':
        newStatus = 'rejected';
        notificationMessage = `Lead rejected: ${lead.company_name}`;
        notificationType = 'error';
        break;
      case 'convert':
      case 'converted':
        newStatus = 'converted';
        notificationMessage = `🎉 Lead converted: ${lead.company_name}`;
        notificationType = 'success';
        break;
      case 'reopen':
        newStatus = 'new';
        notificationMessage = `Lead reopened: ${lead.company_name}`;
        notificationType = 'info';
        break;
    }

    // Update lead
    const updates: any = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (note) updates.note = note;

    await leads.updateOne({ id }, { $set: updates });

    // Create notification
    if (notificationMessage) {
      const notification = {
        id: 'notif_' + Date.now(),
        title: action === 'convert' || action === 'converted' ? '🎉 Lead Converted!' : 
               action === 'accept' ? '✅ Lead Accepted' :
               action === 'reject' ? '❌ Lead Rejected' : '🔔 Lead Updated',
        message: notificationMessage,
        type: notificationType,
        leadId: id,
        userId: lead.assignedTo,
        channel: 'app',
        read: false,
        createdAt: new Date(),
      };
      await notifications.insertOne(notification);

      // Mock WhatsApp for important actions
      if (action === 'convert' || action === 'converted') {
        console.log(`📱 WhatsApp: ${notificationMessage}`);
      }
    }

    return NextResponse.json({
      ok: true,
      data: { ...lead, status: newStatus, note: updates.note },
      message: notificationMessage || 'Lead updated',
    });
  } catch (error: any) {
    console.error('POST /api/score error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// Rescore all leads or single lead
export async function GET(req: Request) {
  try {
    const { leads } = await getCollections();
    const url = new URL(req.url);
    const leadId = url.searchParams.get('id');

    if (leadId) {
      // Score single lead
      const lead = await leads.findOne({ id: leadId });
      if (!lead) {
        return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
      }

      const { score, breakdown, explanation } = scoreLead(lead as any);
      await leads.updateOne(
        { id: leadId },
        { $set: { score, scoreBreakdown: breakdown, scoreExplanation: explanation, updatedAt: new Date() } }
      );

      return NextResponse.json({
        ok: true,
        data: { id: leadId, score, breakdown, explanation },
      });
    }

    // Rescore all leads
    const allLeads = await leads.find({}).toArray();
    const results = [];

    for (const lead of allLeads) {
      const { score, breakdown, explanation } = scoreLead(lead as any);
      await leads.updateOne(
        { id: lead.id },
        { $set: { score, scoreBreakdown: breakdown, scoreExplanation: explanation, updatedAt: new Date() } }
      );
      results.push({ id: lead.id, company: lead.company_name, score });
    }

    return NextResponse.json({
      ok: true,
      data: results,
      message: `Rescored ${results.length} leads`,
    });
  } catch (error: any) {
    console.error('GET /api/score error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
