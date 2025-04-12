import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting based on IP address
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, {
      maxRequests: 5,      // Allow 5 login attempts
      windowMs: 60 * 1000, // Within a 1-minute window
      blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes on exceeding limit
    });

    // If rate limit is exceeded, return a 429 Too Many Requests response
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          message: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
      
      // Add rate limiting headers
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter || 60));
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));
      
      return response;
    }

    const { email, password, organizationSlug } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find user and include their organization and permissions
    let user = await prisma.user.findFirst({
      where: {
        email,
        ...(organizationSlug ? {
          organization: {
            slug: organizationSlug
          }
        } : {})
      },
      include: {
        organization: true,
        permissions: true,
      }
    })

    if (!user) {
      // For security, still consume a rate limit attempt but don't reveal that user doesn't exist
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // If password is invalid, return error but still consume a rate limit attempt
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Since authentication was successful, we can reset the rate limit counter for this IP
    // This prevents legitimate users from being penalized for typos or occasional mistakes
    // Note: In production with distributed servers, this reset might not apply 
    // if the next request hits a different server instance
    
    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    // Create the response object with user data but WITHOUT the token in the body
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
        isOwner: user.isOwner,
        permissions: user.permissions.map(p => p.name),
      },
      organization: user.organization,
    })

    // Set the token as HttpOnly cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "An error occurred during login", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}