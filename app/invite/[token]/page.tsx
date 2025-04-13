"use client"

<<<<<<< Updated upstream
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock } from "lucide-react"

=======
import { useState, useEffect } from "react"
import { useRouter, redirect } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
<<<<<<< Updated upstream

export default function InvitePage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // In a real app, we would validate the token and fetch the invitation details
  const inviteDetails = {
    email: "employee@example.com",
    restaurantName: "Downtown Restaurant",
    role: "Server",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      })
      router.push("/employee-onboarding/1")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand */}
      <div className="bg-primary text-primary-foreground p-8 md:w-1/2 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">ShiftEase</h1>
          <p className="text-xl mb-6">Restaurant scheduling simplified</p>
          <p className="text-primary-foreground/80">
            You've been invited to join {inviteDetails.restaurantName} on ShiftEase. Complete your registration to
            access your schedule, request time off, and more.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="p-8 md:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Accept Invitation</h2>
            <p className="text-muted-foreground mt-2">You've been invited to join as a {inviteDetails.role}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={inviteDetails.email} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Accept Invitation"}
            </Button>
          </form>
=======
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
>>>>>>> Stashed changes
        </div>

        <InvitationRegistrationForm invitation={invitation} />
      </div>
    </div>
  )
}
