import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    console.log("Received registration request")
    
    // Apply rate limiting for registration to prevent abuse
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, {
      maxRequests: 3,           // Only 3 registration attempts
      windowMs: 60 * 60 * 1000, // Within a 1-hour window
      blockDurationMs: 24 * 60 * 60 * 1000 // Block for 24 hours on exceeding limit
    });

    if (!rateLimitResult.success) {
      console.log("Rate limit exceeded")
      const response = NextResponse.json(
        { 
          message: "Too many registration attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
      
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter ?? 3600));
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));
      
      return response;
    }

    const { organizationName, email, password, firstName, lastName } = await request.json()
    console.log("Registration data received:", { organizationName, email, firstName, lastName })

    // Validate required fields
    if (!organizationName || !email || !password || !firstName || !lastName) {
      console.log("Missing required fields")
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

    console.log("Checking for existing organization")
    // Check if organization with this slug already exists
    const existingOrganization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    })

    if (existingOrganization) {
      console.log("Organization already exists")
      return NextResponse.json(
        { message: "Organization with this name already exists" },
        { status: 400 }
      )
    }

    console.log("Checking for existing user")
    // Check if user with this email already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: { email, organization: { slug: organizationSlug } },
    })

    if (existingUser) {
      console.log("User already exists")
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    console.log("Creating organization")
    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
      },
    })

    console.log("Hashing password")
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("Creating user")
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

    console.log("Creating default permissions")
    // Create default permissions for the owner
    const permissions = await prisma.permission.createMany({
      data: [
        { name: "manage_organization", organizationId: organization.id },
        { name: "manage_users", organizationId: organization.id },
        { name: "manage_locations", organizationId: organization.id },
        { name: "manage_schedule", organizationId: organization.id },
        { name: "view_reports", organizationId: organization.id },
      ],
    })

    // Connect permissions to the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        permissions: {
          connect: [
            { name_organizationId: { name: "manage_organization", organizationId: organization.id } },
            { name_organizationId: { name: "manage_users", organizationId: organization.id } },
            { name_organizationId: { name: "manage_locations", organizationId: organization.id } },
            { name_organizationId: { name: "manage_schedule", organizationId: organization.id } },
            { name_organizationId: { name: "view_reports", organizationId: organization.id } },
          ]
        }
      }
    })

    console.log("Registration successful")
    return NextResponse.json({
      message: "Registration successful",
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
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    )
  }
}