import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const headerOrgId = req.headers.get('x-organization-id');
    
    console.log('Session data:', {
      exists: !!session,
      user: session?.user,
      email: session?.user?.email,
    });

    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No valid session found'
      }, { status: 401 });
    }

    if (!headerOrgId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No organization ID provided'
      }, { status: 401 });
    }

    const body = await req.json();
    const { email, role, locationId } = inviteSchema.parse(body);

    // Get the user details from the database
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email,
        organizationId: headerOrgId,
      },
      include: {
        organization: true,
      },
    });

    if (!user || !user.organization) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'User not found in organization'
      }, { status: 401 });
    }

    // Check if target user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: headerOrgId,
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
        organizationId: headerOrgId,
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
        organizationId: headerOrgId,
        inviterId: user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'PENDING',
      },
    });

    // Send invitation email
    await sendInvitationEmail({
      email,
      token: invitation.token,
      organizationName: user.organization.name,
      inviterName: `${user.firstName} ${user.lastName}`,
    });

    // Log audit
    await createAuditLog({
      action: 'INVITE_SENT',
      entityType: 'INVITATION',
      entityId: invitation.id,
      userId: user.id,
      metadata: { email, role, locationId },
    });

    return NextResponse.json({ 
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
      }
    });
  } catch (error) {
    console.error('Invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 