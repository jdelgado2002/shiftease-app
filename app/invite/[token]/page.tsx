"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface InviteDetails {
  email: string
  restaurantName: string
  role: string
  loading: boolean
  error: string | null
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const [inviteDetails, setInviteDetails] = useState<InviteDetails>({
    email: "",
    restaurantName: "",
    role: "",
    loading: true,
    error: null,
  })
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { acceptInvitation } = useAuth()
  const { toast } = useToast()

  // Fetch invitation details when the page loads
  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const response = await fetch(`/api/invitations/${params.token}`)
        const data = await response.json()
        
        if (!response.ok) throw new Error(data.message || 'Invalid invitation')
        
        setInviteDetails({
          email: data.email,
          restaurantName: data.organization.name,
          role: data.role,
          loading: false,
          error: null,
        })
      } catch (error) {
        setInviteDetails(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load invitation details',
        }))
      }
    }

    fetchInviteDetails()
  }, [params.token])

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

    try {
      await acceptInvitation(params.token, {
        firstName,
        lastName,
        password,
      })
    } catch (error) {
      console.error('Error accepting invitation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (inviteDetails.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading invitation details...</p>
      </div>
    )
  }

  if (inviteDetails.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Invalid Invitation</h2>
          <p className="text-muted-foreground">{inviteDetails.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand */}
      <div className="bg-primary text-primary-foreground p-8 md:w-1/2 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">EasyShiftHQ</h1>
          <p className="text-xl mb-6">Restaurant scheduling simplified</p>
          <p className="text-primary-foreground/80">
            You've been invited to join {inviteDetails.restaurantName} on EasyShiftHQ. Complete your registration to
            get started.
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
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
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
        </div>
      </div>
    </div>
  )
}
