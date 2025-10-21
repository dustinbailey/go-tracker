import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Set your password here or use an environment variable
const APP_PASSWORD = process.env.APP_PASSWORD || '';

// In-memory rate limiting
interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute

function getClientIP(request: Request): string {
  // Try to get the real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry) {
    return { allowed: true };
  }
  
  // Check if the lockout period has expired
  if (now > entry.resetTime) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }
  
  // Check if max attempts reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((entry.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry) {
    rateLimitMap.set(ip, {
      attempts: 1,
      resetTime: now + LOCKOUT_DURATION,
    });
  } else {
    entry.attempts += 1;
    // Don't extend the reset time on subsequent attempts
  }
}

function clearFailedAttempts(ip: string): void {
  rateLimitMap.delete(ip);
}

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many failed attempts. Please try again in ${rateLimit.remainingTime} minute(s).` 
        }, 
        { status: 429 }
      );
    }
    
    const { password } = await request.json();

    if (password === APP_PASSWORD && APP_PASSWORD !== '') {
    // Clear any failed attempts on successful login
    clearFailedAttempts(clientIP);
    
    // Set a cookie that expires in 1 year
    const response = NextResponse.json({ success: true });
    response.cookies.set('authenticated', 'true', {
      httpOnly: true,
      secure: true, // Always secure on Cloudflare
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return response;
  }

    // Record failed attempt
    recordFailedAttempt(clientIP);
    
    // Check if this failed attempt has triggered the lockout
    const newRateLimit = checkRateLimit(clientIP);
    if (!newRateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many failed attempts. Please try again in ${newRateLimit.remainingTime} minute(s).` 
        }, 
        { status: 429 }
      );
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed'
      }, 
      { status: 500 }
    );
  }
}

