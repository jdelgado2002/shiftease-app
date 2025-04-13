'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRightIcon, RefreshCcwIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react'

type EmailStatus = 'queued' | 'sent' | 'failed'

interface EmailQueueItem {
  id: string
  recipient: string
  subject: string
  status: EmailStatus
  timestamp: string
}

export function EmailQueueMonitor() {
  const [queueData, setQueueData] = useState<EmailQueueItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate statistics
  const totalEmails = queueData.length
  const queuedEmails = queueData.filter(email => email.status === 'queued').length
  const sentEmails = queueData.filter(email => email.status === 'sent').length
  const failedEmails = queueData.filter(email => email.status === 'failed').length
  
  // Calculate percentages for progress bar
  const sentPercentage = totalEmails ? (sentEmails / totalEmails) * 100 : 0

  const fetchInvitationData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/invitations/queue')
      
      if (!response.ok) {
        throw new Error(`Error fetching queue data: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform API data to match our component's expected format
      const formattedData: EmailQueueItem[] = data.map((invitation: any) => ({
        id: invitation.id,
        recipient: invitation.email || invitation.recipientEmail,
        subject: 'Invitation to ShiftEase',
        status: invitation.status.toLowerCase() as EmailStatus,
        timestamp: invitation.createdAt || invitation.sentAt || new Date().toISOString()
      }))

      setQueueData(formattedData)
    } catch (err) {
      console.error('Failed to fetch invitation queue data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invitation data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchInvitationData()
    
    // Optional: Set up interval for periodic refreshing
    // const interval = setInterval(() => {
    //   fetchInvitationData()
    // }, 30000) // Refresh every 30 seconds
    
    // return () => clearInterval(interval)
  }, [])

  const refreshQueue = () => {
    setIsRefreshing(true)
    fetchInvitationData()
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Email Queue Monitor</CardTitle>
        <CardDescription>Real-time status of invitation emails</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !isRefreshing ? (
          <div className="flex justify-center items-center h-[200px]">
            <RefreshCcwIcon className="animate-spin h-8 w-8 text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            <AlertCircle className="h-10 w-10 mx-auto mb-2" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4" 
              onClick={refreshQueue}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalEmails}</div>
              <div className="text-sm text-muted-foreground">Total Invitations</div>
            </div>
            
            <Progress value={sentPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex flex-col items-center p-2 bg-secondary/20 rounded-md">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="font-medium">{queuedEmails}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Queued</div>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-secondary/20 rounded-md">
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="font-medium">{sentEmails}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Sent</div>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-secondary/20 rounded-md">
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} className="text-destructive" />
                  <span className="font-medium">{failedEmails}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Failed</div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
              {queueData.length > 0 ? (
                <div className="space-y-2">
                  {queueData.slice(0, 3).map(email => (
                    <div key={email.id} className="flex items-center justify-between text-sm p-2 border rounded-md">
                      <div className="truncate max-w-[180px]">{email.recipient}</div>
                      <Badge 
                        variant={
                          email.status === 'sent' ? 'default' : 
                          email.status === 'queued' ? 'secondary' : 'destructive'
                        }
                      >
                        {email.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  No recent invitation activity
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={refreshQueue}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCcwIcon size={14} className="mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCcwIcon size={14} className="mr-2" />
              Refresh Queue
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
