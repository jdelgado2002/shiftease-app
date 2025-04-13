"use client"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { InvitationsDataTable } from "./data-table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { useState } from "react"
import { InviteMemberForm } from "@/components/invite-member-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function InvitationsPage() {
  const { hasPermission } = useAuth()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermissions={["manage_users"]}>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Invitations</h1>
              <p className="text-muted-foreground">Manage and track team member invitations</p>
            </div>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>

          <Card className="p-6">
            <InvitationsDataTable />
          </Card>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member. They will receive an email invitation to join.
              </DialogDescription>
            </DialogHeader>
            <InviteMemberForm onSuccess={() => setIsInviteDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </ProtectedRoute>
    </DashboardLayout>
  )
}
