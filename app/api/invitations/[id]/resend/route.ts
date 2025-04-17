import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has permission to resend invitations
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email,
        organizationId,
      },
      include: {
        permissions: true,
      },
    });

    if (!user || !user.permissions.some(p => p.name === 'invite_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        organization: true,
        inviter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending invitations can be resent' },
        { status: 400 }
      );
    }

    // Update invitation expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Reset to expire in 7 days

    await prisma.invitation.update({
      where: { id: params.id },
      data: { expiresAt },
    });

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

    // Resend invitation email
    await sendInvitationEmail({
      inviteeEmail: invitation.email,
      inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
      organizationName: invitation.organization.name,
      role: invitation.role,
      invitationLink,
    });

    // Create audit log for resend action
    await prisma.auditLog.create({
      data: {
        action: 'invitation_resent',
        userId: user.id,
        entityType: 'invitation',
        entityId: invitation.id,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
} 