/**
 * Test Notification Endpoint
 * GET /api/test-notify - Shows diagnostic info
 * POST /api/test-notify - Sends test notifications to YOUR phone/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { generateHighPriorityLeadEmail } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// DS Region mapping
const dsRegionMapping: Record<string, string> = {
  'Delhi NCR': 'Delhi DS Region',
  'Maharashtra': 'Mumbai DS Region',
  'Karnataka': 'Bangalore DS Region',
  'Tamil Nadu': 'Chennai DS Region',
  'Telangana': 'Hyderabad DS Region',
  'West Bengal': 'Kolkata DS Region',
  'Gujarat': 'Ahmedabad DS Region',
  'Rajasthan': 'Jaipur DS Region',
  'Odisha': 'Bhubaneswar DS Region',
  'Kerala': 'Kochi DS Region',
  'Punjab': 'Chandigarh DS Region',
  'Uttar Pradesh': 'Lucknow DS Region',
  'Pan India': 'Corporate DS',
  'Chhattisgarh': 'Raipur DS Region',
};

function getDSRegion(geo: string): string {
  return dsRegionMapping[geo] || `${geo} DS Region`;
}

// Sample lead for testing
const sampleLead = {
  id: 'test_lead_001',
  company_name: 'Sharma Infra Ltd',
  industry: 'Infrastructure',
  geo: 'Rajasthan',
  score: 130,
  source_text: 'Highway construction contract and installation of two hot-mix asphalt plants',
  inference: {
    inferred_products: ['Bitumen'],
    reason_codes: ['Highway construction contract', 'Installation of hot-mix asphalt plants'],
    confidence_score: 0.90,
    urgency_level: 'high',
    suggested_next_action: 'Call road contractor procurement',
  },
};

// Generate email HTML using shared template
function generateLeadEmailHtml(lead: any) {
  const dsRegion = getDSRegion(lead.geo || 'Pan India');
  return generateHighPriorityLeadEmail(lead, dsRegion);
}

// GET - Show diagnostic info
export async function GET(request: NextRequest) {
  await initializeDatabase();
  const { users, leads } = await getCollections();
  
  // Get all sales/manager users
  const salesUsers = await users.find({ role: { $in: ['sales', 'manager'] } }).toArray();
  
  // Get recent high-priority leads
  const highPriorityLeads = await leads.find({ score: { $gte: 80 } }).sort({ createdAt: -1 }).limit(5).toArray();
  
  // Get recent leads
  const recentLeads = await leads.find({}).sort({ createdAt: -1 }).limit(5).toArray();
  
  return NextResponse.json({
    ok: true,
    diagnostic: {
      environment: {
        EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing',
        TWILIO_ACCOUNT_SID: TWILIO_ACCOUNT_SID ? `✅ ${TWILIO_ACCOUNT_SID.substring(0, 10)}...` : '❌ Missing',
        TWILIO_AUTH_TOKEN: TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
        TWILIO_PHONE_NUMBER: TWILIO_PHONE_NUMBER || '❌ Missing',
        TWILIO_WHATSAPP_NUMBER: TWILIO_WHATSAPP_NUMBER,
      },
      usersInDatabase: salesUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email,
        phone: u.phone,
        region: u.region,
      })),
      totalSalesUsers: salesUsers.length,
      recentLeads: recentLeads.map((l: any) => ({
        id: l.id,
        company: l.company_name,
        score: l.score,
        isHighPriority: l.score >= 80,
        createdAt: l.createdAt,
      })),
      highPriorityLeads: highPriorityLeads.map((l: any) => ({
        id: l.id,
        company: l.company_name,
        score: l.score,
      })),
    },
    instructions: {
      problem: "Notifications are sent to phone numbers in DATABASE, not your real phone!",
      solution: "POST to this endpoint with your real phone/email to test, then update database users",
      postBody: {
        phone: "+919794177498",
        email: "your-real-email@gmail.com",
        testEmail: true,
        testSMS: true,
        testWhatsApp: true,
      },
    },
  });
}

// POST - Send test notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, testEmail, testSMS, testWhatsApp, updateDatabase } = body;
    
    const results: any = {
      timestamp: new Date().toISOString(),
      email: null,
      sms: null,
      whatsapp: null,
      databaseUpdate: null,
    };
    
    // Test Email with new lead format
    if (testEmail && email) {
      try {
        const info = await transporter.sendMail({
          from: process.env.NOTIFICATION_EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: `🔥 NEW LEAD: ${sampleLead.company_name} (Score: ${sampleLead.score})`,
          html: generateLeadEmailHtml(sampleLead),
        });
        results.email = { success: true, messageId: info.messageId, sentTo: email };
      } catch (error: any) {
        results.email = { success: false, error: error.message, sentTo: email };
      }
    }
    
    // Test SMS
    if (testSMS && phone) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phone,
              From: TWILIO_PHONE_NUMBER || '',
              Body: '🧪 HPCL Lead Intelligence - Test SMS. If you see this, SMS notifications are working!',
            }),
          }
        );
        const data = await response.json();
        if (data.sid) {
          results.sms = { success: true, sid: data.sid, sentTo: phone };
        } else {
          results.sms = { success: false, error: data.message, code: data.code, sentTo: phone };
        }
      } catch (error: any) {
        results.sms = { success: false, error: error.message, sentTo: phone };
      }
    }
    
    // Test WhatsApp
    if (testWhatsApp && phone) {
      try {
        const whatsappTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
        const whatsappFrom = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
        
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: whatsappTo,
              From: whatsappFrom,
              Body: '🧪 HPCL Lead Intelligence - Test WhatsApp. If you see this, WhatsApp notifications are working!',
            }),
          }
        );
        const data = await response.json();
        if (data.sid) {
          results.whatsapp = { success: true, sid: data.sid, sentTo: whatsappTo, sentFrom: whatsappFrom };
        } else {
          results.whatsapp = { 
            success: false, 
            error: data.message, 
            code: data.code, 
            sentTo: whatsappTo,
            hint: data.code === 63007 ? 'You need to send "join <sandbox-name>" to the WhatsApp number first!' : null,
          };
        }
      } catch (error: any) {
        results.whatsapp = { success: false, error: error.message };
      }
    }
    
    // Update database users with your real phone/email
    if (updateDatabase && (phone || email)) {
      await initializeDatabase();
      const { users } = await getCollections();
      
      const updateFields: any = {};
      if (phone) updateFields.phone = phone;
      if (email) updateFields.email = email;
      
      // Update all sales/manager users
      const updateResult = await users.updateMany(
        { role: { $in: ['sales', 'manager'] } },
        { $set: updateFields }
      );
      
      results.databaseUpdate = {
        success: true,
        modifiedCount: updateResult.modifiedCount,
        message: `Updated ${updateResult.modifiedCount} users with phone: ${phone}, email: ${email}`,
      };
    }
    
    return NextResponse.json({
      ok: true,
      message: 'Test notifications attempted',
      results,
      nextSteps: !results.databaseUpdate ? [
        'To receive notifications when scraper runs,',
        'add updateDatabase: true to update user phone/email in DB',
      ] : [],
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
