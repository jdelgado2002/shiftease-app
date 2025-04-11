"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function OnboardingStep1() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleNext = () => {
    if (!firstName || !lastName || !restaurantName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    router.push("/onboarding/2")
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={5}
      onNext={handleNext}
      nextDisabled={!firstName || !lastName || !restaurantName}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to ShiftEase!</h1>
          <p className="text-muted-foreground mt-1">Let's get started by setting up your account.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name *</Label>
              <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name *</Label>
              <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Restaurant Name *</Label>
            <Input
              id="restaurant-name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(123) 456-7890"
            />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
