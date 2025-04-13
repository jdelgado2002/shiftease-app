/**
 * Simple in-memory rate limiter for API routes
 * Uses a Map to store rate limit data with automatic cleanup
 */

interface RateLimitData {
  count: number;
  resetTime: number;
  blocked: boolean;
  firstAttempt: number;
}

// In-memory store for rate limiting
// Note: This will reset on server restart or when serverless functions cold start
// For production with high traffic, consider a more persistent solution like Redis or DynamoDB
const ipRequests = new Map<string, RateLimitData>();

// Cleanup old entries every 15 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (data.resetTime < now) {
      ipRequests.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitOptions {
  maxRequests?: number;       // Maximum number of requests allowed within the window
  windowMs?: number;          // Time window in milliseconds
  blockDurationMs?: number;   // How long to block if limit is exceeded
}

export interface RateLimitResult {
  success: boolean;           // Whether the request is allowed
  limit: number;              // Maximum number of requests allowed
  remaining: number;          // Number of requests remaining in the current window
  resetTime: number;          // Time when the rate limit resets
  blocked: boolean;           // Whether the IP is currently blocked
  retryAfter?: number;        // Seconds after which to retry if blocked
}

/**
 * Check if a request should be rate limited
 * 
 * @param ip - The IP address to check
 * @param options - Rate limiting options
 * @returns Result of the rate limit check
 */
export function rateLimit(ip: string, options: RateLimitOptions = {}): RateLimitResult {
  const now = Date.now();
  
  // Default settings - adjust based on security needs
  const maxRequests = options.maxRequests || 5;         // 5 attempts
  const windowMs = options.windowMs || 60 * 1000;       // 1 minute window
  const blockDurationMs = options.blockDurationMs || 15 * 60 * 1000; // 15 minute block
  
  // Get existing data for this IP or create new entry
  const rateLimitData = ipRequests.get(ip) || {
    count: 0,
    resetTime: now + windowMs,
    blocked: false,
    firstAttempt: now
  };
  
  // If IP is blocked and block duration hasn't expired
  if (rateLimitData.blocked) {
    // Check if block duration has passed
    if (now < rateLimitData.resetTime) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: rateLimitData.resetTime,
        blocked: true,
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
      };
    } else {
      // Unblock if duration has passed
      rateLimitData.blocked = false;
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + windowMs;
    }
  }
  
  // If within the current window, increment counter
  if (now < rateLimitData.resetTime) {
    rateLimitData.count++;
  } else {
    // Start a new window
    rateLimitData.count = 1;
    rateLimitData.resetTime = now + windowMs;
    rateLimitData.firstAttempt = now;
  }
  
  // If the limit is exceeded, block the IP
  if (rateLimitData.count > maxRequests) {
    rateLimitData.blocked = true;
    
    // Calculate progressive block duration based on repeated attempts
    // This increases block time for persistent attackers
    const attemptsSinceFirst = Math.ceil((now - rateLimitData.firstAttempt) / windowMs);
    const multiplier = Math.min(attemptsSinceFirst, 5); // Cap at 5x multiplier
    rateLimitData.resetTime = now + (blockDurationMs * multiplier);
    
    ipRequests.set(ip, rateLimitData);
    
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: rateLimitData.resetTime,
      blocked: true,
      retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
    };
  }
  
  // Update the store
  ipRequests.set(ip, rateLimitData);
  
  // Return success result
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - rateLimitData.count),
    resetTime: rateLimitData.resetTime,
    blocked: false
  };
}

/**
 * Get the client IP address from a Next.js request
 */
export function getClientIp(request: Request): string {
  // Try to get the IP from headers first (for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to direct connection IP
  const ip = request.headers.get('x-real-ip');
  if (ip) {
    return ip;
  }
  
  // Last resort, return a placeholder
  // In Vercel, we should always get an IP from x-forwarded-for
  return '127.0.0.1';
}