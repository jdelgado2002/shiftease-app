import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthForEdge } from './lib/auth';

/**
 * Checks if a path matches any of the provided patterns
 */
function isPathMatch(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => path === pattern || path.startsWith(`${pattern}/`));
}

/**
 * Creates a redirect response to the login page with return_to parameter
 */
function createLoginRedirect(request: NextRequest): NextResponse {
  // Don't redirect if we're already on the login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }
  
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('return_to', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Path configurations
const PATHS = {
  // Paths that don't require authentication
  public: ['/login', '/register', '/reset-password', '/invite', '/api/invitations', '/invalid-invitation'],
  
  // Special authenticated paths with specific handling
  specialAuth: ['/onboarding', '/employee-onboarding'],
  
  // Paths to bypass middleware completely
  bypass: ['/_next', '/favicon.ico', '/api/health', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/refresh'],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  
  // 1. Skip middleware for static assets, API routes, and special paths
  if (isPathMatch(path, PATHS.bypass) || request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isPublicPath = isPathMatch(path, PATHS.public);

  // 2. Handle public paths (login, register, etc.)
  if (isPublicPath) {
    if (token) {
      // If user is already logged in, redirect to home
      try {
        const { valid } = await verifyAuthForEdge(token);
        if (valid) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        // If token verification fails, allow access to public path
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 3. Enforce authentication for protected routes
  if (!token) {
    return createLoginRedirect(request);
  }

  // 4. Verify token validity
  try {
    const { valid } = await verifyAuthForEdge(token);
    if (!valid) {
      const response = createLoginRedirect(request);
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Token verification failed, clear it and redirect
    const response = createLoginRedirect(request);
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};