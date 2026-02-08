/**
 * MongoDB Connection Utility
 * Handles database connection with connection pooling
 */

import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'hpcl_leads';

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not set. Database features will not work.');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export interface DbCollections {
  leads: Collection;
  users: Collection;
  notifications: Collection;
  products: Collection;
  signals: Collection;
  analytics: Collection;
  feedback: Collection;
  learnedWeights: Collection;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  console.log('✅ Connected to MongoDB');
  return { client, db };
}

export async function getCollections(): Promise<DbCollections> {
  const { db } = await connectToDatabase();
  return {
    leads: db.collection('leads'),
    users: db.collection('users'),
    notifications: db.collection('notifications'),
    products: db.collection('products'),
    signals: db.collection('signals'),
    analytics: db.collection('analytics'),
    feedback: db.collection('feedback'),
    learnedWeights: db.collection('learned_weights'),
  };
}

// Initialize database with seed data if empty
export async function initializeDatabase() {
  const { db } = await connectToDatabase();
  
  // Check if users collection is empty
  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    await db.collection('users').insertMany([
      { id: 'u1', role: 'sales', name: 'Rajesh Kumar', region: 'North', territory: 'Delhi NCR', email: 'rajesh.kumar@hpcl.in', phone: '+91-9876543210' },
      { id: 'u2', role: 'sales', name: 'Amit Patel', region: 'West', territory: 'Maharashtra', email: 'amit.patel@hpcl.in', phone: '+91-9876543211' },
      { id: 'u3', role: 'sales', name: 'Suresh Reddy', region: 'South', territory: 'Karnataka', email: 'suresh.reddy@hpcl.in', phone: '+91-9876543212' },
      { id: 'u4', role: 'sales', name: 'Vikram Singh', region: 'East', territory: 'West Bengal', email: 'vikram.singh@hpcl.in', phone: '+91-9876543213' },
      { id: 'mgr_001', role: 'manager', name: 'Priya Sharma', region: 'All', territory: 'National', email: 'priya.sharma@hpcl.in', phone: '+91-9876543200' },
    ]);
    console.log('✅ Seeded users collection');
  }

  // Check if products collection is empty
  const productsCount = await db.collection('products').countDocuments();
  if (productsCount === 0) {
    await db.collection('products').insertMany([
      { id: 'prod_001', name: 'HP Lube - Industrial Gear Oil', category: 'Lubricants', tags: ['lubricant', 'gear', 'oil', 'maintenance', 'machinery', 'industrial'], industry_fit: ['Manufacturing', 'Mining', 'Heavy Machinery', 'Transportation'] },
      { id: 'prod_002', name: 'HP Diesel - HSD', category: 'Fuels', tags: ['diesel', 'fuel', 'truck', 'fleet', 'vehicle', 'transport', 'hsd'], industry_fit: ['Transportation', 'Logistics', 'Construction', 'Mining', 'Agriculture'] },
      { id: 'prod_003', name: 'HP LPG - Industrial', category: 'LPG', tags: ['lpg', 'gas', 'cooking', 'kitchen', 'hotel', 'restaurant', 'food'], industry_fit: ['Hospitality', 'Food Processing', 'Manufacturing', 'Healthcare'] },
      { id: 'prod_004', name: 'HP Bitumen', category: 'Bitumen', tags: ['bitumen', 'road', 'highway', 'construction', 'asphalt', 'paving'], industry_fit: ['Construction', 'Infrastructure', 'Road Development'] },
      { id: 'prod_005', name: 'HP Aviation Fuel - ATF', category: 'Aviation', tags: ['aviation', 'aircraft', 'airport', 'atf', 'jet fuel', 'airline'], industry_fit: ['Aviation', 'Airports', 'Defense'] },
      { id: 'prod_006', name: 'HP Transformer Oil', category: 'Specialty', tags: ['transformer', 'electrical', 'power', 'utility', 'substation'], industry_fit: ['Power', 'Utilities', 'Energy'] },
      { id: 'prod_007', name: 'HP Marine Fuel', category: 'Marine', tags: ['marine', 'ship', 'vessel', 'port', 'shipping', 'bunker'], industry_fit: ['Shipping', 'Ports', 'Marine Transport'] },
      { id: 'prod_008', name: 'HP Furnace Oil', category: 'Industrial', tags: ['furnace', 'boiler', 'heating', 'industrial', 'steel', 'cement'], industry_fit: ['Manufacturing', 'Steel', 'Cement', 'Textile'] },
    ]);
    console.log('✅ Seeded products collection');
  }

  // Initialize analytics
  const analyticsCount = await db.collection('analytics').countDocuments();
  if (analyticsCount === 0) {
    await db.collection('analytics').insertOne({
      id: 'main',
      leads_this_week: 0,
      conversion_rate: 0,
      top_products: ['HP Diesel - HSD', 'HP Lube - Industrial Gear Oil', 'HP LPG - Industrial'],
      sector_distribution: { Manufacturing: 35, Transportation: 25, Construction: 20, Hospitality: 12, Others: 8 },
      updated_at: new Date(),
    });
    console.log('✅ Seeded analytics collection');
  }
}
