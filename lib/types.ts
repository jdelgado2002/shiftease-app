export type Role = "OWNER" | "MANAGER" | "EMPLOYEE"

export interface OrganizationSettings {
  theme?: string
  defaultShiftDuration?: number
  timeZone?: string
  allowSelfScheduling?: boolean
  requireApprovalFor?: string[]
  notificationPreferences?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  [key: string]: any
}

export interface Organization {
  id: string
  name: string
  slug: string
  settings?: OrganizationSettings
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: Role
  organizationId: string
  organization?: Organization
  isOwner?: boolean
  permissions?: string[]
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface InvitationAudit {
  action: 'created' | 'sent' | 'resent' | 'accepted' | 'revoked'
  performedBy: string
  timestamp: Date
  details?: Record<string, any>
}

export interface Invitation {
  id: string
  email: string
  role: Role
  status: InvitationStatus
  locationIds?: string[]
  createdAt: Date
  expiresAt: Date
  inviterId: string
  audit: InvitationAudit[]
  locationNames?: string[]
  inviterName?: string
} 