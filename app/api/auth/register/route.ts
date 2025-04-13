import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"
import { getClientIp, rateLimit } from "@/lib/rate-limit"
import { createCsrfTokenGenerator } from "@/lib/csrf"

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for registration to prevent abuse
    // Use a stricter rate limit for registration than login
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, {
      maxRequests: 3,           // Only 3 registration attempts
      windowMs: 60 * 60 * 1000, // Within a 1-hour window
      blockDurationMs: 24 * 60 * 60 * 1000 // Block for 24 hours on exceeding limit
    });

    // If rate limit exceeded, return 429 Too Many Requests
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          message: "Too many registration attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
      
      // Add rate limiting headers
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter ?? 3600));
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));
      
      return response;
    }

    const { organizationName, email, password, firstName, lastName } = await request.json()

    console.log('Received registration request for:', { organizationName, email, firstName, lastName })

    // Validate required fields
    if (!organizationName || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate organization slug from name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "")

    console.log('Generated slug:', slug)

    // Check if organization with slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { message: "Organization already exists" },
        { status: 409 }
      )
    }

    // Check if user with email exists in any organization they own
    const existingOwner = await prisma.user.findFirst({
      where: { 
        email,
        isOwner: true,
        role: "OWNER"
      }
    })

    if (existingOwner) {
      return NextResponse.json(
        { message: "An organization owner account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    let result;
    try {
      // Create organization and owner in a transaction
      result = await prisma.$transaction(async (tx) => {
        console.log('Creating organization...')
        // Create organization first
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug,
            settings: {},
          },
        })

        console.log('Creating user...')
        // Create the owner user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "OWNER",
            status: "ACTIVE",
            organizationId: organization.id,
            isOwner: true,
          },
          include: {
            organization: true,
          },
        })

        console.log('Creating permissions...')
        // Create default permissions for the owner
        const permissionNames = [
          "manage_users",
          "manage_locations",
          "manage_schedules",
          "manage_settings",
          "view_reports",
        ]

        // Create permissions one by one
        for (const name of permissionNames) {
          await tx.permission.create({
            data: {
              name,
              organizationId: organization.id,
              users: {
                connect: { id: user.id }
              }
            }
          })
        }

        return { organization, user }
      })
    } catch (txError) {
      console.error('Transaction error:', txError)
      throw txError
    }

    console.log('Creating JWT token...')
    // Create JWT token
    const token = await new SignJWT({
      userId: result.user.id,
      organizationId: result.organization.id,
      role: result.user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    // Create response object with user data but WITHOUT the token in the body
    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.organization.id,
        organization: result.organization,
        isOwner: result.user.isOwner,
        permissions: [
          "manage_users",
          "manage_locations",
          "manage_schedules",
          "manage_settings",
          "view_reports",
        ],
      },
      organization: result.organization,
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
    
    // Generate and set a CSRF token
    try {
      // Generate a CSRF token directly
      const csrfToken = crypto.randomUUID ? 
        crypto.randomUUID() : 
        Buffer.from(Math.random().toString(36) + Date.now().toString()).toString('base64');
      
      // Add it to the response cookies
      response.cookies.set({
        name: 'csrf-token',
        value: csrfToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return response;
    } catch (error) {
      console.warn('CSRF setup error:', error);
      // Return the original response if CSRF setup fails
      return response;
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "An error occurred during registration", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}