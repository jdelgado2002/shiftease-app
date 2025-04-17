import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Send, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InvitationStatusProps {
  invitation: {
    id: string
    email: string
    role: string
    status: string
    expiresAt: Date
    locationNames?: string[]
  }
}

export function InvitationStatus({ invitation }: InvitationStatusProps) {
  const { toast } = useToast()
  const { resendInvitation, revokeInvitation } = useAuth()

  const handleResend = async () => {
    try {
      await resendInvitation(invitation.id)
      toast({
        title: "Invitation resent",
        description: `Invitation has been resent to ${invitation.email}`,
      })
    } catch (error) {
      toast({
        title: "Failed to resend invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeInvitation(invitation.id)
      toast({
        title: "Invitation revoked",
        description: `Invitation has been revoked for ${invitation.email}`,
      })
    } catch (error) {
      toast({
        title: "Failed to revoke invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = () => {
    switch (invitation.status) {
      case "PENDING":
        return <Badge variant="default">Pending</Badge>
      case "ACCEPTED":
        return <Badge variant="secondary">Accepted</Badge>
      case "REVOKED":
        return <Badge variant="destructive">Revoked</Badge>
      case "EXPIRED":
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">
                Role: {invitation.role}
              </p>
              {invitation.locationNames && invitation.locationNames.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Locations: {invitation.locationNames.join(", ")}
                </p>
              )}
            </div>
            {getStatusBadge()}
          </div>

          <div className="text-sm text-muted-foreground">
            Expires: {format(new Date(invitation.expiresAt), "PPpp")}
          </div>

          <div className="flex gap-2">
            {invitation.status === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Resend
              </Button>
            )}
            {invitation.status !== "REVOKED" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Revoke
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 