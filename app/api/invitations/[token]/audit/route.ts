import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Verify organization access
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        token: params.token,
        organizationId,
      },
      include: {
        audit: {
          include: {
            performer: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Format audit logs for response
    const formattedAudit = invitation.audit.map((entry) => ({
      action: entry.action,
      performedBy: entry.performer ? 
        `${entry.performer.firstName} ${entry.performer.lastName}` :
        entry.performer?.email,
      timestamp: entry.timestamp,
      details: entry.details,
    }));

    return NextResponse.json({ audit: formattedAudit });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
