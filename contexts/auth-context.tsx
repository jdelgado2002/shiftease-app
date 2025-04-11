"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "owner" | "manager" | "employee"
  locations: string[] // IDs of locations this user has access to
  permissions: string[] // Specific permissions the user has
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (userData: Partial<User>) => void
  hasPermission: (permission: string) => boolean
  hasAccess: (locationId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Sample users for demonstration
const sampleUsers = [
  {
    id: "1",
    email: "owner@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Owner",
    role: "owner",
    locations: ["1", "2", "3"],
    permissions: ["manage_users", "manage_locations", "manage_schedules", "manage_settings", "view_reports"],
    profileImage: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    email: "manager@example.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Manager",
    role: "manager",
    locations: ["1"],
    permissions: ["manage_schedules", "view_reports"],
    profileImage: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    email: "employee@example.com",
    password: "password123",
    firstName: "Alex",
    lastName: "Employee",
    role: "employee",
    locations: ["1"],
    permissions: ["view_schedule", "update_availability"],
    profileImage: "/placeholder.svg?height=40&width=40",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
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

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      const foundUser = sampleUsers.find((u) => u.email === email && u.password === password)

      if (!foundUser) {
        throw new Error("Invalid email or password")
      }

      // Remove password before storing user
      const { password: _, ...userWithoutPassword } = foundUser

      // Store user in state and localStorage
      setUser(userWithoutPassword as User)
      localStorage.setItem("user", JSON.stringify(userWithoutPassword))

      toast({
        title: "Login successful",
        description: `Welcome back, ${userWithoutPassword.firstName}!`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      const existingUser = sampleUsers.find((u) => u.email === email)

      if (existingUser) {
        throw new Error("Email already in use")
      }

      // Create new user
      const newUser: User = {
        id: (sampleUsers.length + 1).toString(),
        email,
        firstName,
        lastName,
        role: "owner", // Default role for new registrations
        locations: [],
        permissions: ["manage_users", "manage_locations", "manage_schedules", "manage_settings"],
      }

      // Store user in state and localStorage
      setUser(newUser)
      localStorage.setItem("user", JSON.stringify(newUser))

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
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      const existingUser = sampleUsers.find((u) => u.email === email)

      if (!existingUser) {
        throw new Error("No account found with this email")
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
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
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        resetPassword,
        updateUser,
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
