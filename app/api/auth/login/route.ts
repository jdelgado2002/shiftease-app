import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        organizationId: session.user.organizationId,
        isOwner: session.user.isOwner,
        permissions: session.user.permissions,
        organization: session.user.organization,
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    )
  }
}