/**
 * Email Lead Info API
 * Sends lead information to all sales managers
 */

import { NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { generateLeadReportEmail } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send email with lead info
async function sendLeadEmail(to: string, lead: any, senderName?: string) {
  const emailHtml = generateLeadReportEmail(lead, senderName);

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`📧 [MOCK] Lead email to ${to}: ${lead.company_name}`);
      return { success: true, mock: true, email: to };
    }

    const info = await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `🎯 Lead Alert: ${lead.company_name} (Score: ${lead.score || 0}/100)`,
      html: emailHtml,
    });

    console.log(`📧 Lead email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, email: to };
  } catch (error: any) {
    console.error(`❌ Lead email failed to ${to}:`, error.message);
    return { success: false, error: error.message, email: to };
  }
}

// POST - Send lead info to all sales managers
export async function POST(req: Request) {
  try {
    await initializeDatabase();
    const { leads, users, notifications } = await getCollections();
    
    const body = await req.json();
    const { leadId, senderUserId } = body;

    if (!leadId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'leadId is required' 
      }, { status: 400 });
    }

    // Get the lead
    const lead = await leads.findOne({ id: leadId });
    if (!lead) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    // Get sender info
    const sender = senderUserId ? await users.findOne({ id: senderUserId }) : null;
    const senderName = sender ? sender.name : undefined;

    // Get all sales users (sales reps and managers)
    const salesUsers = await users.find({ 
      role: { $in: ['sales', 'manager', 'admin'] },
      email: { $exists: true, $ne: '' }
    }).toArray();

    if (salesUsers.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No sales users with email found' 
      }, { status: 404 });
    }

    // Send emails to all sales users
    const emailResults = await Promise.all(
      salesUsers.map(user => sendLeadEmail(user.email, lead, senderName))
    );

    const successCount = emailResults.filter(r => r.success).length;
    const failCount = emailResults.filter(r => !r.success).length;

    // Create notification for tracking
    const notification = {
      id: 'notif_email_' + Math.random().toString(36).slice(2, 8),
      title: 'Lead Email Broadcast',
      message: `Lead "${lead.company_name}" info sent to ${successCount} sales team members`,
      type: 'info',
      leadId,
      channel: 'email',
      read: false,
      createdAt: new Date(),
      emailsSent: successCount,
      emailsFailed: failCount,
      sentBy: senderUserId,
    };

    await notifications.insertOne(notification);

    // Update lead to track email sent
    await leads.updateOne(
      { id: leadId },
      { 
        $set: { 
          lastEmailBroadcast: new Date(),
          updatedAt: new Date(),
        },
        $inc: { emailBroadcastCount: 1 }
      }
    );

    return NextResponse.json({
      ok: true,
      message: `Lead information sent to ${successCount} sales team members`,
      successCount,
      failCount,
      results: emailResults,
    });

  } catch (error: any) {
    console.error('POST /api/email-lead error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// GET - Check if lead email was sent recently
export async function GET(req: Request) {
  try {
    await initializeDatabase();
    const { leads } = await getCollections();
    
    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId required' }, { status: 400 });
    }

    const lead = await leads.findOne({ id: leadId });
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lastEmailBroadcast: lead.lastEmailBroadcast || null,
      emailBroadcastCount: lead.emailBroadcastCount || 0,
    });

  } catch (error: any) {
    console.error('GET /api/email-lead error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
