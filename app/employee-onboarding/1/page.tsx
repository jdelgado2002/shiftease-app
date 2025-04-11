"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/employee-onboarding-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Smartphone, Shield, Check } from "lucide-react"

export default function EmployeeOnboardingStep1() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleNext = () => {
    if (!selectedOption) {
      toast({
        title: "Please select an option",
        description: "Choose how you want to receive authentication codes.",
        variant: "destructive",
      })
      return
    }

    router.push("/employee-onboarding/2")
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!selectedOption}
      title="Set Up Two-Factor Authentication"
      description="Enhance your account security by setting up two-factor authentication."
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Two-factor authentication adds an extra layer of security to your account. Each time you sign in, you'll need
          to provide a verification code in addition to your password.
        </p>

        <div className="space-y-3">
          <Card
            className={`cursor-pointer border-2 ${selectedOption === "app" ? "border-primary" : "border-border"}`}
            onClick={() => setSelectedOption("app")}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className={`rounded-full p-2 ${
                  selectedOption === "app" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Authenticator App (Recommended)</h3>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator or Microsoft Authenticator to generate verification
                  codes.
                </p>
              </div>
              {selectedOption === "app" && (
                <div className="rounded-full bg-primary text-primary-foreground p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 ${selectedOption === "sms" ? "border-primary" : "border-border"}`}
            onClick={() => setSelectedOption("sms")}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className={`rounded-full p-2 ${
                  selectedOption === "sms" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">SMS Text Message</h3>
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via SMS text message to your mobile phone.
                </p>
              </div>
              {selectedOption === "sms" && (
                <div className="rounded-full bg-primary text-primary-foreground p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={() => router.push("/employee-onboarding/2")}>
            Skip for now
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  )
}
