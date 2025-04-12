import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Skip middleware for internal Next.js requests
  if (request.nextUrl.pathname.includes('_next') || 
      request.nextUrl.pathname.includes('api') ||
      request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('token')?.value;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/reset-password'];
  const path = request.nextUrl.pathname;
  
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  try {
    if (!token) {
      throw new Error('No token');
    }

    // Verify token and extract organization context
    const { user, organization } = await verifyAuth(token);

    // Check if URL organization matches token organization
    const urlOrg = path.split('/')[1];
    if (urlOrg && urlOrg !== organization.slug) {
      return NextResponse.redirect(new URL(`/${organization.slug}`, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};