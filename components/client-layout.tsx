"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { RoleProvider } from "@/components/role-toggle"
import { NotificationsProvider } from "@/components/notifications-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

export function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <RoleProvider>
          <NotificationsProvider>
            {children}
            <Toaster />
          </NotificationsProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}