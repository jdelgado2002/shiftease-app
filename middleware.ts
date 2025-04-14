import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Checks if a path matches any of the provided patterns
 */
function isPathMatch(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => path.startsWith(pattern));
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
  public: ['/login', '/register', '/forgot-password', '/reset-password', '/invite'],
  
  // Paths to bypass middleware completely
  bypass: ['/api', '/_next', '/static', '/favicon.ico'],
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
    '/api/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};