import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthForEdge } from './lib/auth';
import { createCsrfProtect } from '@edge-csrf/nextjs';

// Define paths that don't need authentication
const publicPaths = ['/login', '/register', '/reset-password', '/invite'];

// Define paths that should bypass middleware entirely
const bypassPaths = ['/_next', '/favicon.ico', '/api/auth'];

// Create CSRF protection middleware with more focused configuration
const csrfProtect = createCsrfProtect({
  cookie: {
    name: 'csrf-token',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  methodsToProtect: ['POST', 'PUT', 'DELETE', 'PATCH'],
  // Only validate CSRF for state-changing operations, not for navigation/GETs
  ignorePaths: ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/me'],
});

export async function middleware(request: NextRequest) {
  // Early return for bypassed paths to avoid any processing
  if (bypassPaths.some(path => request.nextUrl.pathname.includes(path))) {
    return NextResponse.next();
  }

  // Handle RSC requests
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }

  // Create base response
  let response = NextResponse.next();
  
  // Get current path
  const path = request.nextUrl.pathname;
  
  // Check if this is a public path
  const isPublicPath = publicPaths.some(
    publicPath => path === publicPath || path.startsWith(`${publicPath}/`)
  );

  // Apply CSRF protection for non-GET methods (state-changing operations)
  if (request.method !== 'GET' && !path.startsWith('/api/auth/')) {
    try {
      response = await csrfProtect(request, response);
    } catch (csrfError) {
      console.error('CSRF Error:', csrfError);
      return new NextResponse(
        JSON.stringify({ message: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Generate CSRF token for form submissions on GET requests
  // This ensures the token is available for subsequent POST requests
  if (request.method === 'GET') {
    try {
      response = await csrfProtect(request, response);
    } catch (csrfError) {
      // Just log warnings for GET requests but don't block
      console.warn('CSRF warning on GET request:', csrfError);
    }
  }
  
  // Get auth token
  const token = request.cookies.get('token')?.value;

  // Handle public paths
  if (isPublicPath) {
    // If already authenticated and trying to access login/register pages,
    // redirect to dashboard
    if (token) {
      try {
        const { valid } = await verifyAuthForEdge(token);
        if (valid) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        // Token is invalid, let them access public paths
        return response;
      }
    }
    return response;
  }
  
  // Authentication check for protected routes
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('return_to', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token using the Edge-compatible function
    const { valid } = await verifyAuthForEdge(token);
    if (!valid) {
      throw new Error("Invalid token");
    }
    return response;
  } catch (error) {
    // If token validation fails, clear the invalid cookie and redirect to login
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.cookies.delete('token');
    return redirectResponse;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};