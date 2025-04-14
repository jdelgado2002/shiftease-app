"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { InvitationRegistrationForm } from '@/components/invitation-registration-form'
import { use } from 'react'

interface InviteDetails {
  email: string
  role: string
  organization: {
    name: string
    id: string
  }
  token: string
  locationIds?: string[]
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const [invitation, setInvitation] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitation-tokens/${resolvedParams.token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invitation')
        }

        setInvitation(data.invitation)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch invitation')
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch invitation",
          variant: "destructive",
        })
        router.push('/invalid-invitation')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [resolvedParams.token, router, toast])

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto py-10">
        <div className="text-center">
          <p>Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return null // Router will handle the redirect
  }

  return (
    <div className="container max-w-lg mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Join {invitation.organization.name}</h1>
        <p className="text-muted-foreground">
          You've been invited to join as a {invitation.role.toLowerCase()}
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm">
            <strong>Invited email:</strong> {invitation.email}
          </p>
          <p className="text-sm">
            <strong>Organization:</strong> {invitation.organization.name}
          </p>
          <p className="text-sm">
            <strong>Role:</strong> {invitation.role}
          </p>
        </div>

        <InvitationRegistrationForm invitation={invitation} />
      </div>
    </div>
  )
}
