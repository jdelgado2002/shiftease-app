"use client"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DataTable } from "@/app/(dashboard)/invitations/data-table"

export default function InvitationsPage() {
  const { hasPermission } = useAuth()

  return (
    <ProtectedRoute requiredPermissions={["manage_users"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">Manage and track team member invitations</p>
        </div>

        <Card className="p-6">
          <DataTable />
        </Card>
      </div>
    </ProtectedRoute>
  )
} 