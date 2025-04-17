import { POST } from '@/app/api/invitation-tokens/[token]/route';
import prisma from '@/lib/prisma';
import { getRolePermissions } from '@/lib/auth/roles';

// Mock next/server module
jest.mock('next/server', () => {
  const INTERNALS = Symbol('internals');
  return {
    NextRequest: class NextRequest extends Request {
      cookies = {};
      nextUrl = new URL('http://localhost');
      page = {};
      ua = {};
      [INTERNALS] = {};

      constructor(input: string | Request, init?: RequestInit) {
        super(input, init);
      }
    },
    NextResponse: {
      json: (data: any, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        });
      },
    },
  };
});

// Create a helper function to create a NextRequest
function createMockRequest(body: any) {
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    invitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    permission: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed_password'),
}));

jest.mock('@/lib/auth/roles', () => ({
  getRolePermissions: jest.fn(() => ['manage_schedules', 'view_reports']),
}));

describe('POST /api/invitation-tokens/[token]', () => {
  const mockInvitation = {
    id: 'test-invitation-id',
    email: 'test@example.com',
    role: 'MANAGER',
    status: 'PENDING',
    organizationId: 'test-org-id',
    organization: {
      id: 'test-org-id',
      name: 'Test Organization',
    },
  };

  const mockPermissions = [
    { id: 'perm1', name: 'manage_schedules', organizationId: 'test-org-id' },
    { id: 'perm2', name: 'view_reports', organizationId: 'test-org-id' },
  ];

  const mockParams = {
    token: 'valid-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.permission.upsert as jest.Mock)
      .mockResolvedValueOnce(mockPermissions[0])
      .mockResolvedValueOnce(mockPermissions[1]);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: mockInvitation.email,
      firstName: 'John',
      lastName: 'Doe',
      role: mockInvitation.role,
      organizationId: mockInvitation.organizationId,
      permissions: mockPermissions,
      organization: mockInvitation.organization,
    });
  });

  it('should create a user with correct permissions when accepting invitation', async () => {
    const req = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    });

    const response = await POST(req, { params: mockParams });
    const result = await response.json();

    // Verify invitation was found
    expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
      include: { organization: true },
    });

    // Verify permissions were retrieved based on role
    expect(getRolePermissions).toHaveBeenCalledWith('MANAGER');

    // Verify each permission was upserted
    expect(prisma.permission.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.permission.upsert).toHaveBeenCalledWith({
      where: {
        name_organizationId: {
          name: 'manage_schedules',
          organizationId: 'test-org-id',
        },
      },
      create: {
        name: 'manage_schedules',
        organizationId: 'test-org-id',
      },
      update: {},
    });

    // Verify user was created with correct data and permissions
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: mockInvitation.email,
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: mockInvitation.role,
        organizationId: mockInvitation.organizationId,
        isOwner: false,
        status: 'ACTIVE',
        permissions: {
          connect: mockPermissions.map(p => ({ id: p.id })),
        },
      },
      include: {
        organization: true,
        permissions: true,
      }
    });

    // Verify invitation status was updated
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: mockInvitation.id },
      data: { status: 'ACCEPTED' },
    });

    // Verify response contains expected data
    expect(response.status).toBe(200);
    expect(result).toEqual({
      message: 'Invitation accepted successfully',
      user: {
        id: 'new-user-id',
        email: mockInvitation.email,
        firstName: 'John',
        lastName: 'Doe',
        role: mockInvitation.role,
        permissions: mockPermissions.map(p => p.name),
        organization: {
          id: mockInvitation.organization.id,
          name: mockInvitation.organization.name,
        },
      },
    });
  });

  it('should reject if invitation is not found', async () => {
    (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    });

    const response = await POST(req, { params: mockParams });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: 'Invalid or expired invitation',
    });
  });

  it('should reject if invitation status is not pending', async () => {
    (prisma.invitation.findUnique as jest.Mock).mockResolvedValue({
      ...mockInvitation,
      status: 'ACCEPTED',
    });

    const req = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    });

    const response = await POST(req, { params: mockParams });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: 'Invitation has already been used',
    });
  });

  it('should reject if user already exists', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-user-id',
      email: mockInvitation.email,
    });

    const req = createMockRequest({
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    });

    const response = await POST(req, { params: mockParams });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: 'User with this email already exists',
    });
  });
});
