import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email';
import { generateToken } from '@/lib/auth';

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  locationIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = invitationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { email, role, locationIds } = validation.data;

    // Check if user is already in the organization
    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check if there's a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this email' },
        { status: 400 }
      );
    }

    // Get organization and inviter details
    const [organization, inviter] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
      }),
      prisma.user.findFirst({
        where: { organizationId, isOwner: true },
      }),
    ]);

    if (!organization || !inviter) {
      return NextResponse.json(
        { error: 'Organization or inviter not found' },
        { status: 404 }
      );
    }

    // Generate invitation token and expiration
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        organizationId,
        inviterId: inviter.id,
        status: 'PENDING',
      },
    });

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Send invitation email
    await sendInvitationEmail({
      inviteeEmail: email,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      organizationName: organization.name,
      role: role,
      invitationLink,
    });

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
} 