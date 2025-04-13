import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'MANAGER', 'EMPLOYEE']).optional(),
  locationIds: z.array(z.string()).optional(),
});

const bulkInviteSchema = z.object({
  invitations: z.array(invitationSchema),
});

export async function POST(request: Request) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { invitations } = bulkInviteSchema.parse(data);

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

    const results = {
      successful: [] as string[],
      failed: [] as Array<{ email: string; error: string }>,
    };

    // Process invitations in parallel with concurrency control
    await Promise.all(
      invitations.map(async (invite) => {
        try {
          const existingUser = await prisma.user.findFirst({
            where: { email: invite.email, organizationId },
          });

          if (existingUser) {
            results.failed.push({
              email: invite.email,
              error: 'User already exists',
            });
            return;
          }

          const token = generateToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await prisma.invitation.create({
            data: {
              email: invite.email,
              role: invite.role || 'EMPLOYEE',
              token,
              expiresAt,
              organizationId,
              inviterId: inviter.id,
              status: 'PENDING',
              audit: {
                create: {
                  action: 'created',
                  performedBy: inviter.id,
                  details: {
                    source: 'bulk_invite',
                    locationIds: invite.locationIds,
                  },
                },
              },
            },
          });

          const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
          await sendInvitationEmail({
            inviteeEmail: invite.email,
            inviterName: `${inviter.firstName} ${inviter.lastName}`,
            organizationName: organization.name,
            role: invite.role || 'EMPLOYEE',
            invitationLink,
          });

          results.successful.push(invite.email);
        } catch (error) {
          results.failed.push({
            email: invite.email,
            error: error instanceof Error ? error.message : 'Failed to create invitation',
          });
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing bulk invitations:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk invitations' },
      { status: 500 }
    );
  }
}
