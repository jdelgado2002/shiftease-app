"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmployeeOnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onBack?: () => void
  nextDisabled?: boolean
  nextLabel?: string
  title: string
  description: string
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = "Next",
  title,
  description,
}: EmployeeOnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">ShiftEase</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Title and description */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Content */}
          <div className="py-4">{children}</div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <Button onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
              {nextLabel === "Next" && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact your manager or{" "}
            <a href="#" className="text-primary underline">
              support@shiftease.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
