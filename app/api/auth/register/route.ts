import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

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
    const organizationSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if organization with this slug already exists
    const existingOrganization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    })

    if (existingOrganization) {
      return NextResponse.json(
        { message: "Organization with this name already exists" },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
      },
    })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "OWNER",
        organizationId: organization.id,
        isOwner: true,
        status: "ACTIVE",
      },
      include: {
        organization: true,
        permissions: true,
      },
    })

    // Create default permissions for the owner
    await prisma.permission.createMany({
      data: [
        { name: "manage_organization", organizationId: organization.id },
        { name: "manage_users", organizationId: organization.id },
        { name: "manage_locations", organizationId: organization.id },
        { name: "manage_schedule", organizationId: organization.id },
        { name: "view_reports", organizationId: organization.id },
      ],
    })

    // Generate JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isOwner: user.isOwner,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        isOwner: user.isOwner,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    )
  }
}