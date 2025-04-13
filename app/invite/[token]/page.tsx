"use client"

import { useState, useEffect } from "react"
import { useRouter, redirect } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import prisma from '@/lib/prisma'
import { InvitationRegistrationForm } from '@/components/invitation-registration-form'

interface InviteDetails {
  email: string
  restaurantName: string
  role: string
  loading: boolean
  error: string | null
}

async function getInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: true,
    },
  })

  if (!invitation) {
    return null
  }

  // Check if invitation has expired
  if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
    return null
  }

  return invitation
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await getInvitation(params.token)

  if (!invitation) {
    redirect('/invalid-invitation')
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
