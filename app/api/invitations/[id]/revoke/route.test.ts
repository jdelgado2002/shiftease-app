import { NextResponse } from "next/server"
import { POST } from "./route"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/services/audit-log"

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    invitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

// Mock audit-log service
jest.mock("@/lib/services/audit-log", () => ({
  createAuditLog: jest.fn(),
}))

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}))

describe("POST /api/invitations/[id]/revoke", () => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue({}),
    headers: new Headers(),
    method: "POST",
    url: "http://localhost:3000/api/invitations/123/revoke",
  } as unknown as Request

  const mockParams = { id: "123" }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return 401 if user is not authenticated", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await POST(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
  })

  it("should return 404 if invitation is not found", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123", organizationId: "org-123" },
    })
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await POST(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: "Invitation not found" })
  })

  it("should return 401 if user is not authorized to revoke the invitation", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123", organizationId: "org-123" },
    })
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      organizationId: "org-456",
      email: "test@example.com",
      status: "PENDING",
    })

    const response = await POST(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
  })

  it("should successfully revoke an invitation", async () => {
    const mockInvitation = {
      id: "123",
      organizationId: "org-123",
      email: "test@example.com",
      status: "PENDING",
    }

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123", organizationId: "org-123" },
    })
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation)
    ;(prisma.invitation.update as jest.Mock).mockResolvedValue({
      ...mockInvitation,
      status: "EXPIRED",
    })
    ;(createAuditLog as jest.Mock).mockResolvedValue({})

    const response = await POST(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      message: "Invitation revoked successfully",
      invitation: {
        id: "123",
        organizationId: "org-123",
        email: "test@example.com",
        status: "EXPIRED",
      },
    })
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { status: "EXPIRED" },
    })
    expect(createAuditLog).toHaveBeenCalledWith({
      userId: "user-123",
      entityId: "123",
      entityType: "invitation",
      action: "invitation_revoked",
      metadata: { 
        email: "test@example.com",
        role: undefined
      },
    })
  })

  it("should handle errors gracefully", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123", organizationId: "org-123" },
    })
    ;(prisma.invitation.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error")
    )

    const response = await POST(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: "Failed to revoke invitation" })
  })
}) 