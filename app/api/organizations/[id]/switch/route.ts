import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Use your auth verification function to extract user ID from token
    // This is a simplification - you should use your existing verifyAuth function
    let userId: string
    try {
      // Extract userId from token - implement this based on your token structure
      const { user } = await import("@/lib/auth").then(
        mod => mod.verifyAuth(token)
      )
      userId = user.id
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const organizationId = params.id

    // Check if user has access to the organization
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId,
      },
    })

    if (!userOrg) {
      return NextResponse.json(
        { message: "You don't have access to this organization" },
        { status: 403 }
      )
    }

    // Get user with new organization context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          where: { organizationId },
        },
        organization: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Create new JWT token with updated organization context
    const newToken = await new SignJWT({
      userId: user.id,
      organizationId,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    // Create response with user data
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
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error("Organization switch error:", error)
    return NextResponse.json(
      { message: "An error occurred while switching organizations", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}