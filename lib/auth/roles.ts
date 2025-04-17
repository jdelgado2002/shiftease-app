import { type Role } from '@/contexts/auth-context';

export const roleHierarchy: Record<Role, number> = {
  'OWNER': 3,
  'MANAGER': 2,
  'EMPLOYEE': 1,
};

export const rolePermissions: Record<Role, string[]> = {
  'OWNER': [
    'manage_organization',
    'manage_roles',
    'manage_locations',
    'invite_users',
    'view_invitations',
    'manage_schedules',
    'view_reports',
    'manage_settings',
  ],
  'MANAGER': [
    'invite_users',
    'view_invitations',
    'manage_schedules',
    'view_reports',
  ],
  'EMPLOYEE': [
    'view_schedule',
    'request_shift_change',
  ],
};

export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function getRolePermissions(role: Role): string[] {
  return rolePermissions[role];
}
