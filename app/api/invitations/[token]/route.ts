import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    console.log('Looking up invitation with token:', token);

    // First, try to find any invitation with similar token
    const allInvitations = await prisma.invitation.findMany({
      where: {
        token: {
          contains: token
        }
      },
      select: {
        token: true
      }
    });
    console.log('Found invitations with similar tokens:', allInvitations);

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    console.log('Invitation lookup result:', invitation);

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization: {
          name: invitation.organization.name,
          id: invitation.organization.id,
        },
        token: invitation.token,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
} 