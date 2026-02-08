/**
 * Lead Ingestion API
 * Ingests mock web signals (news, tenders) and creates leads with AI inference
 */

import { NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { inferProductNeeds } from '@/lib/openai';
import { scoreLead, scoreLeadWithLearning, shouldNotifyUrgent, normalizeName, getLearnedWeightsFromDb } from '@/lib/scoring';
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
  'Mumbai': 'Mumbai DS Region',
  'Delhi': 'Delhi DS Region',
  'Gorakhpur': 'Gorakhpur DS Region',
};

function getDSRegion(geo: string): string {
  return dsRegionMapping[geo] || `${geo} DS Region`;
}

// Send email notification for high-priority leads
async function sendLeadNotificationEmail(lead: any, user: any) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !user.email) {
    console.log(`📧 [MOCK] Email to ${user.email || 'no email'}`);
    return { success: false, mock: true };
  }

  const dsRegion = getDSRegion(lead.geo || 'Pan India');
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images.jpg`;

  const emailHtml = `
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

  try {
    const info = await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: `🔥 NEW LEAD: ${lead.company_name} (Score: ${lead.score})`,
      html: emailHtml,
    });
    console.log(`📧 Email sent to ${user.name} (${user.email}): ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Email failed to ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Notify all sales users for high-priority leads
async function notifyAllSalesUsers(lead: any, notifications: any, users: any) {
  const isHighPriority = lead.score >= 80;
  const salesUsers = await users.find({ role: { $in: ['sales', 'manager'] } }).toArray();
  
  for (const user of salesUsers) {
    // Create in-app notification
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
    
    await notifications.insertOne(notification);
    
    // Send email for high-priority leads
    if (isHighPriority && user.email) {
      console.log(`\n🚨 HIGH PRIORITY LEAD - Sending email to ${user.name}`);
      await sendLeadNotificationEmail(lead, user);
    }
  }
}

// Mock signals for demo - simulates real-time data ingestion
const mockSignals = [
  {
    company_name: 'Tata Steel Limited',
    text: 'Tata Steel announces major expansion of Kalinganagar plant, requiring additional industrial lubricants and fuel supply for new machinery',
    source: 'Economic Times',
    source_type: 'news' as const,
    timestamp: Date.now(),
    trust: 95,
    geo: 'Odisha',
    url: 'https://economictimes.com/news/tata-steel-expansion',
  },
  {
    company_name: 'Reliance Logistics',
    text: 'Reliance Logistics expanding fleet by 500 trucks for e-commerce delivery network across India',
    source: 'Business Standard',
    source_type: 'news' as const,
    timestamp: Date.now(),
    trust: 90,
    geo: 'Mumbai',
    url: 'https://business-standard.com/reliance-logistics',
  },
  {
    company_name: 'DLF Construction',
    text: 'DLF awarded ₹2,500 crore highway construction contract in Gujarat',
    source: 'Government Tender Portal',
    source_type: 'tender' as const,
    timestamp: Date.now(),
    trust: 98,
    geo: 'Gujarat',
    url: 'https://gem.gov.in/tender/dlf-highway',
  },
  {
    company_name: 'Taj Hotels',
    text: 'Taj Hotels planning to open 15 new properties across tier-2 cities with full-service kitchens',
    source: 'Hospitality Biz',
    source_type: 'news' as const,
    timestamp: Date.now(),
    trust: 85,
    geo: 'Pan India',
    url: 'https://hospitalitybiz.com/taj-expansion',
  },
  {
    company_name: 'SpiceJet Airways',
    text: 'SpiceJet announces new routes and fleet expansion with 20 additional aircraft',
    source: 'Aviation Weekly',
    source_type: 'news' as const,
    timestamp: Date.now(),
    trust: 88,
    geo: 'Delhi',
    url: 'https://aviationweekly.com/spicejet',
  },
  {
    company_name: 'Mahanadi Coalfields',
    text: 'Mahanadi Coalfields Limited requires heavy machinery and diesel supply for new mining project',
    source: 'Coal Ministry Tender',
    source_type: 'tender' as const,
    timestamp: Date.now(),
    trust: 95,
    geo: 'Chhattisgarh',
    url: 'https://coal.gov.in/tender/mcl',
  },
  {
    company_name: 'Chennai Metro Rail',
    text: 'Chennai Metro seeking suppliers for construction equipment fuel and lubricants for Phase 2 expansion',
    source: 'Chennai Metro Portal',
    source_type: 'tender' as const,
    timestamp: Date.now(),
    trust: 92,
    geo: 'Tamil Nadu',
    url: 'https://chennaimetrorail.org/tender',
  },
  {
    company_name: 'Adani Ports',
    text: 'Adani Ports planning new container terminal at Mundra requiring marine fuel and port equipment',
    source: 'Maritime India',
    source_type: 'news' as const,
    timestamp: Date.now(),
    trust: 90,
    geo: 'Gujarat',
    url: 'https://maritimeindia.com/adani-mundra',
  },
];

export async function GET() {
  try {
    await initializeDatabase();
    const { leads, notifications, users, learnedWeights } = await getCollections();
    
    // Pick a random signal for demo
    const signal = mockSignals[Math.floor(Math.random() * mockSignals.length)];
    const canonical = normalizeName(signal.company_name);

    // Check for existing lead
    const existing = await leads.findOne({ normalized_name: canonical });

    if (existing) {
      // Update existing lead
      await leads.updateOne(
        { id: existing.id },
        { 
          $set: { 
            source_text: existing.source_text + '\n---\n' + signal.text,
            trust: Math.max(existing.trust || 0, signal.trust),
            timestamp: Math.max(existing.timestamp || 0, signal.timestamp),
            updatedAt: new Date(),
          }
        }
      );
      return NextResponse.json({ 
        ok: true, 
        message: 'Updated existing lead', 
        lead: existing 
      });
    }

    // Run AI inference
    const inference = await inferProductNeeds(signal.text, signal.company_name);

    // Create new lead
    const leadId = 'lead_' + Math.random().toString(36).slice(2, 9);
    const newLead: any = {
      id: leadId,
      company_name: signal.company_name,
      normalized_name: canonical,
      industry: inference.industry,
      source: signal.source,
      source_type: signal.source_type,
      source_text: signal.text,
      source_url: signal.url,
      timestamp: signal.timestamp,
      trust: signal.trust,
      geo: signal.geo,
      status: 'new',
      inference,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Score the lead with ML-enhanced scoring
    const weights = await getLearnedWeightsFromDb(learnedWeights);
    const { score, breakdown, explanation, mlAdjusted, mlAdjustments } = scoreLeadWithLearning(newLead, weights || undefined);
    newLead.score = score;
    newLead.scoreBreakdown = breakdown;
    newLead.scoreExplanation = explanation;
    newLead.mlAdjusted = mlAdjusted;
    if (mlAdjustments) newLead.mlAdjustments = mlAdjustments;

    // Auto-assign to sales officer
    const salesUsers = await users.find({ role: 'sales' }).toArray();
    if (salesUsers.length > 0) {
      const matchedUser = salesUsers.find((u: any) => 
        signal.geo.toLowerCase().includes((u.region || '').toLowerCase())
      );
      const assignedUser = matchedUser || salesUsers[Math.floor(Math.random() * salesUsers.length)];
      newLead.assignedTo = assignedUser.id;
    }

    // Save to database
    await leads.insertOne(newLead);

    // Notify all sales users (in-app + email for high priority)
    await notifyAllSalesUsers(newLead, notifications, users);

    return NextResponse.json({
      ok: true,
      message: 'Lead created successfully',
      lead: newLead,
      emailsSent: newLead.score >= 80,
    });
  } catch (error: any) {
    console.error('GET /api/ingest error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST endpoint for manual signal submission
export async function POST(req: Request) {
  try {
    await initializeDatabase();
    const { leads, notifications, users, learnedWeights } = await getCollections();
    const body = await req.json();
    
    const { company_name, text, source = 'Manual Entry', source_type = 'manual', geo = 'India' } = body;

    if (!company_name || !text) {
      return NextResponse.json({ ok: false, error: 'company_name and text are required' }, { status: 400 });
    }

    const canonical = normalizeName(company_name);

    // Check for existing lead
    const existing = await leads.findOne({ normalized_name: canonical });

    if (existing) {
      await leads.updateOne(
        { id: existing.id },
        { 
          $set: { 
            source_text: existing.source_text + '\n---\n' + text,
            updatedAt: new Date(),
          }
        }
      );
      return NextResponse.json({ 
        ok: true, 
        message: 'Updated existing lead', 
        lead: existing 
      });
    }

    // Run AI inference
    const inference = await inferProductNeeds(text, company_name);

    // Create new lead
    const leadId = 'lead_' + Math.random().toString(36).slice(2, 9);
    const newLead: any = {
      id: leadId,
      company_name,
      normalized_name: canonical,
      industry: inference.industry,
      source,
      source_type,
      source_text: text,
      timestamp: Date.now(),
      trust: 80,
      geo,
      status: 'new',
      inference,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Score the lead with ML-enhanced scoring
    const weights = await getLearnedWeightsFromDb(learnedWeights);
    const { score, breakdown, explanation, mlAdjusted, mlAdjustments } = scoreLeadWithLearning(newLead, weights || undefined);
    newLead.score = score;
    newLead.scoreBreakdown = breakdown;
    newLead.scoreExplanation = explanation;
    newLead.mlAdjusted = mlAdjusted;
    if (mlAdjustments) newLead.mlAdjustments = mlAdjustments;

    // Auto-assign
    const salesUsers = await users.find({ role: 'sales' }).toArray();
    if (salesUsers.length > 0) {
      newLead.assignedTo = salesUsers[Math.floor(Math.random() * salesUsers.length)].id;
    }

    await leads.insertOne(newLead);

    // Notify all sales users (in-app + email for high priority)
    await notifyAllSalesUsers(newLead, notifications, users);

    return NextResponse.json({
      ok: true,
      message: 'Lead created successfully',
      lead: newLead,
      emailsSent: newLead.score >= 80,
    });
  } catch (error: any) {
    console.error('POST /api/ingest error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
