"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function OnboardingStep2() {
  const [restaurantType, setRestaurantType] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState("US")
  const router = useRouter()
  const { toast } = useToast()

  const handleNext = () => {
    if (!restaurantType || !address || !city || !state || !zipCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    router.push("/onboarding/3")
  }

  const handleBack = () => {
    router.push("/onboarding/1")
  }

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={!restaurantType || !address || !city || !state || !zipCode}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Restaurant Details</h1>
          <p className="text-muted-foreground mt-1">Tell us more about your restaurant.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-type">Restaurant Type *</Label>
            <Select value={restaurantType} onValueChange={setRestaurantType} required>
              <SelectTrigger id="restaurant-type">
                <SelectValue placeholder="Select restaurant type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual-dining">Casual Dining</SelectItem>
                <SelectItem value="fine-dining">Fine Dining</SelectItem>
                <SelectItem value="fast-casual">Fast Casual</SelectItem>
                <SelectItem value="quick-service">Quick Service</SelectItem>
                <SelectItem value="cafe">Café</SelectItem>
                <SelectItem value="bar">Bar/Pub</SelectItem>
                <SelectItem value="food-truck">Food Truck</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip-code">ZIP/Postal Code *</Label>
              <Input id="zip-code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="MX">Mexico</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  {/* Add more countries as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
