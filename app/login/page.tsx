"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"

// Component that uses useSearchParams needs to be wrapped in Suspense
function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const organizationSlug = searchParams.get("org")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password, organizationSlug ?? undefined)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Sign in to your account</h2>
        <p className="text-muted-foreground mt-2">Welcome back! Please enter your details.</p>
      </div>

      <div className="space-y-4 mb-6">
        <Button variant="outline" className="w-full" type="button">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full" type="button">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M21.5 10.8H13.25V7.91L21.5 7.91V10.8Z" fill="#4CAF50" />
            <path d="M21.5 16.5H13.25V13.61H21.5V16.5Z" fill="#F44336" />
            <path d="M8.75 16.5L8.75 7.91L13.25 7.91V10.8H11.64V16.5H8.75Z" fill="#2196F3" />
            <path d="M2.5 16.5V7.91H8.75V10.8H5.39V16.5H2.5Z" fill="#FFC107" />
          </svg>
          Continue with Microsoft
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@restaurant.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/reset-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}

// Fallback to show while loading
function LoginFormFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Sign in to your account</h2>
        <p className="text-muted-foreground mt-2">Welcome back! Please enter your details.</p>
      </div>
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="h-10 bg-primary/40 rounded"></div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand */}
      <div className="bg-primary text-primary-foreground p-8 md:w-1/2 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">EasyShiftHQ</h1>
          <p className="text-xl mb-6">Restaurant scheduling simplified</p>
          <p className="text-primary-foreground/80">
            Sign in to access your restaurant scheduling dashboard, manage your team, and streamline your operations.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="p-8 md:w-1/2 flex items-center justify-center">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
