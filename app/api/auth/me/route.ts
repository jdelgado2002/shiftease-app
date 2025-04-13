import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('token')?.value
    
    // If no token exists, return 401 Unauthorized
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify the token and get user and organization
    const { user: tokenData } = await verifyAuth(token)
    
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Fetch the full user data from the database
    const user = await prisma.user.findUnique({
      where: { id: tokenData.id },
      include: {
        organization: true,
        permissions: true,
      }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data without sensitive information
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
        permissions: user.permissions.map(p => p.name)
      },
      organization: user.organization
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    )
  }
}