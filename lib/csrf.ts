/**
 * CSRF protection utilities for client-side requests
 */

// Import the CSRF package for direct use in server contexts
import { createCsrfProtect } from '@edge-csrf/nextjs';

/**
 * Creates a CSRF token generator for server components
 * This allows generating fresh CSRF tokens in auth endpoints
 * @returns A CSRF protection instance that matches the middleware configuration
 */
export function createCsrfTokenGenerator() {
  return createCsrfProtect({
    cookie: {
      name: 'csrf-token',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    methodsToProtect: ['POST', 'PUT', 'DELETE', 'PATCH'],
    ignorePaths: ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/me', '/api/auth/refresh'],
    generateSecret: () => {
      // Use the same secret generation approach as in middleware
      return process.env.CSRF_SECRET || 'shiftease-development-csrf-secret';
    }
  });
}

/**
 * Gets the CSRF token from cookies
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1].trim()) : null;
}

/**
 * Adds CSRF protection headers to fetch options
 * @param options - The fetch options to enhance with CSRF protection
 * @returns Enhanced fetch options with CSRF token
 */
export function withCsrf<T extends RequestInit & { url?: string }>(options: T): T {
  const csrfToken = getCsrfToken();
  
  // If no token found, return original options with credentials
  if (!csrfToken) {
    return {
      ...options,
      credentials: 'include'
    };
  }

  // Check if this is an auth endpoint
  const isAuthEndpoint = options.url && (
    options.url.startsWith('/api/auth/') || 
    options.url.includes('/api/auth/')
  );

  // Always include the CSRF token unless it's an auth endpoint
  if (!isAuthEndpoint) {
    const headers = new Headers(options.headers || {});
    headers.set('X-CSRF-Token', csrfToken);
    
    return {
      ...options,
      headers,
      credentials: 'include'
    };
  }

  // For auth endpoints, just include credentials
  return {
    ...options,
    credentials: 'include'
  };
}

/**
 * Enhanced fetch function with CSRF protection
 */
export async function fetchWithCsrf(
  url: RequestInfo | URL,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers = new Headers(options.headers || {});
  
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  // Always include credentials to ensure cookies are sent
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}