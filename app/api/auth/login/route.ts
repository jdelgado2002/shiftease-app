import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

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

    // Return success response
    return NextResponse.json({
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
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "An error occurred during login", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}