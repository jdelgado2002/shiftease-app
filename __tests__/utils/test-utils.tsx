import { render as rtlRender } from '@testing-library/react'
import { ReactElement } from 'react'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { Role } from '@prisma/client'
import { AuthProvider } from '@/contexts/auth-context'
import { RoleProvider } from '@/components/role-toggle'
import { Toaster } from '@/components/ui/toaster'

// Mock next-auth session
const mockSession: Session = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'EMPLOYEE' as Role,
    organizationId: '1',
    isOwner: false,
    permissions: ['VIEW_DASHBOARD', 'VIEW_SCHEDULE', 'view_invitations', 'invite_users'],
    organization: {
      id: '1',
      name: 'Test Organization',
      slug: 'test-org',
      settings: {}
    }
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString()
}

// Mock useRouter
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  query: {},
  pathname: '/',
  asPath: '/',
}

// Mock toast notifications
const mockToast = {
  toast: jest.fn(),
}

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => mockToast,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: mockSession, status: 'authenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Custom render function that wraps component with providers
function render(ui: ReactElement) {
  return rtlRender(
    <AuthProvider>
      <SessionProvider session={mockSession}>
        <RoleProvider>
          {ui}
          <Toaster />
        </RoleProvider>
      </SessionProvider>
    </AuthProvider>
  )
}

// Re-export everything
export * from '@testing-library/react'
export { render, mockToast } 