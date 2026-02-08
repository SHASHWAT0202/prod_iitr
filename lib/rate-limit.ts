/**
 * Simple in-memory rate limiter for API protection
 * In production, use Redis or similar for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds
  maxRequests?: number;  // Max requests per window
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetIn: number } {
  const { windowMs, maxRequests } = { ...defaultOptions, ...options };
  const now = Date.now();
  
  let entry = rateLimitStore.get(identifier);
  
  // Clean up or create new entry
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }
  
  entry.count++;
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetTime - now);
  
  return { allowed, remaining, resetIn };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (now >= entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 60 * 1000); // Clean up every minute

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  default: { windowMs: 60 * 1000, maxRequests: 100 },
  strict: { windowMs: 60 * 1000, maxRequests: 30 },
  relaxed: { windowMs: 60 * 1000, maxRequests: 200 },
  scraper: { windowMs: 60 * 1000, maxRequests: 10 },
  auth: { windowMs: 60 * 1000, maxRequests: 10 },
};

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

// Rate limit middleware helper
export function checkRateLimit(
  request: Request,
  config: RateLimitOptions = rateLimitConfigs.default
): { allowed: boolean; headers: Record<string, string> } {
  const ip = getClientIP(request);
  const { allowed, remaining, resetIn } = rateLimit(ip, config);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests || defaultOptions.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
  };
  
  return { allowed, headers };
}
