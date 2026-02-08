/**
 * API Route: /api/scraper
 * 24/7 Web Scraper with REAL NewsAPI integration
 * This endpoint can be called by Vercel Cron, Railway Cron, or external services
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { inferProductNeeds } from '@/lib/openai';
import { scoreLead, shouldNotifyUrgent, normalizeName } from '@/lib/scoring';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Generate unique hash for signal deduplication
function generateSignalHash(companyName: string, text: string): string {
  const normalized = `${companyName.toLowerCase().trim()}-${text.toLowerCase().trim().substring(0, 150)}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

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

// Extract geo from article text
function extractGeo(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(geoMapping)) {
    if (lowerText.includes(key)) return value;
  }
  return 'Pan India';
}

// Extract company name from article (simplified heuristic)
function extractCompanyName(title: string, description: string): string | null {
  const text = `${title} ${description}`;
  
  // Common Indian company patterns
  const patterns = [
    /\b(Tata|Reliance|Adani|JSW|Larsen|L&T|Infosys|Wipro|HCL|Mahindra|Bajaj|Hindustan|Indian Oil|ONGC|NTPC|BHEL|Coal India|SAIL|GAIL|BPCL|IOC|Air India|Maruti|Hero|TVS|Ashok Leyland|Ultratech|ACC|Ambuja|Dalmia|JK Cement|Vedanta|Hindalco|Jindal|SpiceJet|IndiGo|Zomato|Swiggy|Flipkart|Ola|NHAI|DMRC|Metro Rail|Airport|Railways)\b[^,.]*/gi,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Limited|Ltd|Corporation|Corp|Industries|Group|Pvt|Private|Company)\b/g,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      return match[0].trim().replace(/\s+/g, ' ');
    }
  }
  return null;
}

// Fetch REAL news from NewsAPI
async function fetchRealNews(): Promise<Array<{
  company_name: string;
  text: string;
  source: string;
  source_type: 'news' | 'tender';
  trust: number;
  geo: string;
  url: string;
}>> {
  if (!NEWSAPI_KEY) {
    console.log('⚠️ NewsAPI key not found, using fallback data');
    return fallbackSignals;
  }

  try {
    // Search for Indian business news about expansions, contracts, tenders
    const queries = [
      'India expansion plant factory',
      'India tender contract infrastructure',
      'India fleet logistics transport',
      'Indian company crore investment',
    ];
    
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(randomQuery)}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=10&` +
      `apiKey=${NEWSAPI_KEY}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      console.error('NewsAPI error:', response.status, await response.text());
      return fallbackSignals;
    }

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log('No articles found, using fallback');
      return fallbackSignals;
    }

    console.log(`📰 Fetched ${data.articles.length} real news articles from NewsAPI`);

    // Transform NewsAPI articles to our signal format
    const signals = data.articles
      .map((article: any) => {
        const companyName = extractCompanyName(article.title || '', article.description || '');
        if (!companyName) return null;

        const fullText = `${article.title || ''}. ${article.description || ''}`;
        
        return {
          company_name: companyName,
          text: fullText.substring(0, 500),
          source: article.source?.name || 'News',
          source_type: 'news' as const,
          trust: article.source?.name?.includes('Times') || article.source?.name?.includes('Standard') ? 90 : 85,
          geo: extractGeo(fullText),
          url: article.url || '',
        };
      })
      .filter((s: any) => s !== null);

    if (signals.length === 0) {
      console.log('No valid signals extracted, using fallback');
      return fallbackSignals;
    }

    return signals;
  } catch (error) {
    console.error('Error fetching news:', error);
    return fallbackSignals;
  }
}

// Fallback signals when NewsAPI is unavailable
const fallbackSignals = [
  {
    company_name: 'Larsen & Toubro',
    text: 'L&T wins ₹7,000 crore contract for Mumbai-Ahmedabad bullet train civil works. Massive construction equipment and fuel requirements expected.',
    source: 'Economic Times',
    source_type: 'news' as const,
    trust: 95,
    geo: 'Maharashtra',
    url: 'https://economictimes.com/lt-bullet-train',
  },
  {
    company_name: 'Indian Oil Corporation',
    text: 'IOC to set up new refinery in Nagapattinam with 9 MTPA capacity. Seeking equipment suppliers and industrial lubricants.',
    source: 'Business Standard',
    source_type: 'news' as const,
    trust: 92,
    geo: 'Tamil Nadu',
    url: 'https://business-standard.com/ioc-refinery',
  },
  {
    company_name: 'Ashok Leyland',
    text: 'Ashok Leyland to manufacture 10,000 electric buses. Requires industrial lubricants for manufacturing facility expansion.',
    source: 'Auto Car India',
    source_type: 'news' as const,
    trust: 88,
    geo: 'Chennai',
    url: 'https://autocarindia.com/ashok-leyland',
  },
  {
    company_name: 'NHAI',
    text: 'NHAI invites tenders for Bharatmala Phase 2 - 5,000 km road construction. Bitumen and diesel suppliers needed.',
    source: 'Government Tender Portal',
    source_type: 'tender' as const,
    trust: 98,
    geo: 'Pan India',
    url: 'https://nhai.gov.in/tender',
  },
  {
    company_name: 'JSW Steel',
    text: 'JSW Steel Dolvi plant expansion announcement. ₹15,000 crore investment for capacity increase to 10 MTPA.',
    source: 'Moneycontrol',
    source_type: 'news' as const,
    trust: 90,
    geo: 'Maharashtra',
    url: 'https://moneycontrol.com/jsw-steel',
  },
  {
    company_name: 'Hindalco Industries',
    text: 'Hindalco to set up new aluminium smelter in Odisha. Industrial fuel and lubricant requirements for heavy machinery.',
    source: 'Business Line',
    source_type: 'news' as const,
    trust: 89,
    geo: 'Odisha',
    url: 'https://thehindubusinessline.com/hindalco',
  },
  {
    company_name: 'Zomato',
    text: 'Zomato expands delivery fleet with 50,000 new vehicles. Looking for fuel card partnerships and bulk diesel supply.',
    source: 'Tech Crunch India',
    source_type: 'news' as const,
    trust: 85,
    geo: 'Pan India',
    url: 'https://techcrunch.com/zomato-fleet',
  },
  {
    company_name: 'Cochin Shipyard',
    text: 'Cochin Shipyard wins contract to build 6 Next-Gen Offshore Patrol Vessels. Marine fuel and lubricant supply tender open.',
    source: 'Defense News',
    source_type: 'tender' as const,
    trust: 94,
    geo: 'Kerala',
    url: 'https://defensenews.in/cochin-shipyard',
  },
  {
    company_name: 'Air India',
    text: 'Air India fleet modernization: 470 new aircraft order. Seeking ATF supply partnerships at 20+ airports.',
    source: 'Aviation Times',
    source_type: 'news' as const,
    trust: 93,
    geo: 'Pan India',
    url: 'https://aviationtimes.com/air-india',
  },
  {
    company_name: 'Ultratech Cement',
    text: 'Ultratech Cement to add 22 MTPA capacity across India. Furnace oil and diesel requirements for new plants.',
    source: 'Cement World',
    source_type: 'news' as const,
    trust: 87,
    geo: 'Pan India',
    url: 'https://cementworld.com/ultratech',
  },
];

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
        // Get DS Region from lead geo
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

// GET - Run scraper (can be triggered by cron)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { leads, notifications, users, analytics } = await getCollections();
    const { searchParams } = new URL(request.url);
    const forceNew = searchParams.get('force') === 'true';
    const useRealNews = searchParams.get('real') !== 'false'; // Default to real news
    
    // Fetch signals - real from NewsAPI or fallback
    console.log(`🔍 Scraper running (real=${useRealNews}, force=${forceNew})`);
    const allSignals = useRealNews ? await fetchRealNews() : fallbackSignals;
    
    // Get all existing signal hashes to filter duplicates
    const existingLeads = await leads.find({}, { projection: { signal_hash: 1, normalized_name: 1 } }).toArray();
    const existingHashes = new Set(existingLeads.map((l: any) => l.signal_hash).filter(Boolean));
    const existingNames = new Set(existingLeads.map((l: any) => l.normalized_name).filter(Boolean));
    
    // Filter out duplicate signals BEFORE processing
    const uniqueSignals = allSignals.filter(signal => {
      const hash = generateSignalHash(signal.company_name, signal.text);
      const canonical = normalizeName(signal.company_name);
      
      if (existingHashes.has(hash)) {
        console.log(`⏭️ Skipping duplicate signal (hash match): ${signal.company_name}`);
        return false;
      }
      if (existingNames.has(canonical) && !forceNew) {
        console.log(`⏭️ Skipping duplicate signal (company match): ${signal.company_name}`);
        return false;
      }
      return true;
    });
    
    console.log(`📊 Found ${allSignals.length} signals, ${uniqueSignals.length} are unique`);
    
    if (uniqueSignals.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No new unique signals found. All articles already processed.',
        data: {
          processed: 0,
          newLeads: 0,
          duplicatesSkipped: allSignals.length,
          results: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Pick 1-3 random UNIQUE signals to process
    const numSignals = forceNew ? Math.min(3, uniqueSignals.length) : Math.min(Math.floor(Math.random() * 3) + 1, uniqueSignals.length);
    const shuffled = [...uniqueSignals].sort(() => 0.5 - Math.random());
    const signalsToProcess = shuffled.slice(0, numSignals);
    
    const results: any[] = [];
    const newLeadsCreated: any[] = [];
    const duplicatesSkipped = allSignals.length - uniqueSignals.length;
    
    for (const signal of signalsToProcess) {
      const canonical = normalizeName(signal.company_name);
      const signalHash = generateSignalHash(signal.company_name, signal.text);
      
      // Double check for duplicate (in case of race condition)
      const existing = await leads.findOne({ 
        $or: [
          { signal_hash: signalHash },
          { normalized_name: canonical }
        ]
      });
      
      if (existing && !forceNew) {
        console.log(`⏭️ Skipping (already exists): ${signal.company_name}`);
        results.push({ company: signal.company_name, action: 'skipped_duplicate', id: existing.id });
        continue;
      }
      
      // Run AI inference
      const inference = await inferProductNeeds(signal.text, signal.company_name);
      
      // Create new lead with signal hash
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
      
      // Score the lead
      const { score, breakdown, explanation } = scoreLead(newLead);
      newLead.score = score;
      newLead.scoreBreakdown = breakdown;
      newLead.scoreExplanation = explanation;
      
      // Auto-assign based on region
      const salesUsers = await users.find({ role: 'sales' }).toArray();
      if (salesUsers.length > 0) {
        const matchedUser = salesUsers.find((u: any) => 
          signal.geo.toLowerCase().includes((u.region || '').toLowerCase()) ||
          (u.territory || '').toLowerCase().includes(signal.geo.toLowerCase())
        );
        newLead.assignedTo = matchedUser?.id || salesUsers[Math.floor(Math.random() * salesUsers.length)].id;
      }
      
      // Save lead
      await leads.insertOne(newLead);
      newLeadsCreated.push(newLead);
      
      // Send notifications to ALL sales users
      await notifyAllSalesUsers(newLead, notifications, users);
      
      results.push({ company: signal.company_name, action: 'created', id: leadId, score });
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔔 NEW LEAD DETECTED BY SCRAPER`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Company: ${newLead.company_name}`);
      console.log(`Industry: ${newLead.industry}`);
      console.log(`Score: ${newLead.score}`);
      console.log(`Products: ${newLead.inference?.inferred_products?.join(', ')}`);
      console.log(`Urgency: ${newLead.inference?.urgency_level}`);
      console.log(`${'='.repeat(60)}\n`);
    }
    
    // Update analytics
    const totalLeads = await leads.countDocuments();
    const newLeads = await leads.countDocuments({ status: 'new' });
    
    await analytics.updateOne(
      { id: 'main' },
      {
        $set: {
          total_leads: totalLeads,
          new_leads: newLeads,
          updated_at: new Date(),
        },
        $inc: {
          leads_found_by_scraper: newLeadsCreated.length,
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      ok: true,
      message: `Scraper run complete. Created ${newLeadsCreated.length} new leads, skipped ${duplicatesSkipped} duplicates.`,
      data: {
        processed: results.length,
        newLeads: newLeadsCreated.length,
        duplicatesSkipped,
        totalSignalsFetched: allSignals.length,
        uniqueSignals: uniqueSignals.length,
        highPriorityLeads: newLeadsCreated.filter((l: any) => l.score >= 80).length,
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
