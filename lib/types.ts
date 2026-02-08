/**
 * TypeScript Type Definitions
 * Centralized types for the HPCL Lead Intelligence App
 */

export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'rejected';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type UserRole = 'sales' | 'manager' | 'admin' | 'org_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface User {
  _id?: string;
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  region: string;
  territory: string;
  phone?: string;
  avatar?: string;
  status?: UserStatus;
  orgCode?: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  _id?: string;
  id: string;
  name: string;
  category: string;
  tags: string[];
  industry_fit: string[];
  description?: string;
}

export interface InferenceResult {
  company_name: string;
  industry: string;
  inferred_products: string[];
  reason_codes: string[];
  confidence_score: number;
  urgency_level: UrgencyLevel;
  suggested_next_action: string;
}

export interface Lead {
  _id?: string;
  id: string;
  company_name: string;
  normalized_name?: string;
  industry?: string;
  source: string;
  source_type: 'tender' | 'news' | 'social' | 'manual' | 'rss';
  source_text: string;
  source_url?: string;
  timestamp: number;
  trust: number;
  geo: string;
  status: LeadStatus;
  score?: number;
  scoreBreakdown?: Record<string, number>;
  scoreExplanation?: string[];
  assignedTo?: string;
  assignedUser?: User;
  note?: string;
  inference?: InferenceResult;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Signal {
  _id?: string;
  id: string;
  company_name: string;
  text: string;
  source: string;
  source_type: 'tender' | 'news' | 'social' | 'manual' | 'rss';
  timestamp: number;
  trust: number;
  geo: string;
  url?: string;
  processed: boolean;
  leadId?: string;
}

export interface Notification {
  _id?: string;
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  leadId?: string;
  userId?: string;
  channel?: 'app' | 'whatsapp' | 'email';
  read: boolean;
  createdAt: Date;
}

export interface Analytics {
  _id?: string;
  id: string;
  leads_this_week: number;
  leads_this_month: number;
  conversion_rate: number;
  total_leads: number;
  new_leads: number;
  in_progress_leads: number;
  converted_leads: number;
  rejected_leads: number;
  top_products: string[];
  sector_distribution: Record<string, number>;
  region_distribution: Record<string, number>;
  updated_at: Date;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  inProgress: number;
  converted: number;
  rejected: number;
  conversionRate: number;
  avgScore: number;
  highPriorityCount: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Feedback and Learning Types
export type FeedbackAction = 'approved' | 'rejected' | 'converted' | 'contacted';
export type RejectionReason = 
  | 'not_relevant' 
  | 'wrong_industry' 
  | 'too_small' 
  | 'already_customer'
  | 'bad_timing'
  | 'competitor'
  | 'low_quality_source'
  | 'duplicate'
  | 'other';

export interface LeadFeedback {
  _id?: string;
  id: string;
  leadId: string;
  userId: string;
  action: FeedbackAction;
  reason?: RejectionReason;
  notes?: string;
  leadSnapshot: {
    score: number;
    source_type: string;
    industry: string;
    geo: string;
    trust: number;
    intentStrength: number;
    freshness: number;
    companySizeProxy: number;
    keywords: string[];
    inferenceConfidence?: number;
    urgencyLevel?: string;
  };
  createdAt: Date;
}

export interface LearnedWeights {
  _id?: string;
  id: string;
  intentStrengthMultiplier: number;
  freshnessMultiplier: number;
  companySizeMultiplier: number;
  trustMultiplier: number;
  geoMatchMultiplier: number;
  industryBoosts: Record<string, number>;
  sourceBoosts: Record<string, number>;
  keywordBoosts: Record<string, number>;
  geoBoosts: Record<string, number>;
  sampleSize: number;
  lastUpdated: Date;
  version: number;
}

export interface LearningStats {
  totalFeedback: number;
  approvalRate: number;
  learningEnabled: boolean;
  lastUpdated: Date | null;
  version: number;
  recentTrend: 'improving' | 'stable' | 'declining' | 'unknown';
}
