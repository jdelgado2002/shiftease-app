/**
 * CSRF protection utilities for client-side requests
 */

/**
 * Gets the CSRF token from the cookie set by the middleware
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  // The middleware sets a header with the token value
  if (typeof document !== 'undefined') {
    // Get token from cookies
    const cookies = document.cookie.split(';')
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='))
    if (csrfCookie) {
      return csrfCookie.split('=')[1]
    }
    
    // If not found in cookies, check for x-csrf-token header
    // This is a fallback for when the cookie is HTTP-only
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    if (metaTag) {
      return metaTag.getAttribute('content')
    }
  }
  return null
}

/**
 * Adds CSRF protection headers to fetch options
 * @param options - The fetch options to enhance with CSRF protection
 * @returns Enhanced fetch options with CSRF token
 */
export function withCsrf<T extends RequestInit>(options: T): T {
  const csrfToken = getCsrfToken()
  if (!csrfToken) return options

  // Create a new headers object with the existing headers and the CSRF token
  const headers = new Headers(options.headers || {})
  headers.set('X-CSRF-Token', csrfToken)

  return {
    ...options,
    headers,
    // Include credentials to send cookies
    credentials: 'include'
  }
}

/**
 * Enhanced fetch function with CSRF protection
 * @param url - The URL to fetch
 * @param options - The fetch options
 * @returns The fetch response
 */
export async function fetchWithCsrf(
  url: RequestInfo | URL,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, withCsrf(options))
}