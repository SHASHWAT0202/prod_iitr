/**
 * Email Lead Info API
 * Sends lead information to all sales managers
 */

import { NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
    };
    return colors[urgency] || '#6b7280';
  };

  const urgency = lead.inference?.urgency_level || 'medium';
  const products = lead.inference?.inferred_products || [];
  const reasoning = lead.inference?.reasoning || 'No AI reasoning available';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 650px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Hindustan_Petroleum_Logo.svg/1200px-Hindustan_Petroleum_Logo.svg.png" 
               alt="HPCL" style="height: 50px; margin-bottom: 10px;" />
          <h1 style="color: white; margin: 10px 0 5px; font-size: 24px;">Lead Intelligence Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
            ${senderName ? `Shared by ${senderName}` : 'New Lead Information'}
          </p>
        </div>

        <!-- Score Banner -->
        <div style="background: ${getScoreColor(lead.score)}; padding: 20px; text-align: center;">
          <span style="color: white; font-size: 48px; font-weight: bold;">${lead.score || 0}</span>
          <span style="color: rgba(255,255,255,0.9); font-size: 16px;">/100</span>
          <p style="color: white; margin: 5px 0 0; font-size: 14px;">Lead Score</p>
        </div>

        <!-- Lead Details -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${lead.company_name}
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 140px;">Industry</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${lead.inference?.industry || lead.industry || 'Unknown'}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Source</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${lead.source || 'Unknown'}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Geography</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${lead.geo || 'India'}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Priority</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="background: ${getUrgencyBadge(urgency)}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ${urgency} Priority
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Status</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${lead.status?.replace('_', ' ').toUpperCase() || 'NEW'}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Trust Score</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${lead.trust || 0}%
              </td>
            </tr>
            ${lead.inference?.confidence_score ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">AI Confidence</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
                ${Math.round(lead.inference.confidence_score * 100)}%
              </td>
            </tr>
            ` : ''}
          </table>

          ${products.length > 0 ? `
          <!-- Recommended Products -->
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin: 0 0 15px; font-size: 16px;">🎯 Recommended Products</h3>
            <div>
              ${products.map((p: string) => `
                <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; margin: 4px 4px 4px 0; font-size: 13px;">
                  ${p}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${lead.scoreBreakdown ? `
          <!-- Score Breakdown -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px;">📊 Score Breakdown</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Intent Strength</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${lead.scoreBreakdown.intentStrength || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Freshness</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${lead.scoreBreakdown.freshness || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Company Size Proxy</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${lead.scoreBreakdown.companySizeProxy || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Source Trust</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${lead.scoreBreakdown.sourceTrust || 0}</td>
              </tr>
            </table>
          </div>
          ` : ''}

          <!-- AI Reasoning -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">🤖 AI Analysis</h3>
            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
              ${reasoning}
            </p>
          </div>

          ${lead.source_text ? `
          <!-- Source Text -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 10px; font-size: 16px;">📝 Source Information</h3>
            <p style="color: #4b5563; margin: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">
              ${lead.source_text.substring(0, 500)}${lead.source_text.length > 500 ? '...' : ''}
            </p>
          </div>
          ` : ''}

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/leads/${lead.id}" 
               style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                      color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View Full Lead Details →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; padding: 25px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 5px; font-size: 13px;">
            HPCL Direct Sales - B2B Lead Intelligence Platform
          </p>
          <p style="color: #6b7280; margin: 0; font-size: 11px;">
            This email was sent from the HPCL Lead Intelligence System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

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
