/**
 * Mock Data Library for HPCL Lead Intelligence Agent
 * Contains product catalog, sample signals, and helper functions
 */

// HPCL Product Catalog
export const productCatalog = [
  { id: 'prod_001', name: 'HP Lube - Industrial Gear Oil', category: 'Lubricants', tags: ['lubricant', 'gear', 'oil', 'maintenance', 'machinery', 'industrial'], industry_fit: ['Manufacturing', 'Mining', 'Heavy Machinery', 'Transportation'] },
  { id: 'prod_002', name: 'HP Diesel - HSD', category: 'Fuels', tags: ['diesel', 'fuel', 'truck', 'fleet', 'vehicle', 'transport', 'hsd'], industry_fit: ['Transportation', 'Logistics', 'Construction', 'Mining', 'Agriculture'] },
  { id: 'prod_003', name: 'HP LPG - Industrial', category: 'LPG', tags: ['lpg', 'gas', 'cooking', 'kitchen', 'hotel', 'restaurant', 'food'], industry_fit: ['Hospitality', 'Food Processing', 'Manufacturing', 'Healthcare'] },
  { id: 'prod_004', name: 'HP Bitumen', category: 'Bitumen', tags: ['bitumen', 'road', 'highway', 'construction', 'asphalt', 'paving'], industry_fit: ['Construction', 'Infrastructure', 'Road Development'] },
  { id: 'prod_005', name: 'HP Aviation Fuel - ATF', category: 'Aviation', tags: ['aviation', 'aircraft', 'airport', 'atf', 'jet fuel', 'airline'], industry_fit: ['Aviation', 'Airports', 'Defense'] },
  { id: 'prod_006', name: 'HP Transformer Oil', category: 'Specialty', tags: ['transformer', 'electrical', 'power', 'utility', 'substation'], industry_fit: ['Power', 'Utilities', 'Energy'] },
  { id: 'prod_007', name: 'HP Marine Fuel', category: 'Marine', tags: ['marine', 'ship', 'vessel', 'port', 'shipping', 'bunker'], industry_fit: ['Shipping', 'Ports', 'Marine Transport'] },
  { id: 'prod_008', name: 'HP Furnace Oil', category: 'Industrial', tags: ['furnace', 'boiler', 'heating', 'industrial', 'steel', 'cement'], industry_fit: ['Manufacturing', 'Steel', 'Cement', 'Textile'] },
];

// Users for role-based access
export const users = [
  { id: 'u1', role: 'sales', name: 'Rajesh Kumar', region: 'North', territory: 'Delhi NCR', email: 'rajesh.kumar@hpcl.in' },
  { id: 'u2', role: 'sales', name: 'Amit Patel', region: 'West', territory: 'Maharashtra', email: 'amit.patel@hpcl.in' },
  { id: 'u3', role: 'sales', name: 'Suresh Reddy', region: 'South', territory: 'Karnataka', email: 'suresh.reddy@hpcl.in' },
  { id: 'mgr_001', role: 'manager', name: 'Priya Sharma', region: 'All', territory: 'National', email: 'priya.sharma@hpcl.in' },
];

// Mock signals for automated ingestion
export const mockSignals = [
  {
    company_name: 'NHAI',
    text: 'National Highways Authority of India invites bids for supply of VG-30 grade bitumen for NH-44 expansion project. Estimated requirement: 25,000 MT over 24 months.',
    source: 'Government Tender Portal',
    source_type: 'tender',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    trust: 0.95,
    geo: 'South',
  },
  {
    company_name: 'Reliance Logistics',
    text: 'Reliance Logistics announces fleet expansion with 1000 new trucks. While transitioning to CNG, the company still requires diesel for existing fleet operations across Western India.',
    source: 'Business Standard',
    source_type: 'news',
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
    trust: 0.87,
    geo: 'West',
  },
  {
    company_name: 'Haldirams',
    text: 'Haldirams inaugurates its largest food processing facility in Nagpur. The plant features 20 industrial kitchens and will require substantial LPG supply for cooking and processing operations.',
    source: 'Food Industry News',
    source_type: 'news',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    trust: 0.84,
    geo: 'West',
  },
  {
    company_name: 'JSW Steel',
    text: 'JSW Steel to expand Vijayanagar plant capacity by 5 MTPA. New blast furnaces will require substantial furnace oil and industrial lubricants.',
    source: 'Metal Bulletin',
    source_type: 'news',
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
    trust: 0.89,
    geo: 'South',
  },
];

// Industry list
export const industries = [
  'Manufacturing', 'Transportation', 'Construction', 'Hospitality', 'Steel',
  'Cement', 'Mining', 'Power', 'Aviation', 'Marine', 'Logistics',
  'Food Processing', 'Textile', 'Chemicals', 'Infrastructure', 'Healthcare',
];

// Region mapping
export const regions: Record<string, string[]> = {
  North: ['Delhi', 'NCR', 'Punjab', 'Haryana', 'UP', 'Uttarakhand'],
  South: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Telangana'],
  East: ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha', 'Assam'],
  West: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'MP'],
};

// Lead status type
export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'rejected';

// Lead interface
export interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  source: string;
  source_type?: string;
  source_text: string;
  timestamp: number;
  trust: number;
  geo: string;
  status: LeadStatus;
  score?: number;
  assignedTo?: string;
  note?: string;
  inference?: InferenceResult;
}

// Inference result from OpenAI
export interface InferenceResult {
  company_name: string;
  industry: string;
  inferred_products: string[];
  reason_codes: string[];
  confidence_score: number;
  urgency_level: 'low' | 'medium' | 'high';
  suggested_next_action: string;
}

// Helper: Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Format timestamp
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper: Days since timestamp
export function daysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

// Helper: Get urgency badge class
export function getUrgencyClass(urgency?: string): string {
  switch (urgency) {
    case 'high': return 'badge-high';
    case 'medium': return 'badge-medium';
    case 'low': return 'badge-low';
    default: return 'badge-medium';
  }
}

// Helper: Get status badge class
export function getStatusClass(status: LeadStatus): string {
  switch (status) {
    case 'new': return 'badge-new';
    case 'in_progress': return 'badge-progress';
    case 'converted': return 'badge-converted';
    case 'rejected': return 'badge-rejected';
    default: return 'badge-new';
  }
}

// Helper: Get score color
export function getScoreColor(score?: number): string {
  if (!score) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

// Seed initial DB
export function seedDB() {
  return { leads: [], users, notifications: [], analytics: { leads_this_week: 0, conversion_rate: 0 } };
}
