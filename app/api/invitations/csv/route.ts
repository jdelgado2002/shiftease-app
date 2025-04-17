import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { generateToken } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';
import { Role } from '@/lib/generated/prisma';

// Email regex for basic validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation schema for row data
const rowSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).optional(),
  location: z.string().optional(),
});

// Constants for batch processing
const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY = 1000; // 1 second between batches

// Custom error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateError';
  }
}

// Add support for progress updates
interface ProcessingStatus {
  processed: number;
  total: number;
  successful: string[];
  failed: Array<{ email: string; error: string }>;
}

const processingStatuses = new Map<string, ProcessingStatus>();

// Helper function for batch processing with rate limiting
async function processBatch(
  batch: any[],
  organization: any,
  inviter: any,
  defaultRole: Role,
  defaultLocationIds: string[]
) {
  const results = [];
  const errors = [];

  for (const row of batch) {
    try {
      // Validate row data
      const validatedData = rowSchema.parse(row);
      const { email, role, location } = validatedData;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email as string,
          organizationId: organization.id,
        },
      });

      if (existingUser) {
        errors.push({
          email,
          error: 'User already exists in this organization',
        });
        continue;
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: email as string,
          organizationId: organization.id,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        errors.push({
          email,
          error: 'Pending invitation already exists for this email',
        });
        continue;
      }

      // Create invitation
      const token = generateToken();
      const invitation = await prisma.invitation.create({
        data: {
          email: email as string,
          role: role || defaultRole,
          token,
          organizationId: organization.id,
          inviterId: inviter.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send invitation email
      await sendInvitationEmail({
        inviteeEmail: email as string,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        organizationName: organization.name,
        role: role || defaultRole,
        invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
      });

      results.push({
        email,
        status: 'success',
      });

      // Log action in audit log
      await prisma.auditLog.create({
        data: {
          action: 'INVITATION_CREATED',
          performedBy: inviter.id,
          organizationId: organization.id,
          targetId: invitation.id,
          metadata: {
            email,
            role: role || defaultRole,
          },
        },
      });
    } catch (error) {
      errors.push({
        email: row.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, errors };
}

export async function POST(request: Request) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const defaultRole = (formData.get('defaultRole') as Role) || Role.EMPLOYEE;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse CSV file
    const csvContent = await file.text();
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

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

    const results = {
      successful: [] as string[],
      failed: [] as Array<{ email: string; error: string }>,
    };

    // Process each record
    for (const record of records) {
      try {
        const email = record.email?.trim();
        if (!email) {
          results.failed.push({
            email: 'Unknown',
            error: 'Missing email address',
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: { email, organizationId },
        });

        if (existingUser) {
          results.failed.push({
            email,
            error: 'User already exists',
          });
          continue;
        }

        // Check for existing invitation
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email,
            organizationId,
            status: 'PENDING',
          },
        });

        if (existingInvitation) {
          results.failed.push({
            email,
            error: 'Pending invitation already exists',
          });
          continue;
        }

        // Generate invitation token and expiration
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

        // Create invitation
        const invitation = await prisma.invitation.create({
          data: {
            email,
            role: (record.role?.toUpperCase() as Role) || defaultRole,
            token,
            expiresAt,
            organizationId,
            inviterId: inviter.id,
            status: 'PENDING',
          },
        });

        // Create audit log entry
        await prisma.auditLog.create({
          data: {
            action: 'created',
            performedBy: inviter.id,
            targetId: invitation.id,
            organizationId,
            metadata: {
              source: 'csv_import',
              locationIds: record.locationIds ? record.locationIds.split(',') : undefined,
            },
          },
        });

        // Send invitation email
        await sendInvitationEmail({
          inviteeEmail: email as string,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          organizationName: organization.name,
          role: record.role || defaultRole,
          invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
        });

        results.successful.push(email);
      } catch (error) {
        results.failed.push({
          email: record.email || 'Unknown',
          error: error instanceof Error ? error.message : 'Failed to process invitation',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}

// Add new route to check processing status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json(
      { error: 'Batch ID is required' },
      { status: 400 }
    );
  }

  const status = processingStatuses.get(batchId);
  if (!status) {
    return NextResponse.json(
      { error: 'Batch not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(status);
}
