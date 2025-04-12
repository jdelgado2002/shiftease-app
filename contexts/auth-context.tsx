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
  logout: () => void
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
  hasPermission: (permission: string) => boolean
  hasAccess: (locationId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch current user from a secure API endpoint instead of using localStorage
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include credentials (cookies)
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setOrganization(data.organization);
      } else {
        // Clear state if not authenticated
        setUser(null);
        setOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Handle error state
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    // Use setTimeout to ensure this runs after hydration
    const timer = setTimeout(() => {
      fetchCurrentUser();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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
        credentials: 'include', // Important: include credentials (cookies)
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

      // Wait for next tick to ensure state is updated before navigation
      setTimeout(() => {
        if (data.user.role === 'OWNER' || data.user.role === 'MANAGER') {
          router.push("/");
        } else {
          router.push("/schedule");
        }
      }, 0);

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
      // Call logout API to clear the HttpOnly cookie on the server
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear state
      setUser(null);
      setOrganization(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      router.push("/login");
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

      // Store user and org data in state only
      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });

      router.push("/onboarding/1");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
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
        credentials: 'include', // Include cookies for authentication
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
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to accept invitation');

      setUser(data.user);
      setOrganization(data.organization);

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });

      router.push("/employee-onboarding/1");
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
        credentials: 'include', // Include cookies for authentication
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

      router.push("/");
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
