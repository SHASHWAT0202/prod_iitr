/**
 * Notification API
 * Handles in-app notifications, email, and WhatsApp alerts
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

// Send real email
async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`📧 [MOCK] Email to ${to}: ${subject}`);
      return { success: true, mock: true };
    }

    const info = await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// GET - Fetch notifications
export async function GET(req: Request) {
  try {
    await initializeDatabase();
    const { notifications } = await getCollections();
    const url = new URL(req.url);
    
    const userId = url.searchParams.get('userId');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const query: any = {};
    if (userId) {
      query.$or = [{ userId }, { userId: { $exists: false } }];
    }
    if (unreadOnly) {
      query.read = false;
    }

    const result = await notifications
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error: any) {
    console.error('GET /api/notify error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST - Create notification
export async function POST(req: Request) {
  try {
    const { notifications, leads, users } = await getCollections();
    const body = await req.json();
    const { leadId, channel = 'app', message, type = 'info', title, userEmail, userName } = body;

    // Find lead if provided
    const lead = leadId ? await leads.findOne({ id: leadId }) : null;
    const assignedUser = lead?.assignedTo ? await users.findOne({ id: lead.assignedTo }) : null;

    // Create notification
    const notification = {
      id: 'notif_' + Math.random().toString(36).slice(2, 8),
      title: title || (lead ? `Alert: ${lead.company_name}` : 'Notification'),
      message: message || 'New notification',
      type,
      leadId,
      channel,
      read: false,
      createdAt: new Date(),
    };

    await notifications.insertOne(notification);

    // Send real email notification
    if (channel === 'email' && userEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔥 HPCL Lead Intelligence</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">${notification.title}</h2>
            <p style="color: #4b5563; font-size: 16px;">${notification.message}</p>
            ${lead ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f97316; margin-top: 0;">Lead Details</h3>
                <p><strong>Company:</strong> ${lead.company_name}</p>
                <p><strong>Industry:</strong> ${lead.industry}</p>
                <p><strong>Score:</strong> ${lead.score}/100</p>
                <p><strong>Urgency:</strong> ${lead.urgency}</p>
              </div>
            ` : ''}
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Dashboard
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>HPCL Direct Sales - B2B Lead Intelligence Platform</p>
          </div>
        </div>
      `;

      await sendEmail(
        userEmail,
        `🔔 ${notification.title}`,
        emailHtml
      );
    }

    // WhatsApp notification (simulated with console log)
    if (channel === 'whatsapp') {
      console.log('\n' + '='.repeat(50));
      console.log('📱 WHATSAPP NOTIFICATION');
      console.log('='.repeat(50));
      console.log(`To: ${(assignedUser as any)?.phone || userName || 'Sales Team'}`);
      console.log(`Message: ${notification.message}`);
      console.log('='.repeat(50) + '\n');
    }

    return NextResponse.json({
      ok: true,
      data: notification,
      message: 'Notification created',
    });
  } catch (error: any) {
    console.error('POST /api/notify error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Mark notification as read
export async function PATCH(req: Request) {
  try {
    const { notifications } = await getCollections();
    const body = await req.json();
    const { id, markAllRead, userId } = body;

    if (markAllRead) {
      const query: any = { read: false };
      if (userId) {
        query.$or = [{ userId }, { userId: { $exists: false } }];
      }
      await notifications.updateMany(query, { $set: { read: true } });
      
      return NextResponse.json({
        ok: true,
        message: 'All notifications marked as read',
      });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Notification ID required' }, { status: 400 });
    }

    await notifications.updateOne({ id }, { $set: { read: true } });

    return NextResponse.json({
      ok: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('PATCH /api/notify error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Clear notifications
export async function DELETE(req: Request) {
  try {
    const { notifications } = await getCollections();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const clearAll = url.searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await notifications.deleteMany({});
      return NextResponse.json({
        ok: true,
        message: 'All notifications cleared',
      });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Notification ID required' }, { status: 400 });
    }

    await notifications.deleteOne({ id });

    return NextResponse.json({
      ok: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('DELETE /api/notify error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
