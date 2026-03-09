/**
 * API Route: /api/scraper
 * Multi-Source Web Scraper with Google RSS, NewsData.io, MediaStack, and NewsAPI
 * Sources are rate-limited to respect monthly quotas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { inferProductNeeds } from '@/lib/openai';
import { scoreLead, shouldNotifyUrgent, normalizeName } from '@/lib/scoring';
import { generateHighPriorityLeadEmail } from '@/lib/email-templates';
import { runAllScrapers, getApiUsageStats, generateSignalHash, RawSignal } from '@/lib/multi-scraper';
import nodemailer from 'nodemailer';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

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

// Send SMS via Twilio
async function sendSMS(to: string, message: string) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
      console.log(`📱 [MOCK] SMS to ${to}: ${message.substring(0, 50)}...`);
      return { success: true, mock: true };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER || '',
          Body: message,
        }),
      }
    );

    const data = await response.json();
    if (data.sid) {
      console.log(`📱 SMS sent to ${to}: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`❌ SMS failed to ${to}:`, data.message);
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error(`❌ SMS error to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsApp(to: string, message: string) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
      console.log(`💬 [MOCK] WhatsApp to ${to}: ${message.substring(0, 50)}...`);
      return { success: true, mock: true };
    }

    // Format phone number for WhatsApp (must include country code)
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
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
          Body: message,
        }),
      }
    );

    const data = await response.json();
    if (data.sid) {
      console.log(`💬 WhatsApp sent to ${to}: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`❌ WhatsApp failed to ${to}:`, data.message);
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error(`❌ WhatsApp error to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Indian state/city to region mapping
const geoMapping: Record<string, string> = {
  'delhi': 'Delhi NCR', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'maharashtra': 'Maharashtra',
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'karnataka': 'Karnataka',
  'chennai': 'Tamil Nadu', 'tamil nadu': 'Tamil Nadu', 'hyderabad': 'Telangana',
  'kolkata': 'West Bengal', 'west bengal': 'West Bengal', 'gujarat': 'Gujarat',
  'ahmedabad': 'Gujarat', 'rajasthan': 'Rajasthan', 'odisha': 'Odisha',
  'kerala': 'Kerala', 'punjab': 'Punjab', 'uttar pradesh': 'Uttar Pradesh',
  'india': 'Pan India', 'national': 'Pan India',
};

// State/Region to DS Region mapping (HPCL Direct Sales Regions)
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
  'Madhya Pradesh': 'Bhopal DS Region',
  'Bihar': 'Patna DS Region',
  'Jharkhand': 'Ranchi DS Region',
  'Assam': 'Guwahati DS Region',
  'Gorakhpur': 'Gorakhpur DS Region',
};

// Get DS Region from geo
function getDSRegion(geo: string): string {
  return dsRegionMapping[geo] || `${geo} DS Region`;
}

// Send notification to all sales users - ONLY for HIGH PRIORITY leads (score >= 80)
async function notifyAllSalesUsers(lead: any, notifications: any, users: any) {
  const isHighPriority = lead.score >= 80;
  const salesUsers = await users.find({ role: { $in: ['sales', 'manager'] } }).toArray();
  
  // Create lead description for messages
  const leadDescription = `
🏢 Company: ${lead.company_name}
📊 Industry: ${lead.industry || 'N/A'}
⭐ Score: ${lead.score}/100
📍 Location: ${lead.geo || 'India'}
🛢️ Products: ${lead.inference?.inferred_products?.join(', ') || 'N/A'}
📰 Source: ${lead.source}

📝 Signal: "${lead.source_text?.substring(0, 150)}..."

🔗 View: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${lead.id}
  `.trim();

  const smsMessage = `🔥 HPCL HIGH PRIORITY LEAD!\n${lead.company_name} (Score: ${lead.score})\n${lead.industry} - ${lead.geo}\nProducts: ${lead.inference?.inferred_products?.slice(0, 2).join(', ') || 'N/A'}`;

  const whatsappMessage = `🔥 *HPCL HIGH PRIORITY LEAD ALERT*\n\n${leadDescription}`;
  
  const notificationPromises = salesUsers.map(async (user: any) => {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: isHighPriority ? '🔥 High Priority Lead!' : '🆕 New Lead Detected',
      message: `${lead.company_name} - ${lead.industry} (Score: ${lead.score})`,
      type: isHighPriority ? 'warning' : 'info',
      leadId: lead.id,
      userId: user.id,
      channel: 'app',
      read: false,
      createdAt: new Date(),
    };
    
    // Always save in-app notification
    await notifications.insertOne(notification);
    
    // ONLY send Email, SMS, WhatsApp for HIGH PRIORITY leads
    if (isHighPriority) {
      console.log(`\n🚨 HIGH PRIORITY LEAD - Notifying ${user.name} via all channels`);
      
      // Send Email
      if (user.email) {
        const dsRegion = getDSRegion(lead.geo || 'Pan India');
        const emailHtml = generateHighPriorityLeadEmail(lead, dsRegion);

        const emailResult = await sendEmail(
          user.email,
          `🔥 URGENT: High Priority Lead - ${lead.company_name} (Score: ${lead.score}/100)`,
          emailHtml
        );
        console.log(`📧 Email to ${user.name} (${user.email}):`, emailResult.success ? '✅ SENT' : `❌ FAILED: ${emailResult.error}`);
      }
      
      // Send SMS
      if (user.phone) {
        const smsResult = await sendSMS(user.phone, smsMessage);
        console.log(`📱 SMS to ${user.name} (${user.phone}):`, smsResult.success ? '✅ SENT' : `❌ FAILED: ${smsResult.error}`);
      }
      
      // Send WhatsApp
      if (user.phone) {
        const waResult = await sendWhatsApp(user.phone, whatsappMessage);
        console.log(`💬 WhatsApp to ${user.name} (${user.phone}):`, waResult.success ? '✅ SENT' : `❌ FAILED: ${waResult.error}`);
      }
    }
    
    return notification;
  });
  
  return Promise.all(notificationPromises);
}

// GET - Run multi-source scraper (can be triggered by cron)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { leads, notifications, users, analytics, apiUsage } = await getCollections();
    const { searchParams } = new URL(request.url);
    const forceNew = searchParams.get('force') === 'true';
    const usePaidApis = searchParams.get('real') !== 'false';
    
    console.log(`🔍 Multi-source scraper running (paid=${usePaidApis}, force=${forceNew})`);
    
    // Run all scrapers (Google RSS always, paid APIs conditionally)
    const report = await runAllScrapers(apiUsage, { usePaidApis });
    const allSignals = report.signals;
    
    console.log(`📡 Sources: ${Object.entries(report.sourceBreakdown).map(([src, info]) => `${src}(${info.count})`).join(', ')}`);
    
    // Get existing leads for deduplication
    const existingLeads = await leads.find({}, { projection: { signal_hash: 1, normalized_name: 1 } }).toArray();
    const existingHashes = new Set(existingLeads.map((l: any) => l.signal_hash).filter(Boolean));
    const existingNames = new Set(existingLeads.map((l: any) => l.normalized_name).filter(Boolean));
    
    // Filter duplicates
    const uniqueSignals = allSignals.filter(signal => {
      const hash = generateSignalHash(signal.company_name, signal.text);
      const canonical = normalizeName(signal.company_name);
      
      if (existingHashes.has(hash)) {
        console.log(`⏭️ Skipping duplicate (hash): ${signal.company_name}`);
        return false;
      }
      if (existingNames.has(canonical) && !forceNew) {
        console.log(`⏭️ Skipping duplicate (company): ${signal.company_name}`);
        return false;
      }
      return true;
    });
    
    console.log(`📊 ${allSignals.length} signals total, ${uniqueSignals.length} unique`);
    
    if (uniqueSignals.length === 0) {
      const apiStats = await getApiUsageStats(apiUsage);
      return NextResponse.json({
        ok: true,
        message: 'No new unique signals found.',
        data: {
          processed: 0,
          newLeads: 0,
          duplicatesSkipped: allSignals.length,
          results: [],
          sourceBreakdown: report.sourceBreakdown,
          apiUsage: apiStats,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Pick 1-3 random unique signals to process
    const numSignals = forceNew ? Math.min(3, uniqueSignals.length) : Math.min(Math.floor(Math.random() * 3) + 1, uniqueSignals.length);
    const shuffled = [...uniqueSignals].sort(() => 0.5 - Math.random());
    const signalsToProcess = shuffled.slice(0, numSignals);
    
    const results: any[] = [];
    const newLeadsCreated: any[] = [];
    const duplicatesSkipped = allSignals.length - uniqueSignals.length;
    
    for (const signal of signalsToProcess) {
      const canonical = normalizeName(signal.company_name);
      const signalHash = generateSignalHash(signal.company_name, signal.text);
      
      // Race-condition guard
      const existing = await leads.findOne({ 
        $or: [{ signal_hash: signalHash }, { normalized_name: canonical }]
      });
      
      if (existing && !forceNew) {
        results.push({ company: signal.company_name, action: 'skipped_duplicate', id: existing.id });
        continue;
      }
      
      // AI inference
      const inference = await inferProductNeeds(signal.text, signal.company_name);
      
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newLead: any = {
        id: leadId,
        company_name: signal.company_name,
        normalized_name: canonical,
        signal_hash: signalHash,
        industry: inference.industry,
        source: signal.source,
        source_type: signal.source_type,
        source_text: signal.text,
        source_url: signal.url,
        timestamp: Date.now(),
        trust: signal.trust,
        geo: signal.geo,
        status: 'new',
        inference,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Score
      const { score, breakdown, explanation } = scoreLead(newLead);
      newLead.score = score;
      newLead.scoreBreakdown = breakdown;
      newLead.scoreExplanation = explanation;
      
      // Auto-assign by region
      const salesUsers = await users.find({ role: 'sales' }).toArray();
      if (salesUsers.length > 0) {
        const matchedUser = salesUsers.find((u: any) => 
          signal.geo.toLowerCase().includes((u.region || '').toLowerCase()) ||
          (u.territory || '').toLowerCase().includes(signal.geo.toLowerCase())
        );
        newLead.assignedTo = matchedUser?.id || salesUsers[Math.floor(Math.random() * salesUsers.length)].id;
      }
      
      await leads.insertOne(newLead);
      newLeadsCreated.push(newLead);
      await notifyAllSalesUsers(newLead, notifications, users);
      
      results.push({ company: signal.company_name, action: 'created', id: leadId, score, source: signal.source });
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔔 NEW LEAD: ${newLead.company_name} | Score: ${newLead.score} | Source: ${signal.source}`);
      console.log(`   Products: ${newLead.inference?.inferred_products?.join(', ')}`);
      console.log(`${'='.repeat(60)}\n`);
    }
    
    // Update analytics
    const totalLeads = await leads.countDocuments();
    const newLeadsCount = await leads.countDocuments({ status: 'new' });
    
    await analytics.updateOne(
      { id: 'main' },
      {
        $set: { total_leads: totalLeads, new_leads: newLeadsCount, updated_at: new Date() },
        $inc: { leads_found_by_scraper: newLeadsCreated.length },
      },
      { upsert: true }
    );
    
    const apiStats = await getApiUsageStats(apiUsage);
    
    return NextResponse.json({
      ok: true,
      message: `Scraper complete. ${newLeadsCreated.length} new leads from ${Object.keys(report.sourceBreakdown).length} sources.`,
      data: {
        processed: results.length,
        newLeads: newLeadsCreated.length,
        duplicatesSkipped,
        totalSignalsFetched: allSignals.length,
        uniqueSignals: uniqueSignals.length,
        highPriorityLeads: newLeadsCreated.filter((l: any) => l.score >= 80).length,
        sourceBreakdown: report.sourceBreakdown,
        apiUsage: apiStats,
        results,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Scraper error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST - Configure scraper settings
export async function POST(request: NextRequest) {
  try {
    const { leads, notifications, users } = await getCollections();
    const body = await request.json();
    
    // Manual signal submission
    if (body.signal) {
      const signal = body.signal;
      const canonical = normalizeName(signal.company_name);
      const signalHash = generateSignalHash(signal.company_name, signal.text);
      
      // Check for duplicate
      const existing = await leads.findOne({ 
        $or: [
          { signal_hash: signalHash },
          { normalized_name: canonical }
        ]
      });
      
      if (existing) {
        return NextResponse.json({
          ok: false,
          error: 'Duplicate lead - this signal has already been processed',
          existingLeadId: existing.id,
        }, { status: 409 });
      }
      
      const inference = await inferProductNeeds(signal.text, signal.company_name);
      
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newLead: any = {
        id: leadId,
        company_name: signal.company_name,
        normalized_name: canonical,
        signal_hash: signalHash,
        industry: inference.industry,
        source: signal.source || 'Manual Entry',
        source_type: signal.source_type || 'manual',
        source_text: signal.text,
        timestamp: Date.now(),
        trust: signal.trust || 80,
        geo: signal.geo || 'India',
        status: 'new',
        inference,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const { score, breakdown, explanation } = scoreLead(newLead);
      newLead.score = score;
      newLead.scoreBreakdown = breakdown;
      newLead.scoreExplanation = explanation;
      
      await leads.insertOne(newLead);
      
      // Only notify for high priority leads
      if (newLead.score >= 80) {
        await notifyAllSalesUsers(newLead, notifications, users);
      }
      
      return NextResponse.json({
        ok: true,
        message: newLead.score >= 80 
          ? 'High priority lead created! All sales reps notified via Email, SMS, and WhatsApp.'
          : 'Lead created successfully.',
        data: newLead,
        notificationsSent: newLead.score >= 80,
      });
    }
    
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Scraper POST error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
