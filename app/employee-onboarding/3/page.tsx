"use client"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/employee-onboarding-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Calendar, MessageSquare, Clock } from "lucide-react"

export default function EmployeeOnboardingStep3() {
  const router = useRouter()
  const { toast } = useToast()

  const handleComplete = () => {
    toast({
      title: "Setup complete!",
      description: "You're all set up and ready to go.",
    })

    // In a real app, we would save all the settings here

    router.push("/")
  }

  const handleBack = () => {
    router.push("/employee-onboarding/2")
  }

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={3}
      onNext={handleComplete}
      onBack={handleBack}
      nextLabel="Get Started"
      title="You're All Set!"
      description="Here's what you can do with ShiftEase."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">View Your Schedule</h3>
              <p className="text-sm text-muted-foreground">Access your work schedule anytime, anywhere.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Clock In/Out</h3>
              <p className="text-sm text-muted-foreground">Easily track your work hours with our time clock.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Team Communication</h3>
              <p className="text-sm text-muted-foreground">Chat with your team and receive important announcements.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Get the Mobile App</h3>
              <p className="text-sm text-muted-foreground">Download our mobile app for on-the-go access.</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Mobile App
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  )
}
