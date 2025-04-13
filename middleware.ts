import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthForEdge } from './lib/auth';
import { createCsrfProtect } from '@edge-csrf/nextjs';

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
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('return_to', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Creates a standardized CSRF error response
 */
function createCsrfError(error: unknown): NextResponse {
  return NextResponse.json(
    { 
      message: 'Invalid CSRF token',
      error: error instanceof Error ? error.message : String(error)
    },
    { status: 403 }
  );
}

// Path configurations
const PATHS = {
  // Paths that don't require authentication
  public: ['/login', '/register', '/reset-password', '/invite'],
  
  // Special authenticated paths with specific handling
  specialAuth: ['/onboarding', '/employee-onboarding'],
  
  // Paths to bypass middleware completely
  bypass: ['/_next', '/favicon.ico', '/api/health'],
  
  // Auth API endpoints to exempt from CSRF protection
  authEndpoints: [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/refresh'
  ]
};

// CSRF protection configuration
const csrfProtect = createCsrfProtect({
  cookie: {
    name: 'csrf-token',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  token: {
    httpHeader: 'X-CSRF-Token',
    regenerate: true,
  },
  validateInNonMutatingRequests: true,
  excludePathPrefixes: ['/api/auth/login', '/api/auth/register', '/api/auth/logout'],
  encryptionSecret: process.env.CSRF_SECRET || 'shiftease-development-csrf-secret',
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  
  // 1. Skip middleware for static assets and special paths
  if (isPathMatch(path, PATHS.bypass) || request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();
  const token = request.cookies.get('token')?.value;
  const isPublicPath = isPathMatch(path, PATHS.public);
  const isAuthEndpoint = isPathMatch(path, PATHS.authEndpoints);

  // 2. Handle authentication exemptions for auth API endpoints
  if (isAuthEndpoint) {
    return response;
  }

  // 3. Generate CSRF token for all GET requests
  if (request.method === 'GET') {
    try {
      response = await csrfProtect(request, response);
    } catch (error) {
      console.warn('CSRF warning on GET request:', error);
      // Continue despite CSRF warning on GET (non-critical)
    }
  }

  // 4. Handle public paths (login, register, etc.)
  if (isPublicPath) {
    // If user is already authenticated, redirect to home
    if (token) {
      try {
        const { valid } = await verifyAuthForEdge(token);
        if (valid) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch {
        // Token verification failed, continue with public access
      }
    }
    return response;
  }

  // 5. Apply CSRF protection for mutation requests
  if (request.method !== 'GET') {
    try {
      response = await csrfProtect(request, response);
    } catch (error) {
      return createCsrfError(error);
    }
  }

  // 6. Enforce authentication for protected routes
  if (!token) {
    return createLoginRedirect(request);
  }

  // 7. Verify token validity
  try {
    const { valid } = await verifyAuthForEdge(token);
    if (!valid) {
      const redirectResponse = createLoginRedirect(request);
      redirectResponse.cookies.delete('token');
      return redirectResponse;
    }
    return response;
  } catch (error) {
    // Token verification failed, clear it and redirect
    const redirectResponse = createLoginRedirect(request);
    redirectResponse.cookies.delete('token');
    return redirectResponse;
  }
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};