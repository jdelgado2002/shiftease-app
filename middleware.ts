import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Skip middleware for internal Next.js requests and public assets
  if (request.nextUrl.pathname.includes('_next') || 
      request.nextUrl.pathname.includes('api') ||
      request.nextUrl.pathname.includes('favicon.ico') ||
      request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('token')?.value;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/reset-password', '/invite'];
  const path = request.nextUrl.pathname;
  
  // Allow access to public paths without authentication
  for (const publicPath of publicPaths) {
    if (path === publicPath || path.startsWith(`${publicPath}/`)) {
      return NextResponse.next();
    }
  }

  // If we're not on a public path and don't have a token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Add a return_to param to redirect back after login
    loginUrl.searchParams.set('return_to', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token and extract user/organization context
    const { user, organization } = await verifyAuth(token);

    // If we have a valid token and trying to access login/register pages,
    // redirect to the dashboard
    if (publicPaths.includes(path)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if URL organization matches token organization
    // Note: This part should only apply if you're using organization-specific URLs
    const urlOrg = path.split('/')[1];
    if (urlOrg && organization?.slug && urlOrg !== organization.slug) {
      return NextResponse.redirect(new URL(`/${organization.slug}${path.substring(urlOrg.length + 1)}`, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If token validation fails, clear the invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};