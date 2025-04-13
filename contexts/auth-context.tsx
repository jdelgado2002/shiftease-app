"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export type Role = "OWNER" | "MANAGER" | "EMPLOYEE"

// Define a specific type for organization settings
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
  // Add more settings as needed
  [key: string]: any // For backward compatibility, but try to add specific fields above
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
  firstName: string
  lastName: string
  role: Role // Updated to use the unified Role type
  organizationId: string
  organization: Organization
  isOwner: boolean
  locations: string[] // IDs of locations this user has access to
  permissions: string[] // Specific permissions the user has
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, organizationSlug?: string) => Promise<void>
  logout: () => Promise<void>  // Change this to match the async implementation
  register: (organizationData: {
    name: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  inviteUser: (email: string, role: Role) => Promise<void>
  acceptInvitation: (token: string, userData: {
    firstName: string
    lastName: string
    password: string
  }) => Promise<void>
  switchOrganization: (organizationId: string) => Promise<void>
  refreshUserData: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAccess: (locationId: string) => boolean
}

// Navigation action types for different auth flows
type NavigationAction =
  | { type: 'NONE' }
  | { type: 'LOGIN'; role: Role }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_SUCCESS' }
  | { type: 'REGISTER' }
  | { type: 'ACCEPT_INVITATION' }
  | { type: 'SWITCH_ORGANIZATION' };

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [navigationAction, setNavigationAction] = useState<NavigationAction>({ type: 'NONE' })
  const router = useRouter()
  const { toast } = useToast()

  // Fetch current user from a secure API endpoint instead of using localStorage
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
      setOrganization(null);
    }
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    // Only fetch user data if we don't already have it
    if (!user) {
      fetchCurrentUser().finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Handle navigation based on auth actions
  useEffect(() => {
    if (isLoading || !user) return;
    
    switch (navigationAction.type) {
      case 'LOGIN':
        if (user.role === 'OWNER') {
          // Check if organization settings exist and have any properties
          const hasSettings = organization?.settings && Object.keys(organization.settings).length > 0;
          if (!hasSettings) {
            router.push("/onboarding/1");
          } else {
            router.push("/");
          }
        } else if (user.role === 'MANAGER') {
          router.push("/");
        } else {
          router.push("/schedule");
        }
        break;
      case 'LOGOUT':
        router.push("/login");
        break;
      case 'REGISTER':
        router.push("/onboarding/1");
        break;
      case 'ACCEPT_INVITATION':
        router.push("/employee-onboarding/1");
        break;
      case 'SWITCH_ORGANIZATION':
        router.push("/");
        break;
    }
    
    // Reset navigation action after it's processed
    if (navigationAction.type !== 'NONE') {
      setNavigationAction({ type: 'NONE' });
    }
  }, [navigationAction, isLoading, router, organization, user]);

  const login = async (email: string, password: string, organizationSlug?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          organizationSlug,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      
      // Set user and organization in state
      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });

      // Set navigation action based on role
      setNavigationAction({ type: 'LOGIN', role: data.user.role });
      
      return;
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear state
      setUser(null);
      setOrganization(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Set navigation action for logout
      setNavigationAction({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ name, email, password, firstName, lastName }: {
    name: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    setIsLoading(true);

    try {
      // Don't use fetch for register since it's exempted in middleware, similar to login
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: name,
          email,
          password,
          firstName,
          lastName,
        }),
        credentials: 'include', // Important: include credentials (cookies)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      
      // Set user and organization in state
      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });

      // Navigate to onboarding
      setNavigationAction({ type: 'REGISTER' });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update the rest of the auth methods
  const inviteUser = async (email: string, role: Role) => {
    try {
      if (!user || !organization) throw new Error('Not authenticated');

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          organizationId: organization.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send invitation');

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      });

      return data;
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const acceptInvitation = async (token: string, userData: {
    firstName: string
    lastName: string
    password: string
  }) => {
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to accept invitation');

      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });

      // Set navigation action for accepting invitation
      setNavigationAction({ type: 'ACCEPT_INVITATION' });
      
      return data;
    } catch (error) {
      toast({
        title: "Failed to accept invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const switchOrganization = async (organizationId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to switch organization');
      }

      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Organization switched",
        description: `Switched to ${data.organization.name}`,
      });

      // Set navigation action for switching organization
      setNavigationAction({ type: 'SWITCH_ORGANIZATION' });
    } catch (error) {
      toast({
        title: "Switch organization failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    setIsLoading(true);
    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAccess = (locationId: string) => {
    if (!user) return false;
    return user.locations.includes(locationId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        inviteUser,
        acceptInvitation,
        switchOrganization,
        refreshUserData,
        hasPermission,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
