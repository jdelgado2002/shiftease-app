import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
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

    // Check if user with email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
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

    // Return success response
    return NextResponse.json({
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
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "An error occurred during registration", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}