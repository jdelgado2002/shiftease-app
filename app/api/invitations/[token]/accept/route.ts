import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { firstName, lastName, password } = await request.json()
    const { token } = params

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { message: "Invalid or expired invitation" },
        { status: 400 }
      )
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "Invitation has already been used" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: invitation.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: invitation.role,
        organizationId: invitation.organizationId,
        isOwner: false,
        status: "ACTIVE",
      },
      include: {
        organization: true,
        permissions: true,
      },
    })

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    })

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        isOwner: user.isOwner,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      { message: "Failed to complete registration" },
      { status: 500 }
    )
  }
}