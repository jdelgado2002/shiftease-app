import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface InvitationAuditLogProps {
  invitationId: string
}

export function InvitationAuditLog({ invitationId }: InvitationAuditLogProps) {
  const { getInvitationAudit } = useAuth()
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const logs = await getInvitationAudit(invitationId)
        setAuditLogs(logs)
      } catch (error) {
        console.error("Failed to fetch audit logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [invitationId, getInvitationAudit])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No audit logs available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Badge
                  variant={
                    log.action === "created"
                      ? "default"
                      : log.action === "accepted"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {log.action}
                </Badge>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {log.performedBy}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(log.timestamp), "PPpp")}
                </p>
                {log.details && (
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 