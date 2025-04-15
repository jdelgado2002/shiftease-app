import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvitationsPage from '@/app/(dashboard)/invitations/page';
import { InvitationsDataTable } from '@/app/(dashboard)/invitations/data-table';
import { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-id",
        email: "test@example.com",
        name: "Test User",
        role: "OWNER",
        organizationId: "test-org-id",
        permissions: ["view_invitations", "invite_users"],
        organization: {
          id: "test-org-id",
          name: "Test Organization"
        }
      },
    },
    status: "authenticated",
  }),
}));

// Mock useAuth hook
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'OWNER',
      organizationId: 'test-org-id',
      permissions: ["view_invitations", "invite_users"]
    },
    organization: {
      id: 'test-org-id',
      name: 'Test Organization'
    },
    hasPermission: (permission: string) => ["view_invitations", "invite_users"].includes(permission),
    isLoading: false
  })
}));

// Mock the toast
const mockToast = { toast: jest.fn() };
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => mockToast
}));

// Mock protected route and layout components
jest.mock('@/components/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>
}));

jest.mock('@/components/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>
}));

// Mock fetch
global.fetch = jest.fn();

describe('InvitationsPage', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invitations: [] }),
      })
    );
  });

  it('renders the invitations page with correct elements', async () => {
    render(<InvitationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Invitations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Invite Member/i })).toBeInTheDocument();
    });
  });

  it('opens invite dialog and handles form submission with valid email', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Invitation sent successfully' }),
      })
    );

    render(<InvitationsPage />);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: /Invite Member/i }));

    // Fill form
    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');
    
    // Handle role selection (Radix Select workaround)
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    // Instead of user.click, set value programmatically
    fireEvent.change(roleSelect, { target: { value: 'EMPLOYEE' } });

    // Submit form
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Invitation sent',
        description: 'An invitation has been sent to test@example.com',
      });
    });
  });

});

describe('InvitationsDataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders invitations data table and handles data loading', async () => {
    const mockInvitations = [{
      id: '1',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    }];

    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invitations: mockInvitations }),
      })
    );

    render(<InvitationsDataTable />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles API errors in data table', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<InvitationsDataTable />);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Error fetching invitations",
        description: "Failed to load invitations. Please try again.",
        variant: "destructive",
      });
    });
  });
});