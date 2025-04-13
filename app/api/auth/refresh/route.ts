import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"

/**
 * API endpoint to refresh user and organization data in the client's session
 * This ensures the client always has the most up-to-date information after permission changes,
 * organization updates, or other modifications that affect the user's access or state.
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from the HttpOnly cookie
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify the token and fetch fresh user/organization data from the database
    const { user, organization } = await verifyAuth(token)
    
    // Create a new JWT token with the fresh data
    const newToken = await new SignJWT({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    // Create response with user and organization data
    const response = NextResponse.json({
      user,
      organization,
      message: "Session data refreshed successfully"
    })

    // Update the token cookie
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
    console.error("Session refresh error:", error)
    return NextResponse.json(
      { message: "Failed to refresh session data", error: error instanceof Error ? error.message : String(error) },
      { status: 401 }
    )
  }
}