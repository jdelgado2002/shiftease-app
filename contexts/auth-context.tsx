"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Organization } from "@/lib/types"

interface AuthContextType {
  user: User | null
  organization: Organization | null
  isLoading: boolean
  logout: () => Promise<void>
  inviteUser: (email: string, role: string) => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAccess: (resource: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
      return
    }

    if (session?.user) {
      setUser(session.user as User)
      setOrganization(session.user.organization as Organization)
    } else {
      setUser(null)
      setOrganization(null)
    }

    setIsLoading(false)
  }, [session, status])

  const logout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const inviteUser = async (email: string, role: string) => {
    const response = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Invitation failed")
    }

    const result = await response.json()
    return result
  }

  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false
    return user.permissions.includes(permission)
  }

  const hasAccess = (resource: string, action: string) => {
    if (!user?.permissions) return false
    return user.permissions.includes(`${resource}:${action}`)
  }

  const value = {
    user,
    organization,
    isLoading,
    logout,
    inviteUser,
    hasPermission,
    hasAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
