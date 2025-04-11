"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/employee-onboarding-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Clock } from "lucide-react"

export default function EmployeeOnboardingStep2() {
  const [availability, setAvailability] = useState({
    monday: { morning: false, afternoon: false, evening: false, night: false },
    tuesday: { morning: false, afternoon: false, evening: false, night: false },
    wednesday: { morning: false, afternoon: false, evening: false, night: false },
    thursday: { morning: false, afternoon: false, evening: false, night: false },
    friday: { morning: false, afternoon: false, evening: false, night: false },
    saturday: { morning: false, afternoon: false, evening: false, night: false },
    sunday: { morning: false, afternoon: false, evening: false, night: false },
  })
  const [phoneNumber, setPhoneNumber] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const handleNext = () => {
    // In a real app, we would save the availability data
    router.push("/employee-onboarding/3")
  }

  const handleBack = () => {
    router.push("/employee-onboarding/1")
  }

  const toggleAvailability = (day: string, timeBlock: string) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day as keyof typeof availability],
        [timeBlock]:
          !availability[day as keyof typeof availability][
            timeBlock as keyof (typeof availability)[keyof typeof availability]
          ],
      },
    })
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const timeBlocks = [
    { id: "morning", label: "Morning (9AM-12PM)" },
    { id: "afternoon", label: "Afternoon (12PM-5PM)" },
    { id: "evening", label: "Evening (5PM-10PM)" },
    { id: "night", label: "Night (10PM-2AM)" },
  ]

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={3}
      onNext={handleNext}
      onBack={handleBack}
      title="Set Your Availability"
      description="Let your manager know when you're available to work."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your phone number will be used for schedule notifications and time clock verification.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Weekly Availability</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Select the time blocks when you're typically available to work.
          </p>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {days.map((day) => (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium capitalize">{day}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {timeBlocks.map((block) => (
                        <Button
                          key={block.id}
                          type="button"
                          variant={
                            availability[day as keyof typeof availability][
                              block.id as keyof (typeof availability)[keyof typeof availability]
                            ]
                              ? "default"
                              : "outline"
                          }
                          className="h-auto py-2 px-3 justify-start"
                          onClick={() => toggleAvailability(day, block.id)}
                        >
                          <div className="text-left">
                            <div className="text-xs">{block.label}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OnboardingLayout>
  )
}
