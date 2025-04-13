import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit-log';
import { sendInvitationEmail } from '@/lib/services/email';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parse } from 'csv-parse/sync';

const bulkInviteSchema = z.object({
  csv: z.string(),
  defaultRole: z.enum(['OWNER', 'MANAGER', 'EMPLOYEE']).optional(),
  defaultLocationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { csv, defaultRole, defaultLocationId } = bulkInviteSchema.parse(body);

    // Parse CSV
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
    });

    const results = {
      success: [] as string[],
      errors: [] as { email: string; error: string }[],
    };

    // Process each record
    for (const record of records) {
      try {
        const email = record.email?.trim();
        if (!email) {
          results.errors.push({ email: 'unknown', error: 'Missing email' });
          continue;
        }

        // Validate email
        if (!z.string().email().safeParse(email).success) {
          results.errors.push({ email, error: 'Invalid email format' });
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            organizationId: session.user.organizationId,
          },
        });

        if (existingUser) {
          results.errors.push({ email, error: 'User already exists' });
          continue;
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
          results.errors.push({ email, error: 'Pending invitation exists' });
          continue;
        }

        // Create invitation
        const invitation = await prisma.invitation.create({
          data: {
            email,
            role: record.role || defaultRole || 'EMPLOYEE',
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
          action: 'BULK_INVITE_SENT',
          entityType: 'INVITATION',
          entityId: invitation.id,
          userId: session.user.id,
          metadata: { email, role: invitation.role },
        });

        results.success.push(email);
      } catch (error) {
        results.errors.push({
          email: record.email || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk invitations' },
      { status: 500 }
    );
  }
} 