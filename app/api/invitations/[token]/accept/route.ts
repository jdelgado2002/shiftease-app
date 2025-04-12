import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getJwtSecretKey } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const { firstName, lastName, password } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { message: "Invitation has already been used" },
        { status: 400 }
      )
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { message: "Invitation has expired" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    let result
    try {
      // Use a transaction to create user and update invitation status
      result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            firstName,
            lastName,
            role: invitation.role,
            organizationId: invitation.organizationId,
            isOwner: false, // Invited users are not owners
            status: "ACTIVE",
          },
          include: {
            organization: true,
          },
        })

        // Update invitation status
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { 
            status: "ACCEPTED",
            acceptedAt: new Date(),
            userId: user.id
          },
        })

        // Create default permissions based on role
        let permissionNames = []

        if (invitation.role === "MANAGER") {
          permissionNames = [
            "manage_schedules",
            "view_reports",
            "manage_locations",
          ]
        } else if (invitation.role === "EMPLOYEE") {
          permissionNames = [
            "view_schedules",
          ]
        }

        // Create permissions
        for (const name of permissionNames) {
          await tx.permission.create({
            data: {
              name,
              organizationId: invitation.organizationId,
              users: {
                connect: { id: user.id }
              }
            }
          })
        }

        return { user }
      })
    } catch (error) {
      console.error("Transaction error:", error)
      throw error
    }

    // Create JWT token
    const jwtToken = await new SignJWT({
      userId: result.user.id,
      organizationId: result.user.organizationId,
      role: result.user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(getJwtSecretKey()))

    // Create the response object with user data
    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.user.organizationId,
        organization: result.user.organization,
        isOwner: result.user.isOwner,
        permissions: [], // Empty array initially, will be populated client-side
      },
      organization: result.user.organization,
    })

    // Set the token as HttpOnly cookie
    response.cookies.set({
      name: 'token',
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json(
      { 
        message: "An error occurred while accepting the invitation", 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}