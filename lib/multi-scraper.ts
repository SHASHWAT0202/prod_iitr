/**
 * Multi-Source Scraper Engine for HPCL Lead Intelligence
 * 
 * Sources (priority order):
 * 1. Google News RSS — FREE, unlimited, primary source
 * 2. NewsData.io API — 100 req/month, used sparingly
 * 3. MediaStack API — 100 req/month, used sparingly  
 * 4. NewsAPI — existing, used as supplementary
 * 
 * Rate limiting tracked in MongoDB to respect monthly quotas.
 */

import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RawSignal {
  company_name: string;
  text: string;
  source: string;
  source_type: 'news' | 'tender' | 'rss';
  trust: number;
  geo: string;
  url: string;
  scraperSource: 'google_rss' | 'newsdata' | 'mediastack' | 'newsapi' | 'fallback';
}

interface ScraperResult {
  source: string;
  signals: RawSignal[];
  error?: string;
  usedApiCall: boolean;
}

interface ApiUsageDoc {
  apiName: string;
  month: string; // "2026-03"
  callCount: number;
  lastUsed: Date;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const MEDIASTACK_KEY = process.env.MEDIASTACK_API_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

const MONTHLY_LIMIT = 90; // Keep 10 call buffer from the 100 limit

// Search queries targeting HPCL-relevant industries
const SEARCH_QUERIES = [
  'India tender contract fuel supply',
  'India expansion plant factory investment',
  'India fleet logistics transport diesel',
  'India infrastructure highway construction',
  'India steel cement manufacturing expansion',
  'India oil gas petroleum supply',
  'India mining coal power project',
  'India aviation shipping port expansion',
  'India hotel hospitality chain expansion',
  'India industrial project crore investment',
];

// Indian company name patterns for extraction
const COMPANY_PATTERNS = [
  /\b(Tata|Reliance|Adani|JSW|Larsen|L&T|Infosys|Wipro|HCL|Mahindra|Bajaj|Hindustan|Indian Oil|ONGC|NTPC|BHEL|Coal India|SAIL|GAIL|BPCL|IOC|Air India|Maruti|Hero|TVS|Ashok Leyland|Ultratech|ACC|Ambuja|Dalmia|JK Cement|Vedanta|Hindalco|Jindal|SpiceJet|IndiGo|Zomato|Swiggy|Flipkart|Ola|NHAI|DMRC|Metro Rail|Airport|Railways|Cochin Shipyard|Bharat Forge|HAL|BEML|Thermax|Godrej|Kirloskar|IOCL|HPCL|Cairn|Essar|Torrent|Adani Ports|Mundra|Paradip|Vizag Steel|RINL|NMDC|MOIL|Nalco|IRCTC|GMR|GVK|HCC|NCC|Dilip Buildcon|IRB Infra|KEC International|Kalpataru|Sterlite|Suzlon|Tata Power|CESC|NHPC|SJVN|Power Grid)\b[^,.\n]*/gi,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Limited|Ltd|Corporation|Corp|Industries|Group|Pvt|Private|Company|Infra|Energy|Power|Steel|Cement|Logistics|Transport|Aviation|Marine|Shipping)\b/g,
];

// Geo extraction mapping
const GEO_KEYWORDS: Record<string, string> = {
  'delhi': 'Delhi NCR', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'maharashtra': 'Maharashtra',
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'karnataka': 'Karnataka',
  'chennai': 'Tamil Nadu', 'tamil nadu': 'Tamil Nadu', 'hyderabad': 'Telangana', 'telangana': 'Telangana',
  'kolkata': 'West Bengal', 'west bengal': 'West Bengal', 'gujarat': 'Gujarat',
  'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'rajasthan': 'Rajasthan', 'jaipur': 'Rajasthan',
  'odisha': 'Odisha', 'bhubaneswar': 'Odisha', 'kerala': 'Kerala', 'kochi': 'Kerala',
  'punjab': 'Punjab', 'chandigarh': 'Punjab', 'uttar pradesh': 'Uttar Pradesh', 'lucknow': 'Uttar Pradesh',
  'noida': 'Uttar Pradesh', 'gorakhpur': 'Uttar Pradesh', 'chhattisgarh': 'Chhattisgarh', 'raipur': 'Chhattisgarh',
  'madhya pradesh': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
  'jharkhand': 'Jharkhand', 'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand',
  'bihar': 'Bihar', 'patna': 'Bihar', 'assam': 'Assam', 'guwahati': 'Assam',
  'goa': 'Goa', 'visakhapatnam': 'Andhra Pradesh', 'vizag': 'Andhra Pradesh',
  'andhra pradesh': 'Andhra Pradesh', 'nagpur': 'Maharashtra',
  'india': 'Pan India', 'national': 'Pan India', 'pan india': 'Pan India',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractGeo(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, region] of Object.entries(GEO_KEYWORDS)) {
    if (lower.includes(keyword)) return region;
  }
  return 'Pan India';
}

function extractCompanyName(text: string): string | null {
  for (const pattern of COMPANY_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[0]) {
      const name = match[0].trim().replace(/\s+/g, ' ').substring(0, 80);
      if (name.length >= 3) return name;
    }
  }
  return null;
}

function getRandomQuery(): string {
  return SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
}

function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7); // "2026-03"
}

export function generateSignalHash(companyName: string, text: string): string {
  const normalized = `${companyName.toLowerCase().trim()}-${text.toLowerCase().trim().substring(0, 150)}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// ─── Rate Limit Tracking ─────────────────────────────────────────────────────

async function getApiUsage(collection: any, apiName: string): Promise<number> {
  const month = getCurrentMonth();
  const doc = await collection.findOne({ apiName, month });
  return doc?.callCount || 0;
}

async function incrementApiUsage(collection: any, apiName: string): Promise<void> {
  const month = getCurrentMonth();
  await collection.updateOne(
    { apiName, month },
    { $inc: { callCount: 1 }, $set: { lastUsed: new Date() } },
    { upsert: true }
  );
}

async function canUseApi(collection: any, apiName: string): Promise<boolean> {
  const usage = await getApiUsage(collection, apiName);
  return usage < MONTHLY_LIMIT;
}

// ─── Source 1: Google News RSS (FREE, UNLIMITED) ─────────────────────────────

async function scrapeGoogleRSS(): Promise<ScraperResult> {
  const query = getRandomQuery();
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' India')}&hl=en-IN&gl=IN&ceid=IN:en`;
  
  try {
    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'HPCL-LeadSense/1.0' },
    });
    
    if (!response.ok) {
      return { source: 'google_rss', signals: [], error: `HTTP ${response.status}`, usedApiCall: false };
    }
    
    const xml = await response.text();
    
    // Parse RSS XML — extract <item> blocks
    const items: RawSignal[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    for (const itemXml of itemMatches.slice(0, 15)) {
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
      const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() || '';
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
      const sourceName = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || 'Google News';
      
      const fullText = `${title}. ${description}`;
      const companyName = extractCompanyName(fullText);
      if (!companyName) continue;
      
      // Determine trust based on source
      let trust = 80;
      const srcLower = sourceName.toLowerCase();
      if (srcLower.includes('times') || srcLower.includes('standard') || srcLower.includes('hindu') || srcLower.includes('mint')) trust = 92;
      else if (srcLower.includes('moneycontrol') || srcLower.includes('livemint') || srcLower.includes('ndtv')) trust = 90;
      else if (srcLower.includes('reuters') || srcLower.includes('bloomberg')) trust = 95;
      
      items.push({
        company_name: companyName,
        text: fullText.substring(0, 500),
        source: sourceName,
        source_type: fullText.toLowerCase().includes('tender') || fullText.toLowerCase().includes('bid') ? 'tender' : 'news',
        trust,
        geo: extractGeo(fullText),
        url: link,
        scraperSource: 'google_rss',
      });
    }
    
    console.log(`📡 Google RSS: ${items.length} signals from query "${query}"`);
    return { source: 'google_rss', signals: items, usedApiCall: false };
  } catch (error: any) {
    console.error('Google RSS error:', error.message);
    return { source: 'google_rss', signals: [], error: error.message, usedApiCall: false };
  }
}

// ─── Source 2: NewsData.io API (100/month) ───────────────────────────────────

async function scrapeNewsData(apiUsageCollection: any): Promise<ScraperResult> {
  if (!NEWSDATA_KEY) {
    return { source: 'newsdata', signals: [], error: 'No API key', usedApiCall: false };
  }
  
  if (!(await canUseApi(apiUsageCollection, 'newsdata'))) {
    console.log('⚠️ NewsData.io monthly limit reached, skipping');
    return { source: 'newsdata', signals: [], error: 'Monthly limit reached', usedApiCall: false };
  }
  
  try {
    const keywords = 'tender OR expansion OR contract OR infrastructure OR fleet';
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(keywords)}&country=in&language=en&category=business`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return { source: 'newsdata', signals: [], error: `HTTP ${response.status}`, usedApiCall: false };
    }
    
    await incrementApiUsage(apiUsageCollection, 'newsdata');
    
    const data = await response.json();
    const articles = data.results || [];
    
    const signals: RawSignal[] = [];
    for (const article of articles.slice(0, 10)) {
      const fullText = `${article.title || ''}. ${article.description || ''}`;
      const companyName = extractCompanyName(fullText);
      if (!companyName) continue;
      
      let trust = 85;
      const sourceName = article.source_name || article.source_id || 'NewsData';
      if (sourceName.toLowerCase().includes('times') || sourceName.toLowerCase().includes('standard')) trust = 92;
      
      signals.push({
        company_name: companyName,
        text: fullText.substring(0, 500),
        source: sourceName,
        source_type: fullText.toLowerCase().includes('tender') ? 'tender' : 'news',
        trust,
        geo: extractGeo(fullText),
        url: article.link || '',
        scraperSource: 'newsdata',
      });
    }
    
    const usage = await getApiUsage(apiUsageCollection, 'newsdata');
    console.log(`📰 NewsData.io: ${signals.length} signals (${usage}/${MONTHLY_LIMIT} calls this month)`);
    return { source: 'newsdata', signals, usedApiCall: true };
  } catch (error: any) {
    console.error('NewsData.io error:', error.message);
    return { source: 'newsdata', signals: [], error: error.message, usedApiCall: false };
  }
}

// ─── Source 3: MediaStack API (100/month) ────────────────────────────────────

async function scrapeMediaStack(apiUsageCollection: any): Promise<ScraperResult> {
  if (!MEDIASTACK_KEY) {
    return { source: 'mediastack', signals: [], error: 'No API key', usedApiCall: false };
  }
  
  if (!(await canUseApi(apiUsageCollection, 'mediastack'))) {
    console.log('⚠️ MediaStack monthly limit reached, skipping');
    return { source: 'mediastack', signals: [], error: 'Monthly limit reached', usedApiCall: false };
  }
  
  try {
    const keywords = 'India,tender,expansion,infrastructure,fuel,contract';
    // MediaStack free tier only supports http (not https)
    const url = `http://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}&keywords=${encodeURIComponent(keywords)}&countries=in&languages=en&limit=10&sort=published_desc`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return { source: 'mediastack', signals: [], error: `HTTP ${response.status}`, usedApiCall: false };
    }
    
    await incrementApiUsage(apiUsageCollection, 'mediastack');
    
    const data = await response.json();
    const articles = data.data || [];
    
    const signals: RawSignal[] = [];
    for (const article of articles.slice(0, 10)) {
      const fullText = `${article.title || ''}. ${article.description || ''}`;
      const companyName = extractCompanyName(fullText);
      if (!companyName) continue;
      
      signals.push({
        company_name: companyName,
        text: fullText.substring(0, 500),
        source: article.source || 'MediaStack',
        source_type: fullText.toLowerCase().includes('tender') ? 'tender' : 'news',
        trust: 83,
        geo: extractGeo(fullText),
        url: article.url || '',
        scraperSource: 'mediastack',
      });
    }
    
    const usage = await getApiUsage(apiUsageCollection, 'mediastack');
    console.log(`📡 MediaStack: ${signals.length} signals (${usage}/${MONTHLY_LIMIT} calls this month)`);
    return { source: 'mediastack', signals, usedApiCall: true };
  } catch (error: any) {
    console.error('MediaStack error:', error.message);
    return { source: 'mediastack', signals: [], error: error.message, usedApiCall: false };
  }
}

// ─── Source 4: NewsAPI (existing) ────────────────────────────────────────────

async function scrapeNewsAPI(apiUsageCollection: any): Promise<ScraperResult> {
  if (!NEWSAPI_KEY) {
    return { source: 'newsapi', signals: [], error: 'No API key', usedApiCall: false };
  }
  
  if (!(await canUseApi(apiUsageCollection, 'newsapi'))) {
    console.log('⚠️ NewsAPI monthly limit reached, skipping');
    return { source: 'newsapi', signals: [], error: 'Monthly limit reached', usedApiCall: false };
  }
  
  try {
    const query = getRandomQuery();
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return { source: 'newsapi', signals: [], error: `HTTP ${response.status}`, usedApiCall: false };
    }
    
    await incrementApiUsage(apiUsageCollection, 'newsapi');
    
    const data = await response.json();
    const articles = data.articles || [];
    
    const signals: RawSignal[] = [];
    for (const article of articles) {
      const fullText = `${article.title || ''}. ${article.description || ''}`;
      const companyName = extractCompanyName(fullText);
      if (!companyName) continue;
      
      let trust = 85;
      const sourceName = article.source?.name || 'News';
      if (sourceName.includes('Times') || sourceName.includes('Standard') || sourceName.includes('Reuters')) trust = 92;
      
      signals.push({
        company_name: companyName,
        text: fullText.substring(0, 500),
        source: sourceName,
        source_type: 'news',
        trust,
        geo: extractGeo(fullText),
        url: article.url || '',
        scraperSource: 'newsapi',
      });
    }
    
    const usage = await getApiUsage(apiUsageCollection, 'newsapi');
    console.log(`📰 NewsAPI: ${signals.length} signals (${usage}/${MONTHLY_LIMIT} calls this month)`);
    return { source: 'newsapi', signals, usedApiCall: true };
  } catch (error: any) {
    console.error('NewsAPI error:', error.message);
    return { source: 'newsapi', signals: [], error: error.message, usedApiCall: false };
  }
}

// ─── Main: Run All Scrapers ──────────────────────────────────────────────────

export interface MultiScraperOptions {
  /** Use paid APIs (NewsData, MediaStack, NewsAPI). If false, only Google RSS. */
  usePaidApis?: boolean;
  /** Force specific sources. If empty, uses smart selection. */
  forceSources?: ('google_rss' | 'newsdata' | 'mediastack' | 'newsapi')[];
}

export interface MultiScraperReport {
  totalSignals: number;
  signals: RawSignal[];
  sourceBreakdown: Record<string, { count: number; error?: string; usedApiCall: boolean }>;
  apiUsage: { newsdata: number; mediastack: number; newsapi: number };
}

/**
 * Fetch signals from all available scrapers.
 * 
 * Strategy:
 * - Google RSS runs EVERY time (free, unlimited)
 * - Paid APIs run only if:
 *   1. usePaidApis !== false
 *   2. They have remaining monthly quota
 *   3. Google RSS alone yielded < 3 signals (to save API calls)
 */
export async function runAllScrapers(
  apiUsageCollection: any,
  options: MultiScraperOptions = {}
): Promise<MultiScraperReport> {
  const { usePaidApis = true, forceSources } = options;
  
  const report: MultiScraperReport = {
    totalSignals: 0,
    signals: [],
    sourceBreakdown: {},
    apiUsage: { newsdata: 0, mediastack: 0, newsapi: 0 },
  };
  
  // 1. Always run Google RSS first (free)
  const shouldRunSource = (name: string) => !forceSources || forceSources.includes(name as any);
  
  if (shouldRunSource('google_rss')) {
    const rssResult = await scrapeGoogleRSS();
    report.sourceBreakdown['google_rss'] = { count: rssResult.signals.length, error: rssResult.error, usedApiCall: false };
    report.signals.push(...rssResult.signals);
  }
  
  // 2. Run paid APIs only if needed and allowed
  const needMore = report.signals.length < 3;
  
  if (usePaidApis || forceSources) {
    // Run paid sources in parallel to save time
    const paidPromises: Promise<ScraperResult>[] = [];
    
    if (shouldRunSource('newsdata') && (needMore || forceSources)) {
      paidPromises.push(scrapeNewsData(apiUsageCollection));
    }
    if (shouldRunSource('mediastack') && (needMore || forceSources)) {
      paidPromises.push(scrapeMediaStack(apiUsageCollection));
    }
    if (shouldRunSource('newsapi') && (needMore || forceSources)) {
      paidPromises.push(scrapeNewsAPI(apiUsageCollection));
    }
    
    if (paidPromises.length > 0) {
      const paidResults = await Promise.allSettled(paidPromises);
      for (const result of paidResults) {
        if (result.status === 'fulfilled') {
          const r = result.value;
          report.sourceBreakdown[r.source] = { count: r.signals.length, error: r.error, usedApiCall: r.usedApiCall };
          report.signals.push(...r.signals);
        }
      }
    }
  }
  
  // 3. Deduplicate across sources using signal hash
  const seen = new Set<string>();
  const uniqueSignals: RawSignal[] = [];
  for (const signal of report.signals) {
    const hash = generateSignalHash(signal.company_name, signal.text);
    if (!seen.has(hash)) {
      seen.add(hash);
      uniqueSignals.push(signal);
    }
  }
  
  report.signals = uniqueSignals;
  report.totalSignals = uniqueSignals.length;
  
  // 4. Get current API usage for the report
  report.apiUsage = {
    newsdata: await getApiUsage(apiUsageCollection, 'newsdata'),
    mediastack: await getApiUsage(apiUsageCollection, 'mediastack'),
    newsapi: await getApiUsage(apiUsageCollection, 'newsapi'),
  };
  
  console.log(`\n🔍 Multi-Scraper Summary:`);
  console.log(`   Total unique signals: ${report.totalSignals}`);
  for (const [src, info] of Object.entries(report.sourceBreakdown)) {
    console.log(`   ${src}: ${info.count} signals${info.error ? ` (${info.error})` : ''}${info.usedApiCall ? ' [API call used]' : ''}`);
  }
  console.log(`   API usage this month: NewsData=${report.apiUsage.newsdata}, MediaStack=${report.apiUsage.mediastack}, NewsAPI=${report.apiUsage.newsapi}`);
  
  return report;
}

/**
 * Get current API usage stats (for dashboard display)
 */
export async function getApiUsageStats(apiUsageCollection: any): Promise<{
  month: string;
  newsdata: { used: number; limit: number; remaining: number };
  mediastack: { used: number; limit: number; remaining: number };
  newsapi: { used: number; limit: number; remaining: number };
}> {
  const month = getCurrentMonth();
  const [nd, ms, na] = await Promise.all([
    getApiUsage(apiUsageCollection, 'newsdata'),
    getApiUsage(apiUsageCollection, 'mediastack'),
    getApiUsage(apiUsageCollection, 'newsapi'),
  ]);
  
  return {
    month,
    newsdata: { used: nd, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - nd },
    mediastack: { used: ms, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - ms },
    newsapi: { used: na, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - na },
  };
}
