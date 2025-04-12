import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  // Create a response
  const response = NextResponse.json({ 
    success: true, 
    message: "Logged out successfully" 
  })
  
  // Clear the auth token cookie
  response.cookies.delete('token')
  
  return response
}