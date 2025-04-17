import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/services/audit-log"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if the user has permission to revoke invitations
    if (invitation.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Update the invitation status
    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: { status: "EXPIRED" },
    })

    // Log the action
    await createAuditLog({
      action: "invitation_revoked",
      entityType: "invitation",
      entityId: id,
      userId: session.user.id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
    })

    return NextResponse.json({
      message: "Invitation revoked successfully",
      invitation: updatedInvitation,
    })
  } catch (error) {
    console.error("Error revoking invitation:", error)
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    )
  }
} 