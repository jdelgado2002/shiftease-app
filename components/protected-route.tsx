"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export function ProtectedRoute({ children, requiredPermissions = [] }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      const publicRoutes = ["/login", "/register", "/reset-password", "/invite"]
      const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))
      const isOnboardingRoute = pathname?.startsWith("/onboarding") || pathname?.startsWith("/employee-onboarding")

      if (!user && !isPublicRoute && !isOnboardingRoute) {
        router.push("/login")
      } else if (user && requiredPermissions.length > 0) {
        // Check if user has any of the required permissions
        const hasRequiredPermission = requiredPermissions.some((permission) => hasPermission(permission))

        if (!hasRequiredPermission) {
          router.push("/") // Redirect to root route (dashboard) if user doesn't have required permissions
        }
      }
    }
  }, [user, isLoading, pathname, router, hasPermission, requiredPermissions])

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return <>{children}</>
}
