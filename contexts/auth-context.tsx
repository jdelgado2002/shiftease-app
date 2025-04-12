"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export type Role = "OWNER" | "MANAGER" | "EMPLOYEE"

export interface Organization {
  id: string
  name: string
  slug: string
  settings?: any
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "owner" | "manager" | "employee"
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

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user")
        const storedOrganization = localStorage.getItem("organization")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        if (storedOrganization) {
          setOrganization(JSON.parse(storedOrganization))
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Use setTimeout to ensure this runs after hydration
    const timer = setTimeout(() => {
      checkAuth()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const login = async (email: string, password: string, organizationSlug?: string) => {
    setIsLoading(true)

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
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Login failed')

      // Store everything first
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('organization', JSON.stringify(data.organization))
      
      // Then update state
      setUser(data.user)
      setOrganization(data.organization)

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.firstName}!`,
      })

      // Wait for next tick to ensure state is updated before navigation
      setTimeout(() => {
        if (data.user.role === 'OWNER' || data.user.role === 'MANAGER') {
          router.push("/")
        } else {
          router.push("/schedule")
        }
      }, 0)

    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setOrganization(null)
    localStorage.removeItem("user")
    localStorage.removeItem("organization")
    localStorage.removeItem("token")
    router.push("/login")

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  const register = async ({ name, email, password, firstName, lastName }: {
    name: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    setIsLoading(true)

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
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Registration failed')

      // Store user and org data
      setUser(data.user)
      setOrganization(data.organization)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('organization', JSON.stringify(data.organization))

      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      })

      router.push("/onboarding/1")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const inviteUser = async (email: string, role: Role) => {
    try {
      if (!user || !organization) throw new Error('Not authenticated')

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email,
          role,
          organizationId: organization.id,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to send invitation')

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      })

      return data
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error
    }
  }

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
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to accept invitation')

      setUser(data.user)
      setOrganization(data.organization)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('organization', JSON.stringify(data.organization))

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      })

      router.push("/employee-onboarding/1")
      return data
    } catch (error) {
      toast({
        title: "Failed to accept invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error
    }
  }

  const switchOrganization = async (organizationId: string) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/organizations/${organizationId}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to switch organization')
      }

      setUser(data.user)
      setOrganization(data.organization)
      localStorage.setItem('token', data.token)

      toast({
        title: "Organization switched",
        description: `Switched to ${data.organization.name}`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Switch organization failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  const hasAccess = (locationId: string) => {
    if (!user) return false
    return user.locations.includes(locationId)
  }

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
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
