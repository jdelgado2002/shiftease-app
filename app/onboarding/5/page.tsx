"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Smartphone, Clock, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function OnboardingStep5() {
  const [enableMFA, setEnableMFA] = useState(true)
  const [enableGeofencing, setEnableGeofencing] = useState(true)
  const [enableSSO, setEnableSSO] = useState(false)
  const [enableBiometric, setEnableBiometric] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const handleNext = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/organizations/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security: {
            mfaRequired: enableMFA,
            biometricEnabled: enableBiometric,
            geofencingEnabled: enableGeofencing,
            ssoEnabled: enableSSO
          },
          onboardingCompleted: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "Setup complete!",
        description: "Your security settings have been saved.",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/4");
  };

  return (
    <OnboardingLayout 
      currentStep={5} 
      totalSteps={5} 
      onNext={handleNext} 
      onBack={handleBack} 
      nextLabel="Complete Setup"
      nextDisabled={isLoading}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Security Setup</h1>
          <p className="text-muted-foreground mt-1">
            Configure security settings to protect your account and prevent time theft.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account and for your team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mfa">Require MFA for all users</Label>
                    <p className="text-sm text-muted-foreground">
                      All users will be required to set up MFA during their first login.
                    </p>
                  </div>
                  <Switch id="mfa" checked={enableMFA} onCheckedChange={setEnableMFA} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="biometric">Enable biometric authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to authenticate using fingerprint or face recognition on supported devices.
                    </p>
                  </div>
                  <Switch id="biometric" checked={enableBiometric} onCheckedChange={setEnableBiometric} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5 text-primary" />
                Time Clock Security
              </CardTitle>
              <CardDescription>Prevent time theft with location-based verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="geofencing">Enable geofencing for time clock</Label>
                  <p className="text-sm text-muted-foreground">
                    Employees can only clock in/out when they're physically at your restaurant location.
                  </p>
                </div>
                <Switch id="geofencing" checked={enableGeofencing} onCheckedChange={setEnableGeofencing} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Single Sign-On (SSO)
              </CardTitle>
              <CardDescription>Allow users to sign in with their existing accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sso">Enable Single Sign-On</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to sign in with Google, Microsoft, or other identity providers.
                    </p>
                  </div>
                  <Switch id="sso" checked={enableSSO} onCheckedChange={setEnableSSO} />
                </div>

                {enableSSO && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium">Select SSO providers:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start">
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
                        Google
                        <Check className="ml-auto h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path d="M21.5 10.8H13.25V7.91L21.5 7.91V10.8Z" fill="#4CAF50" />
                          <path d="M21.5 16.5H13.25V13.61H21.5V16.5Z" fill="#F44336" />
                          <path d="M8.75 16.5L8.75 7.91L13.25 7.91V10.8H11.64V16.5H8.75Z" fill="#2196F3" />
                          <path d="M2.5 16.5V7.91H8.75V10.8H5.39V16.5H2.5Z" fill="#FFC107" />
                        </svg>
                        Microsoft
                        <Check className="ml-auto h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OnboardingLayout>
  )
}
