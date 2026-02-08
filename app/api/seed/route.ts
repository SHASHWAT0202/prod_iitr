/**
 * API Route: /api/seed
 * Seeds the database with sample data
 */

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Prevent this route from being executed at build time
export const dynamic = 'force-dynamic';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'hpcl_leads';

// Hash password synchronously for seed data
const hashPassword = async (password: string) => bcrypt.hash(password, 10);

// We'll create users dynamically with hashed passwords
const createUsers = async () => {
  const password = await hashPassword('password123');
  const adminPassword = await hashPassword('admin123');
  const managerPassword = await hashPassword('manager123');
  
  return [
    { id: 'org_001', role: 'org_admin', name: 'HPCL Admin', region: 'All', territory: 'National', email: 'admin@hpcl.in', password: adminPassword, phone: '+91-1800-2333-555', avatar: '🏢', status: 'active', orgCode: 'HPCL2024', notificationPrefs: { email: true, web: true, whatsapp: false }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'mgr_001', role: 'manager', name: 'Priya Sharma', region: 'All', territory: 'National', email: 'priya.sharma@hpcl.in', password: managerPassword, phone: '+91-9876543200', avatar: '👩‍💼', status: 'active', notificationPrefs: { email: true, web: true, whatsapp: true }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sales_001', role: 'sales', name: 'Rajesh Kumar', region: 'North', territory: 'Delhi NCR', email: 'rajesh.kumar@hpcl.in', password, phone: '+91-9876543210', avatar: '👨‍💼', status: 'active', notificationPrefs: { email: true, web: true, whatsapp: true }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sales_002', role: 'sales', name: 'Amit Patel', region: 'West', territory: 'Maharashtra', email: 'amit.patel@hpcl.in', password, phone: '+91-9876543211', avatar: '👨‍💼', status: 'active', notificationPrefs: { email: true, web: true, whatsapp: true }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sales_003', role: 'sales', name: 'Suresh Reddy', region: 'South', territory: 'Karnataka', email: 'suresh.reddy@hpcl.in', password, phone: '+91-9876543212', avatar: '👨‍💼', status: 'active', notificationPrefs: { email: true, web: true, whatsapp: false }, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sales_004', role: 'sales', name: 'Vikram Singh', region: 'East', territory: 'West Bengal', email: 'vikram.singh@hpcl.in', password, phone: '+91-9876543213', avatar: '👨‍💼', status: 'active', notificationPrefs: { email: true, web: true, whatsapp: true }, createdAt: new Date(), updatedAt: new Date() },
  ];
};

const products = [
  { id: 'prod_001', name: 'HP Lube - Industrial Gear Oil', category: 'Lubricants', tags: ['lubricant', 'gear', 'oil'], industry_fit: ['Manufacturing', 'Mining'] },
  { id: 'prod_002', name: 'HP Diesel - HSD', category: 'Fuels', tags: ['diesel', 'fuel', 'truck'], industry_fit: ['Transportation', 'Logistics', 'Construction'] },
  { id: 'prod_003', name: 'HP LPG - Industrial', category: 'LPG', tags: ['lpg', 'gas', 'cooking'], industry_fit: ['Hospitality', 'Food Processing'] },
  { id: 'prod_004', name: 'HP Bitumen', category: 'Bitumen', tags: ['bitumen', 'road', 'highway'], industry_fit: ['Construction', 'Infrastructure'] },
  { id: 'prod_005', name: 'HP Aviation Fuel - ATF', category: 'Aviation', tags: ['aviation', 'aircraft'], industry_fit: ['Aviation', 'Airports'] },
  { id: 'prod_006', name: 'HP Transformer Oil', category: 'Specialty', tags: ['transformer', 'electrical'], industry_fit: ['Power', 'Utilities'] },
  { id: 'prod_007', name: 'HP Marine Fuel', category: 'Marine', tags: ['marine', 'ship'], industry_fit: ['Shipping', 'Ports'] },
  { id: 'prod_008', name: 'HP Furnace Oil', category: 'Industrial', tags: ['furnace', 'boiler'], industry_fit: ['Manufacturing', 'Steel'] },
];

const leads = [
  {
    id: 'lead_001', company_name: 'Tata Steel Limited', normalized_name: 'tatasteel', industry: 'Steel Manufacturing',
    source: 'Economic Times', source_type: 'news',
    source_text: 'Tata Steel announces major expansion of Kalinganagar plant with investment of ₹12,000 crore.',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, trust: 95, geo: 'Odisha', status: 'new', score: 87,
    scoreBreakdown: { intentStrength: 32, freshness: 20, companySizeProxy: 18, trustScore: 14, geographyMatch: 3 },
    inference: { industry: 'Steel Manufacturing', inferred_products: ['HP Lube - Industrial Gear Oil', 'HP Diesel - HSD', 'HP Furnace Oil'], confidence_score: 0.92, urgency_level: 'high', suggested_next_action: 'Schedule meeting immediately' },
    assignedTo: 'sales_003', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'lead_002', company_name: 'Reliance Logistics', normalized_name: 'reliancelogistics', industry: 'Transportation',
    source: 'Business Standard', source_type: 'news',
    source_text: 'Reliance Logistics expanding fleet by 500 trucks for e-commerce delivery network.',
    timestamp: Date.now() - 5 * 60 * 60 * 1000, trust: 90, geo: 'Mumbai', status: 'new', score: 82,
    scoreBreakdown: { intentStrength: 30, freshness: 18, companySizeProxy: 17, trustScore: 13, geographyMatch: 4 },
    inference: { industry: 'Transportation', inferred_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil'], confidence_score: 0.88, urgency_level: 'high', suggested_next_action: 'Prepare bulk supply proposal' },
    assignedTo: 'sales_002', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'lead_003', company_name: 'DLF Construction', normalized_name: 'dlfconstruction', industry: 'Construction',
    source: 'Government Tender Portal', source_type: 'tender',
    source_text: 'DLF awarded ₹2,500 crore highway construction contract in Gujarat.',
    timestamp: Date.now() - 24 * 60 * 60 * 1000, trust: 98, geo: 'Gujarat', status: 'in_progress', score: 91,
    scoreBreakdown: { intentStrength: 35, freshness: 17, companySizeProxy: 19, trustScore: 15, geographyMatch: 5 },
    inference: { industry: 'Construction', inferred_products: ['HP Bitumen', 'HP Diesel - HSD'], confidence_score: 0.95, urgency_level: 'high', suggested_next_action: 'Submit tender response' },
    assignedTo: 'sales_002', note: 'Meeting scheduled for next week', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'lead_004', company_name: 'Taj Hotels', normalized_name: 'tajhotels', industry: 'Hospitality',
    source: 'Hospitality Biz', source_type: 'news',
    source_text: 'Taj Hotels planning 15 new properties across tier-2 cities with full-service kitchens.',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, trust: 85, geo: 'Pan India', status: 'new', score: 68,
    scoreBreakdown: { intentStrength: 22, freshness: 12, companySizeProxy: 16, trustScore: 12, geographyMatch: 6 },
    inference: { industry: 'Hospitality', inferred_products: ['HP LPG - Industrial'], confidence_score: 0.78, urgency_level: 'medium', suggested_next_action: 'Contact procurement for LPG partnership' },
    assignedTo: 'sales_001', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'lead_005', company_name: 'SpiceJet Airways', normalized_name: 'spicejet', industry: 'Aviation',
    source: 'Aviation Weekly', source_type: 'news',
    source_text: 'SpiceJet fleet expansion with 20 additional aircraft. Seeking ATF supply contracts.',
    timestamp: Date.now() - 12 * 60 * 60 * 1000, trust: 88, geo: 'Delhi', status: 'new', score: 79,
    scoreBreakdown: { intentStrength: 28, freshness: 18, companySizeProxy: 16, trustScore: 13, geographyMatch: 4 },
    inference: { industry: 'Aviation', inferred_products: ['HP Aviation Fuel - ATF'], confidence_score: 0.85, urgency_level: 'high', suggested_next_action: 'Contact aviation fuel division' },
    assignedTo: 'sales_001', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'lead_006', company_name: 'Chennai Metro Rail', normalized_name: 'chennaimetro', industry: 'Infrastructure',
    source: 'Chennai Metro Portal', source_type: 'tender',
    source_text: 'Chennai Metro Phase 2 expansion - seeking fuel and lubricant suppliers.',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, trust: 92, geo: 'Tamil Nadu', status: 'converted', score: 88,
    scoreBreakdown: { intentStrength: 33, freshness: 10, companySizeProxy: 17, trustScore: 14, geographyMatch: 10 },
    inference: { industry: 'Infrastructure', inferred_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil'], confidence_score: 0.91, urgency_level: 'medium', suggested_next_action: 'N/A - Converted' },
    assignedTo: 'sales_003', note: '🎉 Contract signed for 2 years!', createdAt: new Date(), updatedAt: new Date()
  },
];

const notifications = [
  { id: 'notif_001', title: '🔥 High Priority Lead', message: 'New lead: Tata Steel Limited (Score: 87)', type: 'warning', leadId: 'lead_001', userId: 'sales_003', channel: 'app', read: false, createdAt: new Date() },
  { id: 'notif_002', title: '🆕 New Lead Assigned', message: 'Reliance Logistics assigned to you', type: 'info', leadId: 'lead_002', userId: 'sales_002', channel: 'app', read: false, createdAt: new Date() },
  { id: 'notif_003', title: '🎉 Lead Converted!', message: 'Chennai Metro Rail contract signed!', type: 'success', leadId: 'lead_006', userId: 'sales_003', channel: 'app', read: true, createdAt: new Date() },
];

const scraperConfig = {
  id: 'main', enabled: true, interval_minutes: 5,
  sources: [
    { name: 'Economic Times', url: 'https://economictimes.com', type: 'news', enabled: true },
    { name: 'Government Tender Portal', url: 'https://gem.gov.in', type: 'tender', enabled: true },
  ],
  keywords: ['fuel supply', 'diesel requirement', 'lubricant', 'bitumen', 'LPG', 'tender fuel'],
  last_run: null, total_runs: 0, leads_found: 0, createdAt: new Date()
};

export async function GET() {
  if (!MONGODB_URI) {
    return NextResponse.json({ ok: false, error: 'MONGODB_URI not configured' }, { status: 500 });
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Create users with hashed passwords
    const users = await createUsers();

    // Drop and recreate collections
    const collections = ['users', 'products', 'leads', 'notifications', 'analytics', 'scraper_config'];
    for (const col of collections) {
      try { await db.collection(col).drop(); } catch (e) { /* ignore */ }
    }

    // Create indexes
    await db.collection('leads').createIndex({ id: 1 }, { unique: true });
    await db.collection('leads').createIndex({ status: 1 });
    await db.collection('leads').createIndex({ score: -1 });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });

    // Insert data
    await db.collection('users').insertMany(users);
    await db.collection('products').insertMany(products);
    await db.collection('leads').insertMany(leads);
    await db.collection('notifications').insertMany(notifications);
    await db.collection('scraper_config').insertOne(scraperConfig);
    await db.collection('analytics').insertOne({
      id: 'main', total_leads: leads.length, new_leads: leads.filter(l => l.status === 'new').length,
      in_progress_leads: leads.filter(l => l.status === 'in_progress').length,
      converted_leads: leads.filter(l => l.status === 'converted').length,
      conversion_rate: Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100),
      updated_at: new Date()
    });

    return NextResponse.json({
      ok: true,
      message: 'Database seeded successfully!',
      data: {
        users: users.length,
        products: products.length,
        leads: leads.length,
        notifications: notifications.length,
      }
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
