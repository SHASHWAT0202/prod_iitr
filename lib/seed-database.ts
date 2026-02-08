/**
 * Database Seeding Script
 * Run with: npx ts-node --project tsconfig.json lib/seed-database.ts
 * Or via API: GET /api/seed
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snappysabhya23_db_user:Md3P7moOx6CxZc0A@cluster0.knqdyfa.mongodb.net/?appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'hpcl_leads';

// Sample Users
const users = [
  { 
    id: 'sales_001', 
    role: 'sales', 
    name: 'Rajesh Kumar', 
    region: 'North', 
    territory: 'Delhi NCR', 
    email: 'rajesh.kumar@hpcl.in', 
    phone: '+91-9876543210',
    avatar: '👨‍💼',
    notificationPrefs: { email: true, web: true, whatsapp: true },
    createdAt: new Date()
  },
  { 
    id: 'sales_002', 
    role: 'sales', 
    name: 'Amit Patel', 
    region: 'West', 
    territory: 'Maharashtra', 
    email: 'amit.patel@hpcl.in', 
    phone: '+91-9876543211',
    avatar: '👨‍💼',
    notificationPrefs: { email: true, web: true, whatsapp: true },
    createdAt: new Date()
  },
  { 
    id: 'sales_003', 
    role: 'sales', 
    name: 'Suresh Reddy', 
    region: 'South', 
    territory: 'Karnataka', 
    email: 'suresh.reddy@hpcl.in', 
    phone: '+91-9876543212',
    avatar: '👨‍💼',
    notificationPrefs: { email: true, web: true, whatsapp: false },
    createdAt: new Date()
  },
  { 
    id: 'sales_004', 
    role: 'sales', 
    name: 'Vikram Singh', 
    region: 'East', 
    territory: 'West Bengal', 
    email: 'vikram.singh@hpcl.in', 
    phone: '+91-9876543213',
    avatar: '👨‍💼',
    notificationPrefs: { email: true, web: true, whatsapp: true },
    createdAt: new Date()
  },
  { 
    id: 'mgr_001', 
    role: 'manager', 
    name: 'Priya Sharma', 
    region: 'All', 
    territory: 'National', 
    email: 'priya.sharma@hpcl.in', 
    phone: '+91-9876543200',
    avatar: '👩‍💼',
    notificationPrefs: { email: true, web: true, whatsapp: true },
    createdAt: new Date()
  },
  { 
    id: 'org_001', 
    role: 'organization', 
    name: 'HPCL Corporate', 
    region: 'All', 
    territory: 'National', 
    email: 'corporate@hpcl.in', 
    phone: '+91-1800-2333-555',
    avatar: '🏢',
    notificationPrefs: { email: true, web: true, whatsapp: false },
    createdAt: new Date()
  },
];

// Sample Products
const products = [
  { id: 'prod_001', name: 'HP Lube - Industrial Gear Oil', category: 'Lubricants', tags: ['lubricant', 'gear', 'oil', 'maintenance', 'machinery', 'industrial'], industry_fit: ['Manufacturing', 'Mining', 'Heavy Machinery', 'Transportation'], price_range: '₹500-2000/L', description: 'High-performance gear oil for industrial machinery' },
  { id: 'prod_002', name: 'HP Diesel - HSD', category: 'Fuels', tags: ['diesel', 'fuel', 'truck', 'fleet', 'vehicle', 'transport', 'hsd'], industry_fit: ['Transportation', 'Logistics', 'Construction', 'Mining', 'Agriculture'], price_range: '₹90-100/L', description: 'High Speed Diesel for commercial vehicles' },
  { id: 'prod_003', name: 'HP LPG - Industrial', category: 'LPG', tags: ['lpg', 'gas', 'cooking', 'kitchen', 'hotel', 'restaurant', 'food'], industry_fit: ['Hospitality', 'Food Processing', 'Manufacturing', 'Healthcare'], price_range: '₹800-1200/cylinder', description: 'Industrial grade LPG for commercial kitchens' },
  { id: 'prod_004', name: 'HP Bitumen', category: 'Bitumen', tags: ['bitumen', 'road', 'highway', 'construction', 'asphalt', 'paving'], industry_fit: ['Construction', 'Infrastructure', 'Road Development'], price_range: '₹35000-45000/MT', description: 'Road construction grade bitumen' },
  { id: 'prod_005', name: 'HP Aviation Fuel - ATF', category: 'Aviation', tags: ['aviation', 'aircraft', 'airport', 'atf', 'jet fuel', 'airline'], industry_fit: ['Aviation', 'Airports', 'Defense'], price_range: '₹80000-100000/KL', description: 'Aviation Turbine Fuel for aircraft' },
  { id: 'prod_006', name: 'HP Transformer Oil', category: 'Specialty', tags: ['transformer', 'electrical', 'power', 'utility', 'substation'], industry_fit: ['Power', 'Utilities', 'Energy'], price_range: '₹150-300/L', description: 'Insulating oil for electrical transformers' },
  { id: 'prod_007', name: 'HP Marine Fuel', category: 'Marine', tags: ['marine', 'ship', 'vessel', 'port', 'shipping', 'bunker'], industry_fit: ['Shipping', 'Ports', 'Marine Transport'], price_range: '₹50000-70000/MT', description: 'Marine grade fuel for ships and vessels' },
  { id: 'prod_008', name: 'HP Furnace Oil', category: 'Industrial', tags: ['furnace', 'boiler', 'heating', 'industrial', 'steel', 'cement'], industry_fit: ['Manufacturing', 'Steel', 'Cement', 'Textile'], price_range: '₹45000-55000/KL', description: 'Industrial heating fuel for furnaces and boilers' },
];

// Sample Leads with complete data
const leads = [
  {
    id: 'lead_001',
    company_name: 'Tata Steel Limited',
    normalized_name: 'tatasteel',
    industry: 'Steel Manufacturing',
    source: 'Economic Times',
    source_type: 'news',
    source_text: 'Tata Steel announces major expansion of Kalinganagar plant with investment of ₹12,000 crore. The new facility will require significant industrial supplies including lubricants, diesel for heavy machinery, and furnace oil for steel production.',
    source_url: 'https://economictimes.com/news/tata-steel-expansion',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    trust: 95,
    geo: 'Odisha',
    status: 'new',
    score: 87,
    scoreBreakdown: { intentStrength: 32, freshness: 20, companySizeProxy: 18, trustScore: 14, geographyMatch: 3 },
    scoreExplanation: ['🎯 Strong intent: expansion, plant, supply', '⚡ Fresh signal (today)', '💰 Quantified: 12000 crore', '✓ Verified source: Economic Times'],
    inference: {
      industry: 'Steel Manufacturing',
      inferred_products: ['HP Lube - Industrial Gear Oil', 'HP Diesel - HSD', 'HP Furnace Oil'],
      reason_codes: ['steel_production', 'heavy_machinery', 'industrial_expansion'],
      confidence_score: 0.92,
      urgency_level: 'high',
      suggested_next_action: 'Schedule meeting with procurement team immediately'
    },
    assignedTo: 'sales_003',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lead_002',
    company_name: 'Reliance Logistics',
    normalized_name: 'reliancelogistics',
    industry: 'Transportation & Logistics',
    source: 'Business Standard',
    source_type: 'news',
    source_text: 'Reliance Logistics expanding fleet by 500 trucks for e-commerce delivery network. Looking for long-term fuel supply partnership for pan-India operations.',
    source_url: 'https://business-standard.com/reliance-logistics',
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    trust: 90,
    geo: 'Mumbai',
    status: 'new',
    score: 82,
    scoreBreakdown: { intentStrength: 30, freshness: 18, companySizeProxy: 17, trustScore: 13, geographyMatch: 4 },
    scoreExplanation: ['🎯 Strong intent: fleet, supply', '⚡ Fresh signal (today)', '🏢 Large enterprise'],
    inference: {
      industry: 'Transportation & Logistics',
      inferred_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil'],
      reason_codes: ['fleet_expansion', 'long_term_supply', 'pan_india'],
      confidence_score: 0.88,
      urgency_level: 'high',
      suggested_next_action: 'Prepare bulk supply proposal with competitive pricing'
    },
    assignedTo: 'sales_002',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lead_003',
    company_name: 'DLF Construction',
    normalized_name: 'dlfconstruction',
    industry: 'Construction',
    source: 'Government Tender Portal',
    source_type: 'tender',
    source_text: 'DLF awarded ₹2,500 crore highway construction contract in Gujarat. Tender requires certified fuel and bitumen suppliers for 120km stretch between Ahmedabad and Vadodara.',
    source_url: 'https://gem.gov.in/tender/dlf-highway',
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    trust: 98,
    geo: 'Gujarat',
    status: 'in_progress',
    score: 91,
    scoreBreakdown: { intentStrength: 35, freshness: 17, companySizeProxy: 19, trustScore: 15, geographyMatch: 5 },
    scoreExplanation: ['🎯 Strong intent: tender, contract, supply', '📅 Recent signal', '💰 Quantified: 2500 crore', '✓ Verified source: Government Portal'],
    inference: {
      industry: 'Construction',
      inferred_products: ['HP Bitumen', 'HP Diesel - HSD'],
      reason_codes: ['highway_construction', 'government_tender', 'certified_supplier'],
      confidence_score: 0.95,
      urgency_level: 'high',
      suggested_next_action: 'Submit tender response with all certifications'
    },
    assignedTo: 'sales_002',
    note: 'Initial contact made. Meeting scheduled for Feb 10.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'lead_004',
    company_name: 'Taj Hotels',
    normalized_name: 'tajhotels',
    industry: 'Hospitality',
    source: 'Hospitality Biz',
    source_type: 'news',
    source_text: 'Taj Hotels planning to open 15 new properties across tier-2 cities with full-service kitchens requiring industrial LPG supply.',
    source_url: 'https://hospitalitybiz.com/taj-expansion',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    trust: 85,
    geo: 'Pan India',
    status: 'new',
    score: 68,
    scoreBreakdown: { intentStrength: 22, freshness: 12, companySizeProxy: 16, trustScore: 12, geographyMatch: 6 },
    scoreExplanation: ['🎯 Intent: expansion, supply', '🏢 Large enterprise'],
    inference: {
      industry: 'Hospitality',
      inferred_products: ['HP LPG - Industrial', 'HP Diesel - HSD'],
      reason_codes: ['hotel_expansion', 'kitchen_supply', 'multiple_locations'],
      confidence_score: 0.78,
      urgency_level: 'medium',
      suggested_next_action: 'Contact procurement for LPG supply partnership'
    },
    assignedTo: 'sales_001',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'lead_005',
    company_name: 'SpiceJet Airways',
    normalized_name: 'spicejet',
    industry: 'Aviation',
    source: 'Aviation Weekly',
    source_type: 'news',
    source_text: 'SpiceJet announces new routes and fleet expansion with 20 additional aircraft. Seeking ATF supply contracts at multiple airports.',
    source_url: 'https://aviationweekly.com/spicejet',
    timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    trust: 88,
    geo: 'Delhi',
    status: 'new',
    score: 79,
    scoreBreakdown: { intentStrength: 28, freshness: 18, companySizeProxy: 16, trustScore: 13, geographyMatch: 4 },
    scoreExplanation: ['🎯 Strong intent: expansion, supply, contract', '⚡ Fresh signal', '✓ Verified source'],
    inference: {
      industry: 'Aviation',
      inferred_products: ['HP Aviation Fuel - ATF'],
      reason_codes: ['fleet_expansion', 'multiple_airports', 'atf_requirement'],
      confidence_score: 0.85,
      urgency_level: 'high',
      suggested_next_action: 'Contact aviation fuel division for tender preparation'
    },
    assignedTo: 'sales_001',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lead_006',
    company_name: 'Adani Ports',
    normalized_name: 'adaniports',
    industry: 'Shipping & Ports',
    source: 'Maritime India',
    source_type: 'news',
    source_text: 'Adani Ports planning new container terminal at Mundra with investment of ₹5,000 crore. Seeking marine fuel bunker suppliers and port equipment fuel.',
    source_url: 'https://maritimeindia.com/adani-mundra',
    timestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    trust: 90,
    geo: 'Gujarat',
    status: 'new',
    score: 85,
    scoreBreakdown: { intentStrength: 31, freshness: 19, companySizeProxy: 18, trustScore: 13, geographyMatch: 4 },
    scoreExplanation: ['🎯 Strong intent: seeking suppliers', '⚡ Fresh signal (today)', '💰 Quantified: 5000 crore'],
    inference: {
      industry: 'Shipping & Ports',
      inferred_products: ['HP Marine Fuel', 'HP Diesel - HSD'],
      reason_codes: ['port_expansion', 'marine_fuel', 'heavy_equipment'],
      confidence_score: 0.89,
      urgency_level: 'high',
      suggested_next_action: 'Arrange meeting with port procurement team'
    },
    assignedTo: 'sales_002',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lead_007',
    company_name: 'Chennai Metro Rail',
    normalized_name: 'chennaimetro',
    industry: 'Transportation Infrastructure',
    source: 'Chennai Metro Portal',
    source_type: 'tender',
    source_text: 'Chennai Metro seeking suppliers for construction equipment fuel and lubricants for Phase 2 expansion covering 118.9 km.',
    source_url: 'https://chennaimetrorail.org/tender',
    timestamp: Date.now() - 48 * 60 * 60 * 1000, // 2 days ago
    trust: 92,
    geo: 'Tamil Nadu',
    status: 'converted',
    score: 88,
    scoreBreakdown: { intentStrength: 33, freshness: 14, companySizeProxy: 17, trustScore: 14, geographyMatch: 10 },
    scoreExplanation: ['🎯 Strong intent: tender, seeking suppliers', '✓ Verified source: Official Portal', '📍 Territory match'],
    inference: {
      industry: 'Transportation Infrastructure',
      inferred_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil'],
      reason_codes: ['government_project', 'construction', 'long_term'],
      confidence_score: 0.91,
      urgency_level: 'medium',
      suggested_next_action: 'Prepare tender documents'
    },
    assignedTo: 'sales_003',
    note: 'Won tender! Supply contract signed for 2 years.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'lead_008',
    company_name: 'Mahanadi Coalfields',
    normalized_name: 'mahanadicoalfields',
    industry: 'Mining',
    source: 'Coal Ministry Tender',
    source_type: 'tender',
    source_text: 'Mahanadi Coalfields Limited requires heavy machinery diesel and industrial lubricants for new mining project in Chhattisgarh. Annual requirement: 50,000 KL diesel.',
    source_url: 'https://coal.gov.in/tender/mcl',
    timestamp: Date.now() - 36 * 60 * 60 * 1000, // 1.5 days ago
    trust: 95,
    geo: 'Chhattisgarh',
    status: 'in_progress',
    score: 90,
    scoreBreakdown: { intentStrength: 34, freshness: 15, companySizeProxy: 20, trustScore: 14, geographyMatch: 7 },
    scoreExplanation: ['🎯 Strong intent: requires, annual requirement', '💰 Quantified: 50000 KL', '✓ Government PSU'],
    inference: {
      industry: 'Mining',
      inferred_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil'],
      reason_codes: ['psu_tender', 'bulk_requirement', 'annual_contract'],
      confidence_score: 0.93,
      urgency_level: 'high',
      suggested_next_action: 'Submit competitive bid with volume discounts'
    },
    assignedTo: 'sales_004',
    note: 'Tender submitted. Awaiting evaluation results.',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
];

// Sample Notifications
const notifications = [
  {
    id: 'notif_001',
    title: '🔥 High Priority Lead',
    message: 'New high-priority lead: Tata Steel Limited (Score: 87)',
    type: 'warning',
    leadId: 'lead_001',
    userId: 'sales_003',
    channel: 'app',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'notif_002',
    title: '🆕 New Lead Assigned',
    message: 'Reliance Logistics has been assigned to you',
    type: 'info',
    leadId: 'lead_002',
    userId: 'sales_002',
    channel: 'app',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'notif_003',
    title: '🎉 Lead Converted!',
    message: 'Chennai Metro Rail contract signed - Great work!',
    type: 'success',
    leadId: 'lead_007',
    userId: 'sales_003',
    channel: 'app',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
];

// Analytics data
const analytics = {
  id: 'main',
  total_leads: 8,
  new_leads: 5,
  in_progress_leads: 2,
  converted_leads: 1,
  rejected_leads: 0,
  leads_this_week: 6,
  leads_this_month: 8,
  conversion_rate: 12.5,
  avg_score: 83.75,
  top_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil', 'HP LPG - Industrial'],
  sector_distribution: {
    'Steel Manufacturing': 1,
    'Transportation & Logistics': 1,
    'Construction': 1,
    'Hospitality': 1,
    'Aviation': 1,
    'Shipping & Ports': 1,
    'Transportation Infrastructure': 1,
    'Mining': 1
  },
  region_distribution: {
    'Odisha': 1,
    'Mumbai': 1,
    'Gujarat': 2,
    'Pan India': 1,
    'Delhi': 1,
    'Tamil Nadu': 1,
    'Chhattisgarh': 1
  },
  updated_at: new Date()
};

// Scraper config
const scraperConfig = {
  id: 'main',
  enabled: true,
  interval_minutes: 5,
  sources: [
    { name: 'Economic Times', url: 'https://economictimes.com', type: 'news', enabled: true },
    { name: 'Business Standard', url: 'https://business-standard.com', type: 'news', enabled: true },
    { name: 'Government Tender Portal', url: 'https://gem.gov.in', type: 'tender', enabled: true },
    { name: 'CPPP', url: 'https://eprocure.gov.in', type: 'tender', enabled: true },
    { name: 'Moneycontrol', url: 'https://moneycontrol.com', type: 'news', enabled: true },
  ],
  keywords: [
    'fuel supply', 'diesel requirement', 'lubricant', 'bitumen', 'LPG supply',
    'fleet expansion', 'industrial oil', 'tender fuel', 'petroleum products',
    'aviation fuel', 'marine fuel', 'construction project', 'infrastructure project'
  ],
  last_run: null,
  total_runs: 0,
  leads_found: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Drop existing collections (optional - for clean seed)
    const collections = ['users', 'products', 'leads', 'notifications', 'analytics', 'scraper_config'];
    for (const col of collections) {
      try {
        await db.collection(col).drop();
        console.log(`🗑️ Dropped collection: ${col}`);
      } catch (e) {
        // Collection might not exist
      }
    }
    
    // Create indexes
    await db.collection('leads').createIndex({ id: 1 }, { unique: true });
    await db.collection('leads').createIndex({ status: 1 });
    await db.collection('leads').createIndex({ score: -1 });
    await db.collection('leads').createIndex({ timestamp: -1 });
    await db.collection('leads').createIndex({ normalized_name: 1 });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    console.log('✅ Created indexes');
    
    // Insert data
    await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);
    
    await db.collection('products').insertMany(products);
    console.log(`✅ Inserted ${products.length} products`);
    
    await db.collection('leads').insertMany(leads);
    console.log(`✅ Inserted ${leads.length} leads`);
    
    await db.collection('notifications').insertMany(notifications);
    console.log(`✅ Inserted ${notifications.length} notifications`);
    
    await db.collection('analytics').insertOne(analytics);
    console.log('✅ Inserted analytics');
    
    await db.collection('scraper_config').insertOne(scraperConfig);
    console.log('✅ Inserted scraper config');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`
    Summary:
    - Users: ${users.length}
    - Products: ${products.length}
    - Leads: ${leads.length}
    - Notifications: ${notifications.length}
    `);
    
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
