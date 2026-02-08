/**
 * Test Notification Endpoint
 * GET /api/test-notify - Shows diagnostic info
 * POST /api/test-notify - Sends test notifications to YOUR phone/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
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

// Generate email HTML in the new format with logo
function generateLeadEmailHtml(lead: any) {
  const dsRegion = getDSRegion(lead.geo || 'Pan India');
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images.jpg`;
  
  return `
    <div style="font-family: 'Courier New', Consolas, monospace; max-width: 700px; margin: 0 auto; background: #1a1a2e; color: #eaeaea; padding: 0;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; text-align: center;">
        <img src="${logoUrl}" alt="HPCL" style="height: 50px; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">🔥 NEW HIGH PRIORITY LEAD</h1>
      </div>
      <div style="padding: 30px; background: #16213e;">
        <div style="background: #0f0f23; padding: 25px; border-radius: 8px; border: 1px solid #333;">
          <pre style="margin: 0; font-size: 14px; line-height: 1.8; color: #00ff00; white-space: pre-wrap; word-wrap: break-word;">===== FINAL LEAD OBJECT =====

company_name: ${lead.company_name}
industry: ${lead.industry || 'N/A'}
state: ${lead.geo || 'India'}
activity: ${lead.source_text?.substring(0, 200) || 'N/A'}
products: [${lead.inference?.inferred_products?.map((p: string) => `'${p}'`).join(', ') || ''}]
reasons: [${lead.inference?.reason_codes?.map((r: string) => `'${r}'`).join(', ') || ''}]
confidence: ${Math.round((lead.inference?.confidence_score || 0) * 100)}
score: ${lead.score}
urgency: ${lead.inference?.urgency_level?.charAt(0).toUpperCase() + lead.inference?.urgency_level?.slice(1) || 'High'}
assigned_region: ${dsRegion}
next_action: ${lead.inference?.suggested_next_action || 'Contact procurement manager'}

=============================</pre>
        </div>
        
        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${lead.id}" 
             style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px; font-family: Arial, sans-serif;">
            🔍 View Lead
          </a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
             style="display: inline-block; background: #4a5568; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; font-family: Arial, sans-serif;">
            📊 Dashboard
          </a>
        </div>
      </div>
      <div style="padding: 15px; text-align: center; background: #0f0f23; border-top: 1px solid #333;">
        <img src="${logoUrl}" alt="HPCL" style="height: 30px; margin-bottom: 8px; border-radius: 4px;" />
        <p style="color: #f97316; font-weight: bold; margin: 0; font-family: Arial, sans-serif; font-size: 13px;">HPCL Direct Sales - B2B Lead Intelligence</p>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 11px; font-family: Arial, sans-serif;">Powered by AI • Real-time Lead Detection</p>
      </div>
    </div>
  `;
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
