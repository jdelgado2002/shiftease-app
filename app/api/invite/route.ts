import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit-log';
import { sendInvitationEmail } from '@/lib/services/email';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'MANAGER', 'EMPLOYEE']),
  locationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role, locationId } = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: session.user.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in organization' },
        { status: 400 }
      );
    }

    // Check for existing invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: session.user.organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Pending invitation already exists' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        organizationId: session.user.organizationId,
        inviterId: session.user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invitation email
    await sendInvitationEmail({
      email,
      token: invitation.token,
      organizationName: session.user.organization.name,
      inviterName: `${session.user.firstName} ${session.user.lastName}`,
    });

    // Log audit
    await createAuditLog({
      action: 'INVITE_SENT',
      entityType: 'INVITATION',
      entityId: invitation.id,
      userId: session.user.id,
      metadata: { email, role, locationId },
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
} 