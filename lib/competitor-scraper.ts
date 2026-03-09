/**
 * Competitor Monitoring Scraper for HPCL LeadSense AI
 * 
 * Tracks strategic activities of HPCL's competitors:
 * - Indian Oil Corporation (IOCL)
 * - Bharat Petroleum (BPCL)
 * - Reliance Industries / Jio-bp
 * - Shell India
 * - Nayara Energy (formerly Essar Oil)
 * 
 * Reuses the multi-scraper infrastructure (Google RSS, NewsData, MediaStack, NewsAPI)
 * with competitor-specific search queries and analysis.
 */

import crypto from 'crypto';
import type { CompetitorName, CompetitorActivityType, CompetitorImpactLevel, CompetitorSignal } from './types';

// ─── Competitor Search Queries (rotated per scrape) ──────────────────────────

const COMPETITOR_QUERIES = [
  'Indian Oil Corporation expansion investment India',
  'BPCL Bharat Petroleum new project plant',
  'Reliance Industries petroleum energy fuel retail',
  'IOCL EV charging station hydrogen green energy',
  'Bharat Petroleum infrastructure tender contract',
  'Nayara Energy refinery expansion India',
  'Shell India fuel retail network LNG',
  'Indian Oil refinery upgrade modernization',
  'BPCL city gas distribution CGD pipeline',
  'Reliance bp fuel retail partnership India',
  'IOCL BPCL biofuel ethanol blending India',
  'Indian Oil BPCL green hydrogen ammonia',
  'petroleum competitor India expansion 2026',
  'oil marketing company India new depot terminal',
];

// ─── Competitor Detection Map ────────────────────────────────────────────────

const COMPETITOR_KEYWORDS: { patterns: RegExp[]; name: CompetitorName }[] = [
  {
    patterns: [
      /\b(Indian\s*Oil|IOCL|IndianOil)\b/i,
      /\bIndian\s+Oil\s+Corporation\b/i,
    ],
    name: 'IOCL',
  },
  {
    patterns: [
      /\b(Bharat\s*Petroleum|BPCL)\b/i,
      /\bBharat\s+Petroleum\s+Corporation\b/i,
    ],
    name: 'BPCL',
  },
  {
    patterns: [
      /\b(Reliance\s*Industries|RIL|Reliance\s+Petroleum|Jio[\s-]?bp|Reliance\s+BP)\b/i,
      /\bReliance\b.*\b(fuel|petrol|diesel|energy|refinery|retail)\b/i,
    ],
    name: 'Reliance',
  },
  {
    patterns: [
      /\b(Shell\s*India|Shell)\b/i,
      /\bRoyal\s+Dutch\s+Shell\b/i,
    ],
    name: 'Shell',
  },
  {
    patterns: [
      /\b(Nayara\s*Energy|Nayara)\b/i,
      /\bEssar\s+Oil\b/i,
    ],
    name: 'Nayara',
  },
];

// ─── Activity Type Classification ────────────────────────────────────────────

const ACTIVITY_KEYWORDS: { keywords: string[]; type: CompetitorActivityType; category: string }[] = [
  {
    keywords: ['ev charging', 'electric vehicle', 'ev station', 'charging point', 'ev hub', 'battery swap'],
    type: 'ev_charging',
    category: 'EV Charging Network',
  },
  {
    keywords: ['hydrogen', 'green hydrogen', 'blue hydrogen', 'hydrogen hub', 'hydrogen plant', 'fuel cell'],
    type: 'hydrogen',
    category: 'Hydrogen Infrastructure',
  },
  {
    keywords: ['refinery', 'new plant', 'petrochemical', 'cracker', 'distillation', 'processing unit'],
    type: 'new_plant',
    category: 'Refinery & Plant Expansion',
  },
  {
    keywords: ['solar', 'wind', 'renewable', 'green energy', 'biofuel', 'ethanol', 'compressed biogas', 'cbg', 'sustainable'],
    type: 'green_energy',
    category: 'Green Energy Transition',
  },
  {
    keywords: ['partnership', 'joint venture', 'jv', 'collaboration', 'alliance', 'tie-up', 'mou signed'],
    type: 'partnership',
    category: 'Strategic Partnership',
  },
  {
    keywords: ['government', 'govt', 'tender', 'contract awarded', 'ministry', 'psu', 'bid won', 'license'],
    type: 'govt_contract',
    category: 'Government Contract',
  },
  {
    keywords: ['acquisition', 'acquire', 'buyout', 'stake', 'merger', 'takeover'],
    type: 'acquisition',
    category: 'Acquisition & M&A',
  },
  {
    keywords: ['technology', 'digital', 'ai ', 'iot', 'automation', 'app launch', 'platform', 'tech upgrade'],
    type: 'technology',
    category: 'Technology Deployment',
  },
  {
    keywords: ['retail outlet', 'fuel station', 'petrol pump', 'new outlet', 'dealer', 'retail network', 'fuel point'],
    type: 'retail_expansion',
    category: 'Retail Network Expansion',
  },
  {
    keywords: ['pipeline', 'depot', 'terminal', 'storage', 'supply chain', 'logistics', 'distribution'],
    type: 'supply_chain',
    category: 'Supply Chain & Logistics',
  },
  {
    keywords: ['infrastructure', 'expansion', 'investment', 'crore', 'billion', 'capacity', 'upgrade', 'modernization'],
    type: 'infrastructure_expansion',
    category: 'Infrastructure Expansion',
  },
  {
    keywords: ['price', 'pricing', 'rate cut', 'rate hike', 'discount', 'margin', 'tariff'],
    type: 'pricing',
    category: 'Pricing Strategy',
  },
];

// ─── Geo extraction (reuse from multi-scraper pattern) ───────────────────────

const GEO_MAP: Record<string, string> = {
  'delhi': 'Delhi NCR', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'maharashtra': 'Maharashtra',
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'karnataka': 'Karnataka',
  'chennai': 'Tamil Nadu', 'tamil nadu': 'Tamil Nadu', 'hyderabad': 'Telangana', 'telangana': 'Telangana',
  'kolkata': 'West Bengal', 'west bengal': 'West Bengal', 'gujarat': 'Gujarat',
  'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'rajasthan': 'Rajasthan', 'jaipur': 'Rajasthan',
  'odisha': 'Odisha', 'bhubaneswar': 'Odisha', 'kerala': 'Kerala', 'kochi': 'Kerala',
  'punjab': 'Punjab', 'chandigarh': 'Punjab', 'uttar pradesh': 'Uttar Pradesh', 'lucknow': 'Uttar Pradesh',
  'noida': 'Uttar Pradesh', 'chhattisgarh': 'Chhattisgarh', 'raipur': 'Chhattisgarh',
  'madhya pradesh': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
  'jharkhand': 'Jharkhand', 'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand',
  'bihar': 'Bihar', 'patna': 'Bihar', 'assam': 'Assam', 'guwahati': 'Assam',
  'goa': 'Goa', 'vizag': 'Andhra Pradesh', 'andhra pradesh': 'Andhra Pradesh',
  'nagpur': 'Maharashtra', 'visakhapatnam': 'Andhra Pradesh',
  'india': 'Pan India', 'national': 'Pan India', 'pan india': 'Pan India',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractGeo(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, region] of Object.entries(GEO_MAP)) {
    if (lower.includes(kw)) return region;
  }
  return 'Pan India';
}

function detectCompetitor(text: string): CompetitorName | null {
  for (const comp of COMPETITOR_KEYWORDS) {
    for (const pattern of comp.patterns) {
      if (pattern.test(text)) return comp.name;
    }
  }
  return null;
}

function classifyActivity(text: string): { type: CompetitorActivityType; category: string } {
  const lower = text.toLowerCase();
  for (const act of ACTIVITY_KEYWORDS) {
    if (act.keywords.some(kw => lower.includes(kw))) {
      return { type: act.type, category: act.category };
    }
  }
  return { type: 'other', category: 'General Activity' };
}

function assessImpact(text: string, activityType: CompetitorActivityType): CompetitorImpactLevel {
  const lower = text.toLowerCase();
  // Critical: major investment, large-scale expansion
  if (lower.match(/\b(\d{3,})\s*(crore|billion)/i) || lower.includes('mega') || lower.includes('largest')) return 'critical';
  // High: tenders, new plants, govt contracts, hydrogen
  if (['govt_contract', 'new_plant', 'hydrogen', 'acquisition'].includes(activityType)) return 'high';
  if (lower.includes('tender') || lower.includes('awarded') || lower.includes('first')) return 'high';
  // Medium: partnerships, infrastructure, EV, green
  if (['partnership', 'ev_charging', 'green_energy', 'infrastructure_expansion'].includes(activityType)) return 'medium';
  // Low: pricing, tech, retail, supply chain
  return 'low';
}

function generateImplication(competitor: CompetitorName, activityType: CompetitorActivityType, category: string, geo: string): string {
  const implications: Record<CompetitorActivityType, string[]> = {
    ev_charging: [
      `${competitor} is expanding EV charging in ${geo}. HPCL should accelerate EV hub deployment in this region.`,
      `Competitor EV move in ${geo} — HPCL should evaluate installing charging stations at existing fuel outlets.`,
    ],
    hydrogen: [
      `${competitor} investing in hydrogen in ${geo}. HPCL should assess green hydrogen pilot opportunities here.`,
      `Hydrogen infrastructure push by ${competitor}. HPCL needs to fast-track hydrogen corridor plans.`,
    ],
    new_plant: [
      `${competitor} expanding processing capacity. HPCL should review refinery modernization timeline.`,
      `New ${competitor} plant in ${geo} will increase supply competition. HPCL should strengthen regional distribution.`,
    ],
    infrastructure_expansion: [
      `${competitor} infrastructure expansion in ${geo}. HPCL should consider matching investments to maintain market share.`,
      `${competitor} building capacity in ${geo}. HPCL should explore similar expansion or deepen existing presence.`,
    ],
    partnership: [
      `${competitor} forming strategic alliances. HPCL should evaluate potential partnerships in ${geo}.`,
      `Strategic tie-up by ${competitor} could shift ${geo} market dynamics. HPCL should monitor and respond.`,
    ],
    govt_contract: [
      `${competitor} secured government contract in ${geo}. HPCL should track upcoming tenders in this region.`,
      `Government deal for ${competitor} in ${geo}. HPCL BD team should engage relevant ministries.`,
    ],
    acquisition: [
      `${competitor} M&A activity signals aggressive growth. HPCL should assess strategic acquisition targets.`,
      `Market consolidation by ${competitor}. HPCL should strengthen relationships with existing partners.`,
    ],
    technology: [
      `${competitor} tech upgrade could improve their efficiency. HPCL should review digital transformation roadmap.`,
      `Technology investment by ${competitor}. HPCL should benchmark and accelerate own digitalization.`,
    ],
    retail_expansion: [
      `${competitor} expanding retail network in ${geo}. HPCL should plan new outlet openings in this region.`,
      `Retail push by ${competitor}. HPCL should identify high-potential locations in ${geo} for new outlets.`,
    ],
    green_energy: [
      `${competitor} green energy move in ${geo}. HPCL should accelerate biofuel and renewable initiatives.`,
      `ESG-driven expansion by ${competitor}. HPCL should strengthen sustainability programs.`,
    ],
    supply_chain: [
      `${competitor} logistic improvements in ${geo}. HPCL should review depot and pipeline coverage.`,
      `Supply chain investment by ${competitor}. HPCL should ensure distribution capacity matches demand.`,
    ],
    pricing: [
      `${competitor} pricing move detected. HPCL commercial team should review competitive pricing in ${geo}.`,
      `Pricing strategy change by ${competitor}. HPCL should analyze margin impact and adjust.`,
    ],
    other: [
      `${competitor} activity detected in ${geo}. HPCL strategy team should monitor developments.`,
      `Noteworthy ${competitor} development. HPCL should assess potential market impact.`,
    ],
  };

  const options = implications[activityType] || implications.other;
  return options[Math.floor(Math.random() * options.length)];
}

export function generateCompetitorHash(competitor: string, text: string): string {
  const normalized = `comp-${competitor.toLowerCase()}-${text.toLowerCase().trim().substring(0, 150)}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function getRandomCompetitorQuery(): string {
  return COMPETITOR_QUERIES[Math.floor(Math.random() * COMPETITOR_QUERIES.length)];
}

// ─── Scraper: Google RSS for competitor news ─────────────────────────────────

interface CompetitorRawSignal {
  competitor: CompetitorName;
  title: string;
  text: string;
  source: string;
  url: string;
  geo: string;
  activityType: CompetitorActivityType;
  strategicCategory: string;
  impactLevel: CompetitorImpactLevel;
  hpclImplication: string;
}

async function scrapeCompetitorGoogleRSS(): Promise<{ signals: CompetitorRawSignal[]; error?: string }> {
  // Pick 2 random queries to get variety
  const queries = [getRandomCompetitorQuery(), getRandomCompetitorQuery()];
  const allSignals: CompetitorRawSignal[] = [];

  for (const query of queries) {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

    try {
      const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'HPCL-LeadSense/1.0' },
      });

      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const itemXml of items.slice(0, 12)) {
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]
          ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
        const desc = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]
          ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() || '';
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
        const sourceName = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || 'Google News';

        const fullText = `${title}. ${desc}`;
        const competitor = detectCompetitor(fullText);
        if (!competitor) continue;

        const { type, category } = classifyActivity(fullText);
        const geo = extractGeo(fullText);
        const impact = assessImpact(fullText, type);
        const implication = generateImplication(competitor, type, category, geo);

        allSignals.push({
          competitor,
          title: title.substring(0, 200),
          text: fullText.substring(0, 500),
          source: sourceName,
          url: link,
          geo,
          activityType: type,
          strategicCategory: category,
          impactLevel: impact,
          hpclImplication: implication,
        });
      }
    } catch (err: any) {
      console.error(`Competitor RSS error for query "${query}":`, err.message);
    }
  }

  console.log(`🔎 Competitor Google RSS: ${allSignals.length} signals`);
  return { signals: allSignals };
}

// ─── Scraper: NewsData.io for competitor news ────────────────────────────────

async function scrapeCompetitorNewsData(apiUsageCollection: any): Promise<{ signals: CompetitorRawSignal[]; error?: string; usedApiCall: boolean }> {
  const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
  if (!NEWSDATA_KEY) return { signals: [], error: 'No API key', usedApiCall: false };

  const MONTHLY_LIMIT = 90;
  const month = new Date().toISOString().substring(0, 7);
  const usage = await apiUsageCollection.findOne({ apiName: 'newsdata', month });
  if ((usage?.callCount || 0) >= MONTHLY_LIMIT) return { signals: [], error: 'Monthly limit', usedApiCall: false };

  try {
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent('IOCL OR BPCL OR "Indian Oil" OR "Bharat Petroleum" OR Reliance petroleum OR Nayara')}&country=in&language=en&category=business`;
    const response = await fetch(url);
    if (!response.ok) return { signals: [], error: `HTTP ${response.status}`, usedApiCall: false };

    await apiUsageCollection.updateOne(
      { apiName: 'newsdata', month },
      { $inc: { callCount: 1 }, $set: { lastUsed: new Date() } },
      { upsert: true }
    );

    const data = await response.json();
    const articles = data.results || [];
    const signals: CompetitorRawSignal[] = [];

    for (const article of articles.slice(0, 10)) {
      const fullText = `${article.title || ''}. ${article.description || ''}`;
      const competitor = detectCompetitor(fullText);
      if (!competitor) continue;

      const { type, category } = classifyActivity(fullText);
      const geo = extractGeo(fullText);
      const impact = assessImpact(fullText, type);

      signals.push({
        competitor,
        title: (article.title || '').substring(0, 200),
        text: fullText.substring(0, 500),
        source: article.source_name || 'NewsData',
        url: article.link || '',
        geo,
        activityType: type,
        strategicCategory: category,
        impactLevel: impact,
        hpclImplication: generateImplication(competitor, type, category, geo),
      });
    }

    console.log(`📰 Competitor NewsData: ${signals.length} signals`);
    return { signals, usedApiCall: true };
  } catch (err: any) {
    return { signals: [], error: err.message, usedApiCall: false };
  }
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export interface CompetitorScraperReport {
  totalSignals: number;
  signals: CompetitorRawSignal[];
  sourceBreakdown: Record<string, number>;
  competitorBreakdown: Record<string, number>;
}

export async function runCompetitorScraper(apiUsageCollection: any, options: { usePaidApis?: boolean } = {}): Promise<CompetitorScraperReport> {
  const { usePaidApis = true } = options;

  const report: CompetitorScraperReport = {
    totalSignals: 0,
    signals: [],
    sourceBreakdown: {},
    competitorBreakdown: {},
  };

  // Always start with Google RSS (free)
  const rssResult = await scrapeCompetitorGoogleRSS();
  report.signals.push(...rssResult.signals);
  report.sourceBreakdown['google_rss'] = rssResult.signals.length;

  // Use NewsData only if RSS < 3 signals and paid APIs allowed
  if (usePaidApis && rssResult.signals.length < 3) {
    const ndResult = await scrapeCompetitorNewsData(apiUsageCollection);
    report.signals.push(...ndResult.signals);
    report.sourceBreakdown['newsdata'] = ndResult.signals.length;
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique: CompetitorRawSignal[] = [];
  for (const sig of report.signals) {
    const hash = generateCompetitorHash(sig.competitor, sig.text);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(sig);
    }
  }

  report.signals = unique;
  report.totalSignals = unique.length;

  // Build competitor breakdown
  for (const sig of unique) {
    report.competitorBreakdown[sig.competitor] = (report.competitorBreakdown[sig.competitor] || 0) + 1;
  }

  console.log(`\n🏢 Competitor Scraper Summary: ${report.totalSignals} unique signals`);
  for (const [comp, count] of Object.entries(report.competitorBreakdown)) {
    console.log(`   ${comp}: ${count}`);
  }

  return report;
}

/**
 * Analyze and store competitor signals into MongoDB.
 * Deduplicates against existing signals before inserting.
 */
export async function processCompetitorSignals(
  competitorSignalsCollection: any,
  report: CompetitorScraperReport
): Promise<{ inserted: number; duplicates: number; signals: CompetitorSignal[] }> {
  // Get existing hashes
  const existingDocs = await competitorSignalsCollection
    .find({}, { projection: { signalHash: 1 } })
    .toArray();
  const existingHashes = new Set(existingDocs.map((d: any) => d.signalHash));

  const inserted: CompetitorSignal[] = [];
  let duplicates = 0;

  for (const raw of report.signals) {
    const hash = generateCompetitorHash(raw.competitor, raw.text);
    if (existingHashes.has(hash)) {
      duplicates++;
      continue;
    }

    const doc: CompetitorSignal = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      competitor: raw.competitor,
      activityType: raw.activityType,
      strategicCategory: raw.strategicCategory,
      title: raw.title,
      summary: raw.text,
      source: raw.source,
      sourceUrl: raw.url,
      geo: raw.geo,
      impactLevel: raw.impactLevel,
      hpclImplication: raw.hpclImplication,
      signalHash: hash,
      createdAt: new Date(),
    };

    await competitorSignalsCollection.insertOne(doc);
    existingHashes.add(hash); // prevent intra-batch dupes
    inserted.push(doc);
  }

  console.log(`✅ Competitor signals: ${inserted.length} inserted, ${duplicates} duplicates skipped`);
  return { inserted: inserted.length, duplicates, signals: inserted };
}
