import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Create a response
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })
    
    // Clear the token cookie
    response.cookies.delete('token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: "An error occurred during logout",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}