import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyAuth } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify auth and ensure user is owner
    const { user, organization } = await verifyAuth(token)
    if (!user.isOwner) {
      return NextResponse.json({ message: "Only owners can update organization settings" }, { status: 403 })
    }

    const settings = await request.json()

    // Update organization settings
    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        settings: {
          ...organization.settings,
          ...settings,
          onboardingCompleted: true // Always set this flag when updating settings
        }
      }
    })

    return NextResponse.json({
      organization: updatedOrg,
      message: "Organization settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating organization settings:", error)
    return NextResponse.json(
      { message: "Failed to update organization settings" },
      { status: 500 }
    )
  }
} 