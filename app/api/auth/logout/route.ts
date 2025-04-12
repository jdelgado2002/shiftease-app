import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Create a response
  const response = NextResponse.json({ 
    success: true, 
    message: "Logged out successfully" 
  })
  
  // Clear all auth cookies
  response.cookies.delete('token')
  
  // Also clear CSRF cookie to prevent issues with subsequent requests
  response.cookies.delete('csrf-token')
  
  return response
}