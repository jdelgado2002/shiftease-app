import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Checks if a path matches any of the provided patterns
 */
function isPathMatch(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Handle exact matches
    if (pattern === path) return true;
    // Handle dynamic routes
    if (pattern.endsWith('*')) {
      const basePattern = pattern.slice(0, -1);
      return path.startsWith(basePattern);
    }
    // Handle exact matches with trailing slash
    return path.startsWith(pattern) && (path === pattern || path === `${pattern}/`);
  });
}

/**
 * Creates a redirect response to the login page with return_to parameter
 */
function createLoginRedirect(request: NextRequest): NextResponse {
  const url = new URL('/login', request.url);
  url.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(url);
}

// Path configurations
const PATHS = {
  // Paths that don't require authentication
  public: ['/login', '/register', '/forgot-password', '/reset-password', '/invite*'],
  
  // Paths to bypass middleware completely
  bypass: [
    '/api/auth',
    '/_next',
    '/static',
    '/favicon.ico',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/callback',
    '/api/auth/providers',
    '/api/auth/error',
    '/api/auth/verify-request',
    '/api/invitation-tokens',
  ],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;

  // Log API requests first
  if (path.startsWith('/api/')) {
    console.log('API Request:', {
      method: request.method,
      path: path,
      headers: Object.fromEntries(request.headers.entries()),
    });
  }
  
  // 1. Skip middleware for static assets, API routes, and special paths
  if (isPathMatch(path, PATHS.bypass) || request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isPublicPath = isPathMatch(path, PATHS.public);

  // 2. Handle public routes
  if (isPublicPath) {
    // For invite routes, allow access regardless of authentication status
    if (path.startsWith('/invite/')) {
      return NextResponse.next();
    }
    if (token) {
      // If user is already logged in, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Enforce authentication for protected routes
  if (!token) {
    return createLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|api/invitation-tokens|_next/static|_next/image|favicon.ico).*)',
  ],
};